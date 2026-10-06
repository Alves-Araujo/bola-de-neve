import { motion, useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useTheme } from '../lib/theme'

/** Fundo fixo: aurora boreal animada + neve caindo (canvas). */
export function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden>
      <div
        className="aurora-blob left-[-15%] top-[-20%] h-[55vmax] w-[55vmax] bg-[#22d3ee]"
        style={{ animation: 'drift-1 26s ease-in-out infinite' }}
      />
      <div
        className="aurora-blob right-[-20%] top-[5%] h-[50vmax] w-[50vmax] bg-[#60a5fa]"
        style={{ animation: 'drift-2 32s ease-in-out infinite' }}
      />
      <div
        className="aurora-blob bottom-[-25%] left-[20%] h-[50vmax] w-[50vmax] bg-[#a78bfa]"
        style={{ animation: 'drift-3 36s ease-in-out infinite' }}
      />
      <div
        className="aurora-blob bottom-[-10%] right-[0%] h-[32vmax] w-[32vmax] bg-[#34d399]"
        style={{ animation: 'drift-1 40s ease-in-out infinite reverse', opacity: 'calc(var(--aurora) * 0.6)' }}
      />
      <Snow />
    </div>
  )
}

interface Flake {
  x: number
  y: number
  r: number
  vy: number
  phase: number
  depth: number
}

function Snow() {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduce = useReducedMotion()
  const { theme } = useTheme()
  const color = useRef('255,255,255')
  color.current = theme === 'dark' ? '255,255,255' : '110,135,200'

  useEffect(() => {
    if (reduce) return
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let w = 0
    let h = 0
    let raf = 0
    const flakes: Flake[] = []
    const mouse = { x: 0, y: 0, sx: 0, sy: 0 }

    const make = (anywhere: boolean): Flake => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : -10,
      r: 0.6 + Math.random() * 2.2,
      vy: 0.25 + Math.random() * 0.7,
      phase: Math.random() * Math.PI * 2,
      depth: 0.25 + Math.random() * 0.75,
    })

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const target = Math.min(80, Math.round((w * h) / 16000))
      while (flakes.length < target) flakes.push(make(true))
      flakes.length = target
    }

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX / w - 0.5
      mouse.y = e.clientY / h - 0.5
    }

    const tick = () => {
      mouse.sx += (mouse.x - mouse.sx) * 0.04
      mouse.sy += (mouse.y - mouse.sy) * 0.04
      ctx.clearRect(0, 0, w, h)
      for (const f of flakes) {
        f.y += f.vy * (0.6 + f.depth)
        f.phase += 0.008 + f.depth * 0.006
        if (f.y > h + 10) Object.assign(f, make(false))
        const x = f.x + Math.sin(f.phase) * 10 * f.depth - mouse.sx * 40 * f.depth
        const y = f.y - mouse.sy * 20 * f.depth
        ctx.beginPath()
        ctx.arc(x, y, f.r * f.depth + 0.4, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color.current},${0.25 + f.depth * 0.6})`
        ctx.fill()
      }
      raf = requestAnimationFrame(tick)
    }

    resize()
    tick()
    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
    }
  }, [reduce])

  if (reduce) return null
  return <canvas ref={ref} className="absolute inset-0" />
}

/** Rastro de brilho que segue o cursor (só em mouse/trackpad). */
export function CursorTrail() {
  const reduce = useReducedMotion()
  const [enabled, setEnabled] = useState(false)
  const [visible, setVisible] = useState(false)
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const springs = [
    { x: useSpring(x, { stiffness: 500, damping: 35 }), y: useSpring(y, { stiffness: 500, damping: 35 }), size: 8, o: 0.9 },
    { x: useSpring(x, { stiffness: 220, damping: 28 }), y: useSpring(y, { stiffness: 220, damping: 28 }), size: 6, o: 0.5 },
    { x: useSpring(x, { stiffness: 120, damping: 24 }), y: useSpring(y, { stiffness: 120, damping: 24 }), size: 4, o: 0.3 },
  ]

  useEffect(() => {
    setEnabled(window.matchMedia('(pointer: fine)').matches)
  }, [])

  useEffect(() => {
    if (!enabled || reduce) return
    const onMove = (e: PointerEvent) => {
      x.set(e.clientX)
      y.set(e.clientY)
      setVisible(true)
    }
    const onLeave = () => setVisible(false)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.documentElement.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      document.documentElement.removeEventListener('mouseleave', onLeave)
    }
  }, [enabled, reduce, x, y])

  if (!enabled || reduce) return null
  return (
    <div className="pointer-events-none fixed inset-0 z-[80]" aria-hidden style={{ opacity: visible ? 1 : 0, transition: 'opacity .3s' }}>
      {springs.map((s, k) => (
        <motion.span
          key={k}
          className="absolute left-0 top-0 rounded-full bg-[#a5f3fc]"
          style={{
            x: s.x,
            y: s.y,
            width: s.size,
            height: s.size,
            marginLeft: -s.size / 2,
            marginTop: -s.size / 2,
            opacity: s.o,
            boxShadow: '0 0 12px 2px rgb(34 211 238 / 0.7)',
            mixBlendMode: 'screen',
          }}
        />
      ))}
    </div>
  )
}
