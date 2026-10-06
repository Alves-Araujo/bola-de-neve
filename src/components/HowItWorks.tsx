import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Layers, Snowflake, Sprout } from 'lucide-react'
import { useState } from 'react'
import { ComparisonChart, InViewMount } from './charts'
import { GlassCard, Reveal } from './ui'

const STEPS = [
  {
    icon: Sprout,
    title: 'Você planta',
    text: 'Todo mês você coloca um pouquinho. É o aporte — a neve que você junta com as mãos.',
    animate: { scale: [1, 1.15, 1], y: [0, -3, 0] },
  },
  {
    icon: Layers,
    title: 'Os juros rendem sobre os juros',
    text: 'O rendimento de hoje vira base para o rendimento de amanhã. A bola ganha camadas.',
    animate: { y: [0, -5, 0], rotate: [0, -6, 0] },
  },
  {
    icon: Snowflake,
    title: 'A bola de neve cresce sozinha',
    text: 'Com o tempo, os juros de um mês passam o seu aporte. Aí ela anda por conta própria.',
    animate: { rotate: [0, 180, 360] },
  },
]

const FAQ = [
  {
    q: 'O que são juros compostos?',
    a: 'São juros que rendem sobre o valor que você investiu e também sobre os juros que já foram acumulados. Por isso o crescimento acelera com o tempo — igual a uma bola de neve descendo o morro.',
  },
  {
    q: 'Taxa anual ou mensal: qual usar?',
    a: 'Use a que você tiver em mãos. Investimentos costumam informar a taxa ao ano (a.a.). A calculadora converte automaticamente, e você pode alternar entre a.a. e a.m. sem mudar o resultado.',
  },
  {
    q: 'Por que não é só dividir a taxa anual por 12?',
    a: 'Porque os juros de cada mês também rendem. 10% ao ano equivalem a cerca de 0,80% ao mês, e não 0,83%. Usamos a taxa equivalente: (1 + taxa anual)^(1/12) − 1.',
  },
  {
    q: 'Isso é recomendação de investimento?',
    a: 'Não. As simulações são estimativas que consideram uma taxa constante, sem impostos, taxas ou inflação. Use como referência para planejar, e consulte um profissional antes de decidir.',
  },
]

export function HowItWorks() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6 sm:py-24">
      <Reveal className="text-center">
        <h2 className="font-display text-4xl font-bold tracking-[-0.03em] sm:text-5xl">Como funciona</h2>
        <p className="mx-auto mt-3 max-w-lg text-muted">Três passos. Muita paciência. Uma montanha de neve.</p>
      </Reveal>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {STEPS.map((s, k) => (
          <Reveal key={s.title} delay={k * 0.12}>
            <GlassCard tilt className="h-full p-7">
              <div className="flex items-center justify-between">
                <motion.span
                  animate={s.animate}
                  transition={{ duration: k === 2 ? 6 : 2.6, repeat: Infinity, ease: k === 2 ? 'linear' : 'easeInOut' }}
                  className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-[#22d3ee]/25 to-[#a78bfa]/25 text-accent"
                >
                  <s.icon size={22} />
                </motion.span>
                <span className="font-display text-sm font-semibold text-muted">0{k + 1}</span>
              </div>
              <h3 className="mt-6 font-display text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{s.text}</p>
            </GlassCard>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-6">
        <GlassCard className="min-w-0 p-5 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="font-display text-2xl font-semibold">Simples × compostos</h3>
              <p className="mt-1 text-sm text-muted">R$ 10.000 a 1% ao mês, por 20 anos. Mesma taxa, resultados muito diferentes.</p>
            </div>
            <div className="flex gap-4 text-sm">
              <span className="flex items-center gap-2 text-muted">
                <span className="h-0.5 w-5 border-t-2 border-dashed border-slate-400" /> Simples · R$ 34 mil
              </span>
              <span className="flex items-center gap-2 font-medium text-interest">
                <span className="h-0.5 w-5 rounded bg-interest" /> Compostos · R$ 109 mil
              </span>
            </div>
          </div>
          <div className="mt-6">
            <InViewMount height={280}>
              <ComparisonChart />
            </InViewMount>
          </div>
        </GlassCard>
      </Reveal>

      <Reveal className="mx-auto mt-20 max-w-3xl">
        <h2 className="text-center font-display text-3xl font-bold tracking-[-0.03em] sm:text-4xl">Perguntas frequentes</h2>
        <div className="mt-8 grid gap-3">
          {FAQ.map((f, k) => {
            const isOpen = open === k
            return (
              <GlassCard key={f.q} className="overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : k)}
                  aria-expanded={isOpen}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-5 text-left font-medium"
                >
                  {f.q}
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }} className="shrink-0 text-muted">
                    <ChevronDown size={18} />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <p className="px-6 pb-5 leading-relaxed text-muted">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </GlassCard>
            )
          })}
        </div>
      </Reveal>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-4 pb-10 pt-6 sm:px-6">
      <div className="flex flex-col items-center justify-between gap-4 border-t border-line pt-8 text-sm text-muted sm:flex-row">
        <span className="flex items-center gap-2">
          <span className="snowball block h-5 w-5" /> Bola de Neve
        </span>
        <p className="text-center">As simulações são estimativas e não constituem recomendação de investimento.</p>
      </div>
    </footer>
  )
}
