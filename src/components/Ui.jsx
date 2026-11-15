import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { gbp, gbpShort, pence, span, dLong, plural, oneInShort, ordinal } from '../lib/format'

export const EASE = [0.22, 1, 0.36, 1]

/* Fade and rise as it scrolls into view. */
export function Fade({ as = 'div', delay = 0, className = '', children, ...rest }) {
  const reduce = useReducedMotion()
  const Tag = motion[as]
  return (
    <Tag initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }} transition={{ duration: 0.7, delay, ease: EASE }} className={className} {...rest}>
      {children}
    </Tag>
  )
}

/* A card's artwork. If the image cannot load, a quiet tile in its place. */
const HUES = [158, 212, 262, 22, 336, 48]
export function Art({ card, className = '', radius = 18 }) {
  const [broken, setBroken] = useState(false)
  const hue = HUES[(card.gameNo ?? card.name.length) % HUES.length]
  return (
    <div className={`art relative overflow-hidden bg-ink-3 shadow-art ${className}`} style={{ aspectRatio: '447 / 500', borderRadius: radius }}>
      {card.image && !broken ? (
        <img src={card.image} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setBroken(true)} className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex flex-col justify-end p-3" style={{ background: `linear-gradient(150deg, hsl(${hue} 55% 34%), hsl(${hue + 40} 50% 14%))` }}>
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/60">Game {card.gameNo}</span>
          <span className="text-[15px] font-bold leading-tight text-white">{card.name}</span>
        </div>
      )}
      <div className="absolute inset-0 pointer-events-none" style={{ borderRadius: radius, boxShadow: 'inset 0 0 0 1px rgb(255 255 255 / 0.1)' }} />
    </div>
  )
}

/* The artwork again, blurred right out, as light behind a hero. */
export function Glow({ card, strength = 0.55 }) {
  const [ok, setOk] = useState(true)
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {card.image && ok && (
        <img src={card.image} alt="" referrerPolicy="no-referrer" onError={() => setOk(false)}
          className="absolute -top-1/4 left-1/2 w-[140%] max-w-none -translate-x-1/2 blur-[90px] saturate-[1.7]" style={{ opacity: strength }} />
      )}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgb(14 15 16 / 0.25) 0%, rgb(14 15 16 / 0.82) 62%, #0e0f10 100%)' }} />
    </div>
  )
}

