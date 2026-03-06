export function meanOfArray(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

export function maxOfArray(arr: number[]): number {
  return Math.max(...arr)
}

export function minOfArray(arr: number[]): number {
  return Math.min(...arr)
}

export function dictValuesToMatrix(dict: Record<string, number[]>): {
  matrix: number[][]
  keys: string[]
} {
  const keys = Object.keys(dict).sort((a, b) => parseInt(a) - parseInt(b))
  const matrix = keys.map((k) => dict[k])
  return { matrix, keys }
}
