export const DURUM_VALUES = ['Tahsil edildi', 'Görülmedi', 'Misafir'];

const selectStyles = {
  '': 'text-secondary border-border bg-white',
  'Tahsil edildi': 'text-green border-green/30 bg-green/5',
  'Görülmedi': 'text-amber border-amber/30 bg-amber/5',
  'Misafir': 'text-accent border-accent/30 bg-accent/5',
};

export default function DurumSelect({ value = '', onChange, disabled = false, className = '' }) {
  const style = selectStyles[value] || selectStyles[''];

  return (
    <select
      value={value || ''}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className={`h-7 w-full min-w-[110px] px-1.5 rounded border text-xs font-medium cursor-pointer focus:outline-none focus:border-accent ${style} ${className}`}
      title="Durum değiştir"
    >
      <option value="">—</option>
      {DURUM_VALUES.map((d) => (
        <option key={d} value={d}>{d}</option>
      ))}
    </select>
  );
}
