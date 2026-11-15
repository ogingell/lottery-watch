const DAY = 86400000

export const fromYmd = (s) => { const [y, m, d] = s.slice(0, 10).split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)) }
export const daysBetween = (a, b) => Math.max(0, Math.floor((Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate()) - Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate())) / DAY))

const D = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/London' })
const DS = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'Europe/London' })
const T = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London' })
const asDate = (v) => (v instanceof Date ? v : new Date(v.length === 10 ? `${v}T12:00:00Z` : v))
export const dLong = (v) => (v ? D.format(asDate(v)) : '—')
export const dShort = (v) => (v ? DS.format(asDate(v)) : '—')
export const hhmm = (v) => T.format(asDate(v))

const N = new Intl.NumberFormat('en-GB')
export const n0 = (v) => (v == null ? '—' : N.format(Math.round(v)))

// £1, £2.50, £250,000
export const gbp = (v) => (v == null ? '—' : `£${Number.isInteger(v) ? N.format(v) : v.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
// £250k, £1.2m, £118.8m
export function gbpShort(v) {
  if (v == null) return '—'
  if (v >= 1e9) return `£${+(v / 1e9).toFixed(2)}bn`
  if (v >= 1e6) return `£${+(v / 1e6).toFixed(1)}m`
  if (v >= 1e4) return `£${+(v / 1e3).toFixed(0)}k`
  return gbp(v)
}
// 1 in 3.39 · 1 in 10.9 million
export function oneIn(v) {
  if (v == null) return '—'
  if (v >= 1e6) return `1 in ${+(v / 1e6).toFixed(1)} million`
  if (v >= 100) return `1 in ${N.format(Math.round(v))}`
  return `1 in ${+v.toFixed(2)}`
}
export const pct = (v, dp = 0) => (v == null ? '—' : `${(v * 100).toFixed(dp)}%`)

// 0 → "today", 1 → "1 day", 45 → "45 days", 400 → "13 months"
export function span(days) {
  if (days == null) return '—'
  if (days === 0) return 'today'
  if (days < 60) return `${days} day${days === 1 ? '' : 's'}`
  if (days < 730) return `${Math.round(days / 30.44)} months`
  return `${(days / 365.25).toFixed(1)} years`
}
export const plural = (n, one, many = `${one}s`) => `${N.format(n)} ${n === 1 ? one : many}`

// 0.7 → "70p" · 0.6476 → "65p": what £1 returns, on average
export const pence = (v) => (v == null ? '—' : `${Math.round(v * 100)}p`)
// -0.29 → "−29%"
export const roi = (v) => (v == null ? '—' : `${v > 0 ? '+' : '−'}${Math.abs(v * 100).toFixed(0)}%`)
// 9.13 → "1 in 9" · 3.39 → "1 in 3.4"
export function oneInShort(v) {
  if (v == null) return '—'
  if (v >= 1e6) return `1 in ${+(v / 1e6).toFixed(1)}m`
  if (v >= 1e4) return `1 in ${Math.round(v / 1e3)}k`
  if (v >= 20) return `1 in ${new Intl.NumberFormat('en-GB').format(Math.round(v))}`
  return `1 in ${+v.toFixed(1)}`
}
export const ordinal = (n) => `${n}${['th', 'st', 'nd', 'rd'][n % 100 > 10 && n % 100 < 14 ? 0 : Math.min(n % 10, 4) % 4]}`
