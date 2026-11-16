import { fromYmd, daysBetween } from './format'

// A card with more top prizes than this is a "small top prize" game (£10, £100,
// £500…): its top prize is claimed every day, so "longest without a winner"
// means nothing for it.
const MANY = 50

/* When did this card's top-prize count last go down? Only knowable from the
   point the daily tracker started watching: the feed itself carries no dates. */
function lastClaimSeen(points = [], liveLeft, today) {
  let seen = null
  for (let i = 1; i < points.length; i++) if (points[i][1] < points[i - 1][1]) seen = points[i][0]
  const last = points.at(-1)
  if (last && liveLeft != null && liveLeft < last[1]) seen = today
  return seen
}

/* Everything the prize table can say about a card. */
function prizeMaths(c, p) {
  const tiers = p.tiers ?? null
  const run = p.printRun ?? null
  if (!tiers || !run) return { ladder: null, profitOdds: null, bigOdds: null, breakEvenShare: null, topCountAtLaunch: null }
  const winners = tiers.reduce((s, [, n]) => s + n, 0)
  const profit = tiers.filter(([prize]) => prize > c.price).reduce((s, [, n]) => s + n, 0)
  const big = tiers.filter(([prize]) => prize >= 100).reduce((s, [, n]) => s + n, 0)
  const even = tiers.filter(([prize]) => prize <= c.price).reduce((s, [, n]) => s + n, 0)
  return {
    ladder: tiers.map(([prize, count]) => ({ prize, count, odds: run / count })),
    profitOdds: profit ? run / profit : null,   // 1 in N cards wins more than it cost
    bigOdds: big ? run / big : null,            // 1 in N cards wins £100 or more
    breakEvenShare: winners ? even / winners : null, // share of "wins" that only return the stake (or less)
    topCountAtLaunch: tiers.at(-1)[1],
  }
}

function buildCard(c, proc, hist, now, today) {
  const p = proc ?? {}
  const launched = p.dated ?? null // date on the Game Procedures: close to, not exactly, the on-sale date
  const onSale = launched ? daysBetween(fromYmd(launched), now) : null
  const known = c.topTotal != null && c.topLeft != null && c.topTotal > 0
  const claimed = known ? Math.max(0, c.topTotal - c.topLeft) : null
  const kind = !known ? 'unknown' : c.topLeft === 0 ? 'gone' : c.topTotal > MANY ? 'many' : 'jackpot'
  const maths = prizeMaths(c, p)

  let wait = null
  if (known && c.topLeft > 0) {
    const seen = lastClaimSeen(hist?.points, c.topLeft, today)
    if (claimed === 0 && onSale != null) wait = { basis: 'never', days: onSale, since: launched }
    else if (seen) wait = { basis: 'seen', days: daysBetween(fromYmd(seen), now), since: seen }
    else if (hist?.first) wait = { basis: 'tracking', days: daysBetween(fromYmd(hist.first), now), since: hist.first }
  }

  // How much of the prize money is the top prize itself
  const topCount = maths.topCountAtLaunch ?? c.topTotal
  const topShare = p.prizeFund && c.topPrize && topCount ? Math.min(1, (c.topPrize * topCount) / p.prizeFund) : null
  const payout = p.payout ?? null
  const payoutNoTop = payout != null && topShare != null ? payout * (1 - topShare) : null
  // What £1 spent returns on average. With every top prize claimed, the top
  // prize's slice of the prize fund is no longer there to be won.
  const returns = payout == null ? null : kind === 'gone' && payoutNoTop != null ? payoutNoTop : payout

  return {
    ...c,
    kind,
    claimed,
    leftShare: known ? c.topLeft / c.topTotal : null,
    reprinted: maths.topCountAtLaunch != null && c.topTotal > maths.topCountAtLaunch, // more top prizes than the first print run held
    overallOdds: p.overallOdds ?? null,
    printRun: p.printRun ?? null,
    prizeFund: p.prizeFund ?? null,
    payout,
    payoutNoTop,
    topShare,
    returns,
    roi: returns != null ? returns - 1 : null,
    avgLoss: returns != null && c.price != null ? c.price * (1 - returns) : null,
    topOdds: p.printRun && topCount ? p.printRun / topCount : null, // per card, at launch
    ...maths,
    launched,
    onSale,
    pace: claimed > 0 && onSale ? onSale / claimed : null,
    wait,
    proceduresUrl: c.procedures ? `https://assets.national-lottery.co.uk/dam/jcr:${c.procedures}` : null,
  }
}

