# Lottery Watch

Which National Lottery scratchcards and draws have gone longest without a
top-prize winner, with the price, odds and payout rate of each, so the games can
be compared like for like. Vite, React, Tailwind, Recharts and framer-motion.

| Tab | What it shows |
|---|---|
| **Today** | The recommended card (overall or for a chosen budget) with its score and the reasons for it, then shelves: best return per £1, jackpots nobody has won yet, best chance of a real win, draws on a drought, and cards to skip |
| **Cards** | Every card on sale as a grid, sortable seven ways and filterable by price. Each opens a full breakdown: return and ROI, odds at every prize level, where each £1 goes, what ten cards return on average, and top prizes left |
| **Draws** | Lotto, EuroMillions, Set For Life, Thunderball, HotPicks and Powerball: draws unwon, last win, odds, price, jackpot history |
| **Guide** | How the score is built and what the figures can and cannot tell you |

The score (0–100) weighs return per £1 (45%), share of top prizes left (25%),
chance of winning more than the card cost (20%) and a bonus for every top prize
being intact after months on sale (10%). See `src/lib/model.js`.

## Data

Everything comes from the National Lottery's own public website feeds. No key is needed.

- **Live** — `api/lottery.js` is a Vercel function that relays the feeds
  (`lib/lottery.mjs`), cached at the edge for 15 minutes. The app opens on the
  bundled snapshot and swaps in the live answer when it arrives.
- **Snapshot** — `npm run refresh` writes `public/data/snapshot.json`, the
  fallback when the live function cannot reach the feeds.
- **Odds** — the feed has no odds. `npm run refresh` reads each card's Game
  Procedures PDF once and stores the overall odds, print run, payout rate and
  full prize table (checked against the game's stated prize fund) in
  `public/data/procedures.json`.
- **Claim history** — the feed says how many top prizes are left but not when
  they were claimed. `public/data/history.json` records each card's count every
  time it changes, which is how the app can say when a top prize was last
  claimed. It only knows what it has seen since tracking began.

`.github/workflows/refresh.yml` runs the refresh twice a day and commits the
result, which redeploys the site.

The feeds are undocumented and may change without notice. If the site is
restructured, `lib/lottery.mjs` is the only file that talks to them.

## Run it

```bash
npm install
npm run dev
```

The dev server also serves `/api/lottery`, so the live path works locally.

## Deploy

Import the repository into Vercel. The defaults work (framework: Vite). There
are no environment variables to set.

Independent and unofficial: not affiliated with The National Lottery or Allwyn.
