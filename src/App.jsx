import { Routes, Route, NavLink, Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { NAV_ITEMS } from './lib/nav'
import { useLotteryData } from './hooks/useLotteryData'
import Home from './pages/Home'
import Browse from './pages/Browse'
import CardPage from './pages/CardPage'
import Draws from './pages/Draws'
import Guide from './pages/Guide'
import { dLong, hhmm } from './lib/format'

const Mark = () => (
  <Link to="/" className="inline-flex items-center gap-2.5" aria-label="Lottery Watch, home">
    <img src="/favicon.svg" alt="" className="w-7 h-7 rounded-[8px]" />
    <span className="text-[16px] font-bold tracking-tighter text-hi">Lottery Watch</span>
  </Link>
)

export default function App() {
  const location = useLocation()
  const data = useLotteryData()
  const { model } = data
  const section = `/${location.pathname.split('/')[1]}`

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    const active = NAV_ITEMS.find((n) => n.to === section)
    document.title = active && active.to !== '/' ? `${active.label} · Lottery Watch` : 'Lottery Watch'
  }, [location.pathname, section])

  const Status = () => (
    <button onClick={data.refresh} disabled={data.refreshing} className="chip !h-8 !px-3 !text-[12.5px]" aria-label={data.refreshing ? 'Checking for new data' : 'Check for new data'}>
      <span className={`w-1.5 h-1.5 rounded-full ${data.source === 'live' ? 'bg-mint' : 'bg-amber'}`} />
      {data.source === 'live' ? 'Live' : 'Saved copy'}
      <RefreshCw className={`w-3.5 h-3.5 ${data.refreshing ? 'animate-spin' : ''}`} strokeWidth={2.4} />
    </button>
  )

  return (
    <div className="min-h-screen">
      {/* Desktop: a floating bar */}
      <header className="hidden md:block fixed top-4 inset-x-0 z-50 px-6 pointer-events-none">
        <div className="pointer-events-auto mx-auto max-w-[1120px] h-14 pl-5 pr-3 rounded-full glass flex items-center justify-between">
          <Mark />
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} className={({ isActive }) => `h-9 px-4 rounded-full inline-flex items-center text-[14px] font-semibold transition-colors ${isActive ? 'bg-white/[0.12] text-hi' : 'text-mid hover:text-hi'}`}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <Status />
        </div>
      </header>

      {/* Phone: title row, with the tabs floating at the bottom */}
      <header className="md:hidden flex items-center justify-between px-5 h-14" style={{ marginTop: 'env(safe-area-inset-top)' }}>
        <Mark />
        <Status />
      </header>

      <main className="mx-auto w-full max-w-[1120px] px-5 sm:px-8 pt-4 md:pt-32 pb-36 md:pb-20">
        {data.loading && !model && <div className="py-32 text-center text-mid animate-pulse">Loading today's prize data…</div>}
        {data.error && !model && <div className="panel p-8 text-mid">Couldn't load the prize data: {data.error}</div>}
        {model && (
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
            <Routes location={location}>
              <Route path="/" element={<Home m={model} />} />
              <Route path="/cards" element={<Browse m={model} />} />
              <Route path="/cards/:id" element={<CardPage m={model} />} />
              <Route path="/draws" element={<Draws m={model} />} />
              <Route path="/guide" element={<Guide m={model} source={data.source} />} />
              <Route path="*" element={<Home m={model} />} />
            </Routes>
            <footer className="mt-20 pt-6 hair text-[12.5px] leading-relaxed text-low">
              <p>Scratchcard prizes as published by the National Lottery on {dLong(model.updated)}{model.fetchedAt ? `. Checked ${dLong(model.fetchedAt)} at ${hhmm(model.fetchedAt)}` : ''}.</p>
              <p>Independent and unofficial. Not affiliated with The National Lottery or Allwyn. Nothing here is advice to play. 18+.</p>
              <p>If gambling stops being fun, the National Gambling Helpline is free, 24 hours a day: 0808 8020 133.</p>
            </footer>
          </motion.div>
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 px-4 pb-3 safe-b pointer-events-none">
        <div className="pointer-events-auto mx-auto max-w-[420px] h-[62px] rounded-full glass grid px-2" style={{ gridTemplateColumns: `repeat(${NAV_ITEMS.length}, minmax(0, 1fr))` }}>
          {NAV_ITEMS.map((item) => {
            const active = item.to === section
            return (
              <NavLink key={item.to} to={item.to} end={item.to === '/'} className={`flex flex-col items-center justify-center gap-1 transition-colors ${active ? 'text-hi' : 'text-low'}`}>
                <item.icon className="w-[21px] h-[21px]" strokeWidth={active ? 2.5 : 2} />
                <span className={`text-[10.5px] ${active ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
