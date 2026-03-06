# Llama 3.2-1B Activation Study

Interactive visualization and mechanistic interpretability toolkit for studying the internals of Meta's Llama 3.2-1B (1.23B parameter) language model.

## Architecture Quick Reference

| Property | Value |
|----------|-------|
| Parameters | 1.23B |
| Layers | 16 transformer blocks |
| Hidden dim | 2048 |
| Attention heads | 32 query / 8 KV (GQA) |
| Head dim | 64 |
| MLP intermediate | 8192 (SiLU gated) |
| Vocab size | 128,256 |
| Embeddings | Tied (embed_tokens == lm_head) |
| Precision | bfloat16 |

## Project Structure

```
.
├── token_app.py                    # Streamlit tokenizer visualization
├── activation_app.py               # Streamlit activation analysis app
├── weight_exploration.ipynb        # Embedding PCA & weight exploration notebook
├── utils/
│   ├── activation_utils.py         # Hook-based activation capture, ActivationCache
│   ├── logit_lens.py               # Logit lens & target token tracking
│   ├── activation_style.css        # Dark theme styles for Streamlit
│   ├── token_utils.py              # Tokenizer wrapper
│   ├── html_utils.py               # Color-coded token HTML
│   ├── load_css.py                 # CSS injection for Streamlit
│   └── style.css                   # Token highlight colors
│
├── viz-app/                        # Full-stack interactive visualization
│   ├── python-api/                 # FastAPI backend (model inference)
│   │   ├── main.py                 # App entry, CORS, lifespan model loading
│   │   ├── routers/
│   │   │   ├── inference.py        # POST /infer, POST /infer/attention
│   │   │   ├── activations.py      # POST /activations/layer/{idx}
│   │   │   ├── ablation.py         # POST /ablation/run
│   │   │   └── model_info.py       # GET /model/info
│   │   ├── services/
│   │   │   ├── model_service.py    # Singleton model wrapper
│   │   │   ├── activation_service.py # Tensor→JSON conversion
│   │   │   ├── ablation_service.py # Hook-based ablation
│   │   │   └── cache_service.py    # In-memory LRU cache
│   │   └── schemas/                # Pydantic request/response models
│   │
│   ├── java-backend/               # Spring Boot caching proxy (optional)
│   │   ├── pom.xml
│   │   └── src/main/java/com/llamaviz/
│   │       ├── controller/         # /api/* endpoints with Caffeine caching
│   │       ├── service/            # WebClient, CacheService, SessionService
│   │       └── websocket/          # WebSocket progress streaming
│   │
│   └── frontend/                   # React/TypeScript interactive UI
│       ├── src/
│       │   ├── components/
│       │   │   ├── architecture/   # Interactive SVG transformer diagram
│       │   │   ├── inspectors/     # Click-to-inspect panels
│       │   │   ├── charts/         # Plotly.js visualizations
│       │   │   ├── controls/       # Prompt input, ablation controls
│       │   │   └── layout/         # AppShell, Sidebar, TopBar
│       │   ├── store/              # Zustand state management
│       │   ├── api/                # Fetch client & TypeScript types
│       │   └── theme/              # Dark theme & Tailwind config
│       └── package.json
│
├── config.json                     # Model architecture config
├── requirements.txt                # Python dependencies
└── .env                            # MODEL_PATH (not committed)
```

## Getting Started

### Prerequisites

- Python 3.10+ with PyTorch and Transformers
- Node.js 18+ (for the React frontend)
- Llama 3.2-1B model weights (set `MODEL_PATH` in `.env`)

### Streamlit Apps

```bash
# Tokenizer visualization
streamlit run token_app.py

# Activation analysis
streamlit run activation_app.py
```

### Full-Stack Viz App (2 terminals)

```bash
# Terminal 1: Python API
cd viz-app/python-api
pip install -r requirements.txt
python -m uvicorn main:app --reload --port 8000

# Terminal 2: React dev server
cd viz-app/frontend
npm install
npm run dev    # http://localhost:5173, proxies /api → :8000
```

## Features

### Streamlit Apps
- **Tokenizer App**: Real-time tokenization with color-coded spans, token/char counts
- **Activation App**: Residual stream heatmaps, logit lens, attention patterns, layer contributions

### Viz App (React + FastAPI)
- **Interactive architecture diagram**: SVG rendering of all 16 transformer layers with clickable sub-blocks (Attention, MLP, RMSNorm). Color intensity reflects layer delta magnitude.
- **Click-to-inspect**: Click any block to open a detail panel with attention heatmaps (per-head), MLP neuron rankings, residual stream statistics.
- **Dashboard view**: Tabbed Plotly.js charts — residual norms, logit lens entropy, layer contributions, attention vs MLP comparison.
- **Logit lens**: Track how predictions evolve layer-by-layer through the residual stream.
- **Ablation tools**: Zero layers/heads, mean ablate, or clamp activations and compare modified vs. original output.
- **Caching**: In-memory LRU cache (Python) so re-inspecting the same prompt is instant.

## Key Utilities

### `utils/activation_utils.py`
- `load_model(path, device)` — Load model + tokenizer
- `ActivationCache(model)` — Hook-based capture of residual stream, attention weights, MLP activations
- `run_with_cache(model, tokenizer, text)` — Convenience: forward pass with full activation capture

### `utils/logit_lens.py`
- `logit_lens(cache, model)` — Project each layer's residual stream through the unembedding matrix
- `logit_lens_target(cache, model, target_ids)` — Track specific token probabilities across layers

## Model License

The Llama 3.2 model weights are licensed under the [Llama 3.2 Community License](https://github.com/meta-llama/llama-models/blob/main/models/llama3_2/LICENSE). All analysis code in this repository is original work.
