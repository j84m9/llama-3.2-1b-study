import { create } from 'zustand'
import type { InferenceResult, ModelInfo } from '../api/types'
import { runInference, getModelInfo } from '../api/client'

interface InferenceState {
  prompt: string
  result: InferenceResult | null
  modelInfo: ModelInfo | null
  loading: boolean
  error: string | null

  setPrompt: (prompt: string) => void
  analyze: () => Promise<void>
  fetchModelInfo: () => Promise<void>
}

export const useInferenceStore = create<InferenceState>((set, get) => ({
  prompt: 'The capital of France is',
  result: null,
  modelInfo: null,
  loading: false,
  error: null,

  setPrompt: (prompt) => set({ prompt }),

  analyze: async () => {
    const { prompt } = get()
    if (!prompt.trim()) return

    set({ loading: true, error: null })
    try {
      const result = await runInference(prompt)
      set({ result, loading: false })
    } catch (e) {
      set({ error: (e as Error).message, loading: false })
    }
  },

  fetchModelInfo: async () => {
    try {
      const info = await getModelInfo()
      set({ modelInfo: info })
    } catch (e) {
      console.error('Failed to fetch model info:', e)
    }
  },
}))
