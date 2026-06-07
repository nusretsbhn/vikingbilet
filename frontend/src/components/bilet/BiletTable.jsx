import { useState, useMemo } from 'react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { fmtTL, fmtDate, fmtNum } from '../../utils/format';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import BulkEntryRows from './BulkEntryRows';
import QuickEntryRow from './QuickEntryRow';
import BiletMobileList from './BiletMobileList';
import DurumSelect from './DurumSelect';

const DEFAULT_VISIBILITY = {
  otel: true,
  isim: true,
  gelen_yer: true,
  durum: true,
  free_kisi: true,
};

const EDITABLE_FIELDS = {
  tur_tarihi: { type: 'date' },
  bilet_no: { type: 'text' },
  buyuk_kisi: { type: 'number' },
  kucuk_kisi: { type: 'number' },
  free_kisi: { type: 'number' },
  satis_fiyati: { type: 'number' },
  alis_fiyati: { type: 'number' },
  otel: { type: 'text' },
  isim: { type: 'text' },
  gelen_yer: { type: 'text' },
};

function EditableCell({ row, columnId, value, canEdit, editingCell, editValue, setEditValue, startInlineEdit, saveInlineEdit, cancelInlineEdit, fieldType }) {
  const isEditing = editingCell?.rowId === row.id && editingCell?.columnId === columnId;

  if (isEditing) {
    return (
      <input
        autoFocus
        type={fieldType}
        step={fieldType === 'number' ? '0.01' : undefined}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={() => saveInlineEdit(row.original)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') saveInlineEdit(row.original);
          if (e.key === 'Escape') cancelInlineEdit();
        }}
        className="h-6 px-1 bg-white border border-border-focus rounded text-xs w-full"
      />
    );
  }

  return (
    <span
      onDoubleClick={() => canEdit && startInlineEdit(row.id, columnId, value)}
      className={canEdit ? 'cursor-pointer' : ''}
    >
      {value}
    </span>
  );
}

const sortable = ['tur_tarihi', 'bilet_no', 'buyuk_kisi', 'kucuk_kisi', 'satis_fiyati', 'alis_fiyati', 'komisyon'];

function renderTotalCell(colId, totals) {
  switch (colId) {
    case 'tur_tarihi':
      return <span className="font-semibold text-xs text-primary">Toplam</span>;
    case 'buyuk_kisi':
      return <span className="number-cell font-semibold">{fmtNum(totals.buyuk_kisi)}</span>;
    case 'kucuk_kisi':
      return <span className="number-cell font-semibold">{fmtNum(totals.kucuk_kisi)}</span>;
    case 'free_kisi':
      return <span className="number-cell font-semibold">{fmtNum(totals.free_kisi)}</span>;
    case 'satis_fiyati':
      return <span className="number-cell font-semibold">{fmtTL(totals.satis_fiyati)}</span>;
    case 'alis_fiyati':
      return <span className="number-cell font-semibold">{fmtTL(totals.alis_fiyati)}</span>;
    case 'komisyon':
      return <span className="number-cell font-semibold text-komisyon">{fmtTL(totals.komisyon)}</span>;
    default:
      return null;
  }
}

