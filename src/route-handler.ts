import TimedCache from "@avolgha/timed-cache";
import { RouteHandlerMethod } from "fastify";
import fs from "fs";
import path from "path";
import { fixUrl } from "./fix-url";
import { getHtml } from "./get-html";
import { getTitle } from "./get-title";

export function routeHandler(
  markdownCache: TimedCache<string>,
  workingDir: string,
  userStyles: string,
  notFoundPage: () => Promise<string>
): RouteHandlerMethod {
  const handler: RouteHandlerMethod = async function (req, res) {
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
  };

  return handler;
}
