import Plot from 'react-plotly.js'
import { plotlyDarkLayout } from '../../theme/darkTheme'
import type { InferenceResult } from '../../api/types'
import { meanOfArray } from '../../utils/tensorHelpers'

interface Props {
  result: InferenceResult
}

export function LayerContributionBar({ result }: Props) {
  const layers = Object.keys(result.layer_deltas).sort((a, b) => parseInt(a) - parseInt(b))
  const meanDeltas = layers.map((k) => meanOfArray(result.layer_deltas[k]))
  const attnNorms = layers.map((k) => result.attention_vs_mlp[k]?.attention_norm ?? 0)
  const mlpNorms = layers.map((k) => result.attention_vs_mlp[k]?.mlp_norm ?? 0)

  return (
    <div className="space-y-4">
      {/* Mean layer deltas */}
      <Plot
        data={[
          {
            type: 'bar',
            x: layers.map((k) => `L${k}`),
            y: meanDeltas,
            marker: { color: '#f59e0b' },
            name: 'Mean Delta',
          },
        ]}
        layout={{
          ...plotlyDarkLayout,
          height: 300,
          title: { text: 'Mean Layer Delta', font: { size: 12, color: '#94a3b8' } },
          xaxis: { ...plotlyDarkLayout.xaxis, tickangle: -45 },
          showlegend: false,
        }}
        config={{ displayModeBar: false, responsive: true }}
      />

      {/* Attention vs MLP norms */}
      <Plot
        data={[
          {
            type: 'bar',
            x: layers.map((k) => `L${k}`),
            y: attnNorms,
            marker: { color: '#8b5cf6' },
            name: 'Attention',
          },
          {
            type: 'bar',
            x: layers.map((k) => `L${k}`),
            y: mlpNorms,
            marker: { color: '#10b981' },
            name: 'MLP',
          },
        ]}
        layout={{
          ...plotlyDarkLayout,
          height: 300,
          barmode: 'group',
          title: { text: 'Attention vs MLP Output Norms', font: { size: 12, color: '#94a3b8' } },
          xaxis: { ...plotlyDarkLayout.xaxis, tickangle: -45 },
          legend: { font: { color: '#94a3b8', size: 10 }, bgcolor: 'transparent' },
        }}
        config={{ displayModeBar: false, responsive: true }}
      />
    </div>
  )
}
