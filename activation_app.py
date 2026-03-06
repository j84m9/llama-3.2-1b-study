"""
Activation Visualization App for Llama 3.2-1B.

Interactive Streamlit app with Plotly charts for exploring model internals:
residual stream norms, logit lens, attention patterns, and layer contributions.
"""

import html
from contextlib import contextmanager

import streamlit as st
import torch
import numpy as np
import plotly.graph_objects as go
from plotly.subplots import make_subplots

from utils.activation_utils import load_model, run_with_cache
from utils.logit_lens import logit_lens, logit_lens_target
from utils.load_css import local_css

st.set_page_config(page_title="Llama 3.2-1B Activations", layout="wide")
local_css("utils/activation_style.css")


# ── Plotly Theme ──────────────────────────────────────────────────────────────

LAYOUT_BASE = dict(
    paper_bgcolor="#111827",
    plot_bgcolor="#111827",
    font=dict(family="Inter, system-ui, sans-serif", color="#94a3b8", size=12),
    xaxis=dict(gridcolor="#1f2937", linecolor="#1f2937", zerolinecolor="#1f2937"),
    yaxis=dict(gridcolor="#1f2937", linecolor="#1f2937", zerolinecolor="#1f2937"),
    hoverlabel=dict(
        bgcolor="#1e293b",
        bordercolor="#334155",
        font=dict(family="SF Mono, Fira Code, JetBrains Mono, monospace", color="#f1f5f9", size=12),
    ),
    margin=dict(l=50, r=20, t=40, b=50),
)

# Colorscale constants
CS_NORM = "Viridis"
CS_DELTA = "Magma"
CS_ENTROPY = "RdYlGn_r"
CS_ATTN = [
    [0.0, "#0f172a"],
    [0.25, "#1e3a5f"],
    [0.5, "#1d4ed8"],
    [0.75, "#3b82f6"],
    [1.0, "#93c5fd"],
]

# Multi-series token colors
TOKEN_COLORS = [
    "#3b82f6",  # blue
    "#8b5cf6",  # violet
    "#06b6d4",  # cyan
    "#f59e0b",  # amber
    "#10b981",  # emerald
    "#f43f5e",  # rose
    "#84cc16",  # lime
    "#f97316",  # orange
]


# ── Helpers ───────────────────────────────────────────────────────────────────

@contextmanager
def chart_card():
    st.markdown('<div class="chart-card">', unsafe_allow_html=True)
    yield
    st.markdown('</div>', unsafe_allow_html=True)


def token_pills_html(tokens: list[str]) -> str:
    spans = []
    for i, t in enumerate(tokens):
        cls = "blue" if i % 2 == 0 else "violet"
        spans.append(f'<span class="token-pill {cls}">{html.escape(t)}</span>')
    return " ".join(spans)


def prediction_badge_html(token: str, prob: float) -> str:
    return (
        f'<div class="pred-badge">'
        f'<span class="pred-label">Prediction</span>'
        f'<span class="pred-token">{html.escape(token)}</span>'
        f'<span class="pred-prob">{prob:.1%}</span>'
        f'</div>'
    )


# ── Model Loading ─────────────────────────────────────────────────────────────

@st.cache_resource
def get_model():
    model, tokenizer = load_model()
    return model, tokenizer


# ── Sidebar ───────────────────────────────────────────────────────────────────

st.sidebar.markdown(
    '<div class="sidebar-logo">'
    '<h2>Llama 3.2-1B</h2>'
    '<span class="model-badge">1.23B params · 16 layers · 2048 dim</span>'
    '</div>',
    unsafe_allow_html=True,
)
st.sidebar.markdown('<hr class="sidebar-divider">', unsafe_allow_html=True)

model, tokenizer = get_model()

prompt = st.sidebar.text_area("Prompt", value="The capital of France is", height=100)
analyze = st.sidebar.button("Analyze", type="primary", use_container_width=True)

# Run forward pass on click, store results in session state
if analyze and prompt.strip():
    with st.spinner("Running forward pass..."):
        cache, logits, token_ids, token_strs = run_with_cache(
            model, tokenizer, prompt, output_attentions=False
        )
        st.session_state["cache"] = cache
        st.session_state["logits"] = logits
        st.session_state["token_ids"] = token_ids
        st.session_state["token_strs"] = token_strs
        st.session_state["prompt"] = prompt
        # Clear stale attention cache when input changes
        st.session_state.pop("attention_weights", None)

