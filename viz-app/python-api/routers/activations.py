from fastapi import APIRouter, HTTPException, Path
from schemas.requests import LayerDetailRequest
from services.model_service import model_service
from services.activation_service import layer_detail_stats

router = APIRouter(prefix="/activations", tags=["activations"])


@router.post("/layer/{idx}")
def get_layer_activations(req: LayerDetailRequest, idx: int = Path(..., ge=0, le=15)):
    if not model_service.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    cache, logits, token_ids, token_strs = model_service.run_inference(req.text)

    if idx not in cache.residual_stream:
        raise HTTPException(status_code=404, detail=f"Layer {idx} not found in cache")

    stats = layer_detail_stats(cache, idx)
    stats["tokens"] = token_strs
    return stats
