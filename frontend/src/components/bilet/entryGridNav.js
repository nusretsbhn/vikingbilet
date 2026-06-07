export const NAVIGABLE_COLS = [
  'tur_tarihi',
  'bilet_no',
  'buyuk_kisi',
  'kucuk_kisi',
  'free_kisi',
  'satis_fiyati',
  'alis_fiyati',
  'teknede_odeme',
  'otel',
  'isim',
  'gelen_yer',
  'durum',
];

export function getNavigableColumns(visibleColumnIds) {
  return NAVIGABLE_COLS.filter((id) => visibleColumnIds.includes(id));
}

function isElementVisible(el) {
  if (!(el instanceof HTMLElement)) return false;

  let node = el;
  while (node) {
    const style = window.getComputedStyle(node);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    node = node.parentElement;
  }

  return el.getClientRects().length > 0;
}

export function focusEntryCell(rowIndex, colId, root = document) {
  const nodes = root.querySelectorAll(
    `[data-entry-row="${rowIndex}"][data-entry-col="${colId}"]`
  );

  for (const el of nodes) {
    if (!isElementVisible(el)) continue;
    el.focus();
    if (el.tagName === 'INPUT' && typeof el.select === 'function') {
      const type = el.type;
      if (type === 'text' || type === 'number' || type === 'date') {
        el.select();
      }
    }
    return true;
  }

  return false;
}

function focusAdjacentCell(rowIndex, colId, direction, navigableCols, rowCount, root) {
  const colIdx = navigableCols.indexOf(colId);
  if (colIdx === -1) return false;

  if (direction === 'next') {
    if (colIdx + 1 < navigableCols.length) {
      return focusEntryCell(rowIndex, navigableCols[colIdx + 1], root);
    }
    if (rowIndex + 1 < rowCount) {
      return focusEntryCell(rowIndex + 1, navigableCols[0], root);
    }
    return false;
  }

  if (colIdx > 0) {
    return focusEntryCell(rowIndex, navigableCols[colIdx - 1], root);
  }
  if (rowIndex > 0) {
    return focusEntryCell(rowIndex - 1, navigableCols[navigableCols.length - 1], root);
  }
  return false;
}

export function handleEntryGridKeyDown(e, { rowIndex, colId, navigableCols, rowCount, onEnter, root }) {
  if (!navigableCols.includes(colId)) return;

  const colIdx = navigableCols.indexOf(colId);

  if (e.key === 'Tab') {
    e.preventDefault();
    focusAdjacentCell(
      rowIndex,
      colId,
      e.shiftKey ? 'prev' : 'next',
      navigableCols,
      rowCount,
      root
    );
    return;
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (rowIndex + 1 < rowCount) {
      focusEntryCell(rowIndex + 1, colId, root);
    }
    return;
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (rowIndex > 0) {
      focusEntryCell(rowIndex - 1, colId, root);
    }
    return;
  }

  if (e.key === 'ArrowRight') {
    e.preventDefault();
    if (colIdx + 1 < navigableCols.length) {
      focusEntryCell(rowIndex, navigableCols[colIdx + 1], root);
    }
    return;
  }

  if (e.key === 'ArrowLeft') {
    e.preventDefault();
    if (colIdx > 0) {
      focusEntryCell(rowIndex, navigableCols[colIdx - 1], root);
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
