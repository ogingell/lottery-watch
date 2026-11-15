import { createContext, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'lottery-watch-theme'
const ThemeContext = createContext({ theme: 'dark', toggleTheme: () => {} })

function initialTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') return stored
  } catch { /* private mode */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(initialTheme)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
    try { localStorage.setItem(STORAGE_KEY, theme) } catch { /* ignore */ }
  }, [theme])
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}
export const useTheme = () => useContext(ThemeContext)

// Chart colours (hex: SVG attributes can't take CSS variables). Charts here are
// single-series, so one hue carries the data and a muted step marks the rest.
const CHART_COLORS = {
  light: { main: '#008064', soft: '#9fd8c8', ink: '#1c1c1e', muted: '#86868b', surface: '#ffffff' },
  dark:  { main: '#3ccfa0', soft: '#1f5c4a', ink: '#f2f2f7', muted: '#8e8e93', surface: '#12141c' },
}
export function useChartColors() {
  const { theme } = useTheme()
  return CHART_COLORS[theme] ?? CHART_COLORS.dark
}
