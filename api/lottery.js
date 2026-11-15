// Vercel serverless function: the live feed.
//
//   GET /api/lottery[?fresh=1]
//
// Returns { fetchedAt, updated, cards: [...], draws: [...] } straight from the
// National Lottery's public feeds (see lib/lottery.mjs). The browser cannot call
// those feeds itself (they do not allow cross-origin reads), so this relays them.
// Answers are cached at the edge for 15 minutes: the prize counts change at most
// a few times a day, and there is no reason to lean on their servers.

import { fetchAll } from '../lib/lottery.mjs'

export default async function handler(req, res) {
  try {
    const body = await fetchAll()
    const forced = !!(req.query?.fresh ?? new URL(req.url, 'http://x').searchParams.get('fresh'))
    res.setHeader('Cache-Control', forced ? 'public, s-maxage=60' : 'public, s-maxage=900, stale-while-revalidate=3600')
    res.status(200).json(body)
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store')
    res.status(e.status ?? 500).json({ error: e.code ?? 'failed', message: e.message })
  }
}
