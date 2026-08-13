/**
 * Prevent default on WebGL context lost to avoid browser dialogs / crashes.
 * @param {WebGLContextEvent} event
 */
export function preventContextLost(event) {
  event.preventDefault();
}

/**
 * Attach the context-lost listener to a newly created R3F canvas.
 * @param {{ gl: { domElement: HTMLCanvasElement } }} state
 */
export function onCanvasCreated({ gl }) {
  gl.domElement.addEventListener("webglcontextlost", preventContextLost);
}
