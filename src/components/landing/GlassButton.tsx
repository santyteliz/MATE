interface GlassButtonProps {
  label: string
  onClick: () => void
  disabled?: boolean
}

export function GlassButton({ label, onClick, disabled = false }: GlassButtonProps) {
  return (
    <button type="button" className="glass-btn" onClick={onClick} disabled={disabled}><span>{label}</span></button>
  )
}
