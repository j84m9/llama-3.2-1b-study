interface Props {
  tokens: string[]
}

const TOKEN_COLORS = [
  'bg-blue-900/40 border-blue-700/40',
  'bg-violet-900/40 border-violet-700/40',
  'bg-cyan-900/40 border-cyan-700/40',
  'bg-amber-900/40 border-amber-700/40',
  'bg-emerald-900/40 border-emerald-700/40',
  'bg-rose-900/40 border-rose-700/40',
]

export function TokenPills({ tokens }: Props) {
  return (
    <div className="flex flex-wrap gap-1">
      {tokens.map((tok, i) => (
        <span
          key={i}
          className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-mono border ${TOKEN_COLORS[i % TOKEN_COLORS.length]}`}
          title={`Token ${i}: "${tok}"`}
        >
          {tok.replace(/ /g, '\u00B7')}
        </span>
      ))}
    </div>
  )
}
