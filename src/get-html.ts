import shiki from "@shikijs/markdown-it/index.mjs";
import dompurify from "dompurify";
import fsp from "fs/promises";
import dom from "jsdom";
import markdownIt from "markdown-it";

const md = markdownIt();

let initialized = false;
export async function getHtml(file: string) {
  if (!initialized) {
    md.use(
      await shiki({
        themes: {
          light: "vitesse-light",
          dark: "vitesse-dark",
        },
      })
    );
    initialized = true;
  }

  const jsdom = new dom.JSDOM();
  const purify = dompurify(jsdom.window);

  const content = await fsp.readFile(file, "utf-8");
  const html = md.render(content);

  return purify.sanitize(html);
}
