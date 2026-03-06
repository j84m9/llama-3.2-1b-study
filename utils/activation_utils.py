"""
Activation extraction utilities for Llama 3.2-1B.

Uses PyTorch forward hooks to capture intermediate activations
(residual stream, attention weights, MLP outputs) during inference.
"""

import os
import torch
import torch.nn.functional as F
from dotenv import load_dotenv
from transformers import AutoModelForCausalLM, AutoTokenizer
from contextlib import contextmanager

load_dotenv()

MODEL_PATH = os.getenv("MODEL_PATH", "./Llama-3.2-1B")


def load_model(path=None, device="cpu"):
    """Load the full Llama model and tokenizer."""
    path = path or MODEL_PATH
    tokenizer = AutoTokenizer.from_pretrained(path)
    model = AutoModelForCausalLM.from_pretrained(
        path,
        torch_dtype=torch.float32,  # float32 for analysis precision
        device_map=device,
    )
    model.eval()
    return model, tokenizer


def tokenize(text, tokenizer, device="cpu"):
    """Tokenize text and return input_ids tensor."""
    inputs = tokenizer(text, return_tensors="pt").to(device)
    return inputs


def get_layer_names(model):
    """Return all named modules in the model for reference."""
    return [name for name, _ in model.named_modules()]


class ActivationCache:
    """Captures and stores activations from a forward pass using hooks.

    Usage:
        model, tokenizer = load_model()
        cache = ActivationCache(model)

        with cache.capture():
            inputs = tokenize("Hello world", tokenizer)
            outputs = model(**inputs)

        # Access residual stream after each layer
        cache.residual_stream  # dict: layer_idx -> (1, seq_len, 2048)

        # Access attention weights
        cache.attention_weights  # dict: layer_idx -> (1, 32, seq_len, seq_len)

        # Access MLP intermediate activations
        cache.mlp_activations  # dict: layer_idx -> (1, seq_len, 8192)
    """

    def __init__(self, model):
        self.model = model
        self.residual_stream = {}     # after each full layer
        self.attention_weights = {}   # attention patterns per layer
        self.attention_outputs = {}   # attention output per layer
        self.mlp_activations = {}     # MLP gate activations per layer
        self.mlp_outputs = {}         # MLP output per layer
        self.input_embeds = None      # embedding layer output
        self.final_norm = None        # output of final RMSNorm
        self._hooks = []

    def clear(self):
        """Clear all cached activations."""
        self.residual_stream.clear()
        self.attention_weights.clear()
        self.attention_outputs.clear()
        self.mlp_activations.clear()
        self.mlp_outputs.clear()
        self.input_embeds = None
        self.final_norm = None

    @contextmanager
    def capture(self, layers=None, capture_attention=True, capture_mlp=True):
        """Context manager that installs hooks, yields, then removes them.

        Args:
            layers: list of layer indices to capture (None = all 16)
            capture_attention: whether to capture attention weights
            capture_mlp: whether to capture MLP activations
        """
        self.clear()
        self._install_hooks(layers, capture_attention, capture_mlp)
        try:
            yield self
        finally:
            self._remove_hooks()

    def _install_hooks(self, layers, capture_attention, capture_mlp):
        num_layers = self.model.config.num_hidden_layers
        target_layers = set(layers) if layers else set(range(num_layers))

        # Hook: embedding output
        def embed_hook(module, input, output):
            self.input_embeds = output.detach().clone()

        self._hooks.append(
            self.model.model.embed_tokens.register_forward_hook(embed_hook)
        )

        # Hook: each decoder layer's full output (residual stream)
        for idx in target_layers:
            layer = self.model.model.layers[idx]

            def layer_hook(module, input, output, idx=idx):
                # output is a tuple: (hidden_states, ...)
                self.residual_stream[idx] = output[0].detach().clone()

            self._hooks.append(layer.register_forward_hook(layer_hook))

            if capture_attention:
                def attn_hook(module, input, output, idx=idx):
                    # output is (attn_output, attn_weights, past_kv)
                    # attn_weights only present with output_attentions=True
                    if isinstance(output, tuple) and len(output) > 1 and output[1] is not None:
                        self.attention_weights[idx] = output[1].detach().clone()
                    self.attention_outputs[idx] = output[0].detach().clone()

                self._hooks.append(layer.self_attn.register_forward_hook(attn_hook))

            if capture_mlp:
                def mlp_hook(module, input, output, idx=idx):
                    self.mlp_outputs[idx] = output.detach().clone()

                self._hooks.append(layer.mlp.register_forward_hook(mlp_hook))

                # Capture gate activations (pre-SiLU)
                def gate_hook(module, input, output, idx=idx):
                    self.mlp_activations[idx] = output.detach().clone()

                self._hooks.append(layer.mlp.gate_proj.register_forward_hook(gate_hook))

        # Hook: final layer norm
        def norm_hook(module, input, output):
            self.final_norm = output.detach().clone()

        self._hooks.append(
            self.model.model.norm.register_forward_hook(norm_hook)
        )

    def _remove_hooks(self):
        for hook in self._hooks:
            hook.remove()
        self._hooks.clear()

    def residual_stream_norms(self):
        """L2 norm of residual stream at each layer. Shape: (num_layers, seq_len)."""
        norms = {}
        for idx in sorted(self.residual_stream.keys()):
            norms[idx] = self.residual_stream[idx].squeeze(0).norm(dim=-1)
        return norms

    def layer_deltas(self):
        """Change in residual stream from each layer (how much each layer contributes).

        Returns dict: layer_idx -> L2 norm of (output - input) per token position.
        """
        deltas = {}
        sorted_layers = sorted(self.residual_stream.keys())

        for i, idx in enumerate(sorted_layers):
            if i == 0:
                prev = self.input_embeds
            else:
                prev = self.residual_stream[sorted_layers[i - 1]]

            delta = self.residual_stream[idx] - prev
            deltas[idx] = delta.squeeze(0).norm(dim=-1)

        return deltas


def run_with_cache(model, tokenizer, text, layers=None, output_attentions=True):
    """Convenience function: tokenize, run forward pass, return cache + logits.

    Args:
        model: loaded Llama model
        tokenizer: loaded tokenizer
        text: input text string
        layers: optional list of layer indices to capture
        output_attentions: whether to capture attention weights

    Returns:
        (cache, logits, tokens) tuple
    """
    cache = ActivationCache(model)
    inputs = tokenize(text, tokenizer, device=model.device)

    with torch.no_grad(), cache.capture(layers=layers, capture_attention=output_attentions):
        outputs = model(**inputs, output_attentions=output_attentions)

    token_ids = inputs["input_ids"].squeeze(0).tolist()
    token_strs = [tokenizer.decode(t) for t in token_ids]

    return cache, outputs.logits, token_ids, token_strs


def cosine_similarity_matrix(act1, act2):
    """Cosine similarity between two activation tensors along last dimension."""
    return F.cosine_similarity(act1, act2, dim=-1)
