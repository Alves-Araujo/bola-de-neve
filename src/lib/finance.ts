export type RateUnit = 'aa' | 'am'
export type PeriodUnit = 'anos' | 'meses'

export interface Row {
  month: number
  /** Juros gerados naquele mês */
  interest: number
  /** Tudo o que saiu do bolso até aqui (valor inicial + aportes) */
  invested: number
  totalInterest: number
  total: number
}

export interface YearRow {
  year: number
  lastMonth: number
  interest: number
  invested: number
  totalInterest: number
  total: number
}

/** Taxa mensal em decimal. Taxa anual é convertida por equivalência, nunca dividida por 12. */
export function monthlyRate(ratePercent: number, unit: RateUnit): number {
  const r = ratePercent / 100
  return unit === 'am' ? r : Math.pow(1 + r, 1 / 12) - 1
}

export function toMonths(period: number, unit: PeriodUnit): number {
  return Math.round(unit === 'anos' ? period * 12 : period)
}

export function annualToMonthly(ratePercent: number): number {
  return (Math.pow(1 + ratePercent / 100, 1 / 12) - 1) * 100
}

export function monthlyToAnnual(ratePercent: number): number {
  return (Math.pow(1 + ratePercent / 100, 12) - 1) * 100
}

/** Evolução mês a mês com aporte no fim de cada mês. A linha 0 é o valor inicial. */
export function simulate(pv: number, pmt: number, i: number, n: number): Row[] {
  const rows: Row[] = [{ month: 0, interest: 0, invested: pv, totalInterest: 0, total: pv }]
  let total = pv
  let invested = pv
  let totalInterest = 0
  for (let month = 1; month <= n; month++) {
    const interest = total * i
    total += interest + pmt
    invested += pmt
    totalInterest += interest
    rows.push({ month, interest, invested, totalInterest, total })
  }
  return rows
}

export function byYear(rows: Row[]): YearRow[] {
  const years: YearRow[] = []
  for (let start = 1; start < rows.length; start += 12) {
    const chunk = rows.slice(start, start + 12)
    const last = chunk[chunk.length - 1]
    years.push({
      year: years.length + 1,
      lastMonth: last.month,
      interest: chunk.reduce((sum, r) => sum + r.interest, 0),
      invested: last.invested,
      totalInterest: last.totalInterest,
      total: last.total,
    })
  }
  return years
}

export function futureValue(pv: number, pmt: number, i: number, n: number): number {
  if (i === 0) return pv + pmt * n
  const g = Math.pow(1 + i, n)
  return pv * g + (pmt * (g - 1)) / i
}

/**
 * Aporte mensal necessário para chegar em `goal` em `n` meses, arredondado para cima nos centavos.
 * Retorna 0 quando o valor inicial sozinho já chega na meta.
 */
export function requiredMonthly(goal: number, pv: number, i: number, n: number): number {
  if (n <= 0) return NaN
  const g = Math.pow(1 + i, n)
  const missing = goal - pv * g
  if (missing <= 0) return 0
  const raw = i === 0 ? missing / n : (missing * i) / (g - 1)
  return Math.ceil(raw * 100 - 1e-6) / 100
}

/** Primeiro mês em que os juros do mês passam o aporte mensal ("a bola anda sozinha"). */
export function turningPoint(pv: number, pmt: number, i: number, limit = 1200): number | null {
  if (pmt <= 0 || i <= 0) return null
  let total = pv
  for (let month = 1; month <= limit; month++) {
    const interest = total * i
    if (interest > pmt) return month
    total += interest + pmt
  }
  return null
}
