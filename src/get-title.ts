import dom from "jsdom";

export function getTitle(html: string) {
  const jsdom = new dom.JSDOM(html, {});
  const header = jsdom.window.document
    .querySelector("html")
    ?.querySelector("body")
    ?.querySelector("h1");
  return header?.textContent || "No Title found";
}
