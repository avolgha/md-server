import fs from "fs";
import markdownIt from "markdown-it";
import path from "path";
import { getHtml } from "./get-html.js";
import { lazy } from "./lazy.js";

export const defaultNotFoundPage = lazy(() =>
  markdownIt().render(
    `# 404 - Not Found

The page you were looking for could not be found.
`,
    { async: false }
  )
);

export function getNotFoundPage(dir: string) {
  const filepath = path.join(dir, "404.md");
  if (!fs.existsSync(filepath)) {
    return () => Promise.resolve(defaultNotFoundPage());
  }
  return () => getHtml(filepath);
}
