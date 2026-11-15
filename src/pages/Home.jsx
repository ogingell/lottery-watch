import { Link } from 'react-router-dom'
import { Hourglass, Dices, Eye, Ban } from 'lucide-react'
import { Card, PageHeader, Stat, Thumb, Pips, BarRow, Note, Empty, waitLine } from '../components/Ui'
import { gbp, gbpShort, oneIn, span, dLong, plural } from '../lib/format'

const drawWait = (d) => `${d.drawsWaited}${d.capped ? '+' : ''}`

export default function Home({ m }) {
  const maxUntouched = Math.max(1, ...m.untouched.map((c) => c.wait?.days ?? 0))
  const maxDraw = Math.max(1, ...m.drawRank.map((d) => d.waitDays ?? 0))
  const topDraw = m.drawRank[0]
  const longest = m.untouched[0]

  return (
    <>
      <PageHeader
        eyebrow="National Lottery · top prizes"
        title="Longest without a winner"
        lead="Which scratchcards still have every top prize unclaimed, which draws keep going unwon, and what each one costs and pays. Figures come from the National Lottery's own published data."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Stat label="Scratchcards on sale" value={m.cards.length} sub={`${m.untouched.length + m.watching.length} with a big top prize still to win`} />
        <Stat label="Longest untouched card" value={longest ? `~${span(longest.wait.days)}` : '—'} sub={longest ? `${longest.name}: no top prize claimed yet` : 'Every card has had a winner'} />
        <Stat label="Top prize already gone" value={m.gone.length} tone={m.gone.length ? 'warn' : undefined} sub="cards still on sale with no top prize left" />
        <Stat label="Longest draw drought" value={topDraw ? `${drawWait(topDraw)} draws` : '—'} sub={topDraw ? `${topDraw.name} top prize` : ''} />
      </div>

      <div className="space-y-5">
        <Card title="No top prize claimed yet" icon={Hourglass}>
          <p className="text-[13.5px] leading-relaxed text-surface-300 mb-1">
            Scratchcards where every top prize is still out there, longest on sale first. Time on sale is counted from the date on each game's official procedures, so treat it as approximate.
          </p>
          {m.untouched.length === 0 && <Empty>Every card on sale has had at least one top prize claimed.</Empty>}
          {m.untouched.map((c, i) => (
            <BarRow key={c.id} first={i === 0} left={<Thumb card={c} />}
              title={c.name}
              sub={<>{gbp(c.price)} · top prize {gbpShort(c.topPrize)} · all {c.topTotal} left{c.topOdds ? ` · ${oneIn(c.topOdds)} per card` : ''}</>}
              value={`~${c.wait.days}`} unit="days on sale" share={c.wait.days / maxUntouched} />
          ))}
        </Card>

        <Card title="Draws since the top prize was won" icon={Dices} right={<Link to="/draws" className="text-[13px] font-semibold text-coral">All draw games ›</Link>}>
          {m.drawRank.length === 0 && <Empty>Draw results are not available right now.</Empty>}
          {m.drawRank.map((d, i) => (
            <BarRow key={d.id} first={i === 0}
              title={d.name}
              sub={<>
                {d.lastWin ? `Last won ${dLong(d.lastWin.date)}` : `Not won in the last ${d.lookback} draws (since before ${dLong(d.draws.at(-1)?.date)})`}
                {' · '}{d.latest.prizeText ?? gbpShort(d.latest.jackpot)} top prize · {oneIn(d.odds)}
              </>}
              value={drawWait(d)} unit={d.drawsWaited === 1 && !d.capped ? 'draw' : 'draws'} share={(d.waitDays ?? 0) / maxDraw} />
          ))}
        </Card>

        <Card title="Won before, top prizes still left" icon={Eye}>
          <p className="text-[13.5px] leading-relaxed text-surface-300 mb-1">
            The National Lottery publishes how many top prizes are left, not when each was claimed. This app records the count every day{m.trackingSince ? ` (since ${dLong(m.trackingSince)})` : ''}, so the time since the last claim fills in as it watches.
          </p>
          {m.watching.map((c, i) => (
            <BarRow key={c.id} first={i === 0} left={<Thumb card={c} />}
              title={c.name}
              sub={<>
                <span className="inline-flex items-center gap-2 mr-1 align-middle"><Pips left={c.topLeft} total={c.topTotal} /></span>
                {gbp(c.price)} · top prize {gbpShort(c.topPrize)}
                {c.wait?.basis === 'seen' || c.wait?.days > 0 ? ` · ${waitLine(c, m.trackingSince)}` : ''}
                {c.pace ? ` · about one claimed every ${span(Math.round(c.pace))} so far` : ''}
              </>}
              value={`${c.topLeft}/${c.topTotal}`} unit="left" />
          ))}
        </Card>

        {m.gone.length > 0 && (
          <Card title="Still on sale, top prize gone" icon={Ban} led="amber">
            <p className="text-[13.5px] leading-relaxed text-surface-300 mb-1">
              Every top prize on these {plural(m.gone.length, 'card')} has been claimed. Shops may keep selling packs they have already opened, so you can still buy one, but the headline prize cannot be won.
            </p>
            {m.gone.map((c, i) => (
              <BarRow key={c.id} first={i === 0} left={<Thumb card={c} />}
                title={c.name}
                sub={<>{gbp(c.price)} · advertised top prize {gbpShort(c.topPrize)} · all {c.topTotal} claimed</>}
                value={`0/${c.topTotal}`} unit="left" />
            ))}
          </Card>
        )}

        <Note>
          <b>A long wait is not a tip.</b> In a draw game every draw is independent: a prize that has gone unwon for months is no more likely to be won tonight. Scratchcards are different in one respect only: the prizes are fixed when the cards are printed, so an unclaimed top prize really is still in circulation (or in an unsold pack). Nobody publishes how many cards are left, so the true odds today cannot be known. <Link to="/about" className="font-semibold text-coral">How the numbers work ›</Link>
        </Note>
      </div>
    </>
  )
}
