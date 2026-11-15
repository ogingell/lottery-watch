import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageHead, Stat, Fade } from '../components/Ui'
import { gbp, gbpShort, oneIn, dLong, dShort, span, pence } from '../lib/format'

const MAIN = '#17a877'
const SOFT = '#17a87755'
const tick = { fontSize: 11, fontFamily: 'Inter, system-ui, sans-serif' }

/* Top prize on offer at each recent draw. A sharp drop means it was won. */
function JackpotChart({ d }) {
  const data = d.series.filter((x) => x.jackpot != null)
  const tip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const x = payload[0].payload
    return (
      <div className="glass rounded-2xl px-3.5 py-2.5">
        <p className="text-[12px] text-mid">{dLong(x.date)}</p>
        <p className="num text-[17px] font-extrabold tracking-tighter text-hi">{gbp(x.jackpot)}</p>
        {x.winners != null && <p className={`text-[12px] font-semibold ${x.winners > 0 ? 'text-mint' : 'text-mid'}`}>{x.winners > 0 ? `Won by ${x.winners}` : 'Not won'}</p>}
      </div>
    )
  }
  return (
    <div className="mt-6">
      <p className="caption mb-3">Top prize at each of the last {data.length} draws. Paler bars are draws since it was last won.</p>
      <div className="h-[180px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: 0 }} barCategoryGap="20%">
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickFormatter={dShort} tick={tick} interval="preserveStartEnd" minTickGap={46} tickMargin={8} />
            <YAxis tickFormatter={gbpShort} tick={tick} width={54} tickCount={4} />
            <Tooltip content={tip} cursor={{ fill: 'rgb(255 255 255 / 0.06)', radius: 6 }} wrapperStyle={{ outline: 'none', zIndex: 20 }} />
            <Bar dataKey="jackpot" radius={[4, 4, 0, 0]} maxBarSize={16} isAnimationActive={false}>
              {data.map((x) => <Cell key={x.no} fill={x.winners === 0 ? SOFT : MAIN} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function Game({ d }) {
  const waited = `${d.drawsWaited}${d.capped ? '+' : ''}`
  const long = d.drawsWaited >= 10
  return (
    <Fade as="section" className="panel p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="title">{d.name}</h2>
          <p className="caption mt-1">{d.top} · {d.matrix}</p>
        </div>
        <p className="text-right flex-shrink-0">
          <span className={`num text-[44px] font-extrabold tracking-tightest leading-none ${long ? 'text-amber' : 'text-hi'}`}>{waited}</span>
          <span className="block text-[12px] text-low mt-1">{d.drawsWaited === 1 && !d.capped ? 'draw unwon' : 'draws unwon'}</span>
        </p>
      </div>
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Top prize last won" value={d.lastWin ? dShort(d.lastWin.date) : `${span(d.waitDays)}+`}
          hint={d.lastWin ? `${span(d.waitDays)} ago${d.lastWin.winners > 1 ? ` · ${d.lastWin.winners} winners` : ''}${d.lastWin.jackpot ? ` · ${gbpShort(d.lastWin.jackpot)}` : ''}` : `no winner in the last ${d.lookback} draws`} />
        <Stat label="Top prize, latest draw" value={d.latest.prizeText ? '£10k a month' : gbpShort(d.latest.jackpot)} hint={d.latest.prizeText ? 'for 30 years' : dLong(d.latest.date)} />
        <Stat label="Chance per line" value={oneIn(d.odds).replace(' million', 'm')} hint="the same at every draw" />
        <Stat label="Price per line" value={d.price != null ? gbp(d.price) : 'See site'}
          hint={d.topValue != null && d.price != null ? `the top prize is worth about ${d.topValue >= 1 ? gbp(Math.round(d.topValue * 100) / 100) : pence(d.topValue)} of that` : d.price != null ? 'standard price' : 'not in the published feed'} />
      </div>
      {!d.fixed && <JackpotChart d={d} />}
    </Fade>
  )
}

export default function Draws({ m }) {
  return (
    <>
      <PageHead kicker="Draw games" title="Draws without a winner" lead="How many draws in a row each top prize has gone unwon, when it last fell, and what a line costs against the odds." />
      <div className="space-y-5">
        {m.drawRank.map((d) => <Game key={d.id} d={d} />)}
        {m.drawRank.length === 0 && <p className="panel p-8 text-mid">Draw results could not be loaded just now. Try again in a moment.</p>}
        <Fade className="well p-6 text-[14.5px] leading-relaxed text-mid">
          <b className="text-hi">The odds never change.</b> A line has exactly the same chance at every draw, however long the top prize has gone unwon. What a run of unwon draws does change is the size of a rolling jackpot, and bigger jackpots bring more players, which makes sharing a win more likely. “Worth about” is the top prize multiplied by the chance of winning it: the average value of that prize alone in one line, before any sharing.
        </Fade>
      </div>
    </>
  )
}
