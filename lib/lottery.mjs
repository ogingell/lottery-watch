// Reads the National Lottery's own public data feeds (the same ones its website
// uses) and reduces them to the few fields this app shows. Shared by the Vercel
// function (live, on demand) and scripts/refresh.mjs (the daily snapshot).
//
// Nothing here needs a key. The feeds are undocumented, so every field is read
// defensively: a missing value becomes null rather than an error.

const API = 'https://api-dfe.national-lottery.co.uk'
export const ASSETS = 'https://assets.national-lottery.co.uk'
const HEADERS = {
  accept: 'application/json',
  'accept-language': 'en-GB',
  'user-agent': 'Mozilla/5.0 (compatible; lottery-watch/1.0)',
}

async function getJson(path, { timeout = 15000 } = {}) {
  const r = await fetch(`${API}${path}`, { headers: HEADERS, signal: AbortSignal.timeout(timeout) })
  if (!r.ok) throw Object.assign(new Error(`National Lottery feed answered ${r.status} for ${path.split('?')[0]}`), { status: 502, code: 'upstream_error' })
  return r.json()
}

async function pool(items, size, fn) {
  const out = new Array(items.length)
  let next = 0
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) { const i = next++; out[i] = await fn(items[i], i) }
  }))
  return out
}

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null)
const day = (iso) => (typeof iso === 'string' ? iso.slice(0, 10) : null)

/* ───────────── scratchcards ───────────── */

// "£250,000 Jackpot [1510]" → name "£250,000 Jackpot", game number 1510
export function splitName(raw = '') {
  const m = raw.match(/^(.*?)\s*\[(\d+)\]\s*$/)
  const clean = (s) => s.replace(/\*+\s*$/, '').trim() // the site marks some titles with footnote asterisks
  return m ? { name: clean(m[1]), gameNo: Number(m[2]) } : { name: clean(raw), gameNo: null }
}

export function toCard(s) {
  const { name, gameNo } = splitName(s.title || s.name)
  const link = s.image?.['@link']
  return {
    id: gameNo != null ? String(gameNo) : s['@id'],
    gameNo,
    name,
    price: num(s.playPrice) != null ? s.playPrice / 100 : null, // feed is in pence
    topPrize: num(s.prizePool),                                 // feed is in pounds
    topTotal: num(s.allTopPrizes),
    topLeft: num(s.leftTopPrizes),
    isNew: !!s.isNewGame,
    closes: day(s.closureDate),
    claimBy: day(s.lastDateToClaim),
    image: link ? `${ASSETS}${link}` : null,
    procedures: typeof s.gameProcedures === 'string' && s.gameProcedures.startsWith('jcr:') ? s.gameProcedures.slice(4) : null,
  }
}

export async function fetchScratchcards() {
  const data = await getJson('/cms-proxy/scratchcardList')
  const lists = data.results ?? []
  // Three lists come back: English, Welsh and closed games. The English list is
  // the one the site shows; fall back to the biggest list that has prize counts.
  const live = lists.find((l) => /EN/.test(l['@name'] ?? '') && !/clos/i.test(l['@name'] ?? ''))
    ?? [...lists].filter((l) => !/clos|welsh/i.test(l['@name'] ?? '')).sort((a, b) => (b.scratchcards?.length ?? 0) - (a.scratchcards?.length ?? 0))[0]
  if (!live?.scratchcards?.length) throw Object.assign(new Error('The scratchcard list came back empty'), { status: 502, code: 'empty' })
  return {
    updated: day(live.lastUpdated),
    cards: live.scratchcards.filter((s) => s.name).map(toCard),
  }
}

/* ───────────── draw games ───────────── */

// Jackpot odds are plain combinatorics from each game's matrix. Line prices are
// the standard UK prices and are not in the feed; price is null where unknown.
export const DRAW_GAMES = [
  { id: 6,  key: 'lotto',        name: 'Lotto',                 price: 2,    odds: 45057474,  top: 'Match 6',                 matrix: '6 from 59' },
  { id: 33, key: 'euromillions', name: 'EuroMillions',          price: 2.5,  odds: 139838160, top: 'Match 5 + 2 Lucky Stars', matrix: '5 from 50 + 2 from 12' },
  { id: 3,  key: 'set-for-life', name: 'Set For Life',          price: 1.5,  odds: 15339390,  top: 'Match 5 + Life Ball',     matrix: '5 from 47 + 1 from 10' },
  { id: 4,  key: 'thunderball',  name: 'Thunderball',           price: 1,    odds: 8060598,   top: 'Match 5 + Thunderball',   matrix: '5 from 39 + 1 from 14' },
  { id: 7,  key: 'lotto-hotpicks', name: 'Lotto HotPicks',      price: 1,    odds: 834398,    top: 'Pick 5, match 5',         matrix: '5 picked from 59' },
  { id: 5,  key: 'euromillions-hotpicks', name: 'EuroMillions HotPicks', price: 1.5, odds: 2118760, top: 'Pick 5, match 5',   matrix: '5 picked from 50' },
  { id: 11, key: 'powerball',    name: 'Powerball',             price: null, odds: 292201338, top: 'Match 5 + Powerball',     matrix: '5 from 69 + 1 from 26' },
]

const MAX_LOOKBACK = 48 // draws walked back, per game, looking for the last top-prize winner

async function fetchDrawGame(game) {
  const list = (await getJson(`/draw-game/results/${game.id}`)).drawResults ?? []
  if (!list.length) return null
  list.sort((a, b) => b.drawNo - a.drawNo)
  const draws = list.map((d) => ({
    no: d.drawNo,
    date: d.drawDate,
    jackpot: num(d.topPrize?.prizeCents) != null ? Math.round(d.topPrize.prizeCents / 100) : null,
    prizeText: d.topPrize?.nonCashPrize ?? null,
  }))

  // Walk back from the latest draw, a few at a time, until one had a top-prize winner.
  let waited = 0
  let lastWin = null
  const window = draws.slice(0, MAX_LOOKBACK)
  for (let at = 0; at < window.length && !lastWin; at += 6) {
    const batch = window.slice(at, at + 6)
    const details = await pool(batch, 6, (d) => getJson(`/draw-game/results/${game.id}/${d.no}`).catch(() => null))
    for (let i = 0; i < batch.length; i++) {
      const winners = num(details[i]?.prizeBreakdown?.noOfTopPrizeWinners)
      batch[i].winners = winners
      if (winners == null) continue // breakdown not published yet: neither a win nor a miss
      if (winners > 0) { lastWin = { no: batch[i].no, date: batch[i].date, winners, jackpot: batch[i].jackpot }; break }
      waited++
    }
  }
  return {
    id: game.id, key: game.key, name: game.name, price: game.price, odds: game.odds, top: game.top, matrix: game.matrix,
    latest: draws[0],
    drawsWaited: waited,                 // draws in a row, up to the latest, with no top-prize winner
    lastWin,                             // null = none found inside the lookback
    lookback: Math.min(MAX_LOOKBACK, draws.length),
    draws: draws.slice(0, 52).map(({ no, date, jackpot, winners }) => ({ no, date, jackpot, winners: winners ?? null })),
  }
}

export async function fetchDraws() {
  const games = await pool(DRAW_GAMES, 3, (g) => fetchDrawGame(g).catch(() => null))
  return games.filter(Boolean)
}

export async function fetchAll() {
  const [sc, draws] = await Promise.all([fetchScratchcards(), fetchDraws().catch(() => [])])
  return { source: 'national-lottery', fetchedAt: new Date().toISOString(), updated: sc.updated, cards: sc.cards, draws }
}
