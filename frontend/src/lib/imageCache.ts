const CARD_WIDTH = 320;
const cache = new Map<string, Promise<boolean>>();

/** Smaller Wikimedia/Wikipedia thumbs load much faster in the quiz card. */
export function optimizeImageUrl(url: string | null, width = CARD_WIDTH): string | null {
  if (!url) return null;

  if (url.includes("upload.wikimedia.org") && url.includes("/thumb/")) {
    return url.replace(/\/(\d+)px-/, `/${width}px-`);
  }

  if (url.includes("commons.wikimedia.org") && url.includes("width=")) {
    return url.replace(/width=\d+/, `width=${width}`);
  }

  if (url.includes("thesportsdb.com") && url.includes("/thumb/")) {
    return url;
  }

  return url;
}

export function preloadImage(url: string | null): Promise<boolean> {
  const optimized = optimizeImageUrl(url);
  if (!optimized) return Promise.resolve(false);

  const existing = cache.get(optimized);
  if (existing) return existing;

  const promise = new Promise<boolean>((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = optimized;
  });

  cache.set(optimized, promise);
  return promise;
}

export function getOptimizedImageUrl(url: string | null): string | null {
  return optimizeImageUrl(url);
}
