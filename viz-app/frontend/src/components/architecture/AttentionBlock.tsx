import { useSelectionStore } from '../../store/selectionStore'

interface Props {
  x: number
  y: number
  width: number
  height: number
  layerIndex: number
  intensity: number
}

export function AttentionBlock({ x, y, width, height, layerIndex, intensity }: Props) {
  const select = useSelectionStore((s) => s.select)
  const selection = useSelectionStore((s) => s.selection)

  const isSelected = selection?.type === 'attention' && selection.layerIndex === layerIndex
  const strokeColor = isSelected ? '#3b82f6' : '#6366f1'
  const bgOpacity = 0.15 + intensity * 0.25

  return (
    <g
      onClick={(e) => {
        e.stopPropagation()
        select({ type: 'attention', layerIndex })
      }}
      className="cursor-pointer"
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill={`rgba(99, 102, 241, ${bgOpacity})`}
        stroke={strokeColor}
        strokeWidth={isSelected ? 2 : 0.5}
      />
      <text
        x={x + width / 2}
        y={y + height / 2 - 2}
        fill="#a5b4fc"
        fontSize={9}
        textAnchor="middle"
        fontFamily="monospace"
        fontWeight={600}
      >
        Attention
      </text>
      <text
        x={x + width / 2}
        y={y + height / 2 + 10}
        fill="#6366f1"
        fontSize={7}
        textAnchor="middle"
        fontFamily="monospace"
      >
        32H / 8KV
      </text>
    </g>
  )
}
