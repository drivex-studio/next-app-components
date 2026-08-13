/**
 * Cubic ease-out.
 * @param {number} t
 * @returns {number}
 */
export function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}
