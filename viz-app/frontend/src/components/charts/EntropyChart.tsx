import Plot from 'react-plotly.js'
import { plotlyDarkLayout } from '../../theme/darkTheme'
import type { LogitLensResult } from '../../api/types'

interface Props {
  logitLens: LogitLensResult
  tokens: string[]
}

export function EntropyChart({ logitLens, tokens }: Props) {
  const layers = Object.keys(logitLens.entropy).sort((a, b) => parseInt(a) - parseInt(b))

  // Entropy at the last token position across layers
  const lastPosEntropy = layers.map((k) => {
    const vals = logitLens.entropy[k]
    return vals[vals.length - 1]
  })

  return (
    <div className="space-y-4">
      {/* Entropy convergence (last token) */}
      <Plot
        data={[
          {
            type: 'scatter',
            mode: 'lines+markers',
            x: layers.map((k) => `L${k}`),
            y: lastPosEntropy,
            line: { color: '#ef4444', width: 2 },
            marker: { size: 5, color: '#ef4444' },
            name: 'Last Token',
          },
        ]}
        layout={{
          ...plotlyDarkLayout,
          height: 300,
          title: { text: 'Prediction Entropy Convergence (last position)', font: { size: 12, color: '#94a3b8' } },
          yaxis: { ...plotlyDarkLayout.yaxis, title: { text: 'Entropy (nats)' } },
          showlegend: false,
        }}
        config={{ displayModeBar: false, responsive: true }}
      />

      {/* Per-token entropy at final layer */}
      {(() => {
        const lastLayer = layers[layers.length - 1]
        const finalEntropy = logitLens.entropy[lastLayer]
        if (!finalEntropy) return null
        return (
          <Plot
            data={[
              {
                type: 'bar',
                x: tokens,
                y: finalEntropy,
                marker: { color: '#06b6d4' },
              },
            ]}
            layout={{
              ...plotlyDarkLayout,
              height: 250,
              title: { text: `Final Layer Entropy per Token`, font: { size: 12, color: '#94a3b8' } },
              xaxis: { ...plotlyDarkLayout.xaxis, tickangle: -45 },
              showlegend: false,
            }}
            config={{ displayModeBar: false, responsive: true }}
          />
        )
      })()}
    </div>
  )
}
