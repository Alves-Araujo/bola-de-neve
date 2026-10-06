import { useInView } from 'framer-motion'
import { useRef, type ReactNode } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Row } from '../lib/finance'
import { formatAxis, formatBRL, formatCompactBRL, niceTicks, timeTicks } from '../lib/format'
import { useColors } from '../lib/theme'

/** Só monta o gráfico quando ele aparece na tela, para a animação de desenho ser vista. */
export function InViewMount({ height, children }: { height: number; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  return (
    <div ref={ref} style={{ height }} className="w-full min-w-0">
      {inView && children}
    </div>
  )
}

interface TooltipLine {
  label: string
  value: number
  color: string
}

function GlassTooltip({ title, lines }: { title: string; lines: TooltipLine[] }) {
  return (
    <div className="glass min-w-[190px] rounded-2xl px-4 py-3 text-sm" style={{ boxShadow: '0 20px 50px -20px rgb(0 0 0 / .6)' }}>
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-muted">{title}</p>
      {lines.map((l) => (
        <div key={l.label} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-2 text-muted">
            <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
            {l.label}
          </span>
          <span className="num font-semibold">{formatBRL(l.value)}</span>
        </div>
      ))}
    </div>
  )
}

function monthTitle(m: number) {
  if (m === 0) return 'Início'
  return m >= 12 ? `Mês ${m} · ano ${Math.ceil(m / 12)}` : `Mês ${m}`
}

interface PointProps {
  cx?: number
  cy?: number
}

function PulseDot(color: string) {
  return function Dot({ cx = 0, cy = 0 }: PointProps) {
    return (
      <g>
        <circle cx={cx} cy={cy} r={6} fill={color} opacity={0.5}>
          <animate attributeName="r" values="6;20;6" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values=".55;0;.55" dur="2.2s" repeatCount="indefinite" />
        </circle>
        <circle cx={cx} cy={cy} r={5.5} fill="#fff" stroke={color} strokeWidth={3} />
      </g>
    )
  }
}

type TipProps = { active?: boolean; payload?: ReadonlyArray<{ payload?: unknown }> }

// ---------- Investido × juros ----------

export function GrowthChart({ rows, turning }: { rows: Row[]; turning: number | null }) {
  const c = useColors()
  const n = rows.length - 1
  const final = rows[n].total
  const yTicks = niceTicks(final * 1.02, 5)
  const time = timeTicks(n)
  const data = rows.map((r) => ({ month: r.month, invested: r.invested, interest: r.totalInterest, total: r.total }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gInv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c.invested} stopOpacity={0.55} />
            <stop offset="1" stopColor={c.invested} stopOpacity={0.08} />
          </linearGradient>
          <linearGradient id="gInt" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c.interest} stopOpacity={0.6} />
            <stop offset="1" stopColor={c.interest} stopOpacity={0.12} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 6" />
        <XAxis
          dataKey="month"
          type="number"
          domain={[0, n]}
          ticks={time.ticks}
          tickFormatter={time.format}
          axisLine={false}
          tickLine={false}
          tickMargin={10}
        />
        <YAxis
          width={56}
          domain={[0, yTicks[yTicks.length - 1]]}
          ticks={yTicks}
          tickFormatter={formatAxis}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ stroke: c.total, strokeOpacity: 0.35, strokeDasharray: '4 4' }}
          content={({ active, payload }: TipProps) => {
            const p = payload?.[0]?.payload as (typeof data)[number] | undefined
            if (!active || !p) return null
            return (
              <GlassTooltip
                title={monthTitle(p.month)}
                lines={[
                  { label: 'Investido', value: p.invested, color: c.invested },
                  { label: 'Juros', value: p.interest, color: c.interest },
                  { label: 'Total', value: p.total, color: c.total },
                ]}
              />
            )
          }}
        />
        <Area
          type="monotone"
          dataKey="invested"
          stackId="1"
          stroke={c.invested}
          strokeWidth={2}
          fill="url(#gInv)"
          animationDuration={1400}
          animationEasing="ease-out"
        />
        <Area
          type="monotone"
          dataKey="interest"
          stackId="1"
          stroke={c.interest}
          strokeWidth={2.5}
          fill="url(#gInt)"
          animationDuration={1600}
          animationEasing="ease-out"
        />
        {turning != null && turning <= n && (
          <ReferenceDot x={turning} y={rows[turning].total} shape={PulseDot(c.total)} ifOverflow="visible" />
        )}
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ---------- Rosca investido × juros ----------

