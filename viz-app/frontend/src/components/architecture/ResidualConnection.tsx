interface Props {
  x: number
  yStart: number
  yEnd: number
}

export function ResidualConnection({ x, yStart, yEnd }: Props) {
  return (
    <g>
      <line
        x1={x}
        y1={yStart}
        x2={x}
        y2={yEnd}
        stroke="#3b82f6"
        strokeWidth={3}
        strokeOpacity={0.3}
      />
      <text
        x={x}
        y={yStart - 6}
        fill="#3b82f6"
        fontSize={8}
        textAnchor="middle"
        fontFamily="monospace"
        opacity={0.6}
      >
        Residual
      </text>
    </g>
  )
}
