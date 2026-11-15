// Shared Recharts styling so every chart reads as one system.
// Colours for furniture (grid, ticks) come from CSS in index.css so they
// follow light/dark mode; these props cover what CSS cannot reach.

export const CHART_FONT = '-apple-system, BlinkMacSystemFont, SF Pro Text, Inter, system-ui, sans-serif'

export const axisTick = { fontSize: 11, fontFamily: CHART_FONT }

// Hover cursor for line/area charts: a thin solid guide
export const cursorLine = { stroke: 'rgb(var(--text-faint))', strokeWidth: 1 }

// Hover cursor for bar charts: a soft rounded column wash
export const cursorBar = { fill: 'rgb(118 118 128 / 0.1)', radius: 8 }

// Highlighted point on hover: series colour with a card-coloured ring
export const activeDot = (color) => ({
  r: 5,
  fill: color,
  stroke: 'rgb(var(--void-900))',
  strokeWidth: 2.5,
})

export const tooltipWrapper = { outline: 'none', zIndex: 20 }

// Text set inside a coloured fill: white or near-black, by the fill's luminance.
export function inkOn(hex) {
  const n = parseInt(hex.slice(1), 16)
  const lin = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }
  const L = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255)
  return L > 0.3 ? '#0b0c10' : '#ffffff'
}
