/**
 * Page backdrop — the flat iOS grouped background, fixed behind content.
 */
export default function Backdrop() {
  return (
    <div className="fixed inset-0 -z-10 pointer-events-none bg-void-950" style={{ transition: 'background-color 300ms ease' }} aria-hidden="true">
      {/* A soft glow behind the top of the page, like light on a track at dusk */}
      <div className="backdrop-glow absolute inset-x-0 top-0 h-[520px]" style={{ background: 'radial-gradient(80% 70% at 18% 0%, rgb(var(--coral) / 0.2), transparent 70%), radial-gradient(60% 55% at 95% 8%, rgb(var(--accent-teal) / 0.1), transparent 70%)' }} />
    </div>
  )
}
