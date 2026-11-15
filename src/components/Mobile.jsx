import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

/**
 * Phone-only behaviour: the things a long page of cards needs to feel like an
 * app in the hand.
 */

const BAR = 50 // height of the top bar the section strip sits under

/* Section strip. Each page is a long column of cards; once the reader has
   scrolled past the page title this strip slides in under the top bar with one
   chip per card, marks the card being read, and jumps to any of them. It reads
   the cards straight off the page, so a page needs no wiring to get one. */
export function SectionNav({ watch }) {
  const [items, setItems] = useState([])
  const [active, setActive] = useState(0)
  const [shown, setShown] = useState(false)
  const strip = useRef(null)
  const jumping = useRef(0)

  // The cards on the page, in order. Re-read when the page changes or its content loads.
  useEffect(() => {
    const main = document.querySelector('main')
    if (!main) return
    let frame = 0
    const read = () => {
      const found = [...main.querySelectorAll('section.hud-panel')].map((el) => ({ el, label: el.querySelector(':scope > header h2')?.textContent?.trim() })).filter((x) => x.label)
      setItems((prev) => (prev.length === found.length && prev.every((p, i) => p.el === found[i].el && p.label === found[i].label) ? prev : found))
    }
    read()
    const mo = new MutationObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(read) })
    mo.observe(main, { childList: true, subtree: true })
    return () => { mo.disconnect(); cancelAnimationFrame(frame) }
  }, [watch])

  // Which card is under the strip, and whether the strip should be out at all
  useEffect(() => {
    if (items.length < 4) { setShown(false); return }
    let frame = 0
    const offset = () => BAR + 64
    const update = () => {
      frame = 0
      setShown(window.scrollY > 220)
      if (Date.now() < jumping.current) return // leave the tapped chip marked while the page travels to it
      let at = 0
      for (let i = 0; i < items.length; i++) if (items[i].el.getBoundingClientRect().top <= offset()) at = i
      // At the very bottom the last card may never reach the strip: mark it anyway
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) at = items.length - 1
      setActive(at)
    }
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(frame) }
  }, [items])

  // Keep the marked chip in view inside the strip
  useEffect(() => {
    const el = strip.current?.children[active]
    if (el && shown) el.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
  }, [active, shown])

  const jump = (i) => {
    const top = items[i].el.getBoundingClientRect().top + window.scrollY - (BAR + 56)
    jumping.current = Date.now() + 700
    setActive(i)
    window.scrollTo({ top, behavior: 'smooth' })
  }

  return (
    <AnimatePresence>
      {shown && items.length >= 4 && (
        <motion.nav aria-label="Sections on this page" className="lg:hidden fixed inset-x-0 z-30 material hairline-b"
          style={{ top: `calc(env(safe-area-inset-top) + ${BAR}px)` }}
          initial={{ y: -46, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -46, opacity: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}>
          <div ref={strip} className="flex gap-1.5 overflow-x-auto hide-scrollbar px-3 py-2">
            {items.map((it, i) => (
              <button key={i} type="button" onClick={() => jump(i)} aria-current={i === active ? 'true' : undefined}
                className={`section-chip ${i === active ? 'section-chip-active' : ''}`}>{it.label}</button>
            ))}
          </div>
        </motion.nav>
      )}
    </AnimatePresence>
  )
}

/* Pull to refresh, for the installed app. A browser tab already has its own
   reload gesture, so this only switches on when the app is running from the
   home screen, where there is none. */
export function PullToRefresh({ onRefresh, busy }) {
  const [pull, setPull] = useState(0)
  const start = useRef(null)
  const standalone = typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true)
  const READY = 72

  useEffect(() => {
    if (!standalone) return
    const down = (e) => { start.current = window.scrollY <= 0 && e.touches.length === 1 ? e.touches[0].clientY : null }
    const move = (e) => {
      if (start.current == null) return
      const dy = e.touches[0].clientY - start.current
      if (dy <= 0 || window.scrollY > 0) { setPull(0); return }
      setPull(Math.min(110, dy * 0.5)) // resist, so the gesture has weight
    }
    const up = () => {
      setPull((p) => { if (p >= READY) onRefresh(); return 0 })
      start.current = null
    }
    window.addEventListener('touchstart', down, { passive: true })
    window.addEventListener('touchmove', move, { passive: true })
    window.addEventListener('touchend', up)
    window.addEventListener('touchcancel', up)
    return () => { window.removeEventListener('touchstart', down); window.removeEventListener('touchmove', move); window.removeEventListener('touchend', up); window.removeEventListener('touchcancel', up) }
  }, [standalone, onRefresh])

  if (!standalone) return null
  const visible = pull > 6 || busy
  return (
    <div className="lg:hidden fixed inset-x-0 z-[45] flex justify-center pointer-events-none" style={{ top: `calc(env(safe-area-inset-top) + ${BAR + 8}px)` }} aria-hidden="true">
      <span className="flex items-center justify-center w-9 h-9 rounded-full bg-void-900 text-coral"
        style={{ opacity: visible ? 1 : 0, transform: `translateY(${busy ? 14 : pull * 0.6}px) scale(${visible ? 1 : 0.6})`, boxShadow: 'var(--card-shadow-hover)', transition: pull ? 'opacity 120ms' : 'all 240ms cubic-bezier(0.22, 1, 0.36, 1)' }}>
        <RefreshCw className={`w-[18px] h-[18px] ${busy ? 'animate-spin' : ''}`} strokeWidth={2.4} style={{ transform: busy ? undefined : `rotate(${pull * 3}deg)`, opacity: pull >= READY || busy ? 1 : 0.55 }} />
      </span>
    </div>
  )
}
