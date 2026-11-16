import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, X, ArrowRight } from 'lucide-react'
import { Art, Glow, ScoreRing, Shelf, CardTile, Fade, PageHead, StatusTag, reasons, EASE } from '../components/Ui'
import { gbp, gbpShort, pence, roi, oneInShort, oneIn, span, dLong } from '../lib/format'

function Figure({ label, value, hint }) {
  return (
    <div className="min-w-0">
      <p className="num text-[22px] sm:text-[26px] font-extrabold tracking-tighter leading-none text-hi">{value}</p>
      <p className="mt-1.5 text-[12px] leading-snug text-mid">{label}</p>
      {hint && <p className="text-[11.5px] leading-snug text-low">{hint}</p>}
    </div>
  )
}

/* The recommendation. */
function Pick({ c, m, budget }) {
  return (
    <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }} className="relative">
      <Glow card={c} />
      <div className="relative grid gap-8 md:gap-12 md:grid-cols-[minmax(0,280px),1fr] items-center p-6 sm:p-10 md:p-12">
        <motion.div initial={{ opacity: 0, y: 24, rotate: -6 }} animate={{ opacity: 1, y: 0, rotate: -3 }} transition={{ duration: 0.8, ease: EASE }} className="mx-auto w-[58%] max-w-[260px] md:w-full md:max-w-none">
          <Link to={`/cards/${c.id}`} aria-label={`${c.name}: full breakdown`}><Art card={c} radius={22} className="shadow-lift" /></Link>
        </motion.div>

        <div className="min-w-0">
          <p className="kicker">{budget === 'any' ? 'Top pick today' : `Top pick at ${gbp(budget)}`}</p>
          <div className="mt-3 flex items-start justify-between gap-4">
            <h2 className="font-extrabold tracking-tightest leading-[1] text-hi" style={{ fontSize: 'clamp(30px, 4.6vw, 52px)' }}>{c.name}</h2>
            <ScoreRing score={c.score} size={84} stroke={7} />
          </div>
          <p className="mt-3 flex flex-wrap items-center gap-2 text-[15px] text-mid">
            <span className="num font-semibold text-hi">{gbp(c.price)}</span><span>·</span>
            <span>top prize <span className="num font-semibold text-hi">{gbp(c.topPrize)}</span></span>
            <StatusTag c={c} />
          </p>

          <ul className="mt-6 space-y-2.5">
            {reasons(c, m).map((r) => (
              <li key={r.text} className="flex items-start gap-3 text-[15px] leading-snug text-hi">
                <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full inline-flex items-center justify-center ${r.good ? 'bg-mint/15 text-mint' : 'bg-rose/15 text-rose'}`}>{r.good ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <X className="w-3.5 h-3.5" strokeWidth={3} />}</span>
                {r.text}
              </li>
            ))}
          </ul>

          <div className="mt-7 grid grid-cols-3 gap-4 max-w-[460px]">
            <Figure value={pence(c.returns)} label="back per £1" hint={`ROI ${roi(c.roi)}`} />
            <Figure value={oneInShort(c.profitOdds ?? c.overallOdds)} label={c.profitOdds ? 'win more than you paid' : 'win any prize'} />
            <Figure value={oneInShort(c.topOdds)} label="win the top prize" hint="at launch" />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={`/cards/${c.id}`} className="btn-mint">Full breakdown <ArrowRight className="w-4 h-4" strokeWidth={2.6} /></Link>
            <Link to="/guide" className="btn-quiet">How we score</Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function DrawRow({ d, max }) {
  const waited = `${d.drawsWaited}${d.capped ? '+' : ''}`
  return (
    <Link to="/draws" className="well block p-5 transition-colors hover:bg-ink-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[16px] font-bold tracking-tighter text-hi truncate">{d.name}</p>
          <p className="caption mt-0.5">{d.lastWin ? `Last won ${dLong(d.lastWin.date)}` : `Not won since before ${dLong(d.draws.at(-1)?.date)}`}</p>
        </div>
        <p className="text-right flex-shrink-0">
          <span className="num text-[30px] font-extrabold tracking-tightest leading-none text-hi">{waited}</span>
          <span className="block text-[11.5px] text-low mt-1">{d.drawsWaited === 1 && !d.capped ? 'draw unwon' : 'draws unwon'}</span>
        </p>
      </div>
      <div className="mt-4 h-1 rounded-full bg-white/[0.08] overflow-hidden">
        <motion.div className={`h-full rounded-full ${d.drawsWaited >= 10 ? 'bg-amber' : 'bg-mint'}`} initial={{ width: 0 }} whileInView={{ width: `${Math.max(3, ((d.waitDays ?? 0) / max) * 100)}%` }} viewport={{ once: true }} transition={{ duration: 1, ease: EASE }} />
      </div>
      <p className="mt-3 text-[12.5px] text-mid num">{d.latest.prizeText ? '£10,000 a month for 30 years' : `${gbpShort(d.latest.jackpot)} top prize`} · {oneIn(d.odds)}</p>
    </Link>
  )
}

export default function Home({ m }) {
  const [budget, setBudget] = useState('any')
  const pick = budget === 'any' ? m.picks[0] : m.pickAt[budget]
  const maxDraw = Math.max(1, ...m.drawRank.map((d) => d.waitDays ?? 0))

  return (
    <div className="space-y-14 sm:space-y-16">
      <div>
        <PageHead kicker={`${m.cards.length} scratchcards · ${m.draws.length} draw games`} title="Which card is worth it today?"
          lead="Every National Lottery scratchcard, ranked on what it pays back, what is still left to win and your real chance of coming out ahead." />

        <Fade>
          <div className="flex items-center gap-2 overflow-x-auto pb-4 -mx-5 px-5 sm:mx-0 sm:px-0" style={{ scrollbarWidth: 'none' }} role="tablist" aria-label="Budget">
            <span className="text-[13px] font-medium text-low mr-1 flex-shrink-0">Budget</span>
            {['any', ...m.prices].map((p) => (
              <button key={p} role="tab" aria-selected={budget === p} onClick={() => setBudget(p)} className={`chip flex-shrink-0 ${budget === p ? 'chip-on' : ''}`}>{p === 'any' ? 'Any' : gbp(p)}</button>
            ))}
          </div>
          <section className="panel rounded-5xl overflow-hidden min-h-[420px]">
            <AnimatePresence mode="wait" initial={false}>
              {pick ? <Pick key={pick.id} c={pick} m={m} budget={budget} /> : <p key="none" className="p-12 text-mid">No card at this price has a top prize left.</p>}
            </AnimatePresence>
          </section>
        </Fade>
      </div>

      <Shelf title="Best return on your money" sub={`What each £1 pays back on average. Every game returns less than it takes: the average card here returns ${pence(m.avgReturn)}.`}
        action={<Link to="/cards?sort=returns" className="chip flex-shrink-0">See all</Link>}>
        {m.bestReturn.slice(0, 10).map((c, i) => <CardTile key={c.id} c={c} rank={i + 1} big={pence(c.returns)} small={`per £1 · ROI ${roi(c.roi)}`} />)}
      </Shelf>

      <Shelf title="Jackpots nobody has won yet" sub="Every top prize still unclaimed, longest on sale first. Time on sale is dated from each game's official procedures, so it is approximate.">
        {m.untouched.length === 0 && <p className="caption py-6">Every card on sale has had at least one top prize claimed.</p>}
        {m.untouched.map((c) => <CardTile key={c.id} c={c} big={`~${c.wait?.days ?? 0}`} small={`days · ${c.topTotal} × ${gbpShort(c.topPrize)}`} />)}
      </Shelf>

      <Shelf title="Best chance of a real win" sub="How often a card wins more than it cost. Most advertised “wins” only hand your stake back."
        action={<Link to="/cards?sort=win" className="chip flex-shrink-0">See all</Link>}>
        {m.bestWin.slice(0, 10).map((c) => <CardTile key={c.id} c={c} big={oneInShort(c.profitOdds)} small="wins a profit" />)}
      </Shelf>

      <Fade as="section">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <h2 className="title">Draws on a drought</h2>
            <p className="caption mt-1 max-w-[60ch]">Draws in a row with no top-prize winner. A long run does not make a win more likely.</p>
          </div>
          <Link to="/draws" className="chip flex-shrink-0">All draws</Link>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {m.drawRank.slice(0, 6).map((d) => <DrawRow key={d.id} d={d} max={maxDraw} />)}
        </div>
      </Fade>

      {m.gone.length > 0 && (
        <Shelf title="Skip these" sub={`${m.gone.length} cards are still on sale with every top prize already claimed. The headline prize on the front cannot be won.`}>
          {m.gone.map((c) => <CardTile key={c.id} c={c} dim big={`0 of ${c.topTotal}`} small={`${gbpShort(c.topPrize)} prizes left`} />)}
        </Shelf>
      )}
    </div>
  )
}
