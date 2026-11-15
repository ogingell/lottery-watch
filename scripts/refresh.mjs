// Daily snapshot. Run by .github/workflows/refresh.yml (and by hand: npm run refresh).
//
//   public/data/snapshot.json    the feed as it stood at the last run; what the
//                                app shows when the live function is unreachable
//   public/data/procedures.json  odds, print run and payout read out of each
//                                card's Game Procedures PDF. These never change
//                                for a game, so a PDF is only read once.
//   public/data/history.json     top prizes left, per card, recorded each time
//                                the number changes. This is what lets the app
//                                say when a top prize was last claimed: the feed
//                                itself carries no dates.

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { extractText, getDocumentProxy, getMeta } from 'unpdf'
import { fetchAll, ASSETS } from '../lib/lottery.mjs'

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'data')
const read = async (name, fallback) => { try { return JSON.parse(await readFile(path.join(DIR, name), 'utf8')) } catch { return fallback } }
const write = (name, data) => writeFile(path.join(DIR, name), JSON.stringify(data, null, 1) + '\n')
const toNum = (s) => Number(String(s).replace(/,/g, ''))

// "D:20260714152636Z" → "2026-07-14"
const pdfDate = (s) => { const m = /(\d{4})(\d{2})(\d{2})/.exec(s ?? ''); return m ? `${m[1]}-${m[2]}-${m[3]}` : null }

export function parseProcedures(text) {
  const t = text.replace(/\s+/g, ' ')
  const odds = /1 in ([\d.,]+) overall chance/i.exec(t)
  const run = /There are ([\d,]+) Scratchcards in the initial print run/i.exec(t)
  const pay = /represents ([\d.]+)% of the total face value/i.exec(t)
  const pot = /overall value of Prizes in the initial print run of Scratchcards for the Game is £([\d,]+)/i.exec(t)
  return {
    overallOdds: odds ? toNum(odds[1]) : null,   // 1 in N cards wins something
    printRun: run ? toNum(run[1]) : null,        // cards printed at launch
    payout: pay ? Math.round(Number(pay[1]) * 100) / 10000 : null,   // share of ticket sales paid back as prizes
    prizeFund: pot ? toNum(pot[1]) : null,
  }
}

async function readProcedures(id) {
  const r = await fetch(`${ASSETS}/dam/jcr:${id}`, { signal: AbortSignal.timeout(30000) })
  if (!r.ok) throw new Error(`PDF ${id}: ${r.status}`)
  const pdf = await getDocumentProxy(new Uint8Array(await r.arrayBuffer()))
  const { text } = await extractText(pdf, { mergePages: true })
  const meta = await getMeta(pdf).catch(() => null)
  const created = meta?.info?.CreationDate
  const dated = created instanceof Date ? created.toISOString().slice(0, 10) : pdfDate(created)
  return { ...parseProcedures(text), dated }
}

const today = new Date().toISOString().slice(0, 10)
await mkdir(DIR, { recursive: true })

const live = await fetchAll()
console.log(`feed: ${live.cards.length} scratchcards, ${live.draws.length} draw games (site updated ${live.updated})`)

// Procedures: read the PDFs we have not seen
const procedures = await read('procedures.json', {})
for (const c of live.cards) {
  if (!c.procedures || procedures[c.id]?.source === c.procedures) continue
  try {
    procedures[c.id] = { source: c.procedures, ...(await readProcedures(c.procedures)) }
    console.log(`procedures: ${c.name} [${c.id}]`, JSON.stringify(procedures[c.id]))
  } catch (e) { console.warn(`procedures: skipped ${c.name} [${c.id}]: ${e.message}`) }
}

// History: one point per card each time its top-prize count changes
const history = await read('history.json', { started: today, cards: {} })
for (const c of live.cards) {
  if (c.topLeft == null) continue
  const h = (history.cards[c.id] ??= { name: c.name, first: today, points: [] })
  h.name = c.name
  const last = h.points.at(-1)
  if (!last || last[1] !== c.topLeft) {
    if (last?.[0] === today) last[1] = c.topLeft
    else h.points.push([today, c.topLeft])
  }
  h.seen = today
}
history.checked = today

await write('snapshot.json', live)
await write('procedures.json', procedures)
await write('history.json', history)
console.log(`written to ${path.relative(process.cwd(), DIR)}`)
