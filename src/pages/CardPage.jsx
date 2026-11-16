import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowUpRight, Check, X } from 'lucide-react'
import { Art, Glow, ScoreRing, Stat, Fade, Pips, StatusTag, reasons, waitLine, CardTile, EASE } from '../components/Ui'
import { gbp, gbpShort, pence, roi, oneIn, oneInShort, n0, pct, dLong, span } from '../lib/format'

const GREEN = '#17a877'
const BLUE = '#5b8def'

/* Where each £1 goes: smaller prizes, the top prize, and what is not returned. */
function Split({ c }) {
  const small = c.payoutNoTop ?? c.payout
  const top = c.payoutNoTop != null ? c.payout - c.payoutNoTop : 0
  const kept = 1 - c.payout
  const gone = c.kind === 'gone'
  const parts = [
    { key: 'small', label: 'Smaller prizes', value: small, color: GREEN },
    { key: 'top', label: gone ? 'Top prizes (all claimed)' : 'Top prizes', value: top, color: BLUE, struck: gone },
    { key: 'kept', label: 'Not paid back', value: kept, color: 'rgb(255 255 255 / 0.14)' },
  ].filter((p) => p.value > 0.0005)
  return (
    <div>
      <div className="flex h-4 gap-[2px]" role="img" aria-label={parts.map((p) => `${p.label} ${pence(p.value)}`).join(', ')}>
        {parts.map((p, i) => (
          <motion.div key={p.key} title={`${p.label}: ${pence(p.value)}`} initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.9, delay: i * 0.12, ease: EASE }}
            className={`h-full origin-left ${i === 0 ? 'rounded-l-full' : ''} ${i === parts.length - 1 ? 'rounded-r-full' : ''}`}
            style={{ width: `${p.value * 100}%`, background: p.struck ? `repeating-linear-gradient(135deg, ${p.color}55 0 4px, transparent 4px 8px)` : p.color }} />
        ))}
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3">
        {parts.map((p) => (
          <div key={p.key}>
            <dt className="flex items-center gap-2 text-[12.5px] text-mid"><span className="w-2.5 h-2.5 rounded-[3px] flex-shrink-0" style={{ background: p.color }} />{p.label}</dt>
            <dd className={`num mt-1 text-[22px] font-extrabold tracking-tighter ${p.struck ? 'text-low line-through' : 'text-hi'}`}>{pence(p.value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/* Every prize level: how many were printed and how rare each is. */
function Ladder({ c }) {
  const max = Math.log10(Math.max(...c.ladder.map((t) => t.count)) + 1)
  return (
    <table className="w-full num text-[14px]">
      <thead>
        <tr className="text-left text-[12px] font-medium text-low">
          <th className="pb-2 font-medium">Prize</th>
          <th className="pb-2 font-medium text-right">Printed</th>
          <th className="pb-2 pl-4 font-medium hidden sm:table-cell w-[38%]">How common</th>
          <th className="pb-2 font-medium text-right">Chance per card</th>
        </tr>
      </thead>
      <tbody>
        {[...c.ladder].reverse().map((t) => {
          const profit = t.prize > c.price
          return (
            <tr key={t.prize} className="hair">
              <td className={`py-2.5 font-bold ${profit ? 'text-hi' : 'text-mid'}`}>{gbp(t.prize)}{!profit && <span className="ml-2 font-medium text-[11.5px] text-low">{t.prize === c.price ? 'stake back' : 'less than stake'}</span>}</td>
              <td className="py-2.5 text-right text-mid">{n0(t.count)}</td>
              <td className="py-2.5 pl-4 hidden sm:table-cell"><span className="block h-1.5 rounded-full" style={{ width: `${Math.max(2, (Math.log10(t.count + 1) / max) * 100)}%`, background: profit ? GREEN : 'rgb(255 255 255 / 0.18)' }} /></td>
              <td className="py-2.5 text-right font-semibold text-hi">{oneInShort(t.odds)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

const Block = ({ title, sub, children }) => (
  <Fade as="section" className="panel p-6 sm:p-8">
    <h2 className="title">{title}</h2>
    {sub && <p className="caption mt-1.5 max-w-[62ch]">{sub}</p>}
    <div className="mt-6">{children}</div>
  </Fade>
)

export default function CardPage({ m }) {
  const { id } = useParams()
  const c = m.byId[id]
  if (!c) return <div className="py-24 text-center"><p className="title">That card is no longer on sale.</p><Link to="/cards" className="btn-quiet mt-6">All scratchcards</Link></div>

  const gone = c.kind === 'gone'
  const ten = c.price * 10
  const alt = m.picks.filter((x) => x.price === c.price && x.id !== c.id).slice(0, 6)
  const better = gone ? m.pickAt[c.price] : null

  return (
    <div className="space-y-5">
      <section className="panel rounded-5xl overflow-hidden relative">
        <Glow card={c} strength={gone ? 0.2 : 0.55} />
        <div className="relative p-6 sm:p-10 md:p-12">
          <Link to="/cards" className="chip !bg-black/40 backdrop-blur"><ArrowLeft className="w-4 h-4" /> All cards</Link>
          <div className="mt-8 grid gap-8 md:gap-12 md:grid-cols-[minmax(0,260px),1fr] items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: EASE }} className={`mx-auto w-[52%] max-w-[240px] md:w-full md:max-w-none ${gone ? 'grayscale opacity-70' : ''}`}>
              <Art card={c} radius={22} className="shadow-lift" />
            </motion.div>
            <div className="min-w-0">
              <p className="kicker">Game {c.gameNo}{c.launched ? ` · on sale since about ${dLong(c.launched)}` : ''}</p>
              <div className="mt-3 flex items-start justify-between gap-4">
                <h1 className="font-extrabold tracking-tightest leading-[1] text-hi" style={{ fontSize: 'clamp(32px, 5vw, 58px)' }}>{c.name}</h1>
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
              {better && (
                <Link to={`/cards/${better.id}`} className="mt-7 btn-mint">Better at {gbp(c.price)}: {better.name}</Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <Fade className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <Stat label="Back per £1 spent" value={pence(c.returns)} tone={c.returnRank <= 5 ? 'mint' : undefined} hint={c.returns != null ? `ROI ${roi(c.roi)} · ranks ${c.returnRank} of ${m.cards.length}` : 'not read yet'} />
        <Stat label="Average cost of a card" value={c.avgLoss != null ? gbp(Math.round(c.avgLoss * 100) / 100) : '—'} hint={`${gbp(c.price)} price, less average winnings`} />
        <Stat label="Wins any prize" value={oneInShort(c.overallOdds)} hint={c.breakEvenShare != null ? `${pct(c.breakEvenShare)} of wins only return the stake` : 'official overall odds'} />
        <Stat label="Wins more than it cost" value={oneInShort(c.profitOdds)} hint="a prize bigger than the price" />
        <Stat label="Wins £100 or more" value={oneInShort(c.bigOdds)} hint="at launch" />
        <Stat label={`Wins the ${gbpShort(c.topPrize)} top prize`} value={gone ? 'Gone' : oneInShort(c.topOdds)} tone={gone ? 'rose' : undefined} hint={gone ? 'every top prize has been claimed' : `at launch · ${n0(c.printRun)} cards printed`} />
      </Fade>

      {c.payout != null && (
        <Block title="Where each £1 goes" sub={gone ? `At launch ${pence(c.payout)} of every £1 came back as prizes. With the top prizes claimed, about ${pence(c.returns)} is left to win.` : `${pence(c.payout)} of every £1 spent on this game comes back as prizes. The rest goes to good causes, duty, retailers and the operator.`}>
          <Split c={c} />
        </Block>
      )}

      {c.returns == null && (
        <Fade className="well p-6 text-[14.5px] leading-relaxed text-mid"><b className="text-hi">New on sale.</b> This card has just appeared on the National Lottery's list. Its odds, return and prize table are read from the official procedures twice a day and will fill in at the next update.</Fade>
      )}

      {c.returns != null && <Block title={`If you bought ten (${gbp(ten)})`} sub="Averages over the whole print run. Any ten cards will differ, usually for the worse: the average includes the rare big wins.">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="You'd get back, on average" value={gbp(Math.round(ten * c.returns * 100) / 100)} />
          <Stat label="So it costs you" value={gbp(Math.round(ten * (1 - c.returns) * 100) / 100)} />
          <Stat label="Cards that win anything" value={c.overallOdds ? `~${(10 / c.overallOdds).toFixed(1)}` : '—'} hint="of the ten" />
          <Stat label="Cards that win a profit" value={c.profitOdds ? `~${(10 / c.profitOdds).toFixed(1)}` : '—'} hint="of the ten" />
        </div>
      </Block>}

      <Block title="Top prizes" sub={waitLine(c, m.trackingSince)}>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <p><span className="num text-[44px] font-extrabold tracking-tightest leading-none text-hi">{n0(c.topLeft)}</span><span className="num text-[20px] font-bold text-low"> / {n0(c.topTotal)}</span><span className="block caption mt-1">left to win</span></p>
          <Pips left={c.topLeft} total={c.topTotal} />
          {c.pace && c.kind !== 'many' && <p className="caption max-w-[30ch]">About one claimed every <b className="text-hi">{span(Math.round(c.pace))}</b> since launch.</p>}
        </div>
        {c.reprinted && <p className="caption mt-5">This game has been reprinted: it now lists {n0(c.topTotal)} top prizes against {n0(c.topCountAtLaunch)} in its first print run. The odds per card are designed to stay the same.</p>}
      </Block>

      {c.ladder && (
        <Block title="Every prize, and how rare it is" sub="From the official game procedures, as printed at launch. Lower prizes are claimed in step with sales; nobody publishes how many cards remain.">
          <Ladder c={c} />
        </Block>
      )}

      {c.proceduresUrl && (
        <a href={c.proceduresUrl} target="_blank" rel="noreferrer noopener" className="btn-quiet">Official game procedures (PDF) <ArrowUpRight className="w-4 h-4" /></a>
      )}

      {alt.length > 0 && (
        <Fade as="section" className="pt-8">
          <h2 className="title mb-3">Top rated at {gbp(c.price)}</h2>
          <div className="shelf">{alt.map((x) => <CardTile key={x.id} c={x} big={x.score} small={`score · ${pence(x.returns)} per £1`} />)}</div>
        </Fade>
      )}
    </div>
  )
}
