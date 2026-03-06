from fastapi import APIRouter, HTTPException
from schemas.requests import InferRequest, AttentionRequest
from services.model_service import model_service
from services.cache_service import result_cache
from services.activation_service import (
    cache_to_residual_norms,
    cache_to_layer_deltas,
    cache_to_attention_vs_mlp,
    logit_lens_to_json,
    attention_weights_to_json,
)

router = APIRouter(prefix="/infer", tags=["inference"])


@router.post("")
def infer(req: InferRequest):
    if not model_service.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    cached = result_cache.get("infer", req.text, str(req.include_attention))
    if cached is not None:
        return cached

    cache, logits, token_ids, token_strs = model_service.run_inference(
        req.text, output_attentions=req.include_attention
    )

    prediction = model_service.get_prediction(logits)
    lens_result = model_service.get_logit_lens(cache)

    result = {
        "tokens": {
            "ids": token_ids.tolist() if hasattr(token_ids, 'tolist') else list(token_ids),
            "strings": token_strs,
            "count": len(token_strs),
        },
        "prediction": prediction,
        "residual_norms": cache_to_residual_norms(cache),
        "layer_deltas": cache_to_layer_deltas(cache),
        "attention_vs_mlp": cache_to_attention_vs_mlp(cache),
        "logit_lens": logit_lens_to_json(lens_result),
    }

    result_cache.put(result, "infer", req.text, str(req.include_attention))
    return result


@router.post("/attention")
def infer_attention(req: AttentionRequest):
    if not model_service.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    layer = req.layer if req.layer is not None else 0
    if layer < 0 or layer >= 16:
        raise HTTPException(status_code=400, detail=f"Layer must be 0-15, got {layer}")

    cached = result_cache.get("attention", req.text, str(layer), str(req.head))
    if cached is not None:
        return cached

    cache, logits, token_ids, token_strs = model_service.run_inference(
        req.text, output_attentions=True
    )

    weights = attention_weights_to_json(cache, layer, req.head)

    result = {
        "layer": layer,
        "head": req.head,
        "tokens": token_strs,
        "weights": weights,
    }

    result_cache.put(result, "attention", req.text, str(layer), str(req.head))
    return result
