const state = {
  enabled: false,
  textureCount: 0,
  debugMode: 0,
};

let atlasCanvas = null;
let atlasMeta = null;
let lastStatsKey = "";

/**
 * Create or update the on-screen ASCII atlas debug panel.
 * @param {HTMLCanvasElement} canvas
 * @param {{ size: number, cell: number, characters: string, fontSize: number }} meta
 */
function renderAtlasPanel(canvas, meta) {
  if (typeof document === "undefined") return;

  atlasCanvas = canvas;
  atlasMeta = meta;

  let panel = document.getElementById("ascii-debug-atlas");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "ascii-debug-atlas";
    panel.style.position = "fixed";
    panel.style.bottom = "16px";
    panel.style.right = "16px";
    panel.style.zIndex = "99999";
    panel.style.background = "rgba(0,0,0,0.85)";
    panel.style.border = "1px solid #333";
    panel.style.borderRadius = "8px";
    panel.style.padding = "8px";
    panel.style.color = "#fff";
    panel.style.fontFamily =
      "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    panel.style.fontSize = "12px";
    panel.style.display = "grid";
    panel.style.gap = "6px";
    panel.style.opacity = "0.85";

    const title = document.createElement("div");
    title.textContent = "ASCII Atlas";
    title.style.fontWeight = "600";
    panel.appendChild(title);
    document.body.appendChild(panel);
  }

  while (panel.lastChild) {
    panel.removeChild(panel.lastChild);
  }

  const title = document.createElement("div");
  title.textContent = "ASCII Atlas";
  title.style.fontWeight = "600";
  panel.appendChild(title);

  const info = document.createElement("div");
  info.textContent = `size=${meta.size} cell=${meta.cell} chars=${meta.characters.length} font=${meta.fontSize}px`;
  info.style.color = "#ccc";
  panel.appendChild(info);

  const preview = document.createElement("canvas");
  preview.width = 2 * meta.size;
  preview.height = 2 * meta.size;
  const ctx = preview.getContext("2d");
  if (!ctx) {
    panel.appendChild(preview);
    return;
  }

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(canvas, 0, 0, 2 * meta.size, 2 * meta.size);
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= meta.size; i += meta.cell) {
    const pos = 2 * i + 0.5;
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, 2 * meta.size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, pos);
    ctx.lineTo(2 * meta.size, pos);
    ctx.stroke();
  }

  preview.style.width = `${meta.size}px`;
  preview.style.height = `${meta.size}px`;
  preview.style.border = "1px solid #444";
  panel.appendChild(preview);
}

/**
 * Log atlas pixel statistics when they change.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{ size: number, cell: number, characters: string, fontSize: number }} meta
 */
function logAtlasStats(ctx, meta) {
  const { size } = meta;
  const data = ctx.getImageData(0, 0, size, size).data;
  let nonBlackPixels = 0;
  let nonZeroAlphaPixels = 0;
  let rgbWithZeroAlpha = 0;
  let maxAlpha = 0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3] ?? 0;
    if (r || g || b) nonBlackPixels++;
    if (a > 0) nonZeroAlphaPixels++;
    if ((r || g || b) && a === 0) rgbWithZeroAlpha++;
    if (a > maxAlpha) maxAlpha = a;
  }

  const key = `${nonBlackPixels}:${nonZeroAlphaPixels}:${rgbWithZeroAlpha}:${maxAlpha}`;
  if (key !== lastStatsKey) {
    lastStatsKey = key;
    console.log(
      "%c[ASCII Debug] Atlas stats",
      "color: #ff6b4a; font-weight: bold",
      {
        size: meta.size,
        cell: meta.cell,
        characters: meta.characters.length,
        fontSize: meta.fontSize,
        nonBlackPixels,
        nonZeroAlphaPixels,
        rgbWithZeroAlpha,
        maxAlpha,
      }
    );
  }
}

function isDebugEnabled() {
  return state.enabled || window.__ASCII_DEBUG__ === true;
}


export function setAsciiDebugEnabled(enabled) {
  state.enabled = enabled;
  if (enabled) {
    console.log(
      "%c[ASCII Debug] Enabled",
      "color: #ff6b4a; font-weight: bold",
      `
Version: 2026-01-26-2`,
      `
Texture count: ${state.textureCount}`,
      "\nTo disable: window.__ASCII_DEBUG__ = false"
    );
    if (atlasCanvas && atlasMeta) {
      renderAtlasPanel(atlasCanvas, atlasMeta);
      const ctx = atlasCanvas.getContext("2d");
      if (ctx) logAtlasStats(ctx, atlasMeta);
    }
  }
}

export function incrementTextureCount() {
  state.textureCount++;
  if (isDebugEnabled()) {
    console.log(
      `%c[ASCII Debug] Texture created (total: ${state.textureCount})`,
      "color: #888"
    );
  }
}

export function decrementTextureCount() {
  state.textureCount = Math.max(0, state.textureCount - 1);
  if (isDebugEnabled()) {
    console.log(
      `%c[ASCII Debug] Texture disposed (total: ${state.textureCount})`,
      "color: #888"
    );
  }
}

const asciiDebugUtils = {
  enable: () => setAsciiDebugEnabled(true),
  disable: () => setAsciiDebugEnabled(false),
  getTextureCount() {
    return state.textureCount;
  },
  setDebugMode(mode) {
    state.debugMode = mode;
    window.dispatchEvent(
      new CustomEvent("ascii-debug-mode", { detail: mode })
    );
    if (isDebugEnabled()) {
      console.log(
        "%c[ASCII Debug] Debug mode",
        "color: #ff6b4a; font-weight: bold",
        mode
      );
    }
  },
  getDebugMode: () => state.debugMode,
  showAtlas: () => {
    if (atlasCanvas && atlasMeta) {
      renderAtlasPanel(atlasCanvas, atlasMeta);
    } else {
      console.warn(
        "[ASCII Debug] No atlas available yet. Try refreshAtlas() after the scene renders."
      );
    }
  },
  logAtlasStats: () => {
    if (atlasCanvas && atlasMeta) {
      const ctx = atlasCanvas.getContext("2d");
      if (ctx) logAtlasStats(ctx, atlasMeta);
    } else {
      console.warn(
        "[ASCII Debug] No atlas available yet. Try refreshAtlas() after the scene renders."
      );
    }
  },
  refreshAtlas: () => {
    window.dispatchEvent(new CustomEvent("ascii-debug-refresh"));
  },
  clearOverlays: () => {
    const el = document.getElementById("ascii-debug-atlas");
    if (el?.parentElement) {
      el.parentElement.removeChild(el);
    }
  },
};

if (typeof window !== "undefined") {
  window.__ASCII_DEBUG_UTILS__ = asciiDebugUtils;
  window.ASCII_DEBUG_UTILS = asciiDebugUtils;
}

export { isDebugEnabled, renderAtlasPanel, logAtlasStats };
export default asciiDebugUtils;
