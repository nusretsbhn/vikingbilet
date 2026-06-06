export const NAVIGABLE_COLS = [
  'tur_tarihi',
  'bilet_no',
  'buyuk_kisi',
  'kucuk_kisi',
  'free_kisi',
  'satis_fiyati',
  'alis_fiyati',
  'otel',
  'isim',
  'gelen_yer',
  'durum',
];

export function getNavigableColumns(visibleColumnIds) {
  return NAVIGABLE_COLS.filter((id) => visibleColumnIds.includes(id));
}

export function focusEntryCell(rowIndex, colId, root = document) {
  const el = root.querySelector(
    `[data-entry-row="${rowIndex}"][data-entry-col="${colId}"]`
  );
  if (!el) return false;
  el.focus();
  if (el.tagName === 'INPUT' && typeof el.select === 'function') {
    const type = el.type;
    if (type === 'text' || type === 'number' || type === 'date') {
      el.select();
    }
  }
  return true;
}

export function handleEntryGridKeyDown(e, { rowIndex, colId, navigableCols, rowCount, onEnter }) {
  if (!navigableCols.includes(colId)) return;

  const colIdx = navigableCols.indexOf(colId);

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (rowIndex + 1 < rowCount) {
      focusEntryCell(rowIndex + 1, colId);
    }
    return;
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (rowIndex > 0) {
      focusEntryCell(rowIndex - 1, colId);
    }
    return;
  }

  if (e.key === 'ArrowRight') {
    e.preventDefault();
    if (colIdx + 1 < navigableCols.length) {
      focusEntryCell(rowIndex, navigableCols[colIdx + 1]);
    }
    return;
  }

  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    if (colIdx > 0) {
      focusEntryCell(rowIndex, navigableCols[colIdx - 1]);
    }
    return;
  }

  if (e.key === 'Enter' && onEnter) {
    e.preventDefault();
    onEnter(rowIndex, colId, e);
  }
}

export function gridCellProps(rowIndex, colId) {
  return {
    'data-entry-row': rowIndex,
    'data-entry-col': colId,
  };
}
