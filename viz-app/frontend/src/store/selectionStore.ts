import { create } from 'zustand'

export type SelectionType = 'attention' | 'mlp' | 'layer' | 'residual' | 'embedding' | 'lm_head' | 'rms_norm' | null

interface Selection {
  type: SelectionType
  layerIndex?: number
  headIndex?: number
}

interface SelectionState {
  selection: Selection | null
  expandedLayers: Set<number>
  viewMode: 'architecture' | 'dashboard'

  select: (sel: Selection | null) => void
  toggleLayer: (layerIdx: number) => void
  setViewMode: (mode: 'architecture' | 'dashboard') => void
}

export const useSelectionStore = create<SelectionState>((set) => ({
  selection: null,
  expandedLayers: new Set([0, 1, 15]),  // Default expanded
  viewMode: 'architecture',

  select: (selection) => set({ selection }),

  toggleLayer: (layerIdx) =>
    set((s) => {
      const next = new Set(s.expandedLayers)
      if (next.has(layerIdx)) {
        next.delete(layerIdx)
      } else {
        next.add(layerIdx)
      }
      return { expandedLayers: next }
    }),

  setViewMode: (viewMode) => set({ viewMode }),
}))
