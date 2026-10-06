import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

export type Theme = 'dark' | 'light'

const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'dark', toggle: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark',
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#070b1a' : '#f7f9ff')
    try {
      localStorage.setItem('bn-theme', theme)
    } catch {
      // armazenamento indisponível: o tema só não fica salvo
    }
  }, [theme])

  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])

  return <ThemeContext.Provider value={{ theme, toggle }}>{children}</ThemeContext.Provider>
}

export const useTheme = () => useContext(ThemeContext)

/** Cores dos gráficos (o SVG do Recharts precisa de valores concretos, não de variáveis CSS). */
const palette = {
  dark: { invested: '#60a5fa', interest: '#34d399', total: '#22d3ee', goal: '#a78bfa', simple: '#94a3b8', base: '#cbd5e1' },
  light: { invested: '#3b82f6', interest: '#059669', total: '#0891b2', goal: '#7c3aed', simple: '#94a3b8', base: '#64748b' },
}

export const useColors = () => palette[useTheme().theme]
