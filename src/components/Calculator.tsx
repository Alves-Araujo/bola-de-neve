import { AnimatePresence, motion } from 'framer-motion'
import { Eraser, Link2, Sparkles } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { annualToMonthly, monthlyToAnnual, type PeriodUnit, type RateUnit } from '../lib/finance'
import { formatNumber } from '../lib/format'
import { useFx } from '../lib/fx'
import {
  DEFAULT_GOAL,
  DEFAULT_GROWTH,
  buildLink,
  hasErrors,
  readParams,
  useDebounced,
  validateGoal,
  validateGrowth,
  type Errors,
  type GoalInput,
  type GrowthInput,
  type Mode,
} from '../lib/state'
import { MoneyField, NumberField } from './fields'
import { GoalResults } from './GoalResults'
import { GrowthResults } from './GrowthResults'
import { GlassCard, MagneticButton, Reveal, Segmented } from './ui'

const swap = {
  initial: { opacity: 0, y: 16, filter: 'blur(6px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -12, filter: 'blur(6px)' },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
} as const

interface RateProps {
  id: string
  rate: number
  unit: RateUnit
  onChange: (rate: number, unit: RateUnit) => void
  error?: string
  shake: number
}

function RateField({ id, rate, unit, onChange, error, shake }: RateProps) {
  const equivalent = unit === 'aa' ? `≈ ${formatNumber(annualToMonthly(rate))}% ao mês` : `≈ ${formatNumber(monthlyToAnnual(rate))}% ao ano`
  return (
    <NumberField
      id={id}
      label="Taxa de juros (%)"
      value={rate}
      onChange={(v) => onChange(v, unit)}
      slider={unit === 'aa' ? { min: 0, max: 30, step: 0.25 } : { min: 0, max: 3, step: 0.05 }}
      hint={rate > 0 ? equivalent : undefined}
      error={error}
      shake={shake}
      right={
        <Segmented
          id={`${id}-unit`}
          size="sm"
          value={unit}
          // Ao trocar a unidade, converte a taxa por equivalência para o resultado não mudar.
          onChange={(u) => {
            const converted = u === 'am' ? annualToMonthly(rate) : monthlyToAnnual(rate)
            onChange(Math.round(converted * 100) / 100, u)
          }}
          options={[
            { value: 'aa', label: 'a.a.', ariaLabel: 'Taxa ao ano' },
            { value: 'am', label: 'a.m.', ariaLabel: 'Taxa ao mês' },
          ]}
        />
      }
    />
  )
}

interface PeriodProps {
  id: string
  label: string
  period: number
  unit: PeriodUnit
  onChange: (period: number, unit: PeriodUnit) => void
  error?: string
  shake: number
}

function PeriodField({ id, label, period, unit, onChange, error, shake }: PeriodProps) {
  return (
    <NumberField
      id={id}
      label={label}
      value={period}
      decimals={0}
      onChange={(v) => onChange(v, unit)}
      slider={unit === 'anos' ? { min: 1, max: 50, step: 1 } : { min: 1, max: 600, step: 1 }}
      error={error}
      shake={shake}
      right={
        <Segmented
          id={`${id}-unit`}
          size="sm"
          value={unit}
          onChange={(u) => onChange(u === 'meses' ? period * 12 : Math.max(1, Math.round(period / 12)), u)}
          options={[
            { value: 'anos', label: 'anos' },
            { value: 'meses', label: 'meses' },
          ]}
        />
      }
    />
  )
}

function EmptyState({ errors }: { errors: Errors }) {
  const first = Object.values(errors)[0]
  return (
    <GlassCard className="grid min-h-[320px] place-items-center p-10 text-center">
      <div>
        <motion.div
          animate={{ y: [0, -10, 0], rotate: [0, 8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="snowball mx-auto h-16 w-16"
        />
        <p className="mt-6 font-display text-xl font-semibold">{first ? 'Quase lá!' : 'Sua bola de neve está esperando'}</p>
        <p className="mt-2 max-w-sm text-muted">{first ?? 'Preencha os valores ao lado para ver quanto ela pode crescer.'}</p>
      </div>
    </GlassCard>
  )
}

export function Calculator({ mode, onModeChange }: { mode: Mode; onModeChange: (m: Mode) => void }) {
  const initial = useMemo(() => readParams(), [])
  const [growth, setGrowth] = useState<GrowthInput>(() => ({ ...DEFAULT_GROWTH, ...initial.growth }))
  const [goal, setGoal] = useState<GoalInput>(() => ({ ...DEFAULT_GOAL, ...initial.goal }))
  const [growthD, flushGrowth, growthPending] = useDebounced(growth)
  const [goalD, flushGoal, goalPending] = useDebounced(goal)
  const [shake, setShake] = useState(0)
  const { burstFrom, toast } = useFx()
  const calcRef = useRef<HTMLButtonElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const growthErrors = validateGrowth(growth)
  const goalErrors = validateGoal(goal)
  const errors = mode === 'growth' ? growthErrors : goalErrors

  const growthDErrors = validateGrowth(growthD)
  const growthReady = !hasErrors(growthDErrors) && (growthD.pv > 0 || growthD.pmt > 0)
  const goalDErrors = validateGoal(goalD)
  const goalReady = !hasErrors(goalDErrors)

  function calculate() {
    if (hasErrors(errors)) {
      setShake((s) => s + 1)
      return
    }
    if (mode === 'growth') flushGrowth()
    else flushGoal()
    burstFrom(calcRef.current)
    if (window.innerWidth < 1024) {
      window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
    }
  }

  function clear() {
    if (mode === 'growth') setGrowth((g) => ({ ...g, pv: 0, pmt: 0, rate: 0, period: 0 }))
    else setGoal((g) => ({ ...g, goal: 0, pv: 0, rate: 0, period: 0 }))
  }

  async function copyLink() {
    const url = buildLink(mode, mode === 'growth' ? growth : goal)
    window.history.replaceState(null, '', url)
    try {
      await navigator.clipboard.writeText(url)
      toast('Link copiado! É só colar e mandar ❄️')
    } catch {
      toast('O link já está na barra de endereço — é só copiar.')
    }
  }

  function applyGoal(next: GoalInput) {
    setGoal(next)
    flushGoal(next)
  }

  function seeFull(pmt: number) {
    const next: GrowthInput = { pv: goal.pv, pmt, rate: goal.rate, rateUnit: goal.rateUnit, period: goal.period, periodUnit: goal.periodUnit }
    setGrowth(next)
    flushGrowth(next)
    onModeChange('growth')
    window.setTimeout(() => document.getElementById('tabela')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 700)
  }

  return (
    <section id="calculadora" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20">
      <Reveal className="text-center">
        <h2 className="font-display text-4xl font-bold tracking-[-0.03em] sm:text-5xl">Calculadora</h2>
        <p className="mx-auto mt-3 max-w-lg text-muted">Ajuste os valores e veja a bola de neve crescer em tempo real.</p>
      </Reveal>

      <Reveal delay={0.1} className="mt-8 flex justify-center">
        <Segmented
          id="mode"
          value={mode}
          onChange={onModeChange}
          options={[
            { value: 'growth', label: 'Quanto vou ter?' },
            {
              value: 'goal',
              label: (
                <>
                  Quanto preciso guardar?
                  <span
                    className="rounded-full bg-interest px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#04241a]"
                    style={{ animation: 'pulse-badge 2s infinite' }}
                  >
                    Novo
                  </span>
                </>
              ),
            },
          ]}
        />
      </Reveal>

      <div className="mt-10 grid items-start gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
        <Reveal delay={0.15} className="min-w-0 lg:sticky lg:top-24">
          <GlassCard className="p-5 sm:p-6">
            <AnimatePresence mode="wait" initial={false}>
              {mode === 'growth' ? (
                <motion.div key="growth-form" {...swap} className="grid gap-5">
                  <MoneyField
                    id="pv"
                    label="Valor inicial"
                    value={growth.pv}
                    onChange={(pv) => setGrowth((g) => ({ ...g, pv }))}
                    slider={{ min: 0, max: 200000, step: 500 }}
                  />
                  <MoneyField
                    id="pmt"
                    label="Valor mensal"
                    value={growth.pmt}
                    onChange={(pmt) => setGrowth((g) => ({ ...g, pmt }))}
                    slider={{ min: 0, max: 20000, step: 50 }}
                  />
                  <RateField
                    id="rate"
                    rate={growth.rate}
                    unit={growth.rateUnit}
                    onChange={(rate, rateUnit) => setGrowth((g) => ({ ...g, rate, rateUnit }))}
                    error={growthErrors.rate}
                    shake={shake}
                  />
                  <PeriodField
                    id="period"
                    label="Período"
                    period={growth.period}
                    unit={growth.periodUnit}
                    onChange={(period, periodUnit) => setGrowth((g) => ({ ...g, period, periodUnit }))}
                    error={growthErrors.period}
                    shake={shake}
                  />
                </motion.div>
              ) : (
                <motion.div key="goal-form" {...swap} className="grid gap-5">
                  <MoneyField
                    id="goal"
                    label="Quanto quero ter"
                    value={goal.goal}
                    onChange={(v) => setGoal((g) => ({ ...g, goal: v }))}
                    slider={{ min: 0, max: 2000000, step: 1000 }}
                    error={goalErrors.goal}
                    shake={shake}
                  />
                  <PeriodField
                    id="goal-period"
                    label="Em quanto tempo"
                    period={goal.period}
                    unit={goal.periodUnit}
                    onChange={(period, periodUnit) => setGoal((g) => ({ ...g, period, periodUnit }))}
                    error={goalErrors.period}
                    shake={shake}
                  />
                  <RateField
                    id="goal-rate"
                    rate={goal.rate}
                    unit={goal.rateUnit}
                    onChange={(rate, rateUnit) => setGoal((g) => ({ ...g, rate, rateUnit }))}
                    error={goalErrors.rate}
                    shake={shake}
                  />
                  <MoneyField
                    id="goal-pv"
                    label="Quanto já tenho hoje (opcional)"
                    value={goal.pv}
                    onChange={(pv) => setGoal((g) => ({ ...g, pv }))}
                    slider={{ min: 0, max: 1000000, step: 500 }}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-6 grid grid-cols-[1fr_auto] gap-3">
              <MagneticButton ref={calcRef} onClick={calculate} className="h-12 text-[15px]">
                <Sparkles size={17} /> Calcular
              </MagneticButton>
              <MagneticButton variant="ghost" onClick={clear} className="h-12 px-5 text-[15px]">
                <Eraser size={16} /> Limpar
              </MagneticButton>
            </div>
            <button
              onClick={copyLink}
              className="mx-auto mt-4 flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 text-sm text-muted transition-colors hover:text-fg"
            >
              <Link2 size={15} /> Copiar link da simulação
            </button>
          </GlassCard>
        </Reveal>

        <div ref={resultsRef} id="meta" className="min-w-0 scroll-mt-24">
          <AnimatePresence mode="wait" initial={false}>
            {mode === 'growth' ? (
              <motion.div key="growth-results" {...swap}>
                {growthReady ? <GrowthResults input={growthD} pending={growthPending} /> : <EmptyState errors={growthDErrors} />}
              </motion.div>
            ) : (
              <motion.div key="goal-results" {...swap}>
                {goalReady ? (
                  <GoalResults input={goalD} pending={goalPending} onApply={applyGoal} onSeeFull={seeFull} />
                ) : (
                  <EmptyState errors={goalDErrors} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
