import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { byYear, monthlyRate, simulate, toMonths, turningPoint } from '../lib/finance'
import { formatBRL, formatPercent, monthsLabel } from '../lib/format'
import type { GrowthInput } from '../lib/state'
import { DonutChart, GrowthChart, InViewMount } from './charts'
import { DataTable } from './DataTable'
import { CountUp, GlassCard, PendingBar, Snowball } from './ui'

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
}
const item = {
  hidden: { opacity: 0, y: 24, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
} as const

const pctFormat = (v: number) => formatPercent(v)

export function GrowthResults({ input, pending }: { input: GrowthInput; pending: boolean }) {
  const r = useMemo(() => {
    const i = monthlyRate(input.rate, input.rateUnit)
    const n = toMonths(input.period, input.periodUnit)
    const rows = simulate(input.pv, input.pmt, i, n)
    const last = rows[n]
    return {
      n,
      rows,
      years: byYear(rows),
      final: last.total,
      invested: last.invested,
      interest: last.totalInterest,
      turning: turningPoint(input.pv, input.pmt, i),
    }
  }, [input])

  const share = r.final > 0 ? r.interest / r.final : 0
  // Bola cresce em escala logarítmica: R$ 1 mil → pequena, R$ 1 milhão → enorme.
  const ballSize = 52 + 80 * Math.min(1, Math.max(0, Math.log10(Math.max(r.final, 1) / 1000) / 3))

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="grid grid-cols-1 gap-5 [&>*]:min-w-0">
      <motion.div variants={item}>
        <GlassCard tilt className="glow flex flex-col items-center gap-6 overflow-hidden p-6 sm:flex-row sm:justify-between sm:p-8">
          <PendingBar active={pending} />
          <div className="min-w-0 text-center sm:text-left">
            <p className="text-sm font-medium text-muted">Valor total final</p>
            <CountUp value={r.final} className="mt-2 block font-display text-[clamp(2rem,4.4vw,3rem)] font-bold leading-tight tracking-tight" />
            <p className="mt-2 text-sm text-muted">em {monthsLabel(r.n)}</p>
          </div>
          <div className="grid h-[140px] w-[140px] shrink-0 place-items-center">
            <Snowball size={ballSize} />
          </div>
        </GlassCard>
      </motion.div>

      <motion.div variants={item} className="grid gap-5 sm:grid-cols-2 [&>*]:min-w-0">
        <GlassCard tilt className="p-6">
          <p className="flex items-center gap-2 text-sm text-muted">
            <span className="h-2 w-2 rounded-full bg-invested" /> Total investido
          </p>
          <CountUp value={r.invested} className="mt-2 block font-display text-2xl font-semibold text-invested" />
          <p className="mt-1 text-xs text-muted">O que saiu do seu bolso</p>
        </GlassCard>
        <GlassCard tilt className="p-6">
          <p className="flex items-center gap-2 text-sm text-muted">
            <span className="h-2 w-2 rounded-full bg-interest" /> Total em juros
          </p>
          <CountUp value={r.interest} className="mt-2 block font-display text-2xl font-semibold text-interest" />
          <p className="mt-1 text-xs text-muted">O que o dinheiro rendeu sozinho</p>
        </GlassCard>
      </motion.div>

      {r.turning != null && input.pmt > 0 && (
        <motion.div variants={item}>
          <GlassCard className="flex items-start gap-4 p-5">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent/15 text-xl text-accent"
            >
              ❄
            </motion.span>
            {r.turning <= r.n ? (
              <p className="text-[15px] leading-relaxed">
                <strong className="font-semibold">No mês {r.turning} sua bola de neve começa a andar sozinha.</strong>{' '}
                <span className="text-muted">
                  A partir daí, os juros de cada mês já rendem mais que o seu aporte de {formatBRL(input.pmt)}.
                </span>
              </p>
            ) : (
              <p className="text-[15px] leading-relaxed">
                <strong className="font-semibold">Continue rolando!</strong>{' '}
                <span className="text-muted">
                  Com esses valores, sua bola de neve passa a andar sozinha no mês {r.turning} — quando os juros do mês passam
                  o seu aporte.
                </span>
              </p>
            )}
          </GlassCard>
        </motion.div>
      )}

      <motion.div variants={item} className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_240px]">
        <GlassCard className="min-w-0 p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-lg font-semibold">Investido × juros</h3>
            <div className="flex gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-invested" />Investido</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-interest" />Juros</span>
            </div>
          </div>
          <InViewMount height={300}>
            <GrowthChart rows={r.rows} turning={r.turning} />
          </InViewMount>
        </GlassCard>

        <GlassCard className="flex min-w-0 flex-col items-center justify-center p-6">
          <h3 className="self-start font-display text-lg font-semibold xl:self-center">Proporção</h3>
          <div className="relative mt-3 h-[180px] w-[180px]">
            <InViewMount height={180}>
              <DonutChart invested={r.invested} interest={r.interest} />
            </InViewMount>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <CountUp value={share} format={pctFormat} className="block font-display text-2xl font-bold text-interest" />
                <span className="text-xs text-muted">vem dos juros</span>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <motion.div variants={item} id="tabela" className="scroll-mt-24">
        <GlassCard className="min-w-0 p-5 sm:p-6">
          <DataTable rows={r.rows} years={r.years} turning={r.turning} />
        </GlassCard>
      </motion.div>
    </motion.div>
  )
}
