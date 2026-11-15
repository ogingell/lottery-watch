import { useEffect, useId, useRef } from 'react'
import { motion, animate, useInView, useReducedMotion } from 'framer-motion'

/**
 * Shared card primitives. (Legacy "Hud" names kept so call sites don't churn.)
 */

// Card with optional title row. The icon renders as an iOS Settings-style
// colour tile; `led` picks its tint (defaults to the brand coral).
export const EASE = [0.22, 1, 0.36, 1]
// Reveal once, a little after the element's top edge clears the bottom of the screen
export const VIEWPORT = { once: true, margin: '0px 0px -48px 0px' }

/* Fade-and-rise as the element scrolls into view (or on load if already there). */
export function Reveal({ as = 'div', delay = 0, y = 14, className = '', children, ...rest }) {
  const reduceMotion = useReducedMotion()
  const Tag = motion[as]
  return (
    <Tag
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.65, delay, ease: EASE }}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/* A bar that grows from its origin edge when it scrolls into view.
   axis 'x' grows left→right, 'y' grows bottom→top. */
export function Grow({ axis = 'x', delay = 0, className = '', style, ...rest }) {
  const reduceMotion = useReducedMotion()
  const k = axis === 'x' ? 'scaleX' : 'scaleY'
  return (
    <motion.span
      initial={reduceMotion ? false : { [k]: 0 }}
      whileInView={{ [k]: 1 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.9, delay, ease: EASE }}
      className={className}
      style={{ ...style, transformOrigin: axis === 'x' ? 'left center' : 'center bottom' }}
      {...rest}
    />
  )
}

const TILE_TINT = {
  green: 'rgb(var(--positive))',
  cyan:  'rgb(var(--accent-blue))',
  amber: 'rgb(var(--warning))',
  red:   'rgb(var(--negative))',
}

export function HudPanel({
  title,
  icon: Icon,
  led = null, // 'green' | 'cyan' | 'amber' | 'red'
  right = null,
  corners = true, // legacy prop, ignored
  className = '',
  bodyClassName = '',
  delay = 0,
  children,
}) {
  const reduceMotion = useReducedMotion()
  const tint = TILE_TINT[led] ?? 'rgb(var(--coral))'

  return (
    <motion.section
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
      whileInView={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={`hud-panel ${className}`}
    >
      {title && (
        <header className="flex flex-wrap items-center gap-x-3 gap-y-2 px-5 sm:px-6 pt-5 pb-1">
          {Icon && (
            <span className="icon-tile">
              <Icon className="w-[15px] h-[15px]" strokeWidth={2.4} />
            </span>
          )}
          <h2 className="font-display text-[17px] font-semibold tracking-[-0.022em] text-surface-50">{title}</h2>
          {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
        </header>
      )}
      <div className={bodyClassName || 'p-5 sm:p-6'}>{children}</div>
    </motion.section>
  )
}

// Animated count-up readout. Drives the DOM node directly via framer-motion's
// animate() — no per-frame React state. Respects prefers-reduced-motion and
// only starts once the element scrolls into view.
export function CountUpValue({ value, format = v => String(Math.round(v)), duration = 1.5, delay = 0, className = '', style }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (reduceMotion) {
      node.textContent = format(value)
      return
    }
    if (!inView) return
    const controls = animate(0, value, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: v => { node.textContent = format(v) },
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, inView, reduceMotion, duration, delay])

  return (
    <span ref={ref} className={className} style={style}>
      {reduceMotion ? format(value) : format(0)}
    </span>
  )
}

// Small meta label
export function Telemetry({ children, className = '' }) {
  return <p className={`telemetry-label ${className}`}>{children}</p>
}

// Inline status pill e.g. "On track"
export function StatusChip({ tone = 'green', children }) {
  const tones = {
    green: 'text-hud-green bg-hud-green/[0.12]',
    cyan:  'text-hud-cyan bg-hud-cyan/[0.12]',
    amber: 'text-hud-amber bg-hud-amber/[0.14]',
    red:   'text-hud-red bg-hud-red/[0.12]',
  }
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-full font-sans text-[12px] font-semibold whitespace-nowrap ${tones[tone] ?? tones.green}`}>
      <span className="led bg-current" />
      {children}
    </span>
  )
}

/* ─────────────────────── Chart tooltip ─────────────────────── */

// One tooltip design for every chart: a frosted card with a title row,
// coloured series rows and an optional footer line.
//   rows:   [{ label, value, color?, muted? }]
//   aside:  small text on the right of the title (e.g. a total)
//   footer: { text, tone: 'up' | 'down' | 'neutral' }
export function ChartTooltip({ title, aside, rows = [], footer, className = '' }) {
  const footerTone = {
    up: 'text-hud-green',
    down: 'text-hud-red',
    neutral: 'text-surface-400',
  }[footer?.tone ?? 'neutral']

  return (
    <div className={`chart-tooltip ${className}`}>
      {(title || aside) && (
        <div className="flex items-baseline justify-between gap-5 mb-1.5">
          {title && <p className="text-[12px] font-semibold text-surface-400">{title}</p>}
          {aside && <p className="text-[12px] font-semibold tabular-nums text-surface-50">{aside}</p>}
        </div>
      )}
      <div className="space-y-1">
        {rows.map((r, i) => (
          <div key={r.key ?? i} className="flex items-center justify-between gap-5">
            <span className={`flex items-center gap-2 text-[13px] ${r.muted ? 'text-surface-400' : 'text-surface-100'}`}>
              {r.color && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: r.color }} />}
              {r.label}
            </span>
            <span className="text-[13px] font-semibold tabular-nums text-surface-50">{r.value}</span>
          </div>
        ))}
      </div>
      {footer?.text && (
        <p className={`mt-2 pt-2 hairline-t text-[12px] font-semibold tabular-nums ${footerTone}`}>{footer.text}</p>
      )}
    </div>
  )
}

/* ─────────────────────── Segmented control ─────────────────────── */

// iOS segmented control with a thumb that springs between options.
//   options: [{ value, label, icon? }]
export function Segmented({ options, value, onChange, className = '', itemClassName = '', fill = false }) {
  const id = useId()
  return (
    <div className={`segmented ${fill ? '!flex w-full' : ''} ${className}`} role="tablist">
      {options.map(opt => {
        const active = opt.value === value
        const Icon = opt.icon
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={`segmented-item ${fill ? 'flex-1' : ''} ${active ? '!text-surface-50' : ''} ${itemClassName}`}
          >
            {active && (
              <motion.span
                layoutId={`seg-thumb-${id}`}
                className="segmented-thumb"
                transition={{ type: 'spring', stiffness: 520, damping: 40, mass: 0.8 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center justify-center gap-1.5">
              {Icon && <Icon className="w-3.5 h-3.5" />}
              {opt.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
