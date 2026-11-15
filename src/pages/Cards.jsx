import { useMemo, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { PageHeader, Segmented, StatusChip, Thumb, Pips, Reveal, Empty, waitLine } from '../components/Ui'
import { gbp, gbpShort, oneIn, pct, n0, dLong } from '../lib/format'

const SORTS = [
  { value: 'wait',   label: 'Longest without a top-prize winner', fn: (a, b) => rank(b) - rank(a) },
  { value: 'left',   label: 'Most top prizes left (share)',       fn: (a, b) => (b.leftShare ?? -1) - (a.leftShare ?? -1) || b.topPrize - a.topPrize },
  { value: 'payout', label: 'Highest payout rate',                fn: (a, b) => (b.payout ?? 0) - (a.payout ?? 0) },
  { value: 'odds',   label: 'Best odds of any prize',             fn: (a, b) => (a.overallOdds ?? 1e9) - (b.overallOdds ?? 1e9) },
  { value: 'top',    label: 'Best odds of the top prize',         fn: (a, b) => (a.topOdds ?? 1e12) - (b.topOdds ?? 1e12) },
  { value: 'prize',  label: 'Biggest top prize',                  fn: (a, b) => b.topPrize - a.topPrize },
  { value: 'price',  label: 'Cheapest',                           fn: (a, b) => a.price - b.price || b.topPrize - a.topPrize },
]
// Untouched cards first (by time on sale), then cards being watched, then the rest
const rank = (c) => (c.kind === 'jackpot' ? (c.wait?.basis === 'never' ? 1e6 : 1e3) + (c.wait?.days ?? 0) : c.kind === 'many' ? 1 : 0)

function Fact({ label, value, hint }) {
  return (
    <div>
      <dt className="text-[11.5px] font-medium text-surface-400">{label}</dt>
      <dd className="text-[15px] font-semibold tabular-nums text-surface-50">{value}</dd>
      {hint && <dd className="text-[11.5px] leading-snug text-surface-400">{hint}</dd>}
    </div>
  )
}

function CardTile({ c, trackingSince }) {
  const status = c.kind === 'gone' ? { tone: 'red', text: 'Top prize gone' }
    : c.claimed === 0 ? { tone: 'green', text: 'All top prizes left' }
    : { tone: 'cyan', text: `${n0(c.topLeft)} of ${n0(c.topTotal)} left` }
  return (
    <Reveal as="article" className={`hud-panel p-4 sm:p-5 flex flex-col ${c.kind === 'gone' ? 'opacity-80' : ''}`}>
      <div className="flex items-start gap-3.5">
        <Thumb card={c} size={60} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[16.5px] font-semibold leading-snug text-surface-50">{c.name}</h3>
          <p className="text-[12.5px] text-surface-400 tabular-nums">Game {c.gameNo ?? '—'}{c.launched ? ` · procedures dated ${dLong(c.launched)}` : ''}</p>
          <p className="mt-1.5"><StatusChip tone={status.tone}>{status.text}</StatusChip></p>
        </div>
        <p className="flex-shrink-0 text-right">
          <span className="readout text-[24px] text-surface-50">{gbp(c.price)}</span>
          <span className="block text-[11.5px] text-surface-400 -mt-0.5">per card</span>
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[13px] text-surface-300">Top prize <b className="text-surface-50 font-semibold">{gbp(c.topPrize)}</b></p>
        <Pips left={c.topLeft} total={c.topTotal} />
      </div>
      <p className="mt-1 text-[12.5px] leading-snug text-surface-400">{waitLine(c, trackingSince)}</p>

      <dl className="mt-4 pt-4 hairline-t grid grid-cols-2 gap-x-4 gap-y-3">
        <Fact label="Any prize" value={oneIn(c.overallOdds)} hint="most wins just return the stake" />
        <Fact label="Top prize, at launch" value={oneIn(c.topOdds)} hint={c.printRun ? `${n0(c.printRun)} cards printed` : null} />
        <Fact label="Paid back in prizes" value={pct(c.payout, 1)} hint="of everything spent on this game" />
        <Fact label="Average cost of a card" value={c.avgLoss != null ? gbp(Math.round(c.avgLoss * 100) / 100) : '—'} hint="price minus average winnings" />
      </dl>

      {c.proceduresUrl && (
        <a href={c.proceduresUrl} target="_blank" rel="noreferrer noopener" className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-coral">
          Official game procedures <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}
    </Reveal>
  )
}

export default function Cards({ m }) {
  const prices = useMemo(() => [...new Set(m.cards.map((c) => c.price))].sort((a, b) => a - b), [m.cards])
  const [price, setPrice] = useState('all')
  const [sort, setSort] = useState('wait')
  const [hideGone, setHideGone] = useState(false)

  const shown = useMemo(() => {
    const fn = SORTS.find((s) => s.value === sort).fn
    return m.cards.filter((c) => (price === 'all' || c.price === price) && !(hideGone && c.kind === 'gone')).sort(fn)
  }, [m.cards, price, sort, hideGone])

  return (
    <>
      <PageHeader eyebrow={`${m.cards.length} on sale · prizes as of ${dLong(m.updated)}`} title="Scratchcards"
        lead="Every scratchcard on sale with its price, top prizes left, odds and payout rate, so the cards can be compared like for like." />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 mb-5">
        <Segmented value={price} onChange={setPrice} options={[{ value: 'all', label: 'All' }, ...prices.map((p) => ({ value: p, label: gbp(p) }))]} />
        <label className="flex items-center gap-2 text-[13px] text-surface-300">
          <span className="sr-only sm:not-sr-only">Sort by</span>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input-field !py-2 !px-3 !text-[13.5px] !text-left !font-medium !w-auto max-w-[78vw]">
            {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-[13.5px] text-surface-200 cursor-pointer select-none">
          <input type="checkbox" checked={hideGone} onChange={(e) => setHideGone(e.target.checked)} className="w-4 h-4 accent-[rgb(var(--coral))]" />
          Hide cards with no top prize left
        </label>
      </div>

      {shown.length === 0 && <Empty>No cards match those filters.</Empty>}
      <div className="grid gap-4 md:grid-cols-2">
        {shown.map((c) => <CardTile key={c.id} c={c} trackingSince={m.trackingSince} />)}
      </div>
    </>
  )
}
