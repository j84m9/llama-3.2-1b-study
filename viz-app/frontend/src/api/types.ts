export interface TokenInfo {
  ids: number[]
  strings: string[]
  count: number
}

export interface Prediction {
  token: string
  token_id: number
  probability: number
}

export interface LogitLensResult {
  entropy: Record<string, number[]>
  top_predictions: Record<string, { token: string; prob: number }[][]>
  target_probs: Record<string, number[]> | null
}

export interface InferenceResult {
  tokens: TokenInfo
  prediction: Prediction
  residual_norms: Record<string, number[]>
  layer_deltas: Record<string, number[]>
  attention_vs_mlp: Record<string, { attention_norm: number; mlp_norm: number }>
  logit_lens: LogitLensResult
}

export interface AttentionResult {
  layer: number
  head: number | null
  tokens: string[]
  weights: number[][][]
}

export interface LayerStats {
  layer_index: number
  residual_mean: number
  residual_std: number
  residual_norm_per_token: number[]
  attention_output_norm: number
  mlp_output_norm: number
  gate_activation_stats: Record<string, number>
  top_neurons: { neuron_idx: number; mean_abs_activation: number }[]
  sparsity: number
  tokens: string[]
}

export interface ModelInfo {
  name: string
  num_layers: number
  hidden_size: number
  num_attention_heads: number
  num_kv_heads: number
  intermediate_size: number
  vocab_size: number
  max_position_embeddings: number
  head_dim: number
  components: ComponentInfo[]
}

export interface ComponentInfo {
  type: string
  name: string
  params?: string
  layer_index?: number
  children?: ComponentInfo[]
  num_heads?: number
  num_kv_heads?: number
  head_dim?: number
  intermediate_size?: number
}

export interface AblationModification {
  type: 'zero_layer' | 'zero_head' | 'clamp' | 'mean_ablate'
  layer: number
  head?: number
  clamp_value?: number
}

export interface AblationResult {
  original: InferenceResult
  modified: InferenceResult
  modifications_applied: AblationModification[]
}

export interface ProgressEvent {
  stage: string
  status: 'started' | 'completed' | 'error'
  message?: string
}
