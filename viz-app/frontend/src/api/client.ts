import type {
  InferenceResult,
  AttentionResult,
  LayerStats,
  ModelInfo,
  AblationModification,
  AblationResult,
} from './types'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const error = await res.text()
    throw new Error(`API error ${res.status}: ${error}`)
  }
  return res.json()
}

export async function getModelInfo(): Promise<ModelInfo> {
  return request('/model/info')
}

export async function runInference(text: string, includeAttention = false): Promise<InferenceResult> {
  return request('/infer', {
    method: 'POST',
    body: JSON.stringify({ text, include_attention: includeAttention }),
  })
}

export async function getAttention(text: string, layer?: number, head?: number): Promise<AttentionResult> {
  return request('/infer/attention', {
    method: 'POST',
    body: JSON.stringify({ text, layer, head }),
  })
}

export async function getLayerActivations(text: string, layerIdx: number): Promise<LayerStats> {
  return request(`/activations/layer/${layerIdx}`, {
    method: 'POST',
    body: JSON.stringify({ text }),
  })
}

export async function runAblation(
  text: string,
  modifications: AblationModification[]
): Promise<AblationResult> {
  return request('/ablation/run', {
    method: 'POST',
    body: JSON.stringify({ text, modifications }),
  })
}
