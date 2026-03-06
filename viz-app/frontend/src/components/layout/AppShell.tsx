import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { InspectorPanel } from '../inspectors/InspectorPanel'
import { ArchitectureDiagram } from '../architecture/ArchitectureDiagram'
import { DashboardView } from '../charts/DashboardView'
import { useSelectionStore } from '../../store/selectionStore'
import { useInferenceStore } from '../../store/inferenceStore'

export function AppShell() {
  const viewMode = useSelectionStore((s) => s.viewMode)
  const selection = useSelectionStore((s) => s.selection)
  const result = useInferenceStore((s) => s.result)

  return (
    <div className="h-screen flex flex-col">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        {/* Main canvas */}
        <main className="flex-1 overflow-auto bg-surface-primary p-4">
          {!result ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="text-4xl opacity-20">🦙</div>
                <p className="text-text-secondary text-sm">
                  Enter a prompt and click Analyze to inspect the model
                </p>
              </div>
            </div>
          ) : viewMode === 'architecture' ? (
            <ArchitectureDiagram />
          ) : (
            <DashboardView />
          )}
        </main>

        {/* Inspector panel */}
        {selection && result && (
          <InspectorPanel />
        )}
      </div>
    </div>
  )
}
