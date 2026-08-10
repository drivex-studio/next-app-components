/**
 * Ease-out cubic: 1 - (1 - t)^3
 * original: fL
 */
export function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}
