import { motion, useAnimationFrame, useReducedMotion } from 'framer-motion'
import { ArrowDown, Target } from 'lucide-react'
import { useRef } from 'react'
import type { NavTarget } from './Header'
import { MagneticButton } from './ui'

const PLAIN = ['Veja', 'seu', 'dinheiro', 'virar', 'uma']
const HIGHLIGHT = ['bola', 'de', 'neve.']

const word = {
  hidden: { opacity: 0, y: 40, filter: 'blur(12px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
} as const

export function Hero({ onNavigate }: { onNavigate: (t: NavTarget) => void }) {
  return (
    <section
      id="top"
      className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-12 pt-28 sm:px-6 lg:min-h-[92svh] lg:grid-cols-[1.05fr_1fr] lg:pt-32"
    >
      <div className="min-w-0">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="inline-flex items-center gap-2 rounded-full border border-line bg-[var(--glass)] px-3.5 py-1.5 text-xs font-medium text-muted backdrop-blur-xl"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-interest shadow-[0_0_10px_var(--interest)]" />
          Calculadora de juros compostos
        </motion.span>

        <motion.h1
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.08, delayChildren: 0.3 }}
          className="mt-6 font-display text-[44px] font-bold leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-7xl"
        >
          {PLAIN.map((w) => (
            <motion.span key={w} variants={word} className="mr-[0.22em] inline-block">
              {w}
            </motion.span>
          ))}
          <br className="hidden sm:block" />
          {HIGHLIGHT.map((w) => (
            <motion.span key={w} variants={word} className="text-gradient mr-[0.22em] inline-block pb-1">
              {w}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.7 }}
          className="mt-6 max-w-xl text-lg leading-relaxed text-muted"
        >
          Começa pequena. Cresce cada vez mais rápido. Simule quanto você vai ter — ou descubra quanto precisa guardar
          por mês para chegar na sua meta.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.3, duration: 0.7 }}
          className="mt-9 flex flex-wrap gap-3"
        >
          <MagneticButton onClick={() => onNavigate('growth')} className="h-13 px-7 text-[15px]">
            Começar a calcular
            <motion.span animate={{ y: [0, 3, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
              <ArrowDown size={17} />
            </motion.span>
          </MagneticButton>
          <MagneticButton variant="ghost" onClick={() => onNavigate('goal')} className="h-13 px-6 text-[15px]">
            <Target size={17} /> Quanto preciso guardar?
          </MagneticButton>
        </motion.div>

        <motion.ul
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted"
        >
          {['Grátis e sem cadastro', 'Resultado na hora', 'Taxa anual ou mensal'].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <span className="text-accent">❄</span>
              {t}
            </li>
          ))}
        </motion.ul>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative min-w-0"
      >
        <SnowHill />
      </motion.div>
    </section>
  )
}

// Encosta da colina: curva de Bézier cúbica (P0 → P3) no viewBox 400×300.
const P = [
  [0, 118],
  [120, 132],
  [250, 200],
  [400, 256],
] as const

function bezier(t: number) {
  const u = 1 - t
  const x = u * u * u * P[0][0] + 3 * u * u * t * P[1][0] + 3 * u * t * t * P[2][0] + t * t * t * P[3][0]
  const y = u * u * u * P[0][1] + 3 * u * u * t * P[1][1] + 3 * u * t * t * P[2][1] + t * t * t * P[3][1]
  const dx = 3 * u * u * (P[1][0] - P[0][0]) + 6 * u * t * (P[2][0] - P[1][0]) + 3 * t * t * (P[3][0] - P[2][0])
  const dy = 3 * u * u * (P[1][1] - P[0][1]) + 6 * u * t * (P[2][1] - P[1][1]) + 3 * t * t * (P[3][1] - P[2][1])
  const len = Math.hypot(dx, dy)
  return { x, y, nx: dy / len, ny: -dx / len }
}

const SLOPE = `M${P[0].join(',')} C${P[1].join(',')} ${P[2].join(',')} ${P[3].join(',')}`
const CYCLE = 7000

