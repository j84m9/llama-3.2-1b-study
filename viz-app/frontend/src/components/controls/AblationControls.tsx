import { useAblationStore } from '../../store/ablationStore'
import { useInferenceStore } from '../../store/inferenceStore'
import { Scissors, Trash2, Play } from 'lucide-react'

export function AblationControls() {
  const modifications = useAblationStore((s) => s.modifications)
  const removeModification = useAblationStore((s) => s.removeModification)
  const clearModifications = useAblationStore((s) => s.clearModifications)
  const runComparison = useAblationStore((s) => s.runComparison)
  const loading = useAblationStore((s) => s.loading)
  const prompt = useInferenceStore((s) => s.prompt)

  if (modifications.length === 0) return null

  return (
    <div className="bg-surface-elevated rounded-lg p-3 border border-red-900/30">
      <div className="flex items-center gap-2 mb-2">
        <Scissors className="w-3.5 h-3.5 text-red-400" />
        <span className="text-xs font-medium text-red-400">Ablations ({modifications.length})</span>
      </div>

      <div className="space-y-1 mb-3">
        {modifications.map((mod, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-text-secondary font-mono">
              {mod.type} L{mod.layer}{mod.head != null ? ` H${mod.head}` : ''}
            </span>
            <button
              onClick={() => removeModification(i)}
              className="text-text-muted hover:text-red-400"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => runComparison(prompt)}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white text-xs py-1.5 px-3 rounded-md transition-colors"
        >
          <Play className="w-3 h-3" />
          {loading ? 'Running...' : 'Compare'}
        </button>
        <button
          onClick={clearModifications}
          className="text-xs text-text-muted hover:text-text-secondary px-2"
        >
          Clear
        </button>
      </div>
    </div>
  )
}
