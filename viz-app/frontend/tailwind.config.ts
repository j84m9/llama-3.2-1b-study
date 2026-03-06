import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          primary: '#111827',
          sidebar: '#0e1117',
          elevated: '#1e293b',
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
      },
    },
  },
  plugins: [],
} satisfies Config