/** Ilustração: bola de neve descendo a colina e crescendo, deixando rastro. */
function SnowHill() {
  const reduce = useReducedMotion()
  const ball = useRef<SVGGElement>(null)
  const spin = useRef<SVGGElement>(null)
  const trail = useRef<SVGPathElement>(null)

  useAnimationFrame((time) => {
    const p = reduce ? 0.62 : (time % CYCLE) / CYCLE
    const travel = Math.min(p / 0.86, 1)
    const t = 0.04 + 0.88 * travel * travel // acelera, como uma bola de neve de verdade
    const r = 7 + 30 * Math.pow(travel, 1.4)
    const { x, y, nx, ny } = bezier(t)
    const fade = reduce ? 1 : p < 0.05 ? p / 0.05 : p > 0.86 ? Math.max(0, 1 - (p - 0.86) / 0.1) : 1
    if (ball.current) {
      ball.current.setAttribute('transform', `translate(${x + nx * r} ${y + ny * r}) scale(${r / 30})`)
      ball.current.style.opacity = String(fade)
    }
    if (spin.current) spin.current.setAttribute('transform', `rotate(${t * 900})`)
    if (trail.current) {
      trail.current.style.strokeDasharray = `${t} 1`
      trail.current.style.opacity = String(fade * 0.9)
    }
  })

  return (
    <div className="glass glow relative aspect-[4/3] w-full overflow-hidden rounded-[32px]">
      <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full" role="img" aria-label="Bola de neve rolando morro abaixo e crescendo">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#22d3ee" stopOpacity=".18" />
            <stop offset="1" stopColor="#a78bfa" stopOpacity=".05" />
          </linearGradient>
          <linearGradient id="mtn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#c7d2fe" stopOpacity=".55" />
            <stop offset="1" stopColor="#6366f1" stopOpacity=".1" />
          </linearGradient>
          <linearGradient id="slope" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f8fafc" stopOpacity=".95" />
            <stop offset=".6" stopColor="#c7dbff" stopOpacity=".85" />
            <stop offset="1" stopColor="#7c9be6" stopOpacity=".7" />
          </linearGradient>
          <radialGradient id="ball" cx="35%" cy="30%" r="75%">
            <stop offset="0" stopColor="#fff" />
            <stop offset=".45" stopColor="#dcecff" />
            <stop offset="1" stopColor="#7598e0" />
          </radialGradient>
          <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        <rect width="400" height="300" fill="url(#sky)" />
        {[
          [40, 30],
          [90, 55],
          [160, 22],
          [230, 48],
          [300, 26],
          [350, 70],
          [270, 90],
          [190, 80],
        ].map(([cx, cy], k) => (
          <circle
            key={k}
            cx={cx}
            cy={cy}
            r={k % 3 === 0 ? 1.6 : 1}
            fill="#fff"
            style={{ animation: `twinkle ${2 + (k % 4)}s ease-in-out ${k * 0.3}s infinite` }}
          />
        ))}
        <path d="M0,170 L60,105 L105,140 L175,62 L240,128 L300,84 L360,130 L400,108 L400,300 L0,300 Z" fill="url(#mtn)" />
        <path d="M175,62 L160,80 L172,76 L182,86 L192,74 Z" fill="#fff" opacity=".7" />
        <path d="M300,84 L289,98 L299,95 L307,103 L314,96 Z" fill="#fff" opacity=".6" />
        <path d={`${SLOPE} L400,300 L0,300 Z`} fill="url(#slope)" />

        <path
          ref={trail}
          d={SLOPE}
          pathLength={1}
          fill="none"
          stroke="#93c5fd"
          strokeWidth="5"
          strokeLinecap="round"
          style={{ strokeDasharray: '0 1' }}
        />

        <g ref={ball}>
          <ellipse cx="4" cy="30" rx="26" ry="5" fill="#1e3a8a" opacity=".25" filter="url(#soft)" />
          <circle r="30" fill="#93c5fd" opacity=".45" filter="url(#soft)" />
          <g ref={spin}>
            <circle r="30" fill="url(#ball)" />
            <path d="M-14,-6 q6,-4 10,2 M6,10 q6,-3 9,3 M-6,16 q3,-3 6,0" stroke="#7aa0e6" strokeWidth="1.6" fill="none" opacity=".55" strokeLinecap="round" />
          </g>
          <circle cx="-10" cy="-11" r="7" fill="#fff" opacity=".8" />
        </g>
      </svg>

      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="glass absolute left-4 top-4 rounded-2xl px-4 py-3 sm:left-6 sm:top-6"
        style={{ background: 'var(--header)' }}
      >
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Em 10 anos</p>
        <p className="num font-display text-lg font-semibold text-interest">+ R$ 41.525 em juros</p>
      </motion.div>
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="glass absolute bottom-4 right-4 rounded-2xl px-4 py-3 sm:bottom-6 sm:right-6"
        style={{ background: 'var(--header)' }}
      >
        <p className="text-[11px] uppercase tracking-[0.14em] text-muted">Investindo</p>
        <p className="num font-display text-lg font-semibold">R$ 500/mês</p>
      </motion.div>
    </div>
  )
}
