import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import url from "url";
import { lazy } from "./lazy";

export const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const defaultStyles = lazy(() =>
  fs.readFileSync(path.join(__dirname, "..", "defaultStyles.css"), "utf-8")
);

export async function getUserStyles(dir: string) {
  const filepath = path.join(dir, "styles.css");
  if (!fs.existsSync(filepath)) {
    return defaultStyles();
  }
  return await fsp.readFile(filepath, "utf-8");
}