export default function BiletTable({
  data,
  totals,
  pagination,
  filters,
  onFilter,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  onInlineSave,
  onBulkCreate,
  bulkSaving,
  bulkMode,
  onBulkModeClose,
  bulkSessionKey,
  onQuickCreate,
  quickSaving,
}) {
  const [editingCell, setEditingCell] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [columnVisibility, setColumnVisibility] = useState(DEFAULT_VISIBILITY);
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const startInlineEdit = (rowId, columnId, value) => {
    if (!canEdit || !EDITABLE_FIELDS[columnId]) return;
    setEditingCell({ rowId, columnId });
    if (columnId === 'tur_tarihi') {
      setEditValue(value?.slice?.(0, 10) || value || '');
    } else {
      setEditValue(value ?? '');
    }
  };

  const cancelInlineEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const saveInlineEdit = async (row) => {
    if (!editingCell) return;
    const { columnId } = editingCell;
    let val = editValue;
    if (EDITABLE_FIELDS[columnId]?.type === 'number') {
      val = columnId.includes('kisi')
        ? parseInt(editValue, 10) || 0
        : parseFloat(editValue) || 0;
    }
    try {
      await onInlineSave(row.id, { [columnId]: val });
    } finally {
      cancelInlineEdit();
    }
  };

  const renderEditable = (row, columnId, display, rawValue) => (
    <EditableCell
      row={row}
      columnId={columnId}
      value={display}
      canEdit={canEdit}
      editingCell={editingCell}
      editValue={editValue}
      setEditValue={setEditValue}
      startInlineEdit={startInlineEdit}
      saveInlineEdit={saveInlineEdit}
      cancelInlineEdit={cancelInlineEdit}
      fieldType={EDITABLE_FIELDS[columnId]?.type || 'text'}
    />
  );

  const columns = useMemo(() => [
    {
      id: 'tur_tarihi',
      header: 'Tarih',
      accessorKey: 'tur_tarihi',
      size: 110,
      cell: ({ row, getValue }) =>
        renderEditable(row, 'tur_tarihi', fmtDate(getValue()), getValue()),
    },
    {
      id: 'bilet_no',
      header: 'Bilet No',
      accessorKey: 'bilet_no',
      size: 100,
      cell: ({ row, getValue }) =>
        renderEditable(row, 'bilet_no', getValue() || '—', getValue()),
    },
    {
      id: 'buyuk_kisi',
      header: 'Büyük',
      accessorKey: 'buyuk_kisi',
      size: 70,
      cell: ({ row, getValue }) =>
        renderEditable(row, 'buyuk_kisi', fmtNum(getValue()), getValue()),
    },
    {
      id: 'kucuk_kisi',
      header: 'Küçük',
      accessorKey: 'kucuk_kisi',
      size: 70,
      cell: ({ row, getValue }) =>
        renderEditable(row, 'kucuk_kisi', fmtNum(getValue()), getValue()),
    },
    {
      id: 'free_kisi',
      header: 'Free',
      accessorKey: 'free_kisi',
      size: 60,
      cell: ({ row, getValue }) =>
        renderEditable(row, 'free_kisi', fmtNum(getValue()), getValue()),
    },
    {
      id: 'satis_fiyati',
      header: 'Satış (₺)',
      accessorKey: 'satis_fiyati',
      size: 100,
      cell: ({ row, getValue }) =>
        renderEditable(row, 'satis_fiyati', fmtTL(getValue()), getValue()),
    },
    {
      id: 'alis_fiyati',
      header: 'Alış (₺)',
      accessorKey: 'alis_fiyati',
      size: 100,
      cell: ({ row, getValue }) =>
        renderEditable(row, 'alis_fiyati', fmtTL(getValue()), getValue()),
    },
    {
      id: 'komisyon',
      header: 'Komisyon (₺)',
      accessorKey: 'komisyon',
      size: 110,
      cell: ({ getValue }) => <span className="number-cell text-komisyon">{fmtTL(getValue())}</span>,
    },
    {
      id: 'otel',
      header: 'Otel',
      accessorKey: 'otel',
      size: 150,
      minSize: 120,
      cell: ({ row, getValue }) =>
        renderEditable(row, 'otel', getValue() || '—', getValue()),
    },
    {
      id: 'isim',
      header: 'İsim',
      accessorKey: 'isim',
      size: 180,
      minSize: 140,
      cell: ({ row, getValue }) =>
        renderEditable(row, 'isim', getValue() || '—', getValue()),
    },
    {
      id: 'gelen_yer',
      header: 'Acenta',
      accessorKey: 'gelen_yer',
      size: 165,
      minSize: 130,
      cell: ({ row, getValue }) =>
        renderEditable(row, 'gelen_yer', getValue() || '—', getValue()),
    },
    {
      id: 'durum',
      header: 'Durum',
      accessorKey: 'durum',
      size: 130,
      minSize: 100,
      cell: ({ row, getValue }) => {
        const current = getValue() || '';
        if (!canEdit) {
          return <Badge>{current || '—'}</Badge>;
        }
        return (
          <DurumSelect
            value={current}
            onChange={(durum) => {
              const next = durum || null;
              if ((row.original.durum || null) === next) return;
              onInlineSave(row.original.id, { durum: next });
            }}
          />
        );
      },
    },
    {
      id: 'actions',
      header: 'İşlemler',
      size: 80,
      enableResizing: false,
      cell: ({ row }) => (
        <div className="flex gap-1">
          {canEdit && (
            <button onClick={() => onEdit(row.original)} className="text-secondary hover:text-accent text-xs px-1" title="Düzenle">✎</button>
          )}
          {canDelete && (
            <button onClick={() => onDelete(row.original.id)} className="text-secondary hover:text-red text-xs px-1" title="Sil">✕</button>
          )}
        </div>
      ),
    },
  ], [canEdit, canDelete, editingCell, editValue, onEdit, onDelete, onInlineSave]);

  const table = useReactTable({
    data: data || [],
    columns,
    state: { columnVisibility },
    onColumnVisibilityChange: setColumnVisibility,
    columnResizeMode: 'onChange',
    enableColumnResizing: true,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  const toggleSort = (columnId) => {
    let sort_dir = 'asc';
    if (filters.sort_by === columnId) {
      if (filters.sort_dir === 'asc') sort_dir = 'desc';
      else if (filters.sort_dir === 'desc') {
        onFilter({ ...filters, sort_by: 'tur_tarihi', sort_dir: 'desc', page: filters.page });
        return;
      }
    }
    onFilter({ ...filters, sort_by: columnId, sort_dir, page: '1' });
  };

  const sortIcon = (columnId) => {
    if (filters.sort_by !== columnId) return '↕';
    return filters.sort_dir === 'asc' ? '↑' : '↓';
  };

  const { page, total, totalPages } = pagination;
  const showTotals = total > 0 && totals;

  const toggleableColumns = table.getAllLeafColumns().filter((c) => c.id !== 'actions');

  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      {/* Mobil görünüm */}
      <div className="lg:hidden" {...(isDesktop ? { inert: '' } : {})}>
        {canEdit && bulkMode && (
          <div className="px-3 py-2 bg-amber/10 border-b border-amber/30 text-xs text-amber">
            Toplu giriş mobilde yatay kaydırmalı tabloda açılır. Daha rahat kullanım için cihazı yatay çevirebilirsiniz.
          </div>
        )}
        {canEdit && bulkMode && onBulkCreate && (
          <div className="overflow-x-auto -mx-px">
            <table className="data-table w-full min-w-[1280px]">
              <thead>
                {table.getHeaderGroups().map((hg) => (
                  <tr key={hg.id}>
                    {hg.headers.map((header) => (
                      <th key={header.id} style={{ width: header.getSize(), minWidth: header.getSize() }}>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                <BulkEntryRows
                  key={bulkSessionKey}
                  columns={table.getVisibleLeafColumns()}
                  onSaveBulk={onBulkCreate}
                  saving={bulkSaving}
                  onClose={onBulkModeClose}
                />
              </tbody>
            </table>
          </div>
        )}
        {!bulkMode && (
          <BiletMobileList
            data={data}
            totals={totals}
            filteredTotal={total}
            canEdit={canEdit}
            canDelete={canDelete}
            onEdit={onEdit}
            onDelete={onDelete}
            onInlineSave={onInlineSave}
            filters={filters}
            onFilter={onFilter}
            sortable={sortable}
            sortIcon={sortIcon}
            toggleSort={toggleSort}
          />
        )}
      </div>

      {/* Masaüstü görünüm */}
      <div className="hidden lg:block" {...(!isDesktop ? { inert: '' } : {})}>
      <div className="flex justify-end px-3 py-2 border-b border-border relative">
        <Button size="sm" variant="ghost" onClick={() => setColumnMenuOpen(!columnMenuOpen)}>
          Sütunlar ▾
        </Button>
        {columnMenuOpen && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setColumnMenuOpen(false)} />
            <div className="absolute right-3 top-full mt-1 z-30 bg-header border border-border rounded-lg shadow-xl p-2 min-w-[160px]">
              {toggleableColumns.map((col) => (
                <label key={col.id} className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-row-hover rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={col.getIsVisible()}
                    onChange={col.getToggleVisibilityHandler()}
                    className="rounded border-border"
                  />
                  {col.columnDef.header}
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="overflow-x-auto max-h-[calc(100vh-320px)]">
        <table
          className="data-table"
          style={{ width: table.getCenterTotalSize(), minWidth: table.getCenterTotalSize() }}
        >
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{ width: header.getSize(), minWidth: header.getSize(), position: 'relative' }}
                    className={`${sortable.includes(header.column.id) ? 'cursor-pointer select-none hover:text-primary' : ''}`}
                    onClick={sortable.includes(header.column.id) ? () => toggleSort(header.column.id) : undefined}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {sortable.includes(header.column.id) && (
                      <span className="ml-1 text-dim">{sortIcon(header.column.id)}</span>
                    )}
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`absolute right-0 top-0 h-full w-1 cursor-col-resize select-none touch-none hover:bg-accent ${
                          header.column.getIsResizing() ? 'bg-accent' : 'bg-transparent'
                        }`}
                      />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {canEdit && bulkMode && onBulkCreate && (
              <BulkEntryRows
                key={bulkSessionKey}
                columns={table.getVisibleLeafColumns()}
                onSaveBulk={onBulkCreate}
                saving={bulkSaving}
                onClose={onBulkModeClose}
              />
            )}
            {canEdit && !bulkMode && onQuickCreate && (
              <QuickEntryRow
                columns={table.getVisibleLeafColumns()}
                onSave={onQuickCreate}
                saving={quickSaving}
              />
            )}
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} style={{ width: cell.column.getSize(), minWidth: cell.column.getSize() }}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
            {data?.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="text-center text-secondary py-8">
                  Kayıt bulunamadı
                </td>
              </tr>
            )}
          </tbody>
          {showTotals && (
            <tfoot className="sticky bottom-0 z-10 bg-header border-t-2 border-accent/30 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
              <tr>
                {table.getVisibleLeafColumns().map((col) => (
                  <td
                    key={col.id}
                    style={{ width: col.getSize(), minWidth: col.getSize() }}
                    className="py-2 px-1.5 text-xs"
                  >
                    {renderTotalCell(col.id, totals)}
                  </td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-3 sm:px-4 py-3 border-t border-border text-xs sm:text-sm text-secondary">
        <div className="text-center sm:text-left">{total} kayıt · Sayfa {page}/{totalPages}</div>
        <div className="flex items-center justify-center gap-2">
          <select
            value={filters.limit}
            onChange={(e) => onFilter({ ...filters, limit: e.target.value, page: '1' })}
            className="h-7 px-2 rounded border border-border bg-white text-primary text-xs"
          >
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="200">200</option>
            <option value="all">Tümü</option>
          </select>
          <Button size="sm" disabled={page <= 1} onClick={() => onFilter({ ...filters, page: String(page - 1) })}>
            Önceki
          </Button>
          <Button size="sm" disabled={page >= totalPages} onClick={() => onFilter({ ...filters, page: String(page + 1) })}>
            Sonraki
          </Button>
        </div>
      </div>
    </div>
  );
}