# Show token info in sidebar when results exist
if "token_strs" in st.session_state:
    token_strs = st.session_state["token_strs"]
    token_ids = st.session_state["token_ids"]
    logits = st.session_state["logits"]

    st.sidebar.markdown('<hr class="sidebar-divider">', unsafe_allow_html=True)

    col1, col2 = st.sidebar.columns(2)
    col1.metric("Tokens", len(token_strs))
    col2.metric("Characters", len(st.session_state["prompt"]))

    # Colorized token pills
    st.sidebar.markdown(token_pills_html(token_strs), unsafe_allow_html=True)

    st.sidebar.markdown('<hr class="sidebar-divider">', unsafe_allow_html=True)

    # Model prediction
    pred_id = logits[0, -1].argmax().item()
    pred_token = tokenizer.decode(pred_id)
    pred_prob = torch.softmax(logits[0, -1], dim=-1)[pred_id].item()
    st.sidebar.markdown(prediction_badge_html(pred_token, pred_prob), unsafe_allow_html=True)


# ── Guard: require analysis before showing tabs ──────────────────────────────

if "cache" not in st.session_state:
    st.info("Enter a prompt and click **Analyze** to begin.")
    st.stop()

cache = st.session_state["cache"]
token_strs = st.session_state["token_strs"]
token_ids = st.session_state["token_ids"]
logits = st.session_state["logits"]
num_layers = model.config.num_hidden_layers


# ── Tabs ──────────────────────────────────────────────────────────────────────

tab1, tab2, tab3, tab4 = st.tabs([
    "Residual Stream", "Logit Lens", "Attention Patterns", "Layer Contributions"
])


# ── Tab 1: Residual Stream ───────────────────────────────────────────────────

with tab1:
    norms = cache.residual_stream_norms()
    deltas = cache.layer_deltas()

    layers = sorted(norms.keys())
    norm_matrix = np.stack([norms[l].detach().numpy() for l in layers])
    delta_matrix = np.stack([deltas[l].detach().numpy() for l in layers])
    layer_labels = [f"L{l}" for l in layers]

    left, right = st.columns(2)

    with left:
        with chart_card():
            st.subheader("Residual Stream L2 Norm")
            fig = go.Figure(go.Heatmap(
                z=norm_matrix, x=token_strs, y=layer_labels,
                colorscale=CS_NORM,
                hovertemplate="Token: %{x}<br>Layer: %{y}<br>Norm: %{z:.2f}<extra></extra>"
            ))
            fig.update_layout(**LAYOUT_BASE, height=500, xaxis_title="Token", yaxis_title="Layer", yaxis_autorange="reversed")
            st.plotly_chart(fig, use_container_width=True)
            st.caption("L2 norm of the residual stream at each layer. Growing norms indicate accumulating information; sudden jumps highlight layers with large contributions.")

    with right:
        with chart_card():
            st.subheader("Layer Delta (Contribution)")
            fig = go.Figure(go.Heatmap(
                z=delta_matrix, x=token_strs, y=layer_labels,
                colorscale=CS_DELTA,
                hovertemplate="Token: %{x}<br>Layer: %{y}<br>Delta: %{z:.2f}<extra></extra>"
            ))
            fig.update_layout(**LAYOUT_BASE, height=500, xaxis_title="Token", yaxis_title="Layer", yaxis_autorange="reversed")
            st.plotly_chart(fig, use_container_width=True)
            st.caption("L2 norm of each layer's additive contribution (residual delta). Bright spots show where the model makes its largest updates to the representation.")


# ── Tab 2: Logit Lens ────────────────────────────────────────────────────────

