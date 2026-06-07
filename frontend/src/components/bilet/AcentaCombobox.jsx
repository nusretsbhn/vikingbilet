import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchAcentaList } from '../../api/tahsilat';

const DROPDOWN_MAX_H = 160;
const MENU_PAD_X = 24;
const VIEWPORT_MARGIN = 8;

let measureCanvas;

function measureTextWidth(text, font) {
  if (!text) return 0;
  measureCanvas = measureCanvas || document.createElement('canvas');
  const ctx = measureCanvas.getContext('2d');
  ctx.font = font;
  return ctx.measureText(text).width;
}

function calcDropdownLayout(input, labels) {
  const rect = input.getBoundingClientRect();
  const style = window.getComputedStyle(input);
  const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const openUp = spaceBelow < DROPDOWN_MAX_H + 8 && spaceAbove > spaceBelow;

  let contentW = rect.width;
  labels.forEach((label) => {
    contentW = Math.max(contentW, measureTextWidth(label, font) + MENU_PAD_X);
  });

  const maxW = window.innerWidth - VIEWPORT_MARGIN * 2;
  const width = Math.min(Math.max(rect.width, Math.ceil(contentW)), maxW);

  let left = rect.left;
  if (left + width > window.innerWidth - VIEWPORT_MARGIN) {
    left = Math.max(VIEWPORT_MARGIN, window.innerWidth - VIEWPORT_MARGIN - width);
  }

  return {
    left,
    width,
    ...(openUp
      ? { bottom: window.innerHeight - rect.top + 4 }
      : { top: rect.bottom + 4 }),
    maxHeight: Math.min(
      DROPDOWN_MAX_H,
      openUp ? spaceAbove - 8 : spaceBelow - 8
    ),
  };
}

export default function AcentaCombobox({
  value = '',
  onChange,
  onKeyDown,
  className = '',
  placeholder = 'Acenta',
  inputRef,
  compact = false,
  showNewHint = true,
  gridCellProps: gridCellPropsAttr = {},
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [menuStyle, setMenuStyle] = useState(null);
  const wrapperRef = useRef(null);
  const listRef = useRef(null);
  const localInputRef = useRef(null);

  const setRefs = useCallback(
    (el) => {
      localInputRef.current = el;
      if (typeof inputRef === 'function') inputRef(el);
      else if (inputRef) inputRef.current = el;
    },
    [inputRef]
  );

  const { data } = useQuery({
    queryKey: ['tahsilat', 'acenta-list'],
    queryFn: fetchAcentaList,
  });

  const acentalar = data?.acentalar || [];

  const filtered = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return acentalar;
    return acentalar.filter((a) => a.toLowerCase().includes(q));
  }, [acentalar, value]);

  const isNew = showNewHint &&
    value.trim().length > 0 &&
    !acentalar.some((a) => a.toLowerCase() === value.trim().toLowerCase());

  const updateMenuPosition = useCallback(() => {
    const input = localInputRef.current;
    if (!input) return;

    const labels = [...filtered];
    if (isNew) {
      labels.push(`+ Yeni acenta: ${value.trim()}`);
    }

    setMenuStyle(calcDropdownLayout(input, labels));
  }, [filtered, isNew, value]);

  useEffect(() => {
    setHighlight(0);
  }, [value, filtered.length]);

  useEffect(() => {
    if (!open) return undefined;

    updateMenuPosition();
    window.addEventListener('scroll', updateMenuPosition, true);
    window.addEventListener('resize', updateMenuPosition);

    return () => {
      window.removeEventListener('scroll', updateMenuPosition, true);
      window.removeEventListener('resize', updateMenuPosition);
    };
  }, [open, updateMenuPosition, filtered.length, isNew]);

  useEffect(() => {
    const handler = (e) => {
      if (
        wrapperRef.current?.contains(e.target) ||
        listRef.current?.contains(e.target)
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
  }, []);

  const selectOption = (name) => {
    onChange(name);
    setOpen(false);
    localInputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (open && filtered.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlight((h) => Math.min(h + 1, filtered.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlight((h) => Math.max(h - 1, 0));
        return;
      }
      if (e.key === 'Enter' && filtered[highlight]) {
        e.preventDefault();
        selectOption(filtered[highlight]);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        return;
      }
      if (e.key === 'Tab' && !e.shiftKey) {
        setOpen(false);
      }
    }
    onKeyDown?.(e);
  };

  useEffect(() => {
    if (open && listRef.current) {
      const el = listRef.current.children[highlight];
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlight, open]);

  const inputCls = compact
    ? className
    : `h-[30px] w-full px-2.5 rounded border border-border bg-white text-primary text-sm placeholder:text-dim focus:outline-none focus:border-border-focus ${className}`;

  const showMenu = open && (filtered.length > 0 || isNew) && menuStyle;

  const dropdown = showMenu
    ? createPortal(
        <div
          ref={listRef}
          style={{
            position: 'fixed',
            left: menuStyle.left,
            width: menuStyle.width,
            top: menuStyle.top,
            bottom: menuStyle.bottom,
            maxHeight: menuStyle.maxHeight,
            zIndex: 9999,
          }}
          className="overflow-y-auto overflow-x-hidden bg-white border border-border rounded-md shadow-xl"
        >
          {filtered.map((a, i) => (
            <button
              key={a}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onTouchEnd={(e) => {
                e.preventDefault();
                selectOption(a);
              }}
              onClick={() => selectOption(a)}
              className={`block w-full text-left px-2.5 py-2.5 text-xs sm:py-1.5 whitespace-nowrap hover:bg-row-hover active:bg-row-hover ${
                i === highlight ? 'bg-accent/10 text-accent' : 'text-primary'
              }`}
            >
              {a}
            </button>
          ))}
          {isNew && (
            <div className="px-2.5 py-2 text-xs text-green border-t border-border bg-green/5 whitespace-nowrap">
              + Yeni acenta: <strong>{value.trim()}</strong>
            </div>
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        ref={setRefs}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className={inputCls}
        placeholder={placeholder}
        autoComplete="off"
        {...gridCellPropsAttr}
      />
      {dropdown}
    </div>
  );
}
