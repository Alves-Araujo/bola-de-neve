import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Check } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

interface BurstOptions {
  count?: number
  spread?: number
}

interface Burst {
  id: number
  x: number
  y: number
  count: number
  spread: number
}

interface Fx {
  burst: (x: number, y: number, opts?: BurstOptions) => void
  burstFrom: (el: Element | null, opts?: BurstOptions) => void
  toast: (message: string) => void
}

const FxContext = createContext<Fx>({ burst: () => {}, burstFrom: () => {}, toast: () => {} })

const COLORS = ['#ffffff', '#22d3ee', '#a78bfa', '#34d399', '#bfdbfe']

/** Efeitos globais: explosão de flocos de neve e toast de confirmação. */
export function FxProvider({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion()
  const [bursts, setBursts] = useState<Burst[]>([])
  const [toastState, setToastState] = useState<{ id: number; message: string } | null>(null)
  const nextId = useRef(0)

  const burst = useCallback(
    (x: number, y: number, opts: BurstOptions = {}) => {
      if (reduce) return
      const id = ++nextId.current
      setBursts((b) => [...b, { id, x, y, count: opts.count ?? 22, spread: opts.spread ?? 140 }])
      window.setTimeout(() => setBursts((b) => b.filter((t) => t.id !== id)), 1700)
    },
    [reduce],
  )

  const burstFrom = useCallback(
    (el: Element | null, opts?: BurstOptions) => {
      if (!el) return
      const r = el.getBoundingClientRect()
      burst(r.left + r.width / 2, r.top + r.height / 2, opts)
    },
    [burst],
  )

  const toast = useCallback((message: string) => {
    const id = ++nextId.current
    setToastState({ id, message })
    window.setTimeout(() => setToastState((t) => (t?.id === id ? null : t)), 2800)
  }, [])

  const value = useMemo(() => ({ burst, burstFrom, toast }), [burst, burstFrom, toast])

  return (
    <FxContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-0 z-[60] overflow-hidden" aria-hidden>
        {bursts.map((b) => (
          <BurstParticles key={b.id} {...b} />
        ))}
      </div>
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[70] flex justify-center px-4" aria-live="polite">
        <AnimatePresence>
          {toastState && (
            <motion.div
              key={toastState.id}
              initial={{ opacity: 0, y: 24, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              className="glass flex items-center gap-3 rounded-full px-5 py-3 text-sm font-medium"
            >
              <span className="grid h-6 w-6 place-items-center rounded-full bg-interest/20 text-interest">
                <Check size={14} strokeWidth={3} />
              </span>
              {toastState.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FxContext.Provider>
  )
}

function BurstParticles({ x, y, count, spread }: Burst) {
  const parts = useMemo(
    () =>
      Array.from({ length: count }, (_, k) => {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.7
        const dist = spread * (0.35 + Math.random() * 0.85)
        return {
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
          size: 4 + Math.random() * 7,
          flake: Math.random() < 0.4,
          color: COLORS[k % COLORS.length],
          rotate: (Math.random() - 0.5) * 540,
          delay: Math.random() * 0.08,
        }
      }),
    [count, spread],
  )

  return (
    <>
      {parts.map((p, k) => (
        <motion.span
          key={k}
          className="absolute leading-none"
          style={{ left: x, top: y }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.3 }}
          animate={{ x: p.dx, y: [0, p.dy, p.dy + 70], opacity: [1, 1, 0], scale: 1, rotate: p.rotate }}
          transition={{ duration: 1.4, ease: 'easeOut', delay: p.delay, times: [0, 0.55, 1] }}
        >
          {p.flake ? (
            <span style={{ fontSize: p.size + 9, color: p.color, textShadow: `0 0 10px ${p.color}` }}>❄</span>
          ) : (
            <span
              className="block rounded-full"
              style={{ width: p.size, height: p.size, background: p.color, boxShadow: `0 0 12px ${p.color}` }}
            />
          )}
        </motion.span>
      ))}
    </>
  )
}

export const useFx = () => useContext(FxContext)
