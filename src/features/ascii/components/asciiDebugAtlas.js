// asciiDebugAtlas.js

/**
 * Identifier mappings:
 * fd -> drawAsciiDebugAtlas
 * e  -> atlasImage
 * t  -> config
 * fc -> debugAtlasImage (module scoped state)
 * fu -> debugAtlasConfig (module scoped state)
 */

export let debugAtlasImage = null;
export let debugAtlasConfig = null;

function getOrCreateDebugContainer(id, title) {
  const existingContainer = document.getElementById(id);
  if (existingContainer) return existingContainer;

  const container = document.createElement("div");
  container.id = id;
  
  Object.assign(container.style, {
    position: "fixed",
    bottom: "16px",
    right: "16px",
    zIndex: "99999",
    background: "rgba(0,0,0,0.85)",
    border: "1px solid #333",
    borderRadius: "8px",
    padding: "8px",
    color: "#fff",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
    fontSize: "12px",
    display: "grid",
    gap: "6px",
    opacity: "0.85"
  });

  const titleDiv = document.createElement("div");
  titleDiv.textContent = title;
  titleDiv.style.fontWeight = "600";
  
  container.appendChild(titleDiv);
  document.body.appendChild(container);

  return container;
}

export function drawAsciiDebugAtlas(atlasImage, config) {
  if (typeof document === "undefined") return;

  debugAtlasImage = atlasImage;
  debugAtlasConfig = config;

  const container = getOrCreateDebugContainer("ascii-debug-atlas", "ASCII Atlas");

  // Note: Preserving exact original logic here. The original code immediately wipes 
  // all children of the container prior to drawing (which inadvertently removes the 
  // titleDiv created in the IIFE setup on the first run).
  while (container.lastChild) {
    container.removeChild(container.lastChild);
  }

  // i -> infoDiv
  const infoDiv = document.createElement("div");
  infoDiv.textContent = `size=${config.size} cell=${config.cell} chars=${config.characters.length} font=${config.fontSize}px`;
  infoDiv.style.color = "#ccc";
  container.appendChild(infoDiv);

  // r -> canvas
  const canvas = document.createElement("canvas");
  canvas.width = 2 * config.size;
  canvas.height = 2 * config.size;

  // a -> ctx
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    container.appendChild(canvas);
    return;
  }

  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(atlasImage, 0, 0, 2 * config.size, 2 * config.size);
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = 1;

  // e -> pos
  for (let pos = 0; pos <= config.size; pos += config.cell) {
    // n -> scaledPos
    const scaledPos = 2 * pos + 0.5;
    
    // Vertical grid line
    ctx.beginPath();
    ctx.moveTo(scaledPos, 0);
    ctx.lineTo(scaledPos, 2 * config.size);
    ctx.stroke();
    
    // Horizontal grid line
    ctx.beginPath();
    ctx.moveTo(0, scaledPos);
    ctx.lineTo(2 * config.size, scaledPos);
    ctx.stroke();
  }

  canvas.style.width = `${config.size}px`;
  canvas.style.height = `${config.size}px`;
  canvas.style.border = "1px solid #444";
  
  container.appendChild(canvas);
}

// ── SELF-AUDIT ──────────────────────────────────────────────
// source_present:        [drawAsciiDebugAtlas, getOrCreateDebugContainer (extracted from IIFE)]
// source_not_present:    []
// third_party_deps:      []
// plugins_registered:    []
// inlined_libraries_detected: []
// derived_import_paths:  []
// renamed_identifiers:   [fd -> drawAsciiDebugAtlas, e -> atlasImage, t -> config, n -> container, i -> infoDiv, r -> canvas, a -> ctx, fc -> debugAtlasImage, fu -> debugAtlasConfig]
// unresolved_keys:       [none]
// fabricated_files_refused: []
// output_mode:           [single-file] (Extracted standard imperative JS utility)
// framework_apis_preserved: []
// ─────────────────────────────────────────────────────────────
