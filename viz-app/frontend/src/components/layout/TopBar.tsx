import { useInferenceStore } from '../../store/inferenceStore'
import { useSelectionStore } from '../../store/selectionStore'
import { Brain, LayoutDashboard, GitBranch } from 'lucide-react'

export function TopBar() {
  const modelInfo = useInferenceStore((s) => s.modelInfo)
  const loading = useInferenceStore((s) => s.loading)
  const viewMode = useSelectionStore((s) => s.viewMode)
  const setViewMode = useSelectionStore((s) => s.setViewMode)

  return (
    <header className="h-12 bg-surface-sidebar border-b border-border-subtle flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <Brain className="w-5 h-5 text-blue-500" />
        <h1 className="text-sm font-semibold text-text-primary">
          {modelInfo?.name ?? 'LlamaViz'}
        </h1>
        {modelInfo && (
          <span className="text-xs text-text-muted">
            {modelInfo.num_layers}L / {modelInfo.hidden_size}d / {modelInfo.num_attention_heads}H
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        {loading && (
          <div className="flex items-center gap-2 text-xs text-amber-400">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            Analyzing...
          </div>
        )}

        <div className="flex bg-surface-elevated rounded-md overflow-hidden border border-border-subtle">
          <button
            onClick={() => setViewMode('architecture')}
            className={`px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${
              viewMode === 'architecture'
                ? 'bg-blue-600 text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            Architecture
          </button>
          <button
            onClick={() => setViewMode('dashboard')}
            className={`px-3 py-1.5 text-xs flex items-center gap-1.5 transition-colors ${
              viewMode === 'dashboard'
                ? 'bg-blue-600 text-white'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </button>
        </div>
      </div>
    </header>
  )
}
