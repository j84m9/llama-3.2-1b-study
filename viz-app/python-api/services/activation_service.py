import torch
import numpy as np
from utils.activation_utils import ActivationCache


def round_list(values, decimals=4):
    """Round a list or tensor of floats."""
    if isinstance(values, torch.Tensor):
        values = values.detach().cpu().float().tolist()
    if isinstance(values, (list, np.ndarray)):
        return [round(v, decimals) for v in values]
    return round(float(values), decimals)


def cache_to_residual_norms(cache: ActivationCache) -> dict[str, list[float]]:
    norms = cache.residual_stream_norms()
    return {str(k): round_list(v) for k, v in norms.items()}


def cache_to_layer_deltas(cache: ActivationCache) -> dict[str, list[float]]:
    deltas = cache.layer_deltas()
    return {str(k): round_list(v) for k, v in deltas.items()}


def cache_to_attention_vs_mlp(cache: ActivationCache) -> dict[str, dict[str, float]]:
    result = {}
    for layer_idx in cache.attention_outputs:
        attn_norm = cache.attention_outputs[layer_idx].float().norm().item()
        mlp_norm = cache.mlp_outputs[layer_idx].float().norm().item()
        result[str(layer_idx)] = {
            "attention_norm": round(attn_norm, 4),
            "mlp_norm": round(mlp_norm, 4),
        }
    return result


def logit_lens_to_json(lens_result: dict) -> dict:
    entropy = {}
    for k, v in lens_result["entropy"].items():
        entropy[str(k)] = round_list(v)

    top_predictions = {}
    for k, positions in lens_result["top_tokens"].items():
        top_predictions[str(k)] = [
            [{"token": tok, "prob": round(prob, 4)} for tok, prob in pos_preds]
            for pos_preds in positions
        ]

    return {
        "entropy": entropy,
        "top_predictions": top_predictions,
        "target_probs": None,
    }


def attention_weights_to_json(cache: ActivationCache, layer: int, head: int | None = None) -> list:
    """Extract attention weights for a specific layer and optionally a specific head."""
    if layer not in cache.attention_weights:
        raise ValueError(f"Layer {layer} attention weights not captured")

    weights = cache.attention_weights[layer]  # (1, num_heads, seq, seq)
    weights = weights.detach().cpu().float()

    if head is not None:
        # Single head: return [1, seq, seq]
        w = weights[0, head].unsqueeze(0)
    else:
        # All heads: return [num_heads, seq, seq]
        w = weights[0]

    return [
        [round_list(row) for row in head_weights.tolist()]
        for head_weights in w
    ]


def layer_detail_stats(cache: ActivationCache, layer_idx: int) -> dict:
    """Compute detailed statistics for a single layer."""
    residual = cache.residual_stream[layer_idx].detach().cpu().float()
    r_mean = residual.mean().item()
    r_std = residual.std().item()
    r_norms = residual[0].norm(dim=-1).tolist()

    attn_out = cache.attention_outputs.get(layer_idx)
    attn_norm = attn_out.float().norm().item() if attn_out is not None else 0.0

    mlp_out = cache.mlp_outputs.get(layer_idx)
    mlp_norm = mlp_out.float().norm().item() if mlp_out is not None else 0.0

    # Gate activation stats from MLP activations
    gate_stats = {}
    sparsity = 0.0
    top_neurons = []
    mlp_act = cache.mlp_activations.get(layer_idx)
    if mlp_act is not None:
        act = mlp_act.detach().cpu().float()
        gate_stats = {
            "mean": round(act.mean().item(), 4),
            "std": round(act.std().item(), 4),
            "min": round(act.min().item(), 4),
            "max": round(act.max().item(), 4),
            "abs_mean": round(act.abs().mean().item(), 4),
        }
        # Sparsity: fraction of near-zero activations
        sparsity = round((act.abs() < 0.01).float().mean().item(), 4)

        # Top neurons by mean absolute activation across positions
        mean_abs = act[0].abs().mean(dim=0)  # (intermediate_size,)
        top_k = min(20, mean_abs.shape[0])
        top_vals, top_ids = mean_abs.topk(top_k)
        top_neurons = [
            {"neuron_idx": idx.item(), "mean_abs_activation": round(val.item(), 4)}
            for idx, val in zip(top_ids, top_vals)
        ]

    return {
        "layer_index": layer_idx,
        "residual_mean": round(r_mean, 4),
        "residual_std": round(r_std, 4),
        "residual_norm_per_token": round_list(r_norms),
        "attention_output_norm": round(attn_norm, 4),
        "mlp_output_norm": round(mlp_norm, 4),
        "gate_activation_stats": gate_stats,
        "top_neurons": top_neurons,
        "sparsity": sparsity,
    }
