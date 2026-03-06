import { useInferenceStore } from '../../store/inferenceStore'
import { useActivationStore } from '../../store/activationStore'
import { useSelectionStore } from '../../store/selectionStore'
import { Play } from 'lucide-react'

export function PromptInput() {
  const prompt = useInferenceStore((s) => s.prompt)
  const setPrompt = useInferenceStore((s) => s.setPrompt)
  const analyze = useInferenceStore((s) => s.analyze)
  const loading = useInferenceStore((s) => s.loading)

  const handleAnalyze = () => {
    // Clear stale activation data on new prompt
    useActivationStore.setState({ attentionData: {}, layerStats: {} })
    useSelectionStore.setState({ selection: null })
    analyze()
  }

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-text-secondary">Prompt</label>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            handleAnalyze()
          }
        }}
        placeholder="Enter text to analyze..."
        rows={3}
        className="w-full bg-surface-elevated border border-border-subtle rounded-md px-3 py-2 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-blue-500 resize-none font-mono"
      />
      <button
        onClick={handleAnalyze}
        disabled={loading || !prompt.trim()}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-4 rounded-md transition-colors"
      >
        <Play className="w-3.5 h-3.5" />
        {loading ? 'Analyzing...' : 'Analyze'}
      </button>
      <p className="text-[10px] text-text-muted text-center">Cmd+Enter to run</p>
    </div>
  )
}
