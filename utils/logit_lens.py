"""
Logit Lens for Llama 3.2-1B.

Projects the residual stream at each layer through the unembedding matrix
to see what the model would "predict" at intermediate layers.

Since Llama 3.2 uses tied embeddings (embed_tokens == lm_head),
we project through the embedding matrix directly.

Reference: nostalgebraist's "interpreting GPT: the logit lens" (2020)
"""

import torch
import torch.nn.functional as F


def get_unembedding(model):
    """Get the unembedding matrix (vocab projection weights).

    For Llama 3.2-1B, embeddings are tied so lm_head.weight == embed_tokens.weight.
    """
    if model.config.tie_word_embeddings:
        return model.model.embed_tokens.weight  # (vocab_size, hidden_dim)
    else:
        return model.lm_head.weight


def logit_lens(cache, model, tokenizer=None, top_k=5, apply_norm=True):
    """Apply logit lens: project each layer's residual stream to vocabulary logits.

    Args:
        cache: ActivationCache with captured residual_stream
        model: the Llama model (for unembedding weights and final norm)
        tokenizer: optional, for decoding top-k predictions
        top_k: number of top predictions to return
        apply_norm: whether to apply the final RMSNorm before projecting
                    (True gives more accurate predictions)

    Returns:
        dict with keys:
            'logits': {layer_idx: (seq_len, vocab_size)} raw logits
            'top_tokens': {layer_idx: list of (token_str, prob) per position}
            'top_token_ids': {layer_idx: (seq_len, top_k)} token ids
            'probs': {layer_idx: (seq_len, top_k)} probabilities
            'entropy': {layer_idx: (seq_len,)} entropy of prediction distribution
    """
    unembed = get_unembedding(model)  # (vocab, hidden)
    final_norm = model.model.norm

    result = {
        "logits": {},
        "top_token_ids": {},
        "probs": {},
        "entropy": {},
        "top_tokens": {},
    }

    sorted_layers = sorted(cache.residual_stream.keys())

    for idx in sorted_layers:
        hidden = cache.residual_stream[idx].squeeze(0)  # (seq_len, hidden_dim)

        if apply_norm:
            hidden = final_norm(hidden)

        # Project to vocab: (seq_len, hidden_dim) @ (hidden_dim, vocab) = (seq_len, vocab)
        logits = hidden @ unembed.T
        result["logits"][idx] = logits

        # Softmax for probabilities
        probs = F.softmax(logits, dim=-1)

        # Top-k predictions
        top_probs, top_ids = probs.topk(top_k, dim=-1)
        result["top_token_ids"][idx] = top_ids
        result["probs"][idx] = top_probs

        # Entropy of full distribution (bits)
        log_probs = F.log_softmax(logits, dim=-1)
        entropy = -(probs * log_probs).sum(dim=-1) / torch.log(torch.tensor(2.0))
        result["entropy"][idx] = entropy

        # Decode tokens if tokenizer provided
        if tokenizer is not None:
            layer_tokens = []
            for pos in range(top_ids.shape[0]):
                pos_tokens = []
                for k in range(top_k):
                    tid = top_ids[pos, k].item()
                    p = top_probs[pos, k].item()
                    pos_tokens.append((tokenizer.decode(tid), p))
                layer_tokens.append(pos_tokens)
            result["top_tokens"][idx] = layer_tokens

    return result


def logit_lens_target(cache, model, target_token_ids):
    """Track the probability of specific target tokens across layers.

    Useful for seeing how the model builds up confidence in the correct
    next-token prediction layer by layer.

    Args:
        cache: ActivationCache with captured residual_stream
        model: the Llama model
        target_token_ids: list of token IDs (one per position, typically the
                         actual next tokens in the sequence)

    Returns:
        dict: layer_idx -> tensor of shape (num_targets,) with probabilities
    """
    unembed = get_unembedding(model)
    final_norm = model.model.norm
    target_ids = torch.tensor(target_token_ids)

    result = {}
    for idx in sorted(cache.residual_stream.keys()):
        hidden = cache.residual_stream[idx].squeeze(0)
        hidden = final_norm(hidden)
        logits = hidden @ unembed.T
        probs = F.softmax(logits, dim=-1)

        # Gather probabilities for target tokens
        # For position i, get probability of target_token_ids[i]
        n = min(len(target_token_ids), probs.shape[0])
        target_probs = probs[torch.arange(n), target_ids[:n]]
        result[idx] = target_probs

    return result


def format_logit_lens_table(lens_result, token_strs, top_k=3):
    """Format logit lens results as a readable string table.

    Args:
        lens_result: output from logit_lens()
        token_strs: list of input token strings
        top_k: how many top predictions to show

    Returns:
        formatted string
    """
    lines = []
    sorted_layers = sorted(lens_result["top_tokens"].keys())

    header = f"{'Layer':>6} | {'Pos':>4} | {'Input Token':>15} | {'Entropy':>8} | Top Predictions"
    lines.append(header)
    lines.append("-" * len(header) + "-" * 40)

    for idx in sorted_layers:
        for pos in range(len(token_strs)):
            entropy = lens_result["entropy"][idx][pos].item()
            preds = lens_result["top_tokens"][idx][pos][:top_k]
            pred_str = ", ".join(f"'{t}' ({p:.3f})" for t, p in preds)
            tok = token_strs[pos]
            lines.append(f"{idx:>6} | {pos:>4} | {tok:>15} | {entropy:>8.2f} | {pred_str}")
        lines.append("")

    return "\n".join(lines)
