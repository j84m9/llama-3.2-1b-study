import { useInferenceStore } from '../../store/inferenceStore'
import { PromptInput } from '../controls/PromptInput'
import { TokenPills } from '../controls/TokenPills'
import { AblationControls } from '../controls/AblationControls'
import { Zap, Hash, Layers } from 'lucide-react'

export function Sidebar() {
  const result = useInferenceStore((s) => s.result)
  const modelInfo = useInferenceStore((s) => s.modelInfo)

  return (
    <aside className="w-72 bg-surface-sidebar border-r border-border-subtle flex flex-col shrink-0 overflow-y-auto">
      <div className="p-4 space-y-4">
        <PromptInput />

        {result && (
          <>
            {/* Prediction */}
            <div className="bg-surface-elevated rounded-lg p-3 border border-border-subtle">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-medium text-text-secondary">Prediction</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-mono font-bold text-emerald-400">
                  {result.prediction.token}
                </span>
                <span className="text-xs text-text-muted">
                  {(result.prediction.probability * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Tokens */}
            <div className="bg-surface-elevated rounded-lg p-3 border border-border-subtle">
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-xs font-medium text-text-secondary">
                  Tokens ({result.tokens.count})
                </span>
              </div>
              <TokenPills tokens={result.tokens.strings} />
            </div>

            {/* Model Stats */}
            {modelInfo && (
              <div className="bg-surface-elevated rounded-lg p-3 border border-border-subtle">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-xs font-medium text-text-secondary">Model</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-xs">
                  <div className="text-text-muted">Layers</div>
                  <div className="text-text-primary font-mono">{modelInfo.num_layers}</div>
                  <div className="text-text-muted">Hidden</div>
                  <div className="text-text-primary font-mono">{modelInfo.hidden_size}</div>
                  <div className="text-text-muted">Heads</div>
                  <div className="text-text-primary font-mono">{modelInfo.num_attention_heads}</div>
                  <div className="text-text-muted">Vocab</div>
                  <div className="text-text-primary font-mono">{modelInfo.vocab_size.toLocaleString()}</div>
                </div>
              </div>
            )}

            <AblationControls />
          </>
        )}
      </div>
    </aside>
  )
}
