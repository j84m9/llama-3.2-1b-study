import { Play, Pause, RotateCcw } from 'lucide-react'

interface Props {
  playing: boolean
  speed: number
  onToggle: () => void
  onReset: () => void
  onSpeedChange: (speed: number) => void
}

export function AnimationControls({ playing, speed, onToggle, onReset, onSpeedChange }: Props) {
  return (
    <div className="flex items-center gap-2 bg-surface-elevated rounded-md border border-border-subtle px-3 py-1.5">
      <button
        onClick={onToggle}
        className="text-text-secondary hover:text-text-primary transition-colors"
      >
        {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>
      <button
        onClick={onReset}
        className="text-text-secondary hover:text-text-primary transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
      <input
        type="range"
        min={0.25}
        max={3}
        step={0.25}
        value={speed}
        onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
        className="w-16 h-1 accent-blue-500"
      />
      <span className="text-[10px] text-text-muted w-6">{speed}x</span>
    </div>
  )
}
