import { useEffect } from 'react'
import { useActivationStore } from '../../store/activationStore'
import { useInferenceStore } from '../../store/inferenceStore'
import Plot from 'react-plotly.js'
import { plotlyDarkLayout } from '../../theme/darkTheme'

interface Props {
  layerIndex: number
}

export function MLPInspector({ layerIndex }: Props) {
  const prompt = useInferenceStore((s) => s.prompt)
  const result = useInferenceStore((s) => s.result)
  const fetchLayerStats = useActivationStore((s) => s.fetchLayerStats)
  const layerStats = useActivationStore((s) => s.layerStats)
  const loading = useActivationStore((s) => s.loadingLayer)

  const stats = layerStats[layerIndex]

  useEffect(() => {
    if (prompt) {
      fetchLayerStats(prompt, layerIndex)
    }
  }, [prompt, layerIndex, fetchLayerStats])

  const attnVsMlp = result?.attention_vs_mlp[String(layerIndex)]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32 p-3">
        <div className="text-xs text-text-muted animate-pulse">Loading MLP stats...</div>
      </div>
    )
  }

  return (
    <div className="p-3 space-y-4">
      {/* Norms */}
      {attnVsMlp && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface-elevated rounded p-2 border border-border-subtle">
            <div className="text-[10px] text-text-muted">MLP Output Norm</div>
            <div className="text-sm font-mono text-emerald-400">{attnVsMlp.mlp_norm.toFixed(2)}</div>
          </div>
          <div className="bg-surface-elevated rounded p-2 border border-border-subtle">
            <div className="text-[10px] text-text-muted">Sparsity</div>
            <div className="text-sm font-mono text-amber-400">
              {stats ? `${(stats.sparsity * 100).toFixed(1)}%` : '—'}
            </div>
          </div>
        </div>
      )}

      {/* Gate activation stats */}
      {stats?.gate_activation_stats && (
        <div className="bg-surface-elevated rounded-lg p-3 border border-border-subtle">
          <h3 className="text-xs font-medium text-text-secondary mb-2">Gate Activation Stats</h3>
          <div className="grid grid-cols-2 gap-1.5 text-xs">
            {Object.entries(stats.gate_activation_stats).map(([key, val]) => (
              <div key={key} className="flex justify-between">
                <span className="text-text-muted">{key}</span>
                <span className="font-mono text-text-primary">{val.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top neurons bar chart */}
      {stats?.top_neurons && stats.top_neurons.length > 0 && (
        <div>
          <h3 className="text-xs font-medium text-text-secondary mb-2">Top Neurons (by mean |activation|)</h3>
          <Plot
            data={[
              {
                type: 'bar',
                x: stats.top_neurons.map((n) => n.mean_abs_activation),
                y: stats.top_neurons.map((n) => `N${n.neuron_idx}`),
                orientation: 'h',
                marker: { color: '#10b981' },
              },
            ]}
            layout={{
              ...plotlyDarkLayout,
              height: 300,
              width: 350,
              margin: { l: 60, r: 10, t: 10, b: 30 },
              yaxis: { ...plotlyDarkLayout.yaxis, autorange: 'reversed' as const },
            }}
            config={{ displayModeBar: false, responsive: true }}
          />
        </div>
      )}
    </div>
  )
}
