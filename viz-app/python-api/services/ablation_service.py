import torch
from services.model_service import model_service


def apply_ablation_hooks(model, modifications):
    """Register forward hooks for ablation modifications. Returns list of hook handles."""
    handles = []

    for mod in modifications:
        layer_idx = mod["layer"]
        mod_type = mod["type"]
        layer = model.model.layers[layer_idx]

        if mod_type == "zero_layer":
            # Zero out the entire layer's output contribution
            def make_zero_hook(layer_module):
                def hook(module, input, output):
                    # output is a tuple; first element is hidden states
                    if isinstance(output, tuple):
                        zeroed = torch.zeros_like(output[0])
                        return (zeroed,) + output[1:]
                    return torch.zeros_like(output)
                return hook
            h = layer.register_forward_hook(make_zero_hook(layer))
            handles.append(h)

        elif mod_type == "zero_head":
            head = mod.get("head")
            if head is None:
                continue

            def make_head_zero_hook(head_idx):
                def hook(module, input, output):
                    # Self-attention output; zero out specific head
                    if isinstance(output, tuple):
                        hidden = output[0].clone()
                    else:
                        hidden = output.clone()
                    head_dim = hidden.shape[-1] // 32  # num_attention_heads
                    start = head_idx * head_dim
                    end = start + head_dim
                    hidden[:, :, start:end] = 0
                    if isinstance(output, tuple):
                        return (hidden,) + output[1:]
                    return hidden
                return hook
            h = layer.self_attn.register_forward_hook(make_head_zero_hook(head))
            handles.append(h)

        elif mod_type == "clamp":
            clamp_val = mod.get("clamp_value", 1.0)

            def make_clamp_hook(val):
                def hook(module, input, output):
                    if isinstance(output, tuple):
                        clamped = output[0].clamp(-val, val)
                        return (clamped,) + output[1:]
                    return output.clamp(-val, val)
                return hook
            h = layer.register_forward_hook(make_clamp_hook(clamp_val))
            handles.append(h)

        elif mod_type == "mean_ablate":
            def make_mean_hook():
                def hook(module, input, output):
                    if isinstance(output, tuple):
                        mean_val = output[0].mean(dim=-1, keepdim=True).expand_as(output[0])
                        return (mean_val,) + output[1:]
                    mean_val = output.mean(dim=-1, keepdim=True).expand_as(output)
                    return mean_val
                return hook
            h = layer.register_forward_hook(make_mean_hook())
            handles.append(h)

    return handles


def run_ablation(text: str, modifications: list[dict]) -> dict:
    """Run inference with and without ablation modifications."""
    from services.activation_service import (
        cache_to_residual_norms,
        cache_to_layer_deltas,
        cache_to_attention_vs_mlp,
        logit_lens_to_json,
    )

    # Baseline run
    cache_base, logits_base, token_ids, token_strs = model_service.run_inference(text)
    base_prediction = model_service.get_prediction(logits_base)
    base_lens = model_service.get_logit_lens(cache_base)

    base_result = {
        "tokens": {"ids": token_ids.tolist() if hasattr(token_ids, 'tolist') else list(token_ids), "strings": token_strs, "count": len(token_strs)},
        "prediction": base_prediction,
        "residual_norms": cache_to_residual_norms(cache_base),
        "layer_deltas": cache_to_layer_deltas(cache_base),
        "attention_vs_mlp": cache_to_attention_vs_mlp(cache_base),
        "logit_lens": logit_lens_to_json(base_lens),
    }

    # Modified run with hooks
    mod_dicts = [m if isinstance(m, dict) else m.dict() for m in modifications]
    handles = apply_ablation_hooks(model_service.model, mod_dicts)
    try:
        cache_mod, logits_mod, _, _ = model_service.run_inference(text)
        mod_prediction = model_service.get_prediction(logits_mod)
        mod_lens = model_service.get_logit_lens(cache_mod)

        mod_result = {
            "tokens": {"ids": token_ids.tolist() if hasattr(token_ids, 'tolist') else list(token_ids), "strings": token_strs, "count": len(token_strs)},
            "prediction": mod_prediction,
            "residual_norms": cache_to_residual_norms(cache_mod),
            "layer_deltas": cache_to_layer_deltas(cache_mod),
            "attention_vs_mlp": cache_to_attention_vs_mlp(cache_mod),
            "logit_lens": logit_lens_to_json(mod_lens),
        }
    finally:
        for h in handles:
            h.remove()

    return {
        "original": base_result,
        "modified": mod_result,
        "modifications_applied": mod_dicts,
    }
