import { PageHead, Fade } from '../components/Ui'
import { dLong, pence } from '../lib/format'

const Block = ({ title, children }) => (
  <Fade as="section" className="panel p-6 sm:p-8">
    <h2 className="title mb-5">{title}</h2>
    {children}
  </Fade>
)
const P = ({ children }) => <p className="text-[15px] leading-relaxed text-mid [&+p]:mt-3 [&_b]:text-hi [&_b]:font-semibold">{children}</p>

const WEIGHTS = [
  { pct: 45, name: 'Return', text: 'What £1 pays back on average. If every top prize has been claimed, the top prize\'s share of the prize money is taken out.' },
  { pct: 25, name: 'Left to win', text: 'The share of top prizes still unclaimed.' },
  { pct: 20, name: 'Real wins', text: 'How often a card wins more than it cost, not just its stake back.' },
  { pct: 10, name: 'Untouched', text: 'A bonus when every top prize is intact after months on sale.' },
]
const TERMS = [
  ['Back per £1', 'The share of everything spent on a game that is returned as prizes, from its official procedures. 68p back means the average £5 card returns £3.40. ROI is the same figure as a loss: 68p back is an ROI of −32%.'],
  ['Wins any prize', 'The official overall odds. Most of these wins are the smallest prizes, often exactly the price of the card.'],
  ['Wins more than it cost', 'Counted from the full prize table: cards printed, divided by prizes larger than the price.'],
  ['Top prize odds', 'Cards printed divided by top prizes, at launch. It moves as cards sell and prizes are claimed, and the number of unsold cards is never published, so today\'s true figure cannot be known.'],
  ['Top prizes left', 'Published by the National Lottery for every card. A card with none left can stay on sale while shops sell packs they have already opened.'],
  ['Time without a winner', 'For a card with every top prize left: time since the date on its procedures, close to when it went on sale. For other cards claim dates are not published, so this app records the counts daily and reports the gap since it last saw one fall.'],
]

export default function Guide({ m, source }) {
  return (
    <>
      <PageHead kicker="Guide" title="How the scores work" lead="One number per card, built only from figures the National Lottery publishes. Here is exactly what goes into it, and what it cannot tell you." />
      <div className="space-y-5">
        <Block title="The score">
          <div className="flex h-3 gap-[2px] rounded-full overflow-hidden" aria-hidden="true">
            {WEIGHTS.map((w, i) => <span key={w.name} style={{ width: `${w.pct}%`, background: `rgb(62 232 173 / ${1 - i * 0.24})` }} />)}
          </div>
          <dl className="mt-6 grid gap-5 sm:grid-cols-2">
            {WEIGHTS.map((w) => (
              <div key={w.name} className="flex gap-4">
                <dt className="num w-14 flex-shrink-0 text-[26px] font-extrabold tracking-tighter leading-none text-hi">{w.pct}%</dt>
                <dd className="text-[14.5px] leading-snug text-mid"><b className="block text-hi font-semibold mb-0.5">{w.name}</b>{w.text}</dd>
              </div>
            ))}
          </dl>
          <p className="caption mt-6">Each part is scaled between the worst and the best card currently on sale, so a score compares cards with each other. It is not a chance of winning. Cards with no top prize left are scored but never recommended.</p>
        </Block>

        <Block title="What the figures mean">
          <dl className="divide-y divide-white/[0.07]">
            {TERMS.map(([term, text]) => (
              <div key={term} className="py-4 first:pt-0 last:pb-0 grid gap-1 sm:grid-cols-[200px,1fr] sm:gap-6">
                <dt className="text-[15px] font-semibold text-hi">{term}</dt>
                <dd className="text-[14.5px] leading-relaxed text-mid">{text}</dd>
              </div>
            ))}
          </dl>
        </Block>

        <Block title="What it cannot tell you">
          <P><b>No card is a good investment.</b> The best card on sale returns about {pence(m.bestReturn[0]?.returns)} of every £1 and the average returns {pence(m.avgReturn)}. The top pick is the least bad way to spend the money, nothing more.</P>
          <P><b>A long wait is not a tip.</b> In a draw game every draw is independent. On a scratchcard the prizes are fixed at printing, so an unclaimed top prize really is still out there, in an unsold card or an unchecked one. That nudges the odds in your favour, but without sales figures nobody can say by how much.</P>
          <P><b>Averages hide the spread.</b> Much of each game's return sits in a handful of large prizes. Most buyers get back well under the average.</P>
        </Block>

        <Block title="Where the data comes from">
          <P>Prize counts, prices and draw results come from the National Lottery's public website feeds. Returns, odds and prize tables come from each game's official Game Procedures. You are looking at {source === 'live' ? <b>the live feed</b> : <b>a saved copy from the last daily update</b>}; scratchcard prize counts were last published on {dLong(m.updated)}.</P>
          <P>Daily tracking of claims began on {dLong(m.trackingSince)}. Draw game line prices are the standard published prices and are not in the feed, so check them before you play.</P>
          <P>Lottery Watch is independent. It is not affiliated with or endorsed by The National Lottery or Allwyn.</P>
        </Block>

        <Block title="Keep it fun">
          <P>You must be 18 or over to play. Decide what you can afford to lose before you buy, and never chase losses. If gambling is causing you or someone close to you a problem, the <b>National Gambling Helpline</b> is free and open 24 hours a day on <b>0808 8020 133</b>. GamCare and GambleAware also offer free support online.</P>
        </Block>
      </div>
    </>
  )
}
