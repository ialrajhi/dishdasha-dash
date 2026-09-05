/** A tiny epsilon keeps exact stride boundaries stable after floating-point physics steps. */
export function runFrame(distance: number, stride: number, count: number) {
  return Math.floor(Math.max(0, distance) / stride * count + 1e-7) % count;
}
