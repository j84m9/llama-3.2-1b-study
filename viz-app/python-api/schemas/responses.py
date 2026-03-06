from pydantic import BaseModel


class TokenInfo(BaseModel):
    ids: list[int]
    strings: list[str]
    count: int


class Prediction(BaseModel):
    token: str
    token_id: int
    probability: float


class LogitLensResult(BaseModel):
    entropy: dict[str, list[float]]
    top_predictions: dict[str, list[list[dict]]]
    target_probs: dict[str, list[float]] | None = None


class InferenceResult(BaseModel):
    tokens: TokenInfo
    prediction: Prediction
    residual_norms: dict[str, list[float]]
    layer_deltas: dict[str, list[float]]
    attention_vs_mlp: dict[str, dict[str, float]]
    logit_lens: LogitLensResult


class AttentionResult(BaseModel):
    layer: int
    head: int | None
    tokens: list[str]
    weights: list[list[list[float]]]  # [heads, seq, seq] or [1, seq, seq]


class LayerStats(BaseModel):
    layer_index: int
    residual_mean: float
    residual_std: float
    residual_norm_per_token: list[float]
    attention_output_norm: float
    mlp_output_norm: float
    gate_activation_stats: dict[str, float]
    top_neurons: list[dict]
    sparsity: float


class ModelInfo(BaseModel):
    name: str
    num_layers: int
    hidden_size: int
    num_attention_heads: int
    num_kv_heads: int
    intermediate_size: int
    vocab_size: int
    max_position_embeddings: int
    head_dim: int
    components: list[dict]


class AblationResult(BaseModel):
    original: InferenceResult
    modified: InferenceResult
    modifications_applied: list[dict]
