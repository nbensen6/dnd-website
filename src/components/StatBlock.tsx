'use client'

interface StatBlockProps {
  label: string
  value: number
  onChange?: (value: number) => void
  editable?: boolean
}

export function getModifier(score: number): number {
  return Math.floor((score - 10) / 2)
}

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`
}

export default function StatBlock({ label, value, onChange, editable = false }: StatBlockProps) {
  const modifier = getModifier(value)

  return (
    <div className="stat-block">
      <div className="stat-label">{label}</div>
      {editable && onChange ? (
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          className="stat-value w-16 text-center bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[var(--gold)]"
          min={1}
          max={30}
        />
      ) : (
        <div className="stat-value">{value}</div>
      )}
      <div className="stat-modifier">{formatModifier(modifier)}</div>
    </div>
  )
}
