import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  type HTMLMotionProps,
} from 'framer-motion'
import {
  forwardRef,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { formatBRL } from '../lib/format'

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export const springSoft = { type: 'spring', stiffness: 260, damping: 26 } as const

/** Entra com fade + desfoque + leve subida quando aparece na tela. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y, filter: 'blur(10px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

/** Card de vidro com brilho que segue o mouse e, opcionalmente, inclinação 3D. */
export function GlassCard({
  children,
  className,
  tilt = false,
  ...rest
}: { children: ReactNode; className?: string; tilt?: boolean } & Omit<HTMLMotionProps<'div'>, 'children'>) {
  const ref = useRef<HTMLDivElement>(null)
  const rotateX = useSpring(0, { stiffness: 200, damping: 20 })
  const rotateY = useSpring(0, { stiffness: 200, damping: 20 })

  function onMove(e: MouseEvent<HTMLDivElement>) {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    el.style.setProperty('--mx', `${px * 100}%`)
    el.style.setProperty('--my', `${py * 100}%`)
    if (tilt) {
      rotateY.set((px - 0.5) * 7)
      rotateX.set(-(py - 0.5) * 7)
    }
  }

  function onLeave() {
    rotateX.set(0)
    rotateY.set(0)
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={tilt ? { rotateX, rotateY, transformPerspective: 1000 } : undefined}
      className={cn('glass spotlight', className)}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

type ButtonProps = {
  children: ReactNode
  variant?: 'primary' | 'ghost'
  magnetic?: boolean
  className?: string
} & Omit<HTMLMotionProps<'button'>, 'children'>

/** Botão "magnético" (segue de leve o cursor) com ondinha no clique. */
export const MagneticButton = forwardRef<HTMLButtonElement, ButtonProps>(function MagneticButton(
  { children, variant = 'primary', magnetic = true, className, onPointerDown, ...rest },
  forwardedRef,
) {
  const localRef = useRef<HTMLButtonElement | null>(null)
  const x = useSpring(useMotionValue(0), { stiffness: 300, damping: 18 })
  const y = useSpring(useMotionValue(0), { stiffness: 300, damping: 18 })
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number; size: number }>>([])

  function setRef(el: HTMLButtonElement | null) {
    localRef.current = el
    if (typeof forwardedRef === 'function') forwardedRef(el)
    else if (forwardedRef) forwardedRef.current = el
  }

  function onMove(e: MouseEvent<HTMLButtonElement>) {
    if (!magnetic || !localRef.current) return
    const r = localRef.current.getBoundingClientRect()
    x.set((e.clientX - (r.left + r.width / 2)) * 0.22)
    y.set((e.clientY - (r.top + r.height / 2)) * 0.3)
  }

  function onLeave() {
    x.set(0)
    y.set(0)
  }

  function handlePointerDown(e: PointerEvent<HTMLButtonElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const size = Math.max(r.width, r.height)
    const id = Date.now()
    setRipples((rs) => [...rs, { id, x: e.clientX - r.left - size / 2, y: e.clientY - r.top - size / 2, size }])
    window.setTimeout(() => setRipples((rs) => rs.filter((rp) => rp.id !== id)), 700)
    onPointerDown?.(e)
  }

  return (
    <motion.button
      ref={setRef}
      style={{ x, y }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      onPointerDown={handlePointerDown}
      whileTap={{ scale: 0.96 }}
      className={cn('btn', variant === 'primary' ? 'btn-primary' : 'btn-ghost', className)}
      {...rest}
    >
      {ripples.map((rp) => (
        <span key={rp.id} className="ripple" style={{ left: rp.x, top: rp.y, width: rp.size, height: rp.size }} />
      ))}
      {children}
    </motion.button>
  )
})

/** Controle segmentado com indicador deslizante. */
export function Segmented<T extends string>({
  id,
  options,
  value,
  onChange,
  size = 'md',
  className,
}: {
  id: string
  options: Array<{ value: T; label: ReactNode; ariaLabel?: string }>
  value: T
  onChange: (v: T) => void
  size?: 'sm' | 'md'
  className?: string
}) {
  return (
    <div
      role="tablist"
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full border border-line bg-[var(--glass)] backdrop-blur-xl',
        size === 'sm' ? 'p-0.5' : 'p-1.5',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={opt.ariaLabel}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative cursor-pointer rounded-full font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
              size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-4 py-2.5 text-sm sm:px-5',
              active ? (size === 'sm' ? 'text-[#06101f]' : 'text-[#06101f]') : 'text-muted hover:text-fg',
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-full bg-gradient-to-r from-[#22d3ee] to-[#a78bfa] shadow-[0_6px_24px_-6px_rgb(34_211_238/0.6)]"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Número que conta até o valor quando aparece (e anima entre valores quando muda). */
export function CountUp({
  value,
  format = formatBRL,
  duration = 1.2,
  className,
}: {
  value: number
  format?: (v: number) => string
  duration?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const current = useRef(0)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduce = useReducedMotion()

  useEffect(() => {
    const node = ref.current
    if (!node || !inView) return
    if (reduce) {
      current.current = value
      node.textContent = format(value)
      return
    }
    const controls = animate(current.current, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        current.current = v
        node.textContent = format(v)
      },
    })
    return () => controls.stop()
  }, [value, inView, reduce, duration, format])

  return (
    <span ref={ref} className={cn('num', className)}>
      {format(current.current)}
    </span>
  )
}

/** Barra fininha animada indicando que o cálculo está sendo atualizado. */
export function PendingBar({ active }: { active: boolean }) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-6 top-0 h-[2px] overflow-hidden rounded-full transition-opacity duration-300',
        active ? 'shimmer opacity-100' : 'opacity-0',
      )}
    />
  )
}

export function Snowball({ size, className }: { size: number; className?: string }) {
  return (
    <motion.div
      className={cn('snowball shrink-0', className)}
      animate={{ width: size, height: size, rotate: 360 }}
      transition={{ width: springSoft, height: springSoft, rotate: { duration: 30, repeat: Infinity, ease: 'linear' } }}
    />
  )
}
