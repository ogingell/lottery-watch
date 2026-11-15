import { fromYmd, daysBetween } from './format'

// A card with more top prizes than this is a "small top prize" game (£10, £100,
// £500…): its top prize is claimed every day, so "longest without a winner"
// means nothing for it and it stays out of that ranking.
const MANY = 50

/* When did this card's top-prize count last go down? Only knowable from the
   point the daily tracker started watching: the feed itself carries no dates. */
function lastClaimSeen(points = [], liveLeft, today) {
  let seen = null
  for (let i = 1; i < points.length; i++) if (points[i][1] < points[i - 1][1]) seen = points[i][0]
  const last = points.at(-1)
  if (last && liveLeft != null && liveLeft < last[1]) seen = today // dropped since the last snapshot
  return seen
}

function buildCard(c, proc, hist, now, today) {
  const p = proc ?? {}
  const launched = p.dated ?? null // date on the Game Procedures: close to, not exactly, the on-sale date
  const onSale = launched ? daysBetween(fromYmd(launched), now) : null
  const known = c.topTotal != null && c.topLeft != null && c.topTotal > 0
  const claimed = known ? Math.max(0, c.topTotal - c.topLeft) : null
  const kind = !known ? 'unknown' : c.topLeft === 0 ? 'gone' : c.topTotal > MANY ? 'many' : 'jackpot'

  let wait = null
  if (known && c.topLeft > 0) {
    const seen = lastClaimSeen(hist?.points, c.topLeft, today)
    if (claimed === 0 && onSale != null) wait = { basis: 'never', days: onSale, since: launched }
    else if (seen) wait = { basis: 'seen', days: daysBetween(fromYmd(seen), now), since: seen }
    else if (hist?.first) wait = { basis: 'tracking', days: daysBetween(fromYmd(hist.first), now), since: hist.first }
  }

  return {
    ...c,
    kind,
    claimed,
    leftShare: known ? c.topLeft / c.topTotal : null,
    overallOdds: p.overallOdds ?? null,
    printRun: p.printRun ?? null,
    payout: p.payout ?? null,
    // Odds of the top prize on one card when the game launched
    topOdds: p.printRun && c.topTotal ? p.printRun / c.topTotal : null,
    // What a card costs you on average once prizes are counted back in
    avgLoss: p.payout != null && c.price != null ? c.price * (1 - p.payout) : null,
    launched,
    onSale,
    // Average gap between top-prize claims so far
    pace: claimed > 0 && onSale ? onSale / claimed : null,
    wait,
    proceduresUrl: c.procedures ? `https://assets.national-lottery.co.uk/dam/jcr:${c.procedures}` : null,
  }
}

function buildDraw(d, now) {
  const since = d.lastWin?.date ?? null
  const capped = !d.lastWin // no winner inside the lookback: the real wait is at least this long
  const oldest = d.draws.at(-1)?.date
  return {
    ...d,
    capped,
    waitDays: since ? daysBetween(new Date(since), now) : oldest ? daysBetween(new Date(oldest), now) : null,
    fixed: new Set(d.draws.map((x) => x.jackpot)).size <= 2, // same top prize every draw
    series: [...d.draws].reverse(),
  }
}

export function buildModel({ feed, procedures, history, now = new Date() }) {
  const today = now.toISOString().slice(0, 10)
  const cards = feed.cards.map((c) => buildCard(c, procedures?.[c.id], history?.cards?.[c.id], now, today))
  const draws = (feed.draws ?? []).map((d) => buildDraw(d, now))

  const jackpots = cards.filter((c) => c.kind === 'jackpot')
  const byWait = (a, b) => (b.wait?.days ?? -1) - (a.wait?.days ?? -1)
  return {
    cards,
    draws,
    updated: feed.updated,
    fetchedAt: feed.fetchedAt,
    trackingSince: history?.started ?? null,
    untouched: jackpots.filter((c) => c.claimed === 0).sort(byWait),           // no top prize claimed yet
    watching: jackpots.filter((c) => c.claimed > 0).sort((a, b) => byWait(a, b) || a.leftShare - b.leftShare),
    gone: cards.filter((c) => c.kind === 'gone').sort((a, b) => b.topPrize - a.topPrize),
    drawRank: [...draws].sort((a, b) => (b.waitDays ?? 0) - (a.waitDays ?? 0)),
  }
}
