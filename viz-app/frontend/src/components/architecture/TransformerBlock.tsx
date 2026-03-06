import { AttentionBlock } from './AttentionBlock'
import { MLPBlock } from './MLPBlock'
import { useSelectionStore } from '../../store/selectionStore'

interface Props {
  x: number
  y: number
  width: number
  height: number
  layerIndex: number
  intensity: number
  delta: number
}

export function TransformerBlock({ x, y, width, height, layerIndex, intensity, delta }: Props) {
  const select = useSelectionStore((s) => s.select)

  const innerY = y + 2
  const innerH = height - 4
  const blockW = (width - 60) / 4  // RMSNorm, Attention, RMSNorm, MLP

  const normWidth = blockW * 0.6
  const attnWidth = blockW * 1.4
  const mlpWidth = blockW * 1.2

  let cx = x + 10

  return (
    <g>
      {/* Background */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={6}
        fill={`rgba(30, 41, 59, ${Math.max(intensity, 0.3)})`}
        stroke="#334155"
        strokeWidth={1}
      />

      {/* RMSNorm 1 */}
      <g
        onClick={() => select({ type: 'rms_norm', layerIndex })}
        className="cursor-pointer"
      >
        <rect x={cx} y={innerY} width={normWidth} height={innerH} rx={3}
          fill="#1e293b" stroke="#475569" strokeWidth={0.5} />
        <text x={cx + normWidth / 2} y={innerY + innerH / 2 + 3}
          fill="#94a3b8" fontSize={8} textAnchor="middle" fontFamily="monospace">
          RMSNorm
        </text>
      </g>
      cx += normWidth + 6

      {/* Arrow */}
      <line x1={cx - 4} y1={innerY + innerH / 2} x2={cx + 2} y2={innerY + innerH / 2}
        stroke="#475569" strokeWidth={1} markerEnd="url(#arrowhead)" />
      cx += 6

      {/* Attention */}
      <AttentionBlock
        x={cx}
        y={innerY}
        width={attnWidth}
        height={innerH}
        layerIndex={layerIndex}
        intensity={intensity}
      />
      cx += attnWidth + 6

      {/* Residual add symbol */}
      <circle cx={cx + 6} cy={innerY + innerH / 2} r={7} fill="none" stroke="#3b82f6" strokeWidth={1} />
      <text x={cx + 6} y={innerY + innerH / 2 + 4} fill="#3b82f6" fontSize={12} textAnchor="middle">+</text>
      cx += 20

      {/* RMSNorm 2 */}
      <g
        onClick={() => select({ type: 'rms_norm', layerIndex })}
        className="cursor-pointer"
      >
        <rect x={cx} y={innerY} width={normWidth} height={innerH} rx={3}
          fill="#1e293b" stroke="#475569" strokeWidth={0.5} />
        <text x={cx + normWidth / 2} y={innerY + innerH / 2 + 3}
          fill="#94a3b8" fontSize={8} textAnchor="middle" fontFamily="monospace">
          RMSNorm
        </text>
      </g>
      cx += normWidth + 6

      {/* Arrow */}
      <line x1={cx - 4} y1={innerY + innerH / 2} x2={cx + 2} y2={innerY + innerH / 2}
        stroke="#475569" strokeWidth={1} />
      cx += 6

      {/* MLP */}
      <MLPBlock
        x={cx}
        y={innerY}
        width={mlpWidth}
        height={innerH}
        layerIndex={layerIndex}
        intensity={intensity}
      />
      cx += mlpWidth + 6

      {/* Residual add symbol */}
      <circle cx={cx + 6} cy={innerY + innerH / 2} r={7} fill="none" stroke="#3b82f6" strokeWidth={1} />
      <text x={cx + 6} y={innerY + innerH / 2 + 4} fill="#3b82f6" fontSize={12} textAnchor="middle">+</text>

      {/* Delta label */}
      <text x={x + width - 8} y={innerY + innerH / 2 + 3}
        fill="#64748b" fontSize={9} textAnchor="end" fontFamily="monospace">
        Δ{delta.toFixed(2)}
      </text>

      {/* Arrow marker definition */}
      <defs>
        <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
          <polygon points="0 0, 6 2, 0 4" fill="#475569" />
        </marker>
      </defs>
    </g>
  )
}
