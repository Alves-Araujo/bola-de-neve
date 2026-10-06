import { motion } from 'framer-motion'
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo, useRef } from 'react'
import { monthlyRate, requiredMonthly, simulate, toMonths } from '../lib/finance'
import { formatBRL, formatNumber, formatPercent, periodShort } from '../lib/format'
import { useFx } from '../lib/fx'
import type { GoalInput } from '../lib/state'
import { GoalChart, InViewMount } from './charts'
import { CountUp, GlassCard, MagneticButton, PendingBar, cn } from './ui'

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } }
const item = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
} as const

const pctFormat = (v: number) => formatPercent(v)

function pmtFor(input: GoalInput) {
  return requiredMonthly(input.goal, input.pv, monthlyRate(input.rate, input.rateUnit), toMonths(input.period, input.periodUnit))
}

export function GoalResults({
  input,
  pending,
  onApply,
  onSeeFull,
}: {
  input: GoalInput
  pending: boolean
  onApply: (next: GoalInput) => void
  onSeeFull: (pmt: number) => void
}) {
  const { burst } = useFx()
  const chartRef = useRef<HTMLDivElement>(null)
  const lastBurst = useRef(0)

  const r = useMemo(() => {
    const i = monthlyRate(input.rate, input.rateUnit)
    const n = toMonths(input.period, input.periodUnit)
    const pmt = requiredMonthly(input.goal, input.pv, i, n)
    const rows = simulate(input.pv, pmt, i, n)
    const final = rows[n].total
    const fromPocket = pmt * n
    const interest = final - input.pv - fromPocket
    return { n, pmt, rows, final, fromPocket, interest }
  }, [input])

  const already = r.pmt === 0
  const share = r.final > 0 ? r.interest / r.final : 0
  const rateLabel = `${formatNumber(input.rate)}% ${input.rateUnit === 'aa' ? 'a.a.' : 'a.m.'}`

  const yearsMode = input.periodUnit === 'anos'
  const rateStep = input.rateUnit === 'aa' ? 1 : 0.1
  const rateStepLabel = input.rateUnit === 'aa' ? '1' : '0,1'
  const scenarios = [
    {
      key: 'minus-time',
      label: yearsMode ? '−1 ano' : '−12 meses',
      next: { ...input, period: yearsMode ? input.period - 1 : input.period - 12 },
      disabled: r.n - 12 < 1,
    },
    { key: 'plus-time', label: yearsMode ? '+1 ano' : '+12 meses', next: { ...input, period: yearsMode ? input.period + 1 : input.period + 12 }, disabled: false },
    {
      key: 'plus-rate',
      label: `+${rateStepLabel}% de taxa`,
      next: { ...input, rate: Math.round((input.rate + rateStep) * 100) / 100 },
      disabled: false,
    },
    {
      key: 'minus-rate',
      label: `−${rateStepLabel}% de taxa`,
      next: { ...input, rate: Math.max(0, Math.round((input.rate - rateStep) * 100) / 100) },
      disabled: input.rate <= 0,
    },
  ]

  function celebrate() {
    const now = Date.now()
    if (now - lastBurst.current < 3500) return
    lastBurst.current = now
    const el = chartRef.current
    if (!el) return
    const box = el.getBoundingClientRect()
    if (box.bottom < 0 || box.top > window.innerHeight) return
    // A curva só sobe, então o ponto final (a meta) é o canto superior direito da própria curva.
    const curve = el.querySelector('.recharts-area-curve')?.getBoundingClientRect() ?? box
    burst(curve.right, curve.top, { count: 34, spread: 200 })
  }

  const segments = [
    { label: 'Você já tem', value: input.pv, color: 'bg-slate-400' },
    { label: 'Seus aportes', value: r.fromPocket, color: 'bg-invested' },
    { label: 'Juros', value: r.interest, color: 'bg-interest' },
  ].filter((s) => s.value > 0.005)

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-5 [&>*]:min-w-0">
      <motion.div variants={item}>
        <GlassCard tilt className="glow overflow-hidden p-6 sm:p-8">
          <PendingBar active={pending} />
          <p className="text-sm text-muted">
            Para chegar em <strong className="text-fg">{formatBRL(input.goal)}</strong> em {periodShort(r.n)}, a {rateLabel}
          </p>
          {already ? (
            <>
              <h3 className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                Boa notícia: você nem precisa aportar! <span className="inline-block">🎉</span>
              </h3>
              <p className="mt-3 text-muted">
                Só deixando render o que você já tem, você chega em <strong className="text-interest">{formatBRL(r.final)}</strong>.
              </p>
            </>
          ) : (
            <h3 className="mt-3 font-display text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
              Você precisa investir <CountUp value={r.pmt} className="text-gradient whitespace-nowrap" /> por mês
            </h3>
          )}

          <div className="mt-7">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-[var(--track)]">
              {segments.map((s, k) => (
                <motion.div
                  key={s.label}
                  className={cn('h-full', s.color, k > 0 && 'border-l-2 border-[var(--field)]')}
                  initial={{ width: 0 }}
                  animate={{ width: `${(s.value / r.final) * 100}%` }}
                  transition={{ duration: 1.2, delay: 0.2 + k * 0.25, ease: [0.16, 1, 0.3, 1] }}
                />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
              {segments.map((s) => (
                <span key={s.label} className="flex items-center gap-1.5">
                  <span className={cn('h-2 w-2 rounded-full', s.color)} />
                  {s.label} · {formatPercent(s.value / r.final, 0)}
                </span>
              ))}
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <motion.div variants={item} className="grid gap-5 sm:grid-cols-3 [&>*]:min-w-0">
        <GlassCard tilt className="p-5">
          <p className="flex items-center gap-2 text-sm text-muted">
            <span className="h-2 w-2 shrink-0 rounded-full bg-invested" /> Total que você vai aportar
          </p>
          <CountUp value={r.fromPocket} className="mt-2 block font-display text-[clamp(1.15rem,1.9vw,1.5rem)] font-semibold text-invested" />
        </GlassCard>
        <GlassCard tilt className="p-5">
          <p className="flex items-center gap-2 text-sm text-muted">
            <span className="h-2 w-2 shrink-0 rounded-full bg-interest" /> Virá de juros
          </p>
          <CountUp value={r.interest} className="mt-2 block font-display text-[clamp(1.15rem,1.9vw,1.5rem)] font-semibold text-interest" />
        </GlassCard>
        <GlassCard tilt className="p-5">
          <p className="text-sm text-muted">Da sua meta vem dos juros</p>
          <CountUp value={share} format={pctFormat} className="mt-2 block font-display text-[clamp(1.15rem,1.9vw,1.5rem)] font-semibold text-gradient" />
        </GlassCard>
      </motion.div>

      {!already && (
        <motion.div variants={item}>
          <p className="mb-3 text-sm font-medium text-muted">E se...? <span className="font-normal">(toque para aplicar)</span></p>
          <div className="flex flex-wrap gap-2.5">
            {scenarios.map((s) => {
              const value = s.disabled ? NaN : pmtFor(s.next)
              const cheaper = value < r.pmt
              return (
                <motion.button
                  key={s.key}
                  layout
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={s.disabled}
                  onClick={() => onApply(s.next)}
                  className="btn btn-ghost h-10 px-4 text-sm font-medium"
                >
                  {s.label}
                  {!s.disabled && (
                    <>
                      <span className="num font-normal text-muted">{formatBRL(value)}</span>
                      {cheaper ? <TrendingDown size={15} className="text-interest" /> : <TrendingUp size={15} className="text-danger" />}
                    </>
                  )}
                </motion.button>
              )
            })}
          </div>
        </motion.div>
      )}

      <motion.div variants={item}>
        <GlassCard className="min-w-0 p-5 sm:p-6">
          <h3 className="mb-4 font-display text-lg font-semibold">Evolução até a meta</h3>
          <div ref={chartRef}>
            <InViewMount height={300}>
              <GoalChart rows={r.rows} goal={input.goal} onReached={celebrate} />
            </InViewMount>
          </div>
        </GlassCard>
      </motion.div>

      <motion.div variants={item} className="flex justify-center">
        <MagneticButton onClick={() => onSeeFull(r.pmt)} className="h-12 px-7">
          Ver simulação completa <ArrowRight size={17} />
        </MagneticButton>
      </motion.div>
    </motion.div>
  )
}
