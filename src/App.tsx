import { MotionConfig } from 'framer-motion'
import { useState } from 'react'
import { Background, CursorTrail } from './components/Background'
import { Calculator } from './components/Calculator'
import { Header, type NavTarget } from './components/Header'
import { Hero } from './components/Hero'
import { Footer, HowItWorks } from './components/HowItWorks'
import { FxProvider } from './lib/fx'
import { readParams, type Mode } from './lib/state'
import { ThemeProvider } from './lib/theme'

export default function App() {
  const [mode, setMode] = useState<Mode>(() => readParams().mode ?? 'growth')

  function navigate(target: NavTarget) {
    if (target !== 'how') setMode(target)
    const id = target === 'how' ? 'como-funciona' : 'calculadora'
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
        <FxProvider>
          <Background />
          <CursorTrail />
          <Header onNavigate={navigate} />
          <main>
            <Hero onNavigate={navigate} />
            <Calculator mode={mode} onModeChange={setMode} />
            <HowItWorks />
          </main>
          <Footer />
        </FxProvider>
      </MotionConfig>
    </ThemeProvider>
  )
}
