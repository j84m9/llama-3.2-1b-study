import Plot from 'react-plotly.js'
import { plotlyDarkLayout } from '../../theme/darkTheme'
import { dictValuesToMatrix } from '../../utils/tensorHelpers'

interface Props {
  norms: Record<string, number[]>
  tokens: string[]
  compact?: boolean
}

export function ResidualNormHeatmap({ norms, tokens, compact }: Props) {
  const { matrix, keys } = dictValuesToMatrix(norms)

  const height = compact ? 200 : 400
  const width = compact ? 350 : undefined

  return (
    <Plot
      data={[
        {
          type: 'heatmap',
          z: matrix,
          x: tokens,
          y: keys.map((k) => `L${k}`),
          colorscale: 'Viridis',
          showscale: !compact,
          colorbar: compact ? undefined : { thickness: 10, len: 0.8 },
        },
      ]}
      layout={{
        ...plotlyDarkLayout,
        height,
        width,
        title: compact ? undefined : { text: 'Residual Stream Norms', font: { size: 12, color: '#94a3b8' } },
        xaxis: { ...plotlyDarkLayout.xaxis, tickangle: -45, side: 'bottom' as const },
        yaxis: { ...plotlyDarkLayout.yaxis },
        margin: compact ? { l: 35, r: 10, t: 5, b: 60 } : { l: 50, r: 30, t: 40, b: 80 },
      }}
      config={{ displayModeBar: false, responsive: true }}
    />
  )
}
