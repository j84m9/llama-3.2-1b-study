import { useSelectionStore } from '../../store/selectionStore'

interface Props {
  x: number
  y: number
  width: number
  height: number
  layerIndex: number
  intensity: number
}

export function MLPBlock({ x, y, width, height, layerIndex, intensity }: Props) {
  const select = useSelectionStore((s) => s.select)
  const selection = useSelectionStore((s) => s.selection)

  const isSelected = selection?.type === 'mlp' && selection.layerIndex === layerIndex
  const strokeColor = isSelected ? '#10b981' : '#059669'
  const bgOpacity = 0.15 + intensity * 0.25

  return (
    <g
      onClick={(e) => {
        e.stopPropagation()
        select({ type: 'mlp', layerIndex })
      }}
      className="cursor-pointer"
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={4}
        fill={`rgba(16, 185, 129, ${bgOpacity})`}
        stroke={strokeColor}
        strokeWidth={isSelected ? 2 : 0.5}
      />
      <text
        x={x + width / 2}
        y={y + height / 2 - 2}
        fill="#6ee7b7"
        fontSize={9}
        textAnchor="middle"
        fontFamily="monospace"
        fontWeight={600}
      >
        MLP
      </text>
      <text
        x={x + width / 2}
        y={y + height / 2 + 10}
        fill="#059669"
        fontSize={7}
        textAnchor="middle"
        fontFamily="monospace"
      >
        SiLU 8192
      </text>
    </g>
  )
}
