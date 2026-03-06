export const colors = {
  bg: {
    primary: '#111827',
    sidebar: '#0e1117',
    elevated: '#1e293b',
    hover: '#374151',
  },
  border: {
    subtle: '#1f2937',
    medium: '#334155',
  },
  text: {
    primary: '#f1f5f9',
    secondary: '#94a3b8',
    muted: '#64748b',
  },
  accent: {
    blue: '#3b82f6',
    violet: '#8b5cf6',
    cyan: '#06b6d4',
    amber: '#f59e0b',
    emerald: '#10b981',
    red: '#ef4444',
  },
} as const

export const plotlyDarkLayout: Partial<Plotly.Layout> = {
  paper_bgcolor: '#1e293b',
  plot_bgcolor: '#111827',
  font: { color: '#94a3b8', family: 'Inter, sans-serif', size: 11 },
  xaxis: { gridcolor: '#1f2937', zerolinecolor: '#334155' },
  yaxis: { gridcolor: '#1f2937', zerolinecolor: '#334155' },
  margin: { l: 50, r: 20, t: 30, b: 40 },
}

// Declare Plotly namespace for type
declare namespace Plotly {
  interface Layout {
    paper_bgcolor?: string
    plot_bgcolor?: string
    font?: { color?: string; family?: string; size?: number }
    xaxis?: Record<string, unknown>
    yaxis?: Record<string, unknown>
    margin?: { l?: number; r?: number; t?: number; b?: number }
  }
}
