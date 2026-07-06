/** Normalize stored image URLs to a smaller default size for faster loading. */
export function normalizeStoredImageUrl(url: string, width = 320): string {
  if (url.includes("upload.wikimedia.org") && url.includes("/thumb/")) {
    return url.replace(/\/(\d+)px-/, `/${width}px-`);
  }
  if (url.includes("commons.wikimedia.org") && url.includes("width=")) {
    return url.replace(/width=\d+/, `width=${width}`);
  }
  return url;
}
