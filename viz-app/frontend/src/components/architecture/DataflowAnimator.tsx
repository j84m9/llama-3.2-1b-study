import { useRef, useEffect, useState, useCallback } from 'react'

interface Particle {
  x: number
  y: number
  vy: number
  radius: number
  color: string
  opacity: number
}

interface Props {
  width: number
  height: number
  playing: boolean
  speed: number
  layerDeltas: number[]
}

export function DataflowAnimator({ width, height, playing, speed, layerDeltas }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const [, setFrame] = useState(0)

  const maxDelta = Math.max(...layerDeltas, 0.001)

  const spawnParticle = useCallback(() => {
    const p: Particle = {
      x: 30 + Math.random() * 4 - 2,
      y: 20,
      vy: 1 + Math.random() * 0.5,
      radius: 3,
      color: '#3b82f6',
      opacity: 0.8,
    }
    particlesRef.current.push(p)
  }, [])

  useEffect(() => {
    if (!playing) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number

    const animate = () => {
      ctx.clearRect(0, 0, width, height)

      // Spawn new particles periodically
      if (Math.random() < 0.1 * speed) {
        spawnParticle()
      }

      // Update & draw
      const alive: Particle[] = []
      for (const p of particlesRef.current) {
        p.y += p.vy * speed

        // Determine which layer we're in
        const layerIdx = Math.floor((p.y - 80) / 78)
        if (layerIdx >= 0 && layerIdx < layerDeltas.length) {
          const delta = layerDeltas[layerIdx]
          const intensity = delta / maxDelta
          p.radius = 2 + intensity * 4
          // Shift color from blue toward emerald as it progresses
          const progress = p.y / height
          const r = Math.round(59 + progress * (16 - 59))
          const g = Math.round(130 + progress * (185 - 130))
          const b = Math.round(246 + progress * (129 - 246))
          p.color = `rgb(${r},${g},${b})`
        }

        if (p.y < height) {
          alive.push(p)
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
          ctx.fillStyle = p.color
          ctx.globalAlpha = p.opacity
          ctx.fill()
        }
      }
      particlesRef.current = alive

      ctx.globalAlpha = 1
      animId = requestAnimationFrame(animate)
      setFrame((f) => f + 1)
    }

    animId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animId)
  }, [playing, speed, width, height, layerDeltas, maxDelta, spawnParticle])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute top-0 left-0 pointer-events-none"
      style={{ width, height }}
    />
  )
}
