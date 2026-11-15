# Lottery Watch

Which National Lottery scratchcards and draws have gone longest without a
top-prize winner, with the price, odds and payout rate of each, so the games can
be compared like for like. Built the same way as Coach Claude (Vite, React,
Tailwind, Recharts, framer-motion) and sharing its design system.

| Tab | What it shows |
|---|---|
| **Longest wait** | Scratchcards with every top prize still unclaimed (longest on sale first), draws since each draw game's top prize was won, cards being watched, and cards still on sale with no top prize left |
| **Scratchcards** | Every card on sale: price, top prizes left, odds of any prize, odds of the top prize at launch, payout rate, average cost of a card. Filter by price, sort seven ways |
| **Draw games** | Lotto, EuroMillions, Set For Life, Thunderball, HotPicks and Powerball: draws unwon, last win, odds, price, jackpot history |
| **How it works** | What each number means and what it cannot tell you |

## Data

Everything comes from the National Lottery's own public website feeds. No key is needed.

- **Live** — `api/lottery.js` is a Vercel function that relays the feeds
  (`lib/lottery.mjs`), cached at the edge for 15 minutes. The app opens on the
  bundled snapshot and swaps in the live answer when it arrives.
- **Snapshot** — `npm run refresh` writes `public/data/snapshot.json`, the
  fallback when the live function cannot reach the feeds.
- **Odds** — the feed has no odds. `npm run refresh` reads each card's Game
  Procedures PDF once and stores the overall odds, print run and payout rate in
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