/* The score, as a ring. */
export function ScoreRing({ score, size = 64, stroke = 6, label = true }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const color = score >= 65 ? '#3ee8ad' : score >= 45 ? '#ffb648' : '#ff6b61'
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Score ${score} out of 100`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(255 255 255 / 0.1)" strokeWidth={stroke} />
        <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} whileInView={{ strokeDashoffset: c * (1 - score / 100) }} viewport={{ once: true }} transition={{ duration: 1.1, ease: EASE }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="num font-extrabold tracking-tighter text-hi" style={{ fontSize: size * 0.36 }}>{score}</span>
        {label && size >= 80 && <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-low">score</span>}
      </div>
    </div>
  )
}

/* Top prizes: one pip each when few, a bar when many. Filled = still unclaimed. */
export function Pips({ left, total }) {
  if (left == null || !total) return null
  if (total > 12) {
    return (
      <span className="block h-1.5 w-full max-w-[140px] rounded-full bg-white/10 overflow-hidden" role="img" aria-label={`${left} of ${total} top prizes left`}>
        <span className="block h-full rounded-full bg-mint" style={{ width: `${Math.max(3, (left / total) * 100)}%` }} />
      </span>
    )
  }
  return (
    <span className="inline-flex gap-1" role="img" aria-label={`${left} of ${total} top prizes left`}>
      {Array.from({ length: total }, (_, i) => <span key={i} className={`w-2 h-2 rounded-full ${i < left ? 'bg-mint' : 'bg-white/15'}`} />)}
    </span>
  )
}

export function StatusTag({ c }) {
  if (c.kind === 'gone') return <span className="tag-rose">Top prize gone</span>
  if (c.claimed === 0) return <span className="tag-mint">All {c.topTotal} top prizes left</span>
  if (c.kind === 'many') return <span className="tag-plain">{Math.round(c.leftShare * 100)}% of top prizes left</span>
  return <span className="tag-plain">{c.topLeft} of {c.topTotal} top prizes left</span>
}

/* How long a card has gone without a top-prize claim, and how we know. */
export function waitLine(c, trackingSince) {
  const w = c.wait
  if (c.kind === 'gone') return 'Every top prize has been claimed.'
  if (c.kind === 'many') return c.pace ? `A top prize is claimed about ${c.pace < 1 ? `${Math.round(1 / c.pace)} times a day` : `every ${span(Math.round(c.pace))}`}.` : 'Top prizes are claimed routinely.'
  if (!w) return 'No claim history yet.'
  if (w.basis === 'never') return `No top prize claimed in about ${span(w.days)} on sale.`
  if (w.basis === 'seen') return w.days === 0 ? 'A top prize was claimed today.' : `Last top prize claimed ${span(w.days)} ago, on ${dLong(w.since)}.`
  return w.days === 0 ? `Claim dates are not published. Watching daily from ${dLong(trackingSince ?? w.since)}.` : `No top prize claimed in the ${plural(w.days, 'day')} we have watched.`
}

/* Why this card scores as it does: the three strongest plain-English reasons. */
export function reasons(c, m) {
  const out = []
  const n = m.cards.length
  if (c.returns != null) {
    out.push({ w: c.parts.returns, good: c.returns >= m.avgReturn - 0.005, text: c.returnRank === 1 ? `Pays back ${pence(c.returns)} of every £1, the most of any card on sale` : c.returnRank <= 5 ? `Pays back ${pence(c.returns)} of every £1, ${ordinal(c.returnRank)} best of ${n}` : `Pays back ${pence(c.returns)} of every £1 (average is ${pence(m.avgReturn)})` })
  }
  if (c.kind === 'gone') out.push({ w: 2, good: false, text: `All ${c.topTotal} top prizes of ${gbpShort(c.topPrize)} have been claimed` })
  else if (c.claimed === 0 && c.kind === 'jackpot') out.push({ w: 0.6 + c.parts.intact, text: `All ${c.topTotal} top prizes of ${gbpShort(c.topPrize)} still unclaimed${c.onSale ? ` after about ${span(c.onSale)}` : ''}` })
  else if (c.kind === 'jackpot') out.push({ w: c.parts.left, text: `${c.topLeft} of ${c.topTotal} top prizes of ${gbpShort(c.topPrize)} still to be won` })
  else if (c.kind === 'many') out.push({ w: c.parts.left * 0.6, text: `Smaller top prize of ${gbp(c.topPrize)}, with ${Math.round(c.leftShare * 100)}% of them left` })
  if (c.profitOdds) out.push({ w: c.parts.win, text: `${oneInShort(c.profitOdds)} cards wins more than the ${gbp(c.price)} it costs` })
  else if (c.overallOdds) out.push({ w: 0.3, text: `${oneInShort(c.overallOdds)} cards wins a prize of some kind` })
  return out.sort((a, b) => b.w - a.w).slice(0, 3).map((r) => ({ text: r.text, good: r.good !== false }))
}

/* A row of things to browse sideways. */
export function Shelf({ title, sub, action, children }) {
  return (
    <Fade as="section">
      <div className="flex items-end justify-between gap-4 mb-3">
        <div className="min-w-0">
          <h2 className="title">{title}</h2>
          {sub && <p className="caption mt-1 max-w-[60ch]">{sub}</p>}
        </div>
        {action}
      </div>
      <div className="shelf">{children}</div>
    </Fade>
  )
}

/* Album-style tile for one card. `big` is the headline figure, `small` its label. */
export function CardTile({ c, big, small, rank, dim = false, className = 'w-[158px] sm:w-[184px]' }) {
  return (
    <Link to={`/cards/${c.id}`} className={`tile ${className}`} aria-label={`${c.name}, ${gbp(c.price)}`}>
      <div className={`relative ${dim ? 'opacity-45 grayscale' : ''}`}>
        <Art card={c} />
        {rank != null && <span className="absolute -left-1 -bottom-2 num text-[52px] font-extrabold leading-none tracking-tightest text-hi" style={{ textShadow: '0 2px 18px rgb(0 0 0 / 0.9), 0 0 2px rgb(0 0 0 / 0.9)' }}>{rank}</span>}
        <span className="absolute top-2 right-2 h-6 px-2 rounded-full bg-black/70 backdrop-blur text-[12px] font-bold text-hi num flex items-center">{gbp(c.price)}</span>
      </div>
      <p className="mt-3 text-[14.5px] font-semibold leading-tight text-hi truncate">{c.name}</p>
      <p className="mt-1.5 flex items-baseline gap-1.5">
        <span className={`num text-[19px] font-extrabold tracking-tighter ${dim ? 'text-rose' : 'text-hi'}`}>{big}</span>
        <span className="text-[12px] text-low truncate">{small}</span>
      </p>
    </Link>
  )
}

export function Stat({ label, value, hint, tone }) {
  return (
    <div className="well px-4 py-3.5">
      <p className="text-[12px] font-medium text-low">{label}</p>
      <p className={`num mt-1 text-[24px] font-extrabold tracking-tighter leading-none ${tone === 'mint' ? 'text-mint' : tone === 'rose' ? 'text-rose' : 'text-hi'}`}>{value}</p>
      {hint && <p className="mt-1.5 text-[12px] leading-snug text-mid">{hint}</p>}
    </div>
  )
}

export function PageHead({ kicker, title, lead }) {
  return (
    <Fade as="header" className="mb-8 sm:mb-10">
      {kicker && <p className="kicker mb-3">{kicker}</p>}
      <h1 className="display max-w-[16ch]">{title}</h1>
      {lead && <p className="mt-4 max-w-[56ch] text-[16px] sm:text-[17px] leading-relaxed text-mid">{lead}</p>}
    </Fade>
  )
}

export const Empty = ({ children }) => <p className="py-10 text-center text-mid">{children}</p>
