import { useCallback, useEffect, useState } from 'react'
import { toMonths, type PeriodUnit, type RateUnit } from './finance'

export type Mode = 'growth' | 'goal'

export interface GrowthInput {
  pv: number
  pmt: number
  rate: number
  rateUnit: RateUnit
  period: number
  periodUnit: PeriodUnit
}

export interface GoalInput {
  goal: number
  pv: number
  rate: number
  rateUnit: RateUnit
  period: number
  periodUnit: PeriodUnit
}

export const DEFAULT_GROWTH: GrowthInput = { pv: 1000, pmt: 500, rate: 10, rateUnit: 'aa', period: 10, periodUnit: 'anos' }
export const DEFAULT_GOAL: GoalInput = { goal: 50000, pv: 0, rate: 10, rateUnit: 'aa', period: 2, periodUnit: 'anos' }

export type Errors = Partial<Record<'goal' | 'rate' | 'period', string>>

function validateCommon(rate: number, rateUnit: RateUnit, period: number, periodUnit: PeriodUnit): Errors {
  const errors: Errors = {}
  const n = toMonths(period, periodUnit)
  if (n < 1) errors.period = 'O prazo precisa ser de pelo menos 1 mês.'
  else if (n > 1200) errors.period = 'Use no máximo 100 anos (1.200 meses).'
  if (rate > (rateUnit === 'aa' ? 1000 : 100)) errors.rate = 'Essa taxa é alta demais para simular.'
  return errors
}

export function validateGrowth(input: GrowthInput): Errors {
  return validateCommon(input.rate, input.rateUnit, input.period, input.periodUnit)
}

export function validateGoal(input: GoalInput): Errors {
  const errors = validateCommon(input.rate, input.rateUnit, input.period, input.periodUnit)
  if (!(input.goal > 0)) errors.goal = 'Conte pra gente quanto você quer ter.'
  return errors
}

export const hasErrors = (e: Errors) => Object.keys(e).length > 0

/** Valor "atrasado" de `value`; `flush` aplica na hora (opcionalmente com um valor novo). */
export function useDebounced<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(t)
  }, [value, delay])
  const flush = useCallback((next?: T) => setDebounced(next ?? value), [value])
  return [debounced, flush, debounced !== value] as const
}

// ---------- Link compartilhável ----------

function readNumber(sp: URLSearchParams, key: string): number | undefined {
  const raw = sp.get(key)
  if (raw == null) return undefined
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : undefined
}

function compact<T extends object>(obj: T): Partial<T> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as Partial<T>
}

export function readParams(): { mode?: Mode; growth?: Partial<GrowthInput>; goal?: Partial<GoalInput> } {
  const sp = new URLSearchParams(window.location.search)
  const modeParam = sp.get('modo')
  const mode: Mode | undefined = modeParam === 'meta' ? 'goal' : modeParam === 'crescer' ? 'growth' : undefined
  const tu = sp.get('tu')
  const pu = sp.get('pu')
  const shared = compact({
    pv: readNumber(sp, 'vi'),
    rate: readNumber(sp, 'tx'),
    rateUnit: tu === 'am' || tu === 'aa' ? (tu as RateUnit) : undefined,
    period: readNumber(sp, 'p'),
    periodUnit: pu === 'meses' || pu === 'anos' ? (pu as PeriodUnit) : undefined,
  })
  if (mode === 'goal') return { mode, goal: { ...shared, ...compact({ goal: readNumber(sp, 'meta') }) } }
  if (mode === 'growth') return { mode, growth: { ...shared, ...compact({ pmt: readNumber(sp, 'vm') }) } }
  return {}
}

export function buildLink(mode: Mode, input: GrowthInput | GoalInput): string {
  const sp = new URLSearchParams()
  sp.set('modo', mode === 'goal' ? 'meta' : 'crescer')
  if ('goal' in input) sp.set('meta', String(input.goal))
  else sp.set('vm', String(input.pmt))
  sp.set('vi', String(input.pv))
  sp.set('tx', String(input.rate))
  sp.set('tu', input.rateUnit)
  sp.set('p', String(input.period))
  sp.set('pu', input.periodUnit)
  return `${window.location.origin}${window.location.pathname}?${sp.toString()}`
}
