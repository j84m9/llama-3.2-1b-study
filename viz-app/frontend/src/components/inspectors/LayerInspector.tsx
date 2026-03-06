import { useEffect } from 'react'
import { useActivationStore } from '../../store/activationStore'
import { useInferenceStore } from '../../store/inferenceStore'
import { useAblationStore } from '../../store/ablationStore'
import Plot from 'react-plotly.js'
import { plotlyDarkLayout } from '../../theme/darkTheme'

interface Props {
  layerIndex: number
}

export function LayerInspector({ layerIndex }: Props) {
  const prompt = useInferenceStore((s) => s.prompt)
  const result = useInferenceStore((s) => s.result)
  const fetchLayerStats = useActivationStore((s) => s.fetchLayerStats)
  const layerStats = useActivationStore((s) => s.layerStats)
  const loading = useActivationStore((s) => s.loadingLayer)
  const addModification = useAblationStore((s) => s.addModification)

  const stats = layerStats[layerIndex]

  useEffect(() => {
    if (prompt) {
      fetchLayerStats(prompt, layerIndex)
    }
  }, [prompt, layerIndex, fetchLayerStats])

  const norms = result?.residual_norms[String(layerIndex)]
  const deltas = result?.layer_deltas[String(layerIndex)]
  const tokens = result?.tokens.strings

  return (
    <div className="p-3 space-y-4">
      {/* Quick stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-surface-elevated rounded p-2 border border-border-subtle">
            <div className="text-[10px] text-text-muted">Mean</div>
            <div className="text-xs font-mono text-text-primary">{stats.residual_mean.toFixed(4)}</div>
          </div>
          <div className="bg-surface-elevated rounded p-2 border border-border-subtle">
            <div className="text-[10px] text-text-muted">Std</div>
            <div className="text-xs font-mono text-text-primary">{stats.residual_std.toFixed(4)}</div>
          </div>
          <div className="bg-surface-elevated rounded p-2 border border-border-subtle">
            <div className="text-[10px] text-text-muted">Sparsity</div>
            <div className="text-xs font-mono text-amber-400">{(stats.sparsity * 100).toFixed(1)}%</div>
          </div>
        </div>
      )}

      {/* Residual norm per token */}
      {norms && tokens && (
        <div>
          <h3 className="text-xs font-medium text-text-secondary mb-2">Residual Norm per Token</h3>
          <Plot
            data={[
              {
                type: 'bar',
                x: tokens,
                y: norms,
                marker: { color: '#3b82f6' },
              },
            ]}
            layout={{
              ...plotlyDarkLayout,
              height: 200,
              width: 350,
              margin: { l: 40, r: 10, t: 10, b: 60 },
              xaxis: { ...plotlyDarkLayout.xaxis, tickangle: -45 },
            }}
            config={{ displayModeBar: false, responsive: true }}
          />
        </div>
      )}

      {/* Layer delta per token */}
      {deltas && tokens && (
        <div>
          <h3 className="text-xs font-medium text-text-secondary mb-2">Layer Delta per Token</h3>
          <Plot
            data={[
              {
                type: 'bar',
                x: tokens,
                y: deltas,
                marker: { color: '#f59e0b' },
              },
            ]}
            layout={{
              ...plotlyDarkLayout,
              height: 200,
              width: 350,
              margin: { l: 40, r: 10, t: 10, b: 60 },
              xaxis: { ...plotlyDarkLayout.xaxis, tickangle: -45 },
            }}
            config={{ displayModeBar: false, responsive: true }}
          />
        </div>
      )}

      {/* Ablation actions */}
      <div className="border-t border-border-subtle pt-3">
        <h3 className="text-xs font-medium text-text-secondary mb-2">Ablation Actions</h3>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => addModification({ type: 'zero_layer', layer: layerIndex })}
            className="text-[10px] px-2 py-1 bg-red-900/30 text-red-400 rounded border border-red-800/30 hover:bg-red-900/50"
          >
            Zero Layer
          </button>
          <button
            onClick={() => addModification({ type: 'mean_ablate', layer: layerIndex })}
            className="text-[10px] px-2 py-1 bg-amber-900/30 text-amber-400 rounded border border-amber-800/30 hover:bg-amber-900/50"
          >
            Mean Ablate
          </button>
          <button
            onClick={() => addModification({ type: 'clamp', layer: layerIndex, clamp_value: 1.0 })}
            className="text-[10px] px-2 py-1 bg-violet-900/30 text-violet-400 rounded border border-violet-800/30 hover:bg-violet-900/50"
          >
            Clamp ±1.0
          </button>
        </div>
      </div>

      {loading && (
        <div className="text-xs text-text-muted animate-pulse text-center">Loading layer details...</div>
      )}
    </div>
  )
}
