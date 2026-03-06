import { create } from 'zustand'
import type { AblationModification, AblationResult } from '../api/types'
import { runAblation } from '../api/client'

interface AblationState {
  modifications: AblationModification[]
  result: AblationResult | null
  loading: boolean

  addModification: (mod: AblationModification) => void
  removeModification: (index: number) => void
  clearModifications: () => void
  runComparison: (text: string) => Promise<void>
}

export const useAblationStore = create<AblationState>((set, get) => ({
  modifications: [],
  result: null,
  loading: false,

  addModification: (mod) =>
    set((s) => ({ modifications: [...s.modifications, mod] })),

  removeModification: (index) =>
    set((s) => ({ modifications: s.modifications.filter((_, i) => i !== index) })),

  clearModifications: () => set({ modifications: [], result: null }),

  runComparison: async (text) => {
    const { modifications } = get()
    if (!modifications.length) return

    set({ loading: true })
    try {
      const result = await runAblation(text, modifications)
      set({ result, loading: false })
    } catch {
      set({ loading: false })
    }
  },
}))
