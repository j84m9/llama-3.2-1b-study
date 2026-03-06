import Plot from 'react-plotly.js'
import { plotlyDarkLayout } from '../../theme/darkTheme'

interface Props {
  weights: number[][][]  // [heads, seq, seq] or [1, seq, seq]
  tokens: string[]
  head: number | null
}

export function AttentionHeatmap({ weights, tokens, head }: Props) {
  if (head !== null && weights.length === 1) {
    // Single head heatmap
    return (
      <Plot
        data={[
          {
            type: 'heatmap',
            z: weights[0],
            x: tokens,
            y: tokens,
            colorscale: [
              [0, '#0f172a'],
              [0.25, '#1e3a5f'],
              [0.5, '#2563eb'],
              [0.75, '#60a5fa'],
              [1, '#dbeafe'],
            ],
            showscale: true,
            colorbar: { thickness: 10, len: 0.8 },
          },
        ]}
        layout={{
          ...plotlyDarkLayout,
          height: 350,
          width: 350,
          title: { text: `Head ${head}`, font: { size: 11, color: '#94a3b8' } },
          xaxis: { ...plotlyDarkLayout.xaxis, tickangle: -45, side: 'bottom' as const },
          yaxis: { ...plotlyDarkLayout.yaxis, autorange: 'reversed' as const },
          margin: { l: 80, r: 30, t: 30, b: 80 },
        }}
        config={{ displayModeBar: false, responsive: true }}
      />
    )
  }

  // Grid of all heads (small multiples)
  const numHeads = weights.length
  const cols = 8
  const rows = Math.ceil(numHeads / cols)

  return (
    <div className="space-y-1">
      <p className="text-[10px] text-text-muted">All {numHeads} heads (click a head number above for detail)</p>
      <div className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {weights.map((headWeights, i) => (
          <div key={i} className="relative">
            <Plot
              data={[
                {
                  type: 'heatmap',
                  z: headWeights,
                  colorscale: [
                    [0, '#0f172a'],
                    [0.5, '#2563eb'],
                    [1, '#dbeafe'],
                  ],
                  showscale: false,
                },
              ]}
              layout={{
                width: 42,
                height: 42,
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                margin: { l: 0, r: 0, t: 0, b: 0 },
                xaxis: { visible: false },
                yaxis: { visible: false, autorange: 'reversed' as const },
              }}
              config={{ displayModeBar: false, staticPlot: true }}
            />
            <span className="absolute bottom-0 right-0.5 text-[7px] text-text-muted">{i}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
