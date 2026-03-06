import { create } from 'zustand'
import type { AttentionResult, LayerStats } from '../api/types'
import { getAttention, getLayerActivations } from '../api/client'

interface ActivationState {
  attentionData: Record<string, AttentionResult>  // keyed by "layer-head"
  layerStats: Record<number, LayerStats>
  loadingAttention: boolean
  loadingLayer: boolean

  fetchAttention: (text: string, layer: number, head?: number) => Promise<void>
  fetchLayerStats: (text: string, layerIdx: number) => Promise<void>
}

export const useActivationStore = create<ActivationState>((set, get) => ({
  attentionData: {},
  layerStats: {},
  loadingAttention: false,
  loadingLayer: false,

  fetchAttention: async (text, layer, head) => {
    const key = `${layer}-${head ?? 'all'}`
    if (get().attentionData[key]) return

    set({ loadingAttention: true })
    try {
      const data = await getAttention(text, layer, head)
      set((s) => ({
        attentionData: { ...s.attentionData, [key]: data },
        loadingAttention: false,
      }))
    } catch {
      set({ loadingAttention: false })
    }
  },

  fetchLayerStats: async (text, layerIdx) => {
    if (get().layerStats[layerIdx]) return

    set({ loadingLayer: true })
    try {
      const data = await getLayerActivations(text, layerIdx)
      set((s) => ({
        layerStats: { ...s.layerStats, [layerIdx]: data },
        loadingLayer: false,
      }))
    } catch {
      set({ loadingLayer: false })
    }
  },
}))
