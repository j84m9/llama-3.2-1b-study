import { useSelectionStore } from '../../store/selectionStore'
import type { Prediction } from '../../api/types'

interface Props {
  x: number
  y: number
  width: number
  height: number
  prediction: Prediction
}

export function UnembeddingBlock({ x, y, width, height, prediction }: Props) {
  const select = useSelectionStore((s) => s.select)

  return (
    <g
      onClick={() => select({ type: 'lm_head' })}
      className="cursor-pointer"
    >
      {/* Final RMSNorm */}
      <rect
        x={x}
        y={y}
        width={width * 0.35}
        height={height}
        rx={6}
        fill="rgba(148, 163, 184, 0.05)"
        stroke="#475569"
        strokeWidth={0.5}
      />
      <text
        x={x + width * 0.175}
        y={y + height / 2 + 4}
        fill="#94a3b8"
        fontSize={10}
        textAnchor="middle"
        fontFamily="monospace"
      >
        Final RMSNorm
      </text>

      {/* Arrow */}
      <line
        x1={x + width * 0.35 + 4}
        y1={y + height / 2}
        x2={x + width * 0.42}
        y2={y + height / 2}
        stroke="#475569"
        strokeWidth={1}
      />

      {/* LM Head + prediction */}
      <rect
        x={x + width * 0.42}
        y={y}
        width={width * 0.58}
        height={height}
        rx={6}
        fill="rgba(245, 158, 11, 0.1)"
        stroke="#f59e0b"
        strokeWidth={1}
      />
      <text
        x={x + width * 0.71}
        y={y + height / 2 - 6}
        fill="#fbbf24"
        fontSize={10}
        textAnchor="middle"
        fontFamily="monospace"
      >
        LM Head (tied)
      </text>
      <text
        x={x + width * 0.71}
        y={y + height / 2 + 10}
        fill="#10b981"
        fontSize={13}
        textAnchor="middle"
        fontFamily="monospace"
        fontWeight={700}
      >
        "{prediction.token}" ({(prediction.probability * 100).toFixed(1)}%)
      </text>
    </g>
  )
}
