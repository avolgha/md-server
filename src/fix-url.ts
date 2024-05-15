export function fixUrl(url: string) {
  if (url.endsWith("/")) {
    url += "index";
  }

  if (url.endsWith(".md")) {
    url = url.slice(0, url.length - ".md".length);
  }

  return url;
}
