import { useEffect, useState } from 'react'
import { useActivationStore } from '../../store/activationStore'
import { useInferenceStore } from '../../store/inferenceStore'
import { AttentionHeatmap } from '../charts/AttentionHeatmap'

interface Props {
  layerIndex: number
}

export function AttentionInspector({ layerIndex }: Props) {
  const prompt = useInferenceStore((s) => s.prompt)
  const result = useInferenceStore((s) => s.result)
  const fetchAttention = useActivationStore((s) => s.fetchAttention)
  const attentionData = useActivationStore((s) => s.attentionData)
  const loadingAttention = useActivationStore((s) => s.loadingAttention)
  const [selectedHead, setSelectedHead] = useState<number | null>(null)

  const key = `${layerIndex}-${selectedHead ?? 'all'}`
  const data = attentionData[key]

  useEffect(() => {
    if (prompt) {
      fetchAttention(prompt, layerIndex, selectedHead ?? undefined)
    }
  }, [prompt, layerIndex, selectedHead, fetchAttention])

  const attnVsMlp = result?.attention_vs_mlp[String(layerIndex)]

  return (
    <div className="p-3 space-y-4">
      {/* Norms summary */}
      {attnVsMlp && (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface-elevated rounded p-2 border border-border-subtle">
            <div className="text-[10px] text-text-muted">Attention Norm</div>
            <div className="text-sm font-mono text-violet-400">{attnVsMlp.attention_norm.toFixed(2)}</div>
          </div>
          <div className="bg-surface-elevated rounded p-2 border border-border-subtle">
            <div className="text-[10px] text-text-muted">MLP Norm</div>
            <div className="text-sm font-mono text-emerald-400">{attnVsMlp.mlp_norm.toFixed(2)}</div>
          </div>
        </div>
      )}

      {/* Head selector */}
      <div>
        <label className="text-xs text-text-secondary mb-1 block">Head</label>
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setSelectedHead(null)}
            className={`px-2 py-0.5 text-[10px] rounded ${
              selectedHead === null ? 'bg-violet-600 text-white' : 'bg-surface-elevated text-text-muted'
            }`}
          >
            All
          </button>
          {Array.from({ length: 32 }, (_, i) => (
            <button
              key={i}
              onClick={() => setSelectedHead(i)}
              className={`px-1.5 py-0.5 text-[10px] rounded font-mono ${
                selectedHead === i ? 'bg-violet-600 text-white' : 'bg-surface-elevated text-text-muted hover:text-text-secondary'
              }`}
            >
              {i}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap */}
      {loadingAttention ? (
        <div className="flex items-center justify-center h-32">
          <div className="text-xs text-text-muted animate-pulse">Loading attention weights...</div>
        </div>
      ) : data ? (
        <AttentionHeatmap
          weights={data.weights}
          tokens={data.tokens}
          head={selectedHead}
        />
      ) : null}
    </div>
  )
}
