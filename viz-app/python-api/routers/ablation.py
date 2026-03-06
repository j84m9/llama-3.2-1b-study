from fastapi import APIRouter, HTTPException
from schemas.requests import AblationRequest
from services.model_service import model_service
from services.ablation_service import run_ablation

router = APIRouter(prefix="/ablation", tags=["ablation"])


@router.post("/run")
def run_ablation_endpoint(req: AblationRequest):
    if not model_service.is_loaded:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    modifications = [m.model_dump() for m in req.modifications]
    result = run_ablation(req.text, modifications)
    return result
