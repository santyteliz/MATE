interface GlassButtonProps {
  label: string
  onClick: () => void
}

export function GlassButton({ label, onClick }: GlassButtonProps) {
  return (
    <div className="glass-btn-wrapper">
      {/* Pulse ring animation layers */}
      <span className="glass-btn-pulse" aria-hidden="true" />
      <span className="glass-btn-pulse glass-btn-pulse--delayed" aria-hidden="true" />
      <button
        type="button"
        className="glass-btn"
        onClick={onClick}
        aria-label={label}
      >
        <span className="glass-btn-label">{label}</span>
        <span className="glass-btn-arrow" aria-hidden="true">↗</span>
      </button>
    </div>
  )
}
