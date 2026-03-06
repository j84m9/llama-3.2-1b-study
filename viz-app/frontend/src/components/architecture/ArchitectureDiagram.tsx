import { useInferenceStore } from '../../store/inferenceStore'
import { useSelectionStore } from '../../store/selectionStore'
import { EmbeddingBlock } from './EmbeddingBlock'
import { TransformerBlock } from './TransformerBlock'
import { UnembeddingBlock } from './UnembeddingBlock'
import { ResidualConnection } from './ResidualConnection'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { meanOfArray } from '../../utils/tensorHelpers'

const NUM_LAYERS = 16
const BLOCK_WIDTH = 700
const BLOCK_HEIGHT_EXPANDED = 70
const BLOCK_HEIGHT_COLLAPSED = 32
const BLOCK_SPACING = 8
const HEADER_HEIGHT = 60
const FOOTER_HEIGHT = 60
const RESIDUAL_X = 30

export function ArchitectureDiagram() {
  const result = useInferenceStore((s) => s.result)
  const expandedLayers = useSelectionStore((s) => s.expandedLayers)
  const toggleLayer = useSelectionStore((s) => s.toggleLayer)

  if (!result) return null

  // Compute layer delta magnitudes for color intensity
  const layerMeanDeltas = Object.entries(result.layer_deltas).map(([, vals]) => meanOfArray(vals))
  const maxDelta = Math.max(...layerMeanDeltas, 0.001)

  // Calculate positions
  let yPos = 20
  const positions: { y: number; height: number; expanded: boolean }[] = []

  // Embedding block
  const embeddingY = yPos
  yPos += HEADER_HEIGHT + BLOCK_SPACING

  for (let i = 0; i < NUM_LAYERS; i++) {
    const expanded = expandedLayers.has(i)
    const height = expanded ? BLOCK_HEIGHT_EXPANDED : BLOCK_HEIGHT_COLLAPSED
    positions.push({ y: yPos, height, expanded })
    yPos += height + BLOCK_SPACING
  }

  // Unembed block
  const unembedY = yPos
  yPos += FOOTER_HEIGHT + 20

  const totalHeight = yPos
  const svgWidth = BLOCK_WIDTH + 80

  return (
    <div className="flex justify-center">
      <svg
        width={svgWidth}
        height={totalHeight}
        viewBox={`0 0 ${svgWidth} ${totalHeight}`}
        className="select-none"
      >
        {/* Residual stream backbone */}
        <ResidualConnection
          x={RESIDUAL_X}
          yStart={embeddingY + HEADER_HEIGHT / 2}
          yEnd={unembedY + FOOTER_HEIGHT / 2}
        />

        {/* Embedding */}
        <EmbeddingBlock x={50} y={embeddingY} width={BLOCK_WIDTH} height={HEADER_HEIGHT} />

        {/* Transformer layers */}
        {positions.map(({ y, height, expanded }, i) => {
          const delta = layerMeanDeltas[i] ?? 0
          const intensity = 0.2 + 0.8 * (delta / maxDelta)

          if (!expanded) {
            // Collapsed layer
            return (
              <g key={i} onClick={() => toggleLayer(i)} className="cursor-pointer">
                <rect
                  x={50}
                  y={y}
                  width={BLOCK_WIDTH}
                  height={height}
                  rx={4}
                  fill={`rgba(30, 41, 59, ${intensity})`}
                  stroke="#334155"
                  strokeWidth={1}
                />
                <g transform={`translate(${60}, ${y + height / 2})`}>
                  <ChevronRight x={0} y={-6} width={12} height={12} className="text-text-muted" />
                </g>
                <text x={80} y={y + height / 2 + 4} fill="#94a3b8" fontSize={11} fontFamily="monospace">
                  Layer {i}
                </text>
                <text x={BLOCK_WIDTH - 10} y={y + height / 2 + 4} fill="#64748b" fontSize={10} textAnchor="end" fontFamily="monospace">
                  Δ {delta.toFixed(2)}
                </text>
              </g>
            )
          }

          return (
            <g key={i}>
              {/* Collapse handle */}
              <g onClick={() => toggleLayer(i)} className="cursor-pointer">
                <rect
                  x={50}
                  y={y}
                  width={BLOCK_WIDTH}
                  height={16}
                  rx={4}
                  fill="transparent"
                />
                <g transform={`translate(${55}, ${y + 2})`}>
                  <ChevronDown x={0} y={0} width={12} height={12} className="text-text-muted" />
                </g>
                <text x={72} y={y + 11} fill="#64748b" fontSize={10} fontFamily="monospace">
                  Layer {i}
                </text>
              </g>

              <TransformerBlock
                x={50}
                y={y + 16}
                width={BLOCK_WIDTH}
                height={height - 16}
                layerIndex={i}
                intensity={intensity}
                delta={delta}
              />
            </g>
          )
        })}

        {/* Final norm + LM Head */}
        <UnembeddingBlock
          x={50}
          y={unembedY}
          width={BLOCK_WIDTH}
          height={FOOTER_HEIGHT}
          prediction={result.prediction}
        />
      </svg>
    </div>
  )
}
