import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTheme } from '../lib/theme'
import { cn } from './ui'

export type NavTarget = 'growth' | 'goal' | 'how'

const LINKS: Array<{ target: NavTarget; label: string }> = [
  { target: 'growth', label: 'Calculadora' },
  { target: 'goal', label: 'Minha Meta' },
  { target: 'how', label: 'Como funciona' },
]

export function Header({ onNavigate }: { onNavigate: (t: NavTarget) => void }) {
  const { theme, toggle } = useTheme()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.header
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-3 sm:px-4"
    >
      <nav
        className={cn(
          'flex w-full max-w-6xl items-center justify-between rounded-full border px-4 transition-all duration-300 sm:px-5',
          scrolled ? 'header-solid py-2' : 'border-transparent py-3.5',
        )}
      >
        <a href="#top" className="group flex items-center gap-2.5" aria-label="Bola de Neve — início">
          <span className="snowball block h-7 w-7 transition-transform duration-500 group-hover:rotate-180 group-hover:scale-110" />
          <span className="font-display text-[17px] font-semibold tracking-tight">Bola de Neve</span>
        </a>

        <div className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <button
              key={l.target}
              onClick={() => onNavigate(l.target)}
              className="relative cursor-pointer rounded-full px-4 py-2 text-sm text-muted transition-colors hover:bg-[var(--glass-hover)] hover:text-fg"
            >
              {l.label}
            </button>
          ))}
        </div>

        <button
          onClick={toggle}
          aria-label={theme === 'dark' ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'}
          className="btn btn-ghost relative h-10 w-10 overflow-hidden"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={{ y: 18, rotate: -90, opacity: 0 }}
              animate={{ y: 0, rotate: 0, opacity: 1 }}
              exit={{ y: -18, rotate: 90, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              className="grid place-items-center"
            >
              {theme === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
            </motion.span>
          </AnimatePresence>
        </button>
      </nav>
    </motion.header>
  )
}
