import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { fmtDate } from '../../utils/format';

const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const WEEKDAYS = ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'];

function toIso(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function parseSelected(value) {
  if (!value) return [];
  return value.split(',').map((d) => d.trim()).filter(Boolean).sort();
}

function getMonthGrid(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells = [];

  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(toIso(year, month, day));
  }

  return cells;
}

export default function MultiDatePicker({ value = '', onChange, className = '' }) {
  const selected = useMemo(() => parseSelected(value), [value]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const todayIso = useMemo(() => toIso(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate()
  ), []);

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [menuStyle, setMenuStyle] = useState(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const width = Math.min(280, window.innerWidth - 16);
    let left = rect.left;
    if (left + width > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - width - 8);
    }

    const spaceBelow = window.innerHeight - rect.bottom;
    const panelHeight = 360;
    const openUp = spaceBelow < panelHeight && rect.top > panelHeight;

    setMenuStyle({
      left,
      width,
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    });
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    updateMenuPosition();
    window.addEventListener('scroll', updateMenuPosition, true);
    window.addEventListener('resize', updateMenuPosition);
    return () => {
      window.removeEventListener('scroll', updateMenuPosition, true);
      window.removeEventListener('resize', updateMenuPosition);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (
        rootRef.current?.contains(e.target) ||
        panelRef.current?.contains(e.target)
      ) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  useEffect(() => {
    if (selected.length === 0) return;
    const [y, m] = selected[selected.length - 1].split('-').map(Number);
    setViewYear(y);
    setViewMonth(m - 1);
  }, [selected]);

  const cells = useMemo(
    () => getMonthGrid(viewYear, viewMonth),
    [viewYear, viewMonth]
  );

  const toggleDate = (iso) => {
    const next = selectedSet.has(iso)
      ? selected.filter((d) => d !== iso)
      : [...selected, iso].sort();
    onChange(next.join(','));
  };

  const clearAll = () => onChange('');

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const triggerLabel = selected.length === 0
    ? 'Tur tarihi seç...'
    : selected.length === 1
      ? fmtDate(selected[0])
      : `${selected.length} gün seçili`;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <label className="text-xs text-secondary font-medium block mb-1">Tur Tarihleri</label>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`h-[30px] w-full px-2.5 rounded border text-sm text-left flex items-center justify-between gap-2 focus:outline-none focus:border-border-focus ${
          selected.length > 0
            ? 'border-accent/50 bg-accent/5 text-primary'
            : 'border-border bg-white text-secondary'
        }`}
      >
        <span className="truncate">{triggerLabel}</span>
        <span className="text-dim shrink-0">{open ? '▴' : '▾'}</span>
      </button>

      {open && menuStyle && createPortal(
        <div
          ref={panelRef}
          style={{
            position: 'fixed',
            left: menuStyle.left,
            width: menuStyle.width,
            top: menuStyle.top,
            bottom: menuStyle.bottom,
            zIndex: 9999,
          }}
          className="bg-white border border-border rounded-lg shadow-xl p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={prevMonth} className="px-2 py-1 text-sm hover:bg-row-hover rounded">‹</button>
            <span className="text-sm font-semibold text-primary">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} className="px-2 py-1 text-sm hover:bg-row-hover rounded">›</button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-[10px] text-center text-dim font-medium py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((iso, i) => {
              if (!iso) return <div key={`empty-${i}`} />;
              const isSelected = selectedSet.has(iso);
              const isToday = iso === todayIso;
              return (
                <button
                  key={iso}
                  type="button"
                  onClick={() => toggleDate(iso)}
                  className={`h-8 rounded text-xs font-data transition-colors ${
                    isSelected
                      ? 'bg-accent text-white font-semibold'
                      : isToday
                        ? 'ring-1 ring-accent/40 text-accent hover:bg-accent/10'
                        : 'text-primary hover:bg-row-hover'
                  }`}
                >
                  {parseInt(iso.slice(8, 10), 10)}
                </button>
              );
            })}
          </div>

          {selected.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border space-y-2">
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {selected.map((iso) => (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => toggleDate(iso)}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[11px] hover:bg-accent/20"
                    title="Kaldır"
                  >
                    {fmtDate(iso)}
                    <span className="opacity-70">×</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={clearAll}
                className="text-xs text-secondary hover:text-red"
              >
                Tümünü temizle
              </button>
            </div>
          )}

          <p className="mt-2 text-[10px] text-dim leading-snug">
            Günleri tek tek seçin. Sadece seçili günler listelenir.
          </p>
        </div>,
        document.body
      )}
    </div>
  );
}
