import { useState } from 'react'
import { useInferenceStore } from '../../store/inferenceStore'
import { ResidualNormHeatmap } from './ResidualNormHeatmap'
import { LogitLensChart } from './LogitLensChart'
import { LayerContributionBar } from './LayerContributionBar'
import { EntropyChart } from './EntropyChart'

const TABS = [
  { id: 'residual', label: 'Residual Stream' },
  { id: 'logit_lens', label: 'Logit Lens' },
  { id: 'contributions', label: 'Layer Contributions' },
  { id: 'entropy', label: 'Entropy' },
] as const

type TabId = typeof TABS[number]['id']

export function DashboardView() {
  const [activeTab, setActiveTab] = useState<TabId>('residual')
  const result = useInferenceStore((s) => s.result)

  if (!result) return null

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex gap-1 bg-surface-elevated rounded-lg p-1 border border-border-subtle w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-surface-elevated rounded-lg border border-border-subtle p-4">
        {activeTab === 'residual' && (
          <ResidualNormHeatmap
            norms={result.residual_norms}
            tokens={result.tokens.strings}
          />
        )}
        {activeTab === 'logit_lens' && (
          <LogitLensChart
            logitLens={result.logit_lens}
            tokens={result.tokens.strings}
          />
        )}
        {activeTab === 'contributions' && (
          <LayerContributionBar result={result} />
        )}
        {activeTab === 'entropy' && (
          <EntropyChart
            logitLens={result.logit_lens}
            tokens={result.tokens.strings}
          />
        )}
      </div>
    </div>
  )
}
