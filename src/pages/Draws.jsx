import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Dices } from 'lucide-react'
import { Card, ChartTooltip, PageHeader, StatusChip, Note } from '../components/Ui'
import { useChartColors } from '../lib/theme'
import { axisTick, cursorBar, tooltipWrapper } from '../lib/chartStyle'
import { gbp, gbpShort, oneIn, dLong, dShort, span } from '../lib/format'

function Fact({ label, value, hint }) {
  return (
    <div className="tile px-3.5 py-3">
      <p className="text-[12px] font-medium text-surface-400">{label}</p>
      <p className="readout text-[20px] leading-tight text-surface-50 mt-0.5">{value}</p>
      {hint && <p className="text-[12px] leading-snug text-surface-400 mt-0.5">{hint}</p>}
    </div>
  )
}

/* Top prize on offer at each recent draw. A sharp drop means it was won (or shared out). */
function JackpotChart({ d }) {
  const c = useChartColors()
  const data = d.series.filter((x) => x.jackpot != null)
  const tip = ({ active, payload }) => {
    if (!active || !payload?.length) return null
    const x = payload[0].payload
    return <ChartTooltip title={dLong(x.date)} rows={[{ label: 'Top prize', value: gbp(x.jackpot), color: c.main }]}
      footer={x.winners == null ? null : { text: x.winners > 0 ? `Won by ${x.winners}` : 'Not won', tone: x.winners > 0 ? 'up' : 'neutral' }} />
  }
  return (
    <div className="mt-5">
      <p className="text-[12.5px] font-medium text-surface-400 mb-2">Top prize at each of the last {data.length} draws. Paler bars: draws since it was last won.</p>
      <div className="h-[190px] -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: 0 }} barCategoryGap="18%">
            <CartesianGrid vertical={false} />
            <XAxis dataKey="date" tickFormatter={dShort} tick={axisTick} interval="preserveStartEnd" minTickGap={46} tickMargin={6} />
            <YAxis tickFormatter={gbpShort} tick={axisTick} width={54} tickCount={4} />
            <Tooltip content={tip} cursor={cursorBar} wrapperStyle={tooltipWrapper} />
            <Bar dataKey="jackpot" radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={false}>
              {data.map((x) => <Cell key={x.no} fill={x.winners === 0 ? c.soft : c.main} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function Game({ d }) {
  const waited = `${d.drawsWaited}${d.capped ? '+' : ''}`
  return (
    <Card title={d.name} icon={Dices}
      right={<StatusChip tone={d.drawsWaited >= 10 ? 'amber' : 'cyan'}>{waited} {d.drawsWaited === 1 && !d.capped ? 'draw' : 'draws'} unwon</StatusChip>}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Fact label="Top prize last won" value={d.lastWin ? dShort(d.lastWin.date) : `Over ${span(d.waitDays)} ago`}
          hint={d.lastWin ? `${span(d.waitDays)} ago${d.lastWin.winners > 1 ? ` · ${d.lastWin.winners} winners` : ''}${d.lastWin.jackpot ? ` · ${gbpShort(d.lastWin.jackpot)}` : ''}` : `no winner in the last ${d.lookback} draws`} />
        <Fact label="Top prize, latest draw" value={d.latest.prizeText ? '£10k a month' : gbpShort(d.latest.jackpot)} hint={d.latest.prizeText ? 'for 30 years' : dLong(d.latest.date)} />
        <Fact label="Odds of the top prize" value={oneIn(d.odds)} hint={`${d.top} · ${d.matrix}`} />
        <Fact label="Price per line" value={d.price != null ? gbp(d.price) : 'See site'} hint={d.price != null ? 'standard price' : 'not in the published feed'} />
      </div>
      {!d.fixed && <JackpotChart d={d} />}
    </Card>
  )
}

export default function Draws({ m }) {
  return (
    <>
      <PageHeader eyebrow="Draw games" title="Draws without a winner"
        lead="How many draws in a row each game's top prize has gone unwon, when it was last won, and what a line costs against the odds." />
      <div className="space-y-5">
        {m.drawRank.map((d) => <Game key={d.id} d={d} />)}
        {m.drawRank.length === 0 && <Note>Draw results could not be loaded just now. Try the refresh button.</Note>}
        <Note>
          <b>The odds never change.</b> A line has exactly the same chance at every draw, however long the top prize has gone unwon. What a run of unwon draws does change is the size of a rolling jackpot (Lotto, EuroMillions, Powerball), and bigger jackpots draw more players, which makes sharing a win more likely.
        </Note>
      </div>
    </>
  )
}
