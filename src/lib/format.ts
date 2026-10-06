const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const upTo1 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 })
const upTo2 = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 })

export function formatBRL(v: number): string {
  return brl.format(Number.isFinite(v) ? v : 0)
}

/** Formato curto com moeda: "R$ 25 mil", "R$ 1,25 mi". */
export function formatCompactBRL(v: number): string {
  const a = Math.abs(v)
  if (a >= 1e6) return `R$ ${upTo2.format(v / 1e6)} mi`
  if (a >= 1e3) return `R$ ${upTo1.format(v / 1e3)} mil`
  return `R$ ${upTo1.format(v)}`
}

/** Rótulo de eixo, sem o "R$" para caber em telas pequenas: "150 mil", "1,2 mi". */
export function formatAxis(v: number): string {
  const a = Math.abs(v)
  if (a >= 1e6) return `${upTo2.format(v / 1e6)} mi`
  if (a >= 1e3) return `${upTo1.format(v / 1e3)} mil`
  return upTo1.format(v)
}

export function formatPercent(fraction: number, digits = 1): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(fraction) ? fraction : 0)
}

export function formatNumber(v: number, digits = 2, grouping = true): string {
  return v.toLocaleString('pt-BR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: grouping,
  })
}

export function parseDecimal(s: string): number {
  const n = Number(s.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

export function monthsLabel(n: number): string {
  if (n < 12) return `${n} ${n === 1 ? 'mês' : 'meses'}`
  const years = Math.floor(n / 12)
  const rest = n % 12
  const y = `${years} ${years === 1 ? 'ano' : 'anos'}`
  if (rest === 0) return `${n} meses (${y})`
  return `${n} meses (${y} e ${rest} ${rest === 1 ? 'mês' : 'meses'})`
}

export function periodShort(n: number): string {
  if (n % 12 === 0) {
    const y = n / 12
    return `${y} ${y === 1 ? 'ano' : 'anos'}`
  }
  return `${n} ${n === 1 ? 'mês' : 'meses'}`
}

function niceStep(raw: number): number {
  const p = Math.pow(10, Math.floor(Math.log10(raw)))
  // Folga pequena para valores como 25.000,11 não pularem para o próximo degrau.
  const f = raw / p - 1e-3
  const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10
  return nf * p
}

/** Ticks redondos (0, 25 mil, 50 mil…) cobrindo `max`. */
export function niceTicks(max: number, target = 4): number[] {
  if (!(max > 0)) return [0, 1]
  const step = niceStep(max / target)
  const count = Math.ceil(max / step - 1e-3)
  return Array.from({ length: count + 1 }, (_, k) => k * step)
}

/** Ticks do eixo do tempo em meses: meses inteiros até 2 anos, anos redondos depois disso. */
export function timeTicks(n: number): { ticks: number[]; format: (m: number) => string } {
  if (n <= 24) {
    const step = [1, 2, 3, 6, 12].find((s) => n / s <= 6) ?? 12
    const ticks = []
    for (let m = 0; m <= n; m += step) ticks.push(m)
    return { ticks, format: (m) => `${m}m` }
  }
  const years = n / 12
  const step = [1, 2, 5, 10, 20, 25, 50].find((s) => years / s <= 6) ?? 50
  const ticks = []
  for (let y = 0; y * 12 <= n; y += step) ticks.push(y * 12)
  return { ticks, format: (m) => `${m / 12}a` }
}
