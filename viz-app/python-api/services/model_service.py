import sys
import os
from pathlib import Path

# Add repo root so we can import existing utils
REPO_ROOT = str(Path(__file__).resolve().parents[3])
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

import torch
from dotenv import load_dotenv

load_dotenv(os.path.join(REPO_ROOT, ".env"))

from utils.activation_utils import load_model, run_with_cache, ActivationCache
from utils.logit_lens import logit_lens, logit_lens_target


class ModelService:
    """Singleton service wrapping model, tokenizer, and analysis utilities."""

    def __init__(self):
        self.model = None
        self.tokenizer = None
        self._loaded = False

    def load(self):
        if self._loaded:
            return
        model_path = os.environ.get("MODEL_PATH", REPO_ROOT)
        self.model, self.tokenizer = load_model(path=model_path, device="cpu")
        self.model.eval()
        self._loaded = True

    @property
    def is_loaded(self) -> bool:
        return self._loaded

    @property
    def device(self) -> str:
        if self.model is None:
            return "cpu"
        return str(next(self.model.parameters()).device)

    def run_inference(self, text: str, output_attentions: bool = False):
        """Run forward pass with activation caching. Returns (cache, logits, token_ids, token_strs)."""
        cache, logits, token_ids, token_strs = run_with_cache(
            self.model, self.tokenizer, text,
            layers=None,
            output_attentions=output_attentions,
        )
        return cache, logits, token_ids, token_strs

    def get_logit_lens(self, cache: ActivationCache, top_k: int = 5):
        """Run logit lens analysis on cached activations."""
        return logit_lens(cache, self.model, tokenizer=self.tokenizer, top_k=top_k)

    def get_logit_lens_target(self, cache: ActivationCache, target_token_ids):
        """Track specific target token probabilities across layers."""
        return logit_lens_target(cache, self.model, target_token_ids)

    def get_prediction(self, logits):
        """Get top prediction from final logits."""
        last_logits = logits[0, -1, :]
        probs = torch.softmax(last_logits, dim=-1)
        top_prob, top_idx = probs.max(dim=-1)
        token_str = self.tokenizer.decode([top_idx.item()])
        return {
            "token": token_str,
            "token_id": top_idx.item(),
            "probability": round(top_prob.item(), 4),
        }


# Module-level singleton
model_service = ModelService()