with tab2:
    lens = logit_lens(cache, model, tokenizer=tokenizer, top_k=5)

    # Build next-token targets (shifted by 1)
    next_token_ids = token_ids[1:] + [token_ids[-1]]
    target_probs = logit_lens_target(cache, model, next_token_ids)

    layers = sorted(lens["entropy"].keys())
    layer_labels = [f"L{l}" for l in layers]

    # Entropy heatmap
    entropy_matrix = np.stack([lens["entropy"][l].detach().numpy() for l in layers])

    # Target probability heatmap
    target_matrix = np.stack([target_probs[l].detach().numpy() for l in layers])

    left, right = st.columns(2)

    with left:
        with chart_card():
            st.subheader("Prediction Entropy (bits)")
            fig = go.Figure(go.Heatmap(
                z=entropy_matrix, x=token_strs, y=layer_labels,
                colorscale=CS_ENTROPY,
                hovertemplate="Token: %{x}<br>Layer: %{y}<br>Entropy: %{z:.2f} bits<extra></extra>"
            ))
            fig.update_layout(**LAYOUT_BASE, height=500, xaxis_title="Token", yaxis_title="Layer", yaxis_autorange="reversed")
            st.plotly_chart(fig, use_container_width=True)
            st.caption("Entropy of the predicted distribution at each layer. Lower entropy (green) means the model is more confident; watch for entropy dropping sharply at specific layers.")

    with right:
        with chart_card():
            st.subheader("Correct Next-Token Probability")
            fig = go.Figure(go.Heatmap(
                z=target_matrix, x=token_strs, y=layer_labels,
                colorscale=CS_NORM,
                hovertemplate="Token: %{x}<br>Layer: %{y}<br>P(correct): %{z:.3f}<extra></extra>"
            ))
            fig.update_layout(**LAYOUT_BASE, height=500, xaxis_title="Token", yaxis_title="Layer", yaxis_autorange="reversed")
            st.plotly_chart(fig, use_container_width=True)
            st.caption("Probability assigned to the correct next token at each layer. Bright bands show where the model 'learns' the right answer through its depth.")

    # Top-5 predictions table for selected position
    with chart_card():
        st.subheader("Top-5 Predictions by Layer")
        pos = st.selectbox("Token position", range(len(token_strs)),
                           format_func=lambda i: f"{i}: '{token_strs[i]}'")

        table_data = []
        for l in layers:
            preds = lens["top_tokens"][l][pos]
            row = {"Layer": f"L{l}"}
            for k, (tok, prob) in enumerate(preds):
                row[f"#{k+1}"] = f"{tok} ({prob:.3f})"
            table_data.append(row)
        st.dataframe(table_data, use_container_width=True, hide_index=True)
        st.caption("Top-5 token predictions when decoding the residual stream at each layer. Track how the model's 'belief' about the next token evolves layer by layer.")


# ── Tab 3: Attention Patterns ────────────────────────────────────────────────

with tab3:
    # Lazy-load attention weights
    if "attention_weights" not in st.session_state:
        st.info("Attention weights require a second forward pass with `output_attentions=True`.")
        if st.button("Load Attention Weights", type="primary"):
            with st.spinner("Running forward pass with attention..."):
                attn_cache, _, _, _ = run_with_cache(
                    model, tokenizer, st.session_state["prompt"], output_attentions=True
                )
                st.session_state["attention_weights"] = attn_cache.attention_weights
            st.rerun()
    else:
        attn_weights = st.session_state["attention_weights"]
        num_heads = model.config.num_attention_heads

        with chart_card():
            sel_col1, sel_col2, sel_col3 = st.columns(3)
            layer_idx = sel_col1.selectbox("Layer", range(num_layers), format_func=lambda l: f"Layer {l}")
            head_idx = sel_col2.selectbox("Head", range(num_heads), format_func=lambda h: f"Head {h}")
            view_mode = sel_col3.radio("View", ["Single Head", "All Heads"], horizontal=True)

        if view_mode == "Single Head":
            with chart_card():
                attn = attn_weights[layer_idx][0, head_idx].detach().numpy()
                fig = go.Figure(go.Heatmap(
                    z=attn, x=token_strs, y=token_strs,
                    colorscale=CS_ATTN,
                    hovertemplate="From: %{y}<br>To: %{x}<br>Weight: %{z:.3f}<extra></extra>"
                ))
                fig.update_layout(
                    **LAYOUT_BASE,
                    title=f"Layer {layer_idx}, Head {head_idx}",
                    height=600, xaxis_title="Key", yaxis_title="Query",
                    yaxis_autorange="reversed"
                )
                st.plotly_chart(fig, use_container_width=True)
                st.caption("Attention weights from each query token (row) to each key token (column). Look for diagonal patterns (self-attention), vertical stripes (global attention sinks), or off-diagonal structure.")
        else:
            with chart_card():
                # All heads: 4 columns x 8 rows grid
                n_cols, n_rows = 4, 8
                fig = make_subplots(
                    rows=n_rows, cols=n_cols,
                    subplot_titles=[f"H{h}" for h in range(num_heads)],
                    vertical_spacing=0.03, horizontal_spacing=0.03
                )
                attn_layer = attn_weights[layer_idx][0]  # (num_heads, seq, seq)
                for h in range(num_heads):
                    r, c = divmod(h, n_cols)
                    fig.add_trace(
                        go.Heatmap(
                            z=attn_layer[h].detach().numpy(), colorscale=CS_ATTN,
                            showscale=False,
                            hovertemplate=f"Head {h}<br>From: %{{y}}<br>To: %{{x}}<br>Weight: %{{z:.3f}}<extra></extra>"
                        ),
                        row=r + 1, col=c + 1
                    )
                fig.update_layout(
                    **LAYOUT_BASE,
                    title=f"Layer {layer_idx} — All Heads",
                    height=200 * n_rows, showlegend=False
                )
                # Hide tick labels on small multiples for readability
                fig.update_xaxes(showticklabels=False)
                fig.update_yaxes(showticklabels=False, autorange="reversed")
                st.plotly_chart(fig, use_container_width=True)
                st.caption("All 32 attention heads for the selected layer. Compare head specialization: some may attend to previous tokens, others to specific positions or BOS.")


