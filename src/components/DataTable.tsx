import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Row, YearRow } from '../lib/finance'
import { formatBRL, formatNumber } from '../lib/format'
import { Segmented, cn } from './ui'

type View = 'mes' | 'ano'
const PAGE = 12

function toCsv(view: View, rows: Row[], years: YearRow[]): string {
  const money = (v: number) => formatNumber(v, 2, false)
  const header =
    view === 'mes'
      ? ['Mês', 'Juros do mês', 'Total investido', 'Total em juros', 'Total acumulado']
      : ['Ano', 'Juros do ano', 'Total investido', 'Total em juros', 'Total acumulado']
  const body =
    view === 'mes'
      ? rows.slice(1).map((r) => [r.month, money(r.interest), money(r.invested), money(r.totalInterest), money(r.total)])
      : years.map((y) => [y.year, money(y.interest), money(y.invested), money(y.totalInterest), money(y.total)])
  return [header, ...body].map((line) => line.join(';')).join('\n')
}

export function DataTable({ rows, years, turning }: { rows: Row[]; years: YearRow[]; turning: number | null }) {
  const [view, setView] = useState<View>(years.length > 2 ? 'ano' : 'mes')
  const [page, setPage] = useState(0)

  const items =
    view === 'mes'
      ? rows.slice(1).map((r) => ({ key: r.month, period: r.month, interest: r.interest, invested: r.invested, totalInterest: r.totalInterest, total: r.total, turning: r.month === turning }))
      : years.map((y) => ({
          key: y.year,
          period: y.year,
          interest: y.interest,
          invested: y.invested,
          totalInterest: y.totalInterest,
          total: y.total,
          turning: turning != null && turning > y.lastMonth - 12 && turning <= y.lastMonth,
        }))
  const pages = Math.max(1, Math.ceil(items.length / PAGE))
  const current = Math.min(page, pages - 1)
  const visible = items.slice(current * PAGE, current * PAGE + PAGE)

  useEffect(() => setPage(0), [view, rows])

  function exportCsv() {
    const blob = new Blob(['﻿' + toCsv(view, rows, years)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bola-de-neve-${view === 'mes' ? 'mensal' : 'anual'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold">Evolução {view === 'mes' ? 'mês a mês' : 'ano a ano'}</h3>
        <div className="flex items-center gap-2">
          <Segmented
            id="table-view"
            size="sm"
            value={view}
            onChange={setView}
            options={[
              { value: 'mes', label: 'Por mês' },
              { value: 'ano', label: 'Por ano' },
            ]}
          />
          <button onClick={exportCsv} className="btn btn-ghost h-8 px-3 text-xs" aria-label="Exportar tabela em CSV">
            <Download size={14} /> CSV
          </button>
        </div>
      </div>

      <div className="-mx-2 mt-4 overflow-x-auto px-2">
        <table className="num w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-[0.12em] text-muted">
              <th className="py-2 pr-3 font-medium">{view === 'mes' ? 'Mês' : 'Ano'}</th>
              <th className="py-2 pr-3 text-right font-medium">Juros {view === 'mes' ? 'do mês' : 'do ano'}</th>
              <th className="py-2 pr-3 text-right font-medium">Total investido</th>
              <th className="py-2 pr-3 text-right font-medium">Total em juros</th>
              <th className="py-2 text-right font-medium">Total acumulado</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((it, k) => (
              <motion.tr
                key={`${view}-${current}-${it.key}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: k * 0.03, duration: 0.35 }}
                className={cn('border-t border-line transition-colors hover:bg-[var(--glass-hover)]', it.turning && 'bg-accent/10')}
              >
                <td className="py-2.5 pr-3 font-medium">
                  <span className="flex items-center gap-2">
                    {it.period}
                    {it.turning && (
                      <span title="Ponto de virada: os juros do mês passam o seu aporte" className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">
                        ❄ virada
                      </span>
                    )}
                  </span>
                </td>
                <td className="py-2.5 pr-3 text-right text-interest">{formatBRL(it.interest)}</td>
                <td className="py-2.5 pr-3 text-right">{formatBRL(it.invested)}</td>
                <td className="py-2.5 pr-3 text-right">{formatBRL(it.totalInterest)}</td>
                <td className="py-2.5 text-right font-semibold">{formatBRL(it.total)}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted">
          <span>
            Página {current + 1} de {pages}
          </span>
          <div className="flex gap-2">
            <button onClick={() => setPage(current - 1)} disabled={current === 0} className="btn btn-ghost h-9 w-9" aria-label="Página anterior">
              <ChevronLeft size={16} />
            </button>
            <button onClick={() => setPage(current + 1)} disabled={current >= pages - 1} className="btn btn-ghost h-9 w-9" aria-label="Próxima página">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
