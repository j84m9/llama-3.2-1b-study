import { useSelectionStore } from '../../store/selectionStore'
import { AttentionInspector } from './AttentionInspector'
import { MLPInspector } from './MLPInspector'
import { LayerInspector } from './LayerInspector'
import { ResidualInspector } from './ResidualInspector'
import { X } from 'lucide-react'

export function InspectorPanel() {
  const selection = useSelectionStore((s) => s.selection)
  const select = useSelectionStore((s) => s.select)

  if (!selection) return null

  const title = (() => {
    switch (selection.type) {
      case 'attention': return `Attention - Layer ${selection.layerIndex}`
      case 'mlp': return `MLP - Layer ${selection.layerIndex}`
      case 'layer': return `Layer ${selection.layerIndex}`
      case 'residual': return 'Residual Stream'
      case 'embedding': return 'Token Embedding'
      case 'lm_head': return 'LM Head'
      case 'rms_norm': return `RMSNorm - Layer ${selection.layerIndex}`
      default: return 'Inspector'
    }
  })()

  const renderContent = () => {
    switch (selection.type) {
      case 'attention':
        return <AttentionInspector layerIndex={selection.layerIndex!} />
      case 'mlp':
        return <MLPInspector layerIndex={selection.layerIndex!} />
      case 'layer':
      case 'rms_norm':
        return <LayerInspector layerIndex={selection.layerIndex!} />
      case 'residual':
      case 'embedding':
      case 'lm_head':
        return <ResidualInspector />
      default:
        return <div className="text-text-muted text-sm p-4">Select a component to inspect</div>
    }
  }

  return (
    <aside className="w-96 bg-surface-sidebar border-l border-border-subtle flex flex-col shrink-0 overflow-y-auto">
      <div className="flex items-center justify-between p-3 border-b border-border-subtle">
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
        <button
          onClick={() => select(null)}
          className="text-text-muted hover:text-text-primary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {renderContent()}
      </div>
    </aside>
  )
}
