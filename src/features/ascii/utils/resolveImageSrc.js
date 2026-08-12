
export function resolveImageSrc(src) {
  if (src.startsWith("https://cdn.sanity.io/")) {
    return `/api/image-proxy?url=${encodeURIComponent(src)}`;
  }
  return src;
}