# ── Tab 4: Layer Contributions ───────────────────────────────────────────────

with tab4:
    deltas = cache.layer_deltas()
    layers = sorted(deltas.keys())
    layer_labels = [f"L{l}" for l in layers]

    show_per_token = st.toggle("Show per-token breakdown", value=False)

    if not show_per_token:
        with chart_card():
            # Mean L2 delta per layer
            mean_deltas = [deltas[l].mean().item() for l in layers]
            fig = go.Figure(go.Bar(
                x=layer_labels, y=mean_deltas,
                marker_color=TOKEN_COLORS[0],
                hovertemplate="Layer: %{x}<br>Mean Delta: %{y:.3f}<extra></extra>"
            ))
            fig.update_layout(
                **LAYOUT_BASE,
                title="Mean Layer Contribution (L2 Delta)",
                height=450, xaxis_title="Layer", yaxis_title="Mean L2 Delta"
            )
            st.plotly_chart(fig, use_container_width=True)
            st.caption("Average L2 delta across all token positions. Taller bars indicate layers that modify the residual stream more aggressively.")
    else:
        with chart_card():
            # Per-token grouped bars
            fig = go.Figure()
            for i, tok in enumerate(token_strs):
                vals = [deltas[l][i].item() for l in layers]
                fig.add_trace(go.Bar(
                    name=f"'{tok}'", x=layer_labels, y=vals,
                    marker_color=TOKEN_COLORS[i % len(TOKEN_COLORS)],
                    hovertemplate=f"Token: '{tok}'<br>Layer: %{{x}}<br>Delta: %{{y:.3f}}<extra></extra>"
                ))
            fig.update_layout(
                **LAYOUT_BASE,
                title="Per-Token Layer Contribution",
                barmode="group", height=500,
                xaxis_title="Layer", yaxis_title="L2 Delta"
            )
            st.plotly_chart(fig, use_container_width=True)
            st.caption("Layer contribution broken down by token. Compare how different tokens are processed — content words often show different patterns than function words.")

    # Attention vs MLP decomposition
    with chart_card():
        st.subheader("Attention vs MLP Contribution")
        attn_outs = cache.attention_outputs
        mlp_outs = cache.mlp_outputs

        if attn_outs and mlp_outs:
            attn_norms = [attn_outs[l].squeeze(0).norm(dim=-1).mean().item() for l in layers]
            mlp_norms = [mlp_outs[l].squeeze(0).norm(dim=-1).mean().item() for l in layers]

            fig = go.Figure()
            fig.add_trace(go.Bar(name="Attention", x=layer_labels, y=attn_norms, marker_color=TOKEN_COLORS[3]))  # amber
            fig.add_trace(go.Bar(name="MLP", x=layer_labels, y=mlp_norms, marker_color=TOKEN_COLORS[4]))  # emerald
            fig.update_layout(
                **LAYOUT_BASE,
                barmode="group", height=450,
                xaxis_title="Layer", yaxis_title="Mean L2 Norm",
                legend=dict(font=dict(color="#94a3b8")),
            )
            st.plotly_chart(fig, use_container_width=True)
            st.caption("Compares attention vs MLP output norms per layer. In early layers attention often dominates; in later layers MLP contributions typically grow.")
        else:
            st.warning("Attention/MLP outputs not captured. Re-run analysis.")
