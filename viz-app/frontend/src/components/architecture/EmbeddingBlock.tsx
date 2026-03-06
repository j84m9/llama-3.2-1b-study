import { useSelectionStore } from '../../store/selectionStore'

interface Props {
  x: number
  y: number
  width: number
  height: number
}

export function EmbeddingBlock({ x, y, width, height }: Props) {
  const select = useSelectionStore((s) => s.select)

  return (
    <g
      onClick={() => select({ type: 'embedding' })}
      className="cursor-pointer"
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        fill="rgba(6, 182, 212, 0.1)"
        stroke="#06b6d4"
        strokeWidth={1}
      />
      <text
        x={x + width / 2}
        y={y + height / 2 - 4}
        fill="#22d3ee"
        fontSize={12}
        textAnchor="middle"
        fontFamily="monospace"
        fontWeight={600}
      >
        Token Embedding
      </text>
      <text
        x={x + width / 2}
        y={y + height / 2 + 12}
        fill="#06b6d4"
        fontSize={9}
        textAnchor="middle"
        fontFamily="monospace"
      >
        128,256 tokens → 2048 dim
      </text>
    </g>
  )
}
