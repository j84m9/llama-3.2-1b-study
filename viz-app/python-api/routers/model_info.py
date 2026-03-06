import json
import os
from fastapi import APIRouter, HTTPException
from services.model_service import model_service, REPO_ROOT

router = APIRouter(prefix="/model", tags=["model"])


@router.get("/info")
def get_model_info():
    if not model_service.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    config_path = os.path.join(REPO_ROOT, "config.json")
    with open(config_path) as f:
        config = json.load(f)

    num_layers = config["num_hidden_layers"]
    num_heads = config["num_attention_heads"]
    hidden_size = config["hidden_size"]
    head_dim = hidden_size // num_heads

    # Build component list for the architecture diagram
    components = []
    components.append({"type": "embedding", "name": "Token Embedding", "params": "embed_tokens"})

    for i in range(num_layers):
        components.append({
            "type": "transformer_block",
            "name": f"Layer {i}",
            "layer_index": i,
            "children": [
                {"type": "rms_norm", "name": f"Input LayerNorm", "params": f"layers.{i}.input_layernorm"},
                {"type": "attention", "name": f"Self-Attention", "params": f"layers.{i}.self_attn",
                 "num_heads": num_heads, "num_kv_heads": config["num_key_value_heads"], "head_dim": head_dim},
                {"type": "residual_add", "name": "Residual Add (Attention)"},
                {"type": "rms_norm", "name": f"Post-Attention LayerNorm", "params": f"layers.{i}.post_attention_layernorm"},
                {"type": "mlp", "name": f"MLP", "params": f"layers.{i}.mlp",
                 "intermediate_size": config["intermediate_size"]},
                {"type": "residual_add", "name": "Residual Add (MLP)"},
            ],
        })

    components.append({"type": "rms_norm", "name": "Final LayerNorm", "params": "model.norm"})
    components.append({"type": "lm_head", "name": "LM Head (tied)", "params": "lm_head"})

    return {
        "name": "Llama 3.2-1B",
        "num_layers": num_layers,
        "hidden_size": hidden_size,
        "num_attention_heads": num_heads,
        "num_kv_heads": config["num_key_value_heads"],
        "intermediate_size": config["intermediate_size"],
        "vocab_size": config["vocab_size"],
        "max_position_embeddings": config["max_position_embeddings"],
        "head_dim": head_dim,
        "components": components,
    }
