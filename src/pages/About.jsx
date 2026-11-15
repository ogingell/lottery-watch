import { BookOpen, Database, Scale, LifeBuoy } from 'lucide-react'
import { Card, PageHeader } from '../components/Ui'
import { dLong } from '../lib/format'

const P = ({ children }) => <p className="text-[14.5px] leading-relaxed text-surface-200 [&+p]:mt-3">{children}</p>
const Li = ({ term, children }) => (
  <li className="flex gap-2.5 text-[14.5px] leading-relaxed text-surface-200">
    <span className="mt-[9px] w-1.5 h-1.5 rounded-full bg-coral flex-shrink-0" />
    <span><b className="font-semibold text-surface-50">{term}</b> {children}</span>
  </li>
)

export default function About({ m, source }) {
  return (
    <>
      <PageHeader eyebrow="Method" title="How it works" lead="Where every number comes from, what it can tell you, and what it cannot." />
      <div className="space-y-5">
        <Card title="Reading the numbers" icon={BookOpen}>
          <ul className="space-y-2.5">
            <Li term="Top prizes left.">Published by the National Lottery for every scratchcard: how many top prizes the game started with and how many are unclaimed. A card with none left can stay on sale.</Li>
            <Li term="Any prize (1 in N).">The overall chance that a card wins anything, from the game's official procedures. Most wins are the smallest prizes, often just the price of the card.</Li>
            <Li term="Top prize, at launch.">Cards printed divided by top prizes. It is exact on day one only. As cards sell and prizes are claimed the true figure moves, and the number of unsold cards is never published.</Li>
            <Li term="Paid back in prizes.">The share of all money spent on a game that is returned as prizes. A 68% payout means the average £5 card returns £3.40 and costs £1.60, though almost nobody gets the average.</Li>
            <Li term="Time without a winner.">For a card with every top prize left, it is the time since the date on its procedures (close to when it went on sale). For other cards, claim dates are not published, so this app records the prize counts daily and reports the gap since it last saw one drop.</Li>
            <Li term="Draws unwon.">Counted from each draw's published prize breakdown: consecutive draws, up to the latest, with no top-prize winner.</Li>
          </ul>
        </Card>

        <Card title="What a long wait does and doesn't mean" icon={Scale}>
          <P>For draw games, nothing. Each draw is independent, so a top prize that has gone unwon for months is no more likely to fall next time. The odds on a line are fixed by the number of balls.</P>
          <P>For scratchcards the prizes are printed into a fixed run of cards, so a top prize that has not been claimed is either in an unsold card or sitting unclaimed in someone's drawer. A game with all its top prizes left after months on sale is, if anything, slightly better than it was at launch, but without sales figures nobody can say by how much. The one firm conclusion the data supports is the negative one: a card with no top prizes left cannot win you its headline prize.</P>
          <P>Every game here pays back less than it takes in. Treat the cost of a card as the price of the entertainment.</P>
        </Card>

        <Card title="Data" icon={Database}>
          <P>Prize counts, prices and draw results are read from the National Lottery's public website feeds. Odds, print runs and payout rates are read from each game's Game Procedures PDF. You are looking at {source === 'live' ? 'the live feed' : 'a saved copy from the last daily update, because the live feed could not be reached'}; the National Lottery last updated its scratchcard prize counts on {dLong(m.updated)}.</P>
          <P>Daily tracking of claims began on {dLong(m.trackingSince)}. Line prices for draw games are the standard published prices and are not part of the feed, so check them before you play.</P>
          <P>This is an independent project. It is not affiliated with, or endorsed by, The National Lottery or Allwyn, and nothing here is advice to play.</P>
        </Card>

        <Card title="Keep it fun" icon={LifeBuoy}>
          <P>You must be 18 or over to play. Set a budget before you buy and never chase losses. If gambling is causing you or someone you know a problem, the National Gambling Helpline is free and open 24 hours on 0808 8020 133, and GamCare and GambleAware offer free support online.</P>
        </Card>
      </div>
    </>
  )
}