/* The score: one number, 0–100, built only from published facts.
     45%  what £1 returns on average
     25%  share of top prizes still unclaimed
     20%  chance a card wins more than it cost
     10%  every top prize intact after a long time on sale
   Each part is scaled between the worst and best card on sale. A card with no
   top prize left can be scored but is never recommended. */
function scoreCards(cards) {
  const range = (get) => { const v = cards.map(get).filter((x) => x != null); return [Math.min(...v), Math.max(...v)] }
  const scale = ([lo, hi], v) => (v == null ? 0.5 : hi === lo ? 1 : (v - lo) / (hi - lo))
  const rRet = range((c) => c.returns)
  const winChance = (c) => (c.profitOdds ? 1 / c.profitOdds : c.overallOdds ? 0.35 / c.overallOdds : null)
  const rWin = range(winChance)
  for (const c of cards) {
    const parts = {
      returns: scale(rRet, c.returns),
      left: c.leftShare ?? 0,
      win: scale(rWin, winChance(c)),
      intact: c.claimed === 0 && c.kind === 'jackpot' ? Math.min(1, (c.onSale ?? 0) / 120) : 0,
    }
    c.parts = parts
    c.score = Math.round(100 * (0.45 * parts.returns + 0.25 * parts.left + 0.2 * parts.win + 0.1 * parts.intact))
    c.eligible = c.kind !== 'gone' && c.kind !== 'unknown' && c.returns != null
  }
  const ranked = [...cards].sort((a, b) => (b.returns ?? -1) - (a.returns ?? -1))
  ranked.forEach((c, i) => { c.returnRank = i + 1 })
}

function buildDraw(d, now) {
  const since = d.lastWin?.date ?? null
  const capped = !d.lastWin
  const oldest = d.draws.at(-1)?.date
  const jackpot = d.latest?.jackpot ?? null
  return {
    ...d,
    capped,
    waitDays: since ? daysBetween(new Date(since), now) : oldest ? daysBetween(new Date(oldest), now) : null,
    fixed: new Set(d.draws.map((x) => x.jackpot)).size <= 2,
    // What the top prize alone is worth per line, on average: prize × chance
    topValue: jackpot && d.odds ? jackpot / d.odds : null,
    series: [...d.draws].reverse(),
  }
}

export function buildModel({ feed, procedures, history, now = new Date() }) {
  const today = now.toISOString().slice(0, 10)
  const cards = feed.cards.map((c) => buildCard(c, procedures?.[c.id], history?.cards?.[c.id], now, today))
  scoreCards(cards)
  const draws = (feed.draws ?? []).map((d) => buildDraw(d, now))

  const eligible = cards.filter((c) => c.eligible).sort((a, b) => b.score - a.score || b.returns - a.returns)
  const prices = [...new Set(cards.map((c) => c.price))].sort((a, b) => a - b)
  const byWait = (a, b) => (b.wait?.days ?? -1) - (a.wait?.days ?? -1)
  return {
    cards,
    byId: Object.fromEntries(cards.map((c) => [c.id, c])),
    draws,
    prices,
    updated: feed.updated,
    fetchedAt: feed.fetchedAt,
    trackingSince: history?.started ?? null,
    picks: eligible,                                              // best first
    pickAt: Object.fromEntries(prices.map((p) => [p, eligible.find((c) => c.price === p) ?? null])),
    bestReturn: cards.filter((c) => c.returns != null).sort((a, b) => b.returns - a.returns),
    bestWin: cards.filter((c) => c.profitOdds && c.kind !== 'gone').sort((a, b) => a.profitOdds - b.profitOdds),
    untouched: cards.filter((c) => c.kind === 'jackpot' && c.claimed === 0 && c.wait?.basis === 'never').sort(byWait),
    // On the National Lottery's list but too new for the daily job to have read its procedures yet
    pending: cards.filter((c) => c.returns == null),
    gone: cards.filter((c) => c.kind === 'gone').sort((a, b) => b.topPrize - a.topPrize),
    drawRank: [...draws].sort((a, b) => (b.waitDays ?? 0) - (a.waitDays ?? 0)),
    avgReturn: cards.reduce((s, c) => s + (c.returns ?? 0), 0) / Math.max(1, cards.filter((c) => c.returns != null).length),
  }
}
