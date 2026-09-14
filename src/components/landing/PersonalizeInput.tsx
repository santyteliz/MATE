interface PersonalizeInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function PersonalizeInput({ value, onChange, placeholder }: PersonalizeInputProps) {
  return (
    <div className="personalize-input-wrapper">
      <label htmlFor="personalize-text" className="sr-only">
        Texto para personalizar tu virola
      </label>
      <input
        id="personalize-text"
        type="text"
        className="personalize-input"
        placeholder={placeholder || "Escribí algo que quieras llevar con vos..."}
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 20))}
        maxLength={20}
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  )
}
