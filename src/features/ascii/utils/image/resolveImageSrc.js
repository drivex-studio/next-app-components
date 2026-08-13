export function resolveImageSrc(src) {
  return src.startsWith("https://cdn.sanity.io/")
    ? `/api/image-proxy?url=${encodeURIComponent(src)}`
    : src;
}
