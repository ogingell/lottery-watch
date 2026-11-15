import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CardTile, PageHead, Empty } from '../components/Ui'
import { gbp, gbpShort, pence, oneInShort, dLong } from '../lib/format'

const SORTS = {
  score:   { label: 'Top rated',          fn: (a, b) => b.eligible - a.eligible || b.score - a.score,            big: (c) => c.score, small: () => 'score' },
  returns: { label: 'Best return',        fn: (a, b) => (b.returns ?? 0) - (a.returns ?? 0),                     big: (c) => pence(c.returns), small: () => 'back per £1' },
  win:     { label: 'Real win chance',    fn: (a, b) => (a.profitOdds ?? 1e9) - (b.profitOdds ?? 1e9),           big: (c) => oneInShort(c.profitOdds), small: () => 'wins a profit' },
  wait:    { label: 'Longest unwon',      fn: (a, b) => waitRank(b) - waitRank(a),                               big: (c) => (c.wait?.basis === 'never' ? `~${c.wait.days}d` : `${c.topLeft}/${c.topTotal}`), small: (c) => (c.wait?.basis === 'never' ? 'no top prize won' : 'top prizes left') },
  left:    { label: 'Most prizes left',   fn: (a, b) => (b.leftShare ?? -1) - (a.leftShare ?? -1) || b.topPrize - a.topPrize, big: (c) => `${Math.round((c.leftShare ?? 0) * 100)}%`, small: () => 'of top prizes left' },
  top:     { label: 'Top prize odds',     fn: (a, b) => (a.topOdds ?? 1e12) - (b.topOdds ?? 1e12),               big: (c) => oneInShort(c.topOdds), small: () => 'for the top prize' },
  prize:   { label: 'Biggest prize',      fn: (a, b) => b.topPrize - a.topPrize,                                  big: (c) => gbpShort(c.topPrize), small: () => 'top prize' },
}
const waitRank = (c) => (c.kind === 'jackpot' ? (c.wait?.basis === 'never' ? 1e6 : 1e3) + (c.wait?.days ?? 0) + (c.leftShare ?? 0) : c.kind === 'many' ? 1 : 0)

export default function Browse({ m }) {
  const [params, setParams] = useSearchParams()
  const sort = SORTS[params.get('sort')] ? params.get('sort') : 'score'
  const [price, setPrice] = useState('all')
  const [hideGone, setHideGone] = useState(false)
  const s = SORTS[sort]

  const shown = useMemo(
    () => m.cards.filter((c) => (price === 'all' || c.price === price) && !(hideGone && c.kind === 'gone')).sort(s.fn),
    [m.cards, price, hideGone, s],
  )

  return (
    <>
      <PageHead kicker={`Prizes as of ${dLong(m.updated)}`} title="All scratchcards" lead="Tap any card for its full breakdown: return, odds at every prize level and what is left to win." />

      <div className="sticky top-0 md:top-[84px] z-30 -mx-5 px-5 sm:-mx-8 sm:px-8 py-3 mb-4 bg-ink/85 backdrop-blur-xl">
        <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {Object.entries(SORTS).map(([key, v]) => (
            <button key={key} onClick={() => setParams(key === 'score' ? {} : { sort: key }, { replace: true })} className={`chip flex-shrink-0 ${sort === key ? 'chip-on' : ''}`}>{v.label}</button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {['all', ...m.prices].map((p) => (
            <button key={p} onClick={() => setPrice(p)} className={`chip !h-8 !px-3.5 !text-[13px] flex-shrink-0 ${price === p ? '!bg-white/20 !text-hi' : ''}`}>{p === 'all' ? 'Any price' : gbp(p)}</button>
          ))}
          <button onClick={() => setHideGone((v) => !v)} aria-pressed={hideGone} className={`chip !h-8 !px-3.5 !text-[13px] flex-shrink-0 ${hideGone ? '!bg-white/20 !text-hi' : ''}`}>Hide top prize gone</button>
        </div>
      </div>

      {shown.length === 0 && <Empty>No cards match those filters.</Empty>}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-1 gap-y-4 -mx-3">
        {shown.map((c) => <CardTile key={c.id} c={c} className="w-full" dim={c.kind === 'gone'} big={s.big(c)} small={c.kind === 'gone' && sort === 'score' ? 'top prize gone' : s.small(c)} />)}
      </div>
    </>
  )
}
