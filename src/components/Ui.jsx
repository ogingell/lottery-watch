import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Ticket } from 'lucide-react'
import { EASE, VIEWPORT, Reveal, Grow } from './Hud'
import { dLong, span, plural } from '../lib/format'

export { HudPanel as Card, ChartTooltip, Segmented, StatusChip, Reveal, Grow } from './Hud'

export function PageHeader({ eyebrow, title, lead }) {
  return (
    <Reveal as="header" className="pt-2 pb-1 mb-5">
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <h1 className="page-title">{title}</h1>
      {lead && <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-surface-300">{lead}</p>}
    </Reveal>
  )
}

export function Stat({ label, value, sub, tone }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
      whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={VIEWPORT} transition={{ duration: 0.6, ease: EASE }}
      className="tile px-3.5 py-3"
    >
      <p className="text-[12px] font-medium text-surface-400">{label}</p>
      <p className={`readout text-[26px] leading-tight mt-0.5 ${tone === 'warn' ? 'text-hud-amber' : 'text-surface-50'}`}>{value}</p>
      {sub && <p className="text-[12px] leading-snug text-surface-400 mt-0.5">{sub}</p>}
    </motion.div>
  )
}

/* The card's artwork, or a neutral ticket if the image cannot be loaded. */
export function Thumb({ card, size = 48 }) {
  const [broken, setBroken] = useState(false)
  const box = { width: size, height: size * 1.12 }
  if (!card.image || broken) {
    return <span className="flex-shrink-0 inline-flex items-center justify-center rounded-[10px] bg-void-800 text-surface-400" style={box}><Ticket className="w-5 h-5" /></span>
  }
  return <img src={card.image} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} className="flex-shrink-0 rounded-[10px] object-cover bg-void-800" style={box} />
}

/* Top prizes: one pip each when there are few, a bar when there are many.
   Filled = still unclaimed. */
export function Pips({ left, total }) {
  if (left == null || !total) return null
  if (total > 12) {
    return (
      <span className="block h-2 w-full max-w-[160px] rounded-full bg-[rgb(118_118_128/0.2)] overflow-hidden" role="img" aria-label={`${left} of ${total} top prizes left`}>
        <span className="block h-full rounded-full bg-coral" style={{ width: `${(left / total) * 100}%` }} />
      </span>
    )
  }
  return (
    <span className="inline-flex gap-[3px]" role="img" aria-label={`${left} of ${total} top prizes left`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`w-2.5 h-2.5 rounded-full ${i < left ? 'bg-coral' : 'ring-[1.5px] ring-inset ring-surface-500'}`} />
      ))}
    </span>
  )
}

/* How long a card has gone without a top-prize claim, and how we know. */
export function waitLine(c, trackingSince) {
  const w = c.wait
  if (c.kind === 'gone') return 'Every top prize has been claimed'
  if (c.kind === 'many') return c.pace ? `A top prize is claimed about ${c.pace < 1 ? `${Math.round(1 / c.pace)} times a day` : `every ${span(Math.round(c.pace))}`}` : 'Top prizes are claimed routinely'
  if (!w) return 'No claim history yet'
  if (w.basis === 'never') return `No top prize claimed in about ${span(w.days)} on sale`
  if (w.basis === 'seen') return w.days === 0 ? 'A top prize was claimed today' : `Last top prize claimed ${span(w.days)} ago (${dLong(w.since)})`
  return w.days === 0 ? `Last claim date not published; watching from ${dLong(trackingSince ?? w.since)}` : `No top prize claimed in the ${plural(w.days, 'day')} we have watched`
}

/* A ranked row with a quiet bar behind the figure on the right. */
export function BarRow({ first, left, title, sub, value, unit, share, tone = 'coral' }) {
  return (
    <div className={`py-3 ${first ? '' : 'hairline-t'}`}>
      <div className="flex items-center gap-3">
        {left}
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-surface-50 truncate">{title}</p>
          <p className="text-[12.5px] leading-snug text-surface-400">{sub}</p>
        </div>
        <p className="flex-shrink-0 text-right">
          <span className="readout text-[19px] text-surface-50">{value}</span>
          {unit && <span className="block text-[11.5px] text-surface-400 -mt-0.5">{unit}</span>}
        </p>
      </div>
      {share != null && (
        <span className="mt-2 block h-1.5 rounded-full bg-[rgb(118_118_128/0.14)] overflow-hidden">
          <Grow className={`block h-full rounded-full ${tone === 'amber' ? 'bg-hud-amber' : 'bg-coral'}`} style={{ width: `${Math.max(2, share * 100)}%` }} />
        </span>
      )}
    </div>
  )
}

export function Note({ children }) {
  return <Reveal className="accent-panel px-4 py-3.5 text-[14px] leading-relaxed text-surface-100">{children}</Reveal>
}

export const Empty = ({ children }) => <p className="py-6 text-center text-[14px] text-surface-400">{children}</p>
