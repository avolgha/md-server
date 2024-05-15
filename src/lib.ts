import TimedCache from "@avolgha/timed-cache";
import shiki from "@shikijs/markdown-it";
import dompurify from "dompurify";
import fastify from "fastify";
import fs from "fs";
import fsp from "fs/promises";
import dom from "jsdom";
import markdownIt from "markdown-it";
import path from "path";
import url from "url";
import { lazy } from "./lazy.js";

// TODO(avolgha): sidebar on website for navigation between markdown files.

const md = markdownIt();
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

const defaultNotFoundPage = lazy(() =>
  md.render(
    `# 404 - Not Found

The page you were looking for could not be found.
`,
    { async: false }
  )
);
const defaultStyles = lazy(() =>
  fs.readFileSync(path.join(__dirname, "..", "defaultStyles.css"), "utf-8")
);

export interface MdServerOptions {
  workingDir: string;
  port: number;
}

function fixUrl(url: string) {
  if (url.endsWith("/")) {
    url += "index";
  }

  if (url.endsWith(".md")) {
    url = url.slice(0, url.length - ".md".length);
  }

  return url;
}

async function getHtml(file: string) {
  const jsdom = new dom.JSDOM();
  const purify = dompurify(jsdom.window);

  const content = await fsp.readFile(file, "utf-8");
  const html = md.render(content);

  return purify.sanitize(html);
}

async function getUserStyles(dir: string) {
  const filepath = path.join(dir, "styles.css");
  if (!fs.existsSync(filepath)) {
    return defaultStyles();
  }
  return await fsp.readFile(filepath, "utf-8");
}

function getNotFoundPage(dir: string) {
  const filepath = path.join(dir, "404.md");
  if (!fs.existsSync(filepath)) {
    return () => Promise.resolve(defaultNotFoundPage());
  }
  return () => getHtml(filepath);
}

function getTitle(html: string) {
  const jsdom = new dom.JSDOM(html, {});
  const header = jsdom.window.document
    .querySelector("html")
    ?.querySelector("body")
    ?.querySelector("h1");
  return header?.textContent || "No Title found";
}

export async function startServer({
  workingDir = process.cwd(),
  port = 5173,
}: Partial<MdServerOptions>) {
  if (!fs.existsSync(workingDir)) {
    throw new Error(
      `Server cannot be created in a non-existing directory. (${workingDir})`
    );
  }

  md.use(
    await shiki({
      themes: {
        light: "vitesse-light",
        dark: "vitesse-dark",
      },
    })
  );

  const markdownCache = new TimedCache<string>(600_000); // 600_000s == 10 minutes
  const userStyles = await getUserStyles(workingDir);
  const notFoundPage = getNotFoundPage(workingDir);

  const app = fastify({
    logger: {
      transport: {
        target: "@fastify/one-line-logger",
      },
    },
  });

  app.register(import("@fastify/rate-limit"), {
    max: 100,
    timeWindow: "1 minute",
  });
  app.register(import("@fastify/cors"));

  app.get("*", async (req, res) => {
    const url = fixUrl(req.url);

    const markdown = markdownCache.get(url);
    if (markdown) {
      res.status(200);
      res.type("text/html");
      return markdown;
    }

    const filepath = path.join(workingDir, url + ".md");

    let status;
    let content;
    let isError;
    if (!fs.existsSync(filepath)) {
      status = 404;
      content = await notFoundPage();
      isError = true;
    } else {
      status = 200;
      content = await getHtml(filepath);
      isError = false;
    }

    const title = getTitle(content);

    const htmlString = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    ${userStyles}
  </style>
</head>
<body>
  <article class="markdown-body">
    ${content}
  </article>
</body>
</html>`;

    !isError && markdownCache.set(url, htmlString);

    res.status(status);
    res.type("text/html");
    return htmlString;
  });

  await app.listen({
    port,
  });
}
