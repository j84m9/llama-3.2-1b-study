from pydantic import BaseModel, Field


class InferRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2048)
    include_attention: bool = False


class AttentionRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2048)
    layer: int | None = None
    head: int | None = None


class LayerDetailRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2048)


class AblationModification(BaseModel):
    type: str = Field(..., pattern="^(zero_layer|zero_head|clamp|mean_ablate)$")
    layer: int
    head: int | None = None
    clamp_value: float | None = None


class AblationRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2048)
    modifications: list[AblationModification]
