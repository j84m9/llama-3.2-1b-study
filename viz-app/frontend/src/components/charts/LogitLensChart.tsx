import Plot from 'react-plotly.js'
import { plotlyDarkLayout } from '../../theme/darkTheme'
import type { LogitLensResult } from '../../api/types'
import { dictValuesToMatrix } from '../../utils/tensorHelpers'

interface Props {
  logitLens: LogitLensResult
  tokens: string[]
  compact?: boolean
}

export function LogitLensChart({ logitLens, tokens, compact }: Props) {
  const { matrix: entropyMatrix, keys } = dictValuesToMatrix(logitLens.entropy)

  const height = compact ? 200 : 350
  const width = compact ? 350 : undefined

  return (
    <div className="space-y-3">
      {/* Entropy heatmap */}
      <Plot
        data={[
          {
            type: 'heatmap',
            z: entropyMatrix,
            x: tokens,
            y: keys.map((k) => `L${k}`),
            colorscale: [
              [0, '#1a1a2e'],
              [0.33, '#16213e'],
              [0.66, '#e94560'],
              [1, '#ffde7d'],
            ],
            showscale: !compact,
            colorbar: compact ? undefined : { title: { text: 'Entropy' }, thickness: 10, len: 0.8 },
          },
        ]}
        layout={{
          ...plotlyDarkLayout,
          height,
          width,
          title: compact ? undefined : { text: 'Prediction Entropy per Layer', font: { size: 12, color: '#94a3b8' } },
          xaxis: { ...plotlyDarkLayout.xaxis, tickangle: -45, side: 'bottom' as const },
          yaxis: { ...plotlyDarkLayout.yaxis },
          margin: compact ? { l: 35, r: 10, t: 5, b: 60 } : { l: 50, r: 30, t: 40, b: 80 },
        }}
        config={{ displayModeBar: false, responsive: true }}
      />

      {/* Top predictions table for last position */}
      {!compact && (
        <div className="bg-surface-elevated rounded-lg p-3 border border-border-subtle">
          <h3 className="text-xs font-medium text-text-secondary mb-2">Top Predictions (last token position)</h3>
          <div className="overflow-x-auto">
            <table className="text-[10px] font-mono w-full">
              <thead>
                <tr className="text-text-muted">
                  <th className="text-left pr-3 pb-1">Layer</th>
                  <th className="text-left pr-3 pb-1">Top-1</th>
                  <th className="text-left pr-3 pb-1">Prob</th>
                  <th className="text-left pr-3 pb-1">Top-2</th>
                  <th className="text-left pb-1">Prob</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => {
                  const lastPos = logitLens.top_predictions[k]
                  if (!lastPos) return null
                  const preds = lastPos[lastPos.length - 1]
                  if (!preds || preds.length === 0) return null
                  return (
                    <tr key={k} className="text-text-primary border-t border-border-subtle">
                      <td className="pr-3 py-0.5 text-text-muted">L{k}</td>
                      <td className="pr-3 py-0.5">{preds[0]?.token}</td>
                      <td className="pr-3 py-0.5 text-emerald-400">{(preds[0]?.prob * 100).toFixed(1)}%</td>
                      <td className="pr-3 py-0.5">{preds[1]?.token ?? '—'}</td>
                      <td className="py-0.5 text-text-muted">{preds[1] ? `${(preds[1].prob * 100).toFixed(1)}%` : ''}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
