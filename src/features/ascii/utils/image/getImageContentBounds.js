import { resolveImageSrc } from "./resolveImageSrc.js";

/**
 * Compute the normalized maximum distance from a reveal origin to non-transparent
 * content pixels in the image. Used to scale the typewriter reveal so it finishes
 * when content is fully covered.
 *
 * @param {string} imageSrc
 * @param {{ x: number, y: number }} [origin={ x: 0.5, y: 0.5 }]
 * @returns {Promise<number>}
 */
export async function getImageContentBounds(imageSrc, origin = { x: 0.5, y: 0.5 }) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          console.warn("[ASCII] Could not get canvas context, using default bounds");
          resolve(1);
          return;
        }

        const scale = Math.min(200 / img.width, 200 / img.height, 1);
        const w = Math.floor(img.width * scale);
        const h = Math.floor(img.height * scale);
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);

        const data = ctx.getImageData(0, 0, w, h).data;
        const originX = origin.x * w;
        const originY = (1 - origin.y) * h;
        const maxPossible = Math.max(
          Math.hypot(originX, originY),
          Math.hypot(w - originX, originY),
          Math.hypot(originX, h - originY),
          Math.hypot(w - originX, h - originY)
        );

        let maxContentDist = 0;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const idx = (y * w + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const a = data[idx + 3];
            if (
              a !== undefined &&
              r !== undefined &&
              g !== undefined &&
              b !== undefined &&
              a > 10 &&
              (r > 15 || g > 15 || b > 15)
            ) {
              const dist = Math.hypot(x - originX, y - originY);
              maxContentDist = Math.max(maxContentDist, dist);
            }
          }
        }

        const result = Math.min((maxContentDist / maxPossible) * 1.05, 1);
        resolve(result);
      } catch (err) {
        console.warn("[ASCII] Error computing content bounds:", err);
        resolve(1);
      }
    };
    img.onerror = () => {
      console.warn("[ASCII] Could not load image for bounds computation");
      resolve(1);
    };
    img.src = resolveImageSrc(imageSrc);
  });
}
