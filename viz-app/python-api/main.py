import sys
import os
from pathlib import Path
from contextlib import asynccontextmanager

# Ensure repo root is on path for imports
REPO_ROOT = str(Path(__file__).resolve().parents[2])
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

# Also add python-api dir itself for local imports
API_DIR = str(Path(__file__).resolve().parent)
if API_DIR not in sys.path:
    sys.path.insert(0, API_DIR)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import ORJSONResponse

from services.model_service import model_service
from routers import inference, activations, ablation, model_info


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load model at startup
    print("Loading Llama 3.2-1B model...")
    model_service.load()
    print(f"Model loaded on {model_service.device}")
    yield
    print("Shutting down...")


app = FastAPI(
    title="Llama 3.2-1B Viz API",
    version="1.0.0",
    default_response_class=ORJSONResponse,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(model_info.router)
app.include_router(inference.router)
app.include_router(activations.router)
app.include_router(ablation.router)


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model_service.is_loaded}
