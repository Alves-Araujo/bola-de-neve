import { describe, expect, it } from 'vitest'
import { byYear, futureValue, monthlyRate, requiredMonthly, simulate, turningPoint } from './finance'
import { niceTicks, timeTicks } from './format'

const i10aa = monthlyRate(10, 'aa')

describe('juros compostos', () => {
  it('converte taxa anual por equivalência', () => {
    expect(Math.pow(1 + i10aa, 12)).toBeCloseTo(1.1, 12)
  })

  it('R$ 1.000 + R$ 500/mês a 10% a.a. por 10 anos', () => {
    const rows = simulate(1000, 500, i10aa, 120)
    const last = rows[120]
    expect(last.total).toBeCloseTo(102525.67, 1)
    expect(last.invested).toBe(61000)
    expect(futureValue(1000, 500, i10aa, 120)).toBeCloseTo(last.total, 6)
    expect(byYear(rows)[0].invested).toBe(7000)
    expect(turningPoint(1000, 500, i10aa)).toBe(87)
  })

  it('aporte para R$ 50 mil em 2 anos a 10% a.a.', () => {
    const pmt = requiredMonthly(50000, 0, i10aa, 24)
    expect(pmt).toBe(1898.61)
    expect(simulate(0, pmt, i10aa, 24)[24].total).toBeGreaterThanOrEqual(50000)
  })

  it('aporte para R$ 100 mil em 5 anos a 10% a.a.', () => {
    expect(requiredMonthly(100000, 0, i10aa, 60)).toBe(1306.15)
  })

  it('taxa zero vira divisão simples', () => {
    expect(requiredMonthly(12000, 0, 0, 12)).toBe(1000)
    expect(futureValue(100, 10, 0, 10)).toBe(200)
  })

  it('valor inicial que já chega na meta não precisa de aporte', () => {
    expect(requiredMonthly(10000, 20000, i10aa, 12)).toBe(0)
  })
})

describe('eixos', () => {
  it('gera ticks redondos', () => {
    expect(niceTicks(108000, 5)).toEqual([0, 25000, 50000, 75000, 100000, 125000])
    expect(niceTicks(100000.45, 4)).toEqual([0, 25000, 50000, 75000, 100000])
  })

  it('usa meses até 2 anos e anos depois', () => {
    expect(timeTicks(24).ticks).toEqual([0, 6, 12, 18, 24])
    expect(timeTicks(120).ticks).toEqual([0, 24, 48, 72, 96, 120])
  })
})
