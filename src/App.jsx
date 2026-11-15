import { Routes, Route, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon, RefreshCw } from 'lucide-react'
import { ThemeProvider, useTheme } from './lib/theme'
import { NAV_ITEMS } from './lib/nav'
import { useLotteryData } from './hooks/useLotteryData'
import Backdrop from './components/Backdrop'
import { PullToRefresh } from './components/Mobile'
import Home from './pages/Home'
import Cards from './pages/Cards'
import Draws from './pages/Draws'
import About from './pages/About'
import { dLong, hhmm } from './lib/format'

function Logo({ onClick }) {
  return (
    <button type="button" onClick={onClick} aria-label="Lottery Watch — back to the top" className="inline-flex items-center gap-2.5 text-left">
      <img src="/favicon.svg" alt="" className="w-8 h-8 rounded-[9px]" />
      <span className="font-title text-[24px] leading-none text-surface-50">Lottery Watch</span>
    </button>
  )
}

function Shell() {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const data = useLotteryData()
  const { model } = data

  const toTop = (smooth = true) => window.scrollTo({ top: 0, left: 0, behavior: smooth ? 'smooth' : 'instant' })

  useEffect(() => {
    toTop(false)
    const active = NAV_ITEMS.find((n) => n.to === location.pathname)
    document.title = active && active.to !== '/' ? `${active.label} · Lottery Watch` : 'Lottery Watch'
  }, [location.pathname])

  const iconBtn = 'p-2 rounded-full text-surface-300 hover:text-surface-50 active:bg-[rgb(118_118_128/0.12)] transition-colors'
  const Buttons = () => (
    <span className="flex items-center">
      <button onClick={data.refresh} disabled={data.refreshing} className={iconBtn} aria-label={data.refreshing ? 'Checking for new data' : 'Check for new data'}>
        <RefreshCw className={`w-[19px] h-[19px] ${data.refreshing ? 'animate-spin' : ''}`} />
      </button>
      <button onClick={toggleTheme} className={iconBtn} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
        {theme === 'dark' ? <Sun className="w-[21px] h-[21px]" /> : <Moon className="w-[21px] h-[21px]" />}
      </button>
    </span>
  )
  const SourceDot = () => (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-1.5 h-1.5 rounded-full ${data.source === 'live' ? 'bg-hud-green' : 'bg-hud-amber'}`} />
      {data.source === 'live' ? 'Live' : 'Saved copy'}
    </span>
  )

  return (
    <div className="min-h-screen">
      <Backdrop />

      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[232px] flex-col material hairline-r z-30 px-3 py-5">
        <div className="px-2 mb-6"><Logo onClick={() => (location.pathname === '/' ? toTop() : navigate('/'))} /></div>
        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active !bg-[rgb(118_118_128/0.16)]' : ''}`}>
              <span className="icon-tile"><item.icon className="w-[15px] h-[15px]" strokeWidth={2.4} /></span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto px-2 flex items-end justify-between">
          <p className="text-[12px] leading-snug text-surface-400">
            <SourceDot />
            {model?.updated && <span className="block">Prizes as of {dLong(model.updated)}</span>}
          </p>
          <span className="-mr-1"><Buttons /></span>
        </div>
      </aside>

      <header className="lg:hidden sticky top-0 z-40 material hairline-b" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="flex items-center justify-between px-4 h-[50px]">
          <Logo onClick={() => toTop()} />
          <span className="-mr-2"><Buttons /></span>
        </div>
      </header>

      <PullToRefresh onRefresh={data.refresh} busy={data.refreshing} />

      <main className="lg:pl-[232px]">
        <div className="mx-auto w-full max-w-[1080px] px-4 sm:px-6 lg:px-10 pt-4 pb-28 lg:pt-9 lg:pb-14">
          {data.loading && !model && <div className="py-24 text-center text-surface-400 animate-pulse">Loading the latest prize data…</div>}
          {data.error && !model && <div className="hud-panel p-6 text-surface-200">Couldn't load the prize data: {data.error}</div>}
          {model && (
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}>
              <Routes location={location}>
                <Route path="/" element={<Home m={model} />} />
                <Route path="/cards" element={<Cards m={model} />} />
                <Route path="/draws" element={<Draws m={model} />} />
                <Route path="/about" element={<About m={model} source={data.source} />} />
                <Route path="*" element={<Home m={model} />} />
              </Routes>
              <footer className="mt-10 pt-5 text-center text-[12px] leading-relaxed text-surface-400" style={{ boxShadow: 'inset 0 0.5px 0 rgb(var(--hairline))' }}>
                <p>
                  <SourceDot /> · scratchcard prizes as published {dLong(model.updated)}
                  {model.fetchedAt ? ` · checked ${dLong(model.fetchedAt)} ${hhmm(model.fetchedAt)}` : ''}
                </p>
                <p>Independent and unofficial. Not affiliated with The National Lottery or Allwyn. 18+ only.</p>
                <p>If gambling stops being fun: National Gambling Helpline, 0808 8020 133 (free, 24 hours).</p>
              </footer>
            </motion.div>
          )}
        </div>
      </main>

      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 material hairline-t safe-area-bottom">
        <div className="grid pt-1.5 pb-1" style={{ gridTemplateColumns: `repeat(${NAV_ITEMS.length}, minmax(0, 1fr))` }}>
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}>
              <span className="tab-icon"><item.icon className="w-[21px] h-[21px]" strokeWidth={2.1} /></span>
              <span className="tab-label">{item.short}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <Shell />
    </ThemeProvider>
  )
}
