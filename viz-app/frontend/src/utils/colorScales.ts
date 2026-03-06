export function normToColor(value: number, min: number, max: number): string {
  const t = max === min ? 0.5 : (value - min) / (max - min)
  // Viridis-inspired: dark purple → blue → green → yellow
  const r = Math.round(68 + t * (253 - 68))
  const g = Math.round(1 + t * (231 - 1))
  const b = Math.round(84 + t * (37 - 84))
  return `rgb(${r},${g},${b})`
}

export function deltaToColor(value: number, min: number, max: number): string {
  const t = max === min ? 0.5 : (value - min) / (max - min)
  // Magma-inspired: dark → magenta → orange → yellow
  const r = Math.round(0 + t * 252)
  const g = Math.round(0 + t * 255)
  const b = Math.round(4 + t * (164 - 4))
  return `rgb(${r},${g},${b})`
}

export function layerActivityOpacity(delta: number, maxDelta: number): number {
  if (maxDelta === 0) return 0.3
  return 0.2 + 0.8 * (delta / maxDelta)
}