export function DonutChart({ invested, interest }: { invested: number; interest: number }) {
  const c = useColors()
  const data = [
    { name: 'Investido', value: Math.max(invested, 0), fill: c.invested },
    { name: 'Juros', value: Math.max(interest, 0), fill: c.interest },
  ]
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          innerRadius="72%"
          outerRadius="98%"
          paddingAngle={3}
          cornerRadius={8}
          startAngle={90}
          endAngle={-270}
          stroke="none"
          animationDuration={1400}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

// ---------- Evolução até a meta ----------

export function GoalChart({
  rows,
  goal,
  onReached,
}: {
  rows: Row[]
  goal: number
  onReached?: () => void
}) {
  const c = useColors()
  const n = rows.length - 1
  const top = Math.max(goal, rows[n].total)
  const yTicks = niceTicks(top * 1.06, 4)
  const time = timeTicks(n)
  const data = rows.map((r) => ({ month: r.month, total: r.total, invested: r.invested }))

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 20, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gGoal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={c.total} stopOpacity={0.5} />
            <stop offset="1" stopColor={c.goal} stopOpacity={0.04} />
          </linearGradient>
          <linearGradient id="gGoalStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={c.invested} />
            <stop offset="1" stopColor={c.total} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 6" />
        <XAxis
          dataKey="month"
          type="number"
          domain={[0, n]}
          ticks={time.ticks}
          tickFormatter={time.format}
          axisLine={false}
          tickLine={false}
          tickMargin={10}
        />
        <YAxis
          width={56}
          domain={[0, yTicks[yTicks.length - 1]]}
          ticks={yTicks}
          tickFormatter={formatAxis}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ stroke: c.total, strokeOpacity: 0.35, strokeDasharray: '4 4' }}
          content={({ active, payload }: TipProps) => {
            const p = payload?.[0]?.payload as (typeof data)[number] | undefined
            if (!active || !p) return null
            return (
              <GlassTooltip
                title={monthTitle(p.month)}
                lines={[
                  { label: 'Investido', value: p.invested, color: c.invested },
                  { label: 'Juros', value: p.total - p.invested, color: c.interest },
                  { label: 'Total', value: p.total, color: c.total },
                ]}
              />
            )
          }}
        />
        <ReferenceLine
          y={goal}
          stroke={c.goal}
          strokeDasharray="6 6"
          strokeWidth={1.5}
          label={{ value: `Meta · ${formatCompactBRL(goal)}`, position: 'insideTopLeft', fill: c.goal, fontSize: 12, dy: -16 }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="url(#gGoalStroke)"
          strokeWidth={3}
          fill="url(#gGoal)"
          animationDuration={1500}
          animationEasing="ease-in"
          onAnimationEnd={onReached}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ---------- Simples × compostos ----------

export function ComparisonChart() {
  const c = useColors()
  const data = Array.from({ length: 241 }, (_, m) => ({
    month: m,
    simple: 10000 * (1 + 0.01 * m),
    compound: 10000 * Math.pow(1.01, m),
  }))
  const yTicks = niceTicks(data[240].compound, 4)
  const time = timeTicks(240)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 16, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 6" />
        <XAxis dataKey="month" type="number" domain={[0, 240]} ticks={time.ticks} tickFormatter={time.format} axisLine={false} tickLine={false} tickMargin={10} />
        <YAxis width={56} domain={[0, yTicks[yTicks.length - 1]]} ticks={yTicks} tickFormatter={formatAxis} axisLine={false} tickLine={false} />
        <Tooltip
          cursor={{ stroke: c.total, strokeOpacity: 0.35, strokeDasharray: '4 4' }}
          content={({ active, payload }: TipProps) => {
            const p = payload?.[0]?.payload as (typeof data)[number] | undefined
            if (!active || !p) return null
            return (
              <GlassTooltip
                title={monthTitle(p.month)}
                lines={[
                  { label: 'Simples', value: p.simple, color: c.simple },
                  { label: 'Compostos', value: p.compound, color: c.interest },
                ]}
              />
            )
          }}
        />
        <Line type="monotone" dataKey="simple" stroke={c.simple} strokeWidth={2.5} strokeDasharray="6 6" dot={false} animationDuration={1800} />
        <Line type="monotone" dataKey="compound" stroke={c.interest} strokeWidth={3} dot={false} animationDuration={2200} />
      </LineChart>
    </ResponsiveContainer>
  )
}
