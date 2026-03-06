import { useInferenceStore } from '../../store/inferenceStore'
import { ResidualNormHeatmap } from '../charts/ResidualNormHeatmap'
import { LogitLensChart } from '../charts/LogitLensChart'

export function ResidualInspector() {
  const result = useInferenceStore((s) => s.result)

  if (!result) return null

  return (
    <div className="p-3 space-y-4">
      <div>
        <h3 className="text-xs font-medium text-text-secondary mb-2">Residual Stream Norms</h3>
        <ResidualNormHeatmap
          norms={result.residual_norms}
          tokens={result.tokens.strings}
          compact
        />
      </div>

      <div>
        <h3 className="text-xs font-medium text-text-secondary mb-2">Logit Lens</h3>
        <LogitLensChart
          logitLens={result.logit_lens}
          tokens={result.tokens.strings}
          compact
        />
      </div>
    </div>
  )
}
