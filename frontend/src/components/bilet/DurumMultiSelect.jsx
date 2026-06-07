import { DURUM_VALUES } from './DurumSelect';

export const DURUM_EMPTY_VALUE = '__bos__';

const OPTIONS = [
  ...DURUM_VALUES.map((d) => ({ value: d, label: d })),
  { value: DURUM_EMPTY_VALUE, label: 'Belirtilmemiş' },
];

export default function DurumMultiSelect({ value = [], onChange, className = '' }) {
  const selected = new Set(value);

  const toggle = (optionValue) => {
    const next = new Set(selected);
    if (next.has(optionValue)) next.delete(optionValue);
    else next.add(optionValue);
    onChange(Array.from(next));
  };

  return (
    <div className={className}>
      <label className="text-xs text-secondary font-medium block mb-1.5">Bilet Durumu</label>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((opt) => {
          const checked = selected.has(opt.value);
          const colorClass =
            opt.value === 'Tahsil edildi' ? 'border-green/40 text-green' :
            opt.value === 'Görülmedi' ? 'border-amber/40 text-amber' :
            opt.value === 'Misafir' ? 'border-accent/40 text-accent' :
            'border-border text-secondary';

          return (
            <label
              key={opt.value}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs cursor-pointer select-none transition-colors ${
                checked ? `bg-accent/10 ${colorClass}` : 'bg-white border-border text-secondary hover:bg-row-hover'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(opt.value)}
                className="rounded border-border text-accent focus:ring-accent/30"
              />
              {opt.label}
            </label>
          );
        })}
      </div>
      <p className="text-[10px] text-dim mt-1.5">
        Hiçbiri seçilmezse tüm durumlar dahil edilir.
      </p>
    </div>
  );
}
