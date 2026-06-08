import { useState, useMemo, useCallback } from 'react';
import AcentaCombobox from './AcentaCombobox';
import Button from '../ui/Button';
import {
  getNavigableColumns,
  handleEntryGridKeyDown,
  focusEntryCell,
  gridCellProps,
} from './entryGridNav';
import { calcKomisyon, parseOptionalPrice, parseMoneyDefaultZero } from '../../utils/format';

export const ENTRY_INPUT_CLASS =
  'h-7 w-full min-w-0 px-1.5 text-xs border border-accent/40 rounded bg-white text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30';

const INITIAL_ROWS = 10;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

let rowKeyCounter = 0;

function createEmptyRow() {
  return {
    key: `bulk-${++rowKeyCounter}`,
    tur_tarihi: '',
    bilet_no: '',
    buyuk_kisi: '',
    kucuk_kisi: '',
    free_kisi: '',
    satis_fiyati: '',
    alis_fiyati: '',
    teknede_odeme: '',
    otel: '',
    isim: '',
    gelen_yer: '',
    durum: '',
  };
}

function createRows(count) {
  return Array.from({ length: count }, () => createEmptyRow());
}

function rowHasData(row) {
  return !!(
    row.tur_tarihi ||
    row.bilet_no ||
    row.buyuk_kisi !== '' ||
    row.kucuk_kisi !== '' ||
    row.free_kisi !== '' ||
    row.satis_fiyati !== '' ||
    row.alis_fiyati !== '' ||
    row.teknede_odeme !== '' ||
    row.otel ||
    row.isim ||
    row.gelen_yer ||
    row.durum
  );
}

function rowIsSavable(row) {
  return !!(row.tur_tarihi && row.alis_fiyati !== '');
}

function lastRowWithDataIndex(rows) {
  let last = -1;
  rows.forEach((r, i) => {
    if (rowHasData(r)) last = i;
  });
  return last;
}

function requiredRowCount(rows) {
  const lastFilled = lastRowWithDataIndex(rows);
  if (lastFilled === -1) return INITIAL_ROWS;
  const withBuffer = lastFilled + 2;
  const afterInitialBlock = lastFilled < INITIAL_ROWS ? INITIAL_ROWS + 1 : INITIAL_ROWS;
  return Math.max(withBuffer, afterInitialBlock);
}

function rowToPayload(row) {
  return {
    tur_tarihi: row.tur_tarihi,
    bilet_no: row.bilet_no || null,
    buyuk_kisi: parseInt(row.buyuk_kisi, 10) || 0,
    kucuk_kisi: parseInt(row.kucuk_kisi, 10) || 0,
    free_kisi: parseInt(row.free_kisi, 10) || 0,
    satis_fiyati: parseOptionalPrice(row.satis_fiyati),
    alis_fiyati: parseOptionalPrice(row.alis_fiyati),
    teknede_odeme: parseMoneyDefaultZero(row.teknede_odeme),
    otel: row.otel || null,
    isim: row.isim || null,
    gelen_yer: row.gelen_yer || null,
    durum: row.durum || null,
  };
}

function EntryCell({ colId, row, rowIndex, onChange, onCellKeyDown }) {
  const inputClass = ENTRY_INPUT_CLASS;
  const handle = (key, value) => onChange(rowIndex, key, value);

  const keyProps = {
    onKeyDown: (e) => onCellKeyDown(e, rowIndex, colId),
  };

  switch (colId) {
    case 'tur_tarihi':
      return (
        <input
          type="date"
          value={row.tur_tarihi}
          onChange={(e) => handle('tur_tarihi', e.target.value)}
          className={inputClass}
          title="Tur tarihi"
          {...gridCellProps(rowIndex, 'tur_tarihi')}
          {...keyProps}
        />
      );
    case 'bilet_no':
      return (
        <input
          type="text"
          value={row.bilet_no}
          onChange={(e) => handle('bilet_no', e.target.value)}
          className={inputClass}
          placeholder="No"
          {...gridCellProps(rowIndex, 'bilet_no')}
          {...keyProps}
        />
      );
    case 'buyuk_kisi':
      return (
        <input
          type="number"
          min="0"
          value={row.buyuk_kisi}
          onChange={(e) => handle('buyuk_kisi', e.target.value)}
          className={`${inputClass} text-right font-data`}
          placeholder="0"
          {...gridCellProps(rowIndex, 'buyuk_kisi')}
          {...keyProps}
        />
      );
    case 'kucuk_kisi':
      return (
        <input
          type="number"
          min="0"
          value={row.kucuk_kisi}
          onChange={(e) => handle('kucuk_kisi', e.target.value)}
          className={`${inputClass} text-right font-data`}
          placeholder="0"
          {...gridCellProps(rowIndex, 'kucuk_kisi')}
          {...keyProps}
        />
      );
    case 'free_kisi':
      return (
        <input
          type="number"
          min="0"
          value={row.free_kisi}
          onChange={(e) => handle('free_kisi', e.target.value)}
          className={`${inputClass} text-right font-data`}
          placeholder="0"
          {...gridCellProps(rowIndex, 'free_kisi')}
          {...keyProps}
        />
      );
    case 'satis_fiyati':
      return (
        <input
          type="number"
          min="0"
          step="0.01"
          value={row.satis_fiyati}
          onChange={(e) => handle('satis_fiyati', e.target.value)}
          className={`${inputClass} text-right font-data`}
          placeholder="0"
          {...gridCellProps(rowIndex, 'satis_fiyati')}
          {...keyProps}
        />
      );
    case 'alis_fiyati':
      return (
        <input
          type="number"
          min="0"
          step="0.01"
          value={row.alis_fiyati}
          onChange={(e) => handle('alis_fiyati', e.target.value)}
          className={`${inputClass} text-right font-data`}
          placeholder="0"
          {...gridCellProps(rowIndex, 'alis_fiyati')}
          {...keyProps}
        />
      );
    case 'teknede_odeme':
      return (
        <input
          type="number"
          min="0"
          step="0.01"
          value={row.teknede_odeme}
          onChange={(e) => handle('teknede_odeme', e.target.value)}
          className={`${inputClass} text-right font-data`}
          placeholder="0"
          {...gridCellProps(rowIndex, 'teknede_odeme')}
          {...keyProps}
        />
      );
    case 'komisyon': {
      const komisyon = calcKomisyon(row.satis_fiyati, row.alis_fiyati);
      return (
        <span className="number-cell text-komisyon text-xs block px-1">
          {komisyon === null ? '—' : komisyon.toFixed(2)}
        </span>
      );
    }
    case 'otel':
      return (
        <input
          type="text"
          value={row.otel}
          onChange={(e) => handle('otel', e.target.value)}
          className={inputClass}
          placeholder="Otel"
          {...gridCellProps(rowIndex, 'otel')}
          {...keyProps}
        />
      );
    case 'isim':
      return (
        <input
          type="text"
          value={row.isim}
          onChange={(e) => handle('isim', e.target.value)}
          className={inputClass}
          placeholder="İsim"
          {...gridCellProps(rowIndex, 'isim')}
          {...keyProps}
        />
      );
    case 'gelen_yer':
      return (
        <AcentaCombobox
          value={row.gelen_yer}
          onChange={(v) => handle('gelen_yer', v)}
          onKeyDown={(e) => onCellKeyDown(e, rowIndex, colId)}
          className={inputClass}
          placeholder="Acenta"
          compact
          gridCellProps={gridCellProps(rowIndex, 'gelen_yer')}
        />
      );
    case 'durum':
      return (
        <input
          type="text"
          value={row.durum}
          onChange={(e) => handle('durum', e.target.value)}
          className={inputClass}
          placeholder="Durum"
          list="bulk-durum-options"
          {...gridCellProps(rowIndex, 'durum')}
          {...keyProps}
        />
      );
    case 'actions':
      return (
        <span className="text-xs text-secondary font-data tabular-nums">{rowIndex + 1}</span>
      );
    default:
      return null;
  }
}

export default function BulkEntryRows({ columns, onSaveBulk, saving, onClose }) {
  const [rows, setRows] = useState(() => createRows(INITIAL_ROWS));
  const [bulkDate, setBulkDate] = useState(todayIso);
  const [rangeDays, setRangeDays] = useState(INITIAL_ROWS);

  const navigableCols = useMemo(
    () => getNavigableColumns(columns.map((c) => c.id)),
    [columns]
  );

  const savableCount = useMemo(
    () => rows.filter(rowIsSavable).length,
    [rows]
  );

  const skippedCount = useMemo(
    () => rows.filter((r) => r.tur_tarihi && r.alis_fiyati === '').length,
    [rows]
  );

  const handleChange = useCallback((rowIndex, key, value) => {
    setRows((prev) => {
      const next = prev.map((row, i) => (i === rowIndex ? { ...row, [key]: value } : row));
      const needed = requiredRowCount(next);
      if (next.length < needed) {
        return [...next, ...createRows(needed - next.length)];
      }
      return next;
    });
  }, []);

  const handleCellKeyDown = useCallback((e, rowIndex, colId) => {
    handleEntryGridKeyDown(e, {
      rowIndex,
      colId,
      navigableCols,
      rowCount: rows.length,
      onEnter: (rIdx, cId) => {
        if (rIdx + 1 < rows.length) {
          focusEntryCell(rIdx + 1, cId);
        }
      },
    });
  }, [navigableCols, rows.length]);

  const applyDateToRows = useCallback((mode) => {
    setRows((prev) =>
      prev.map((row) => {
        if (mode === 'empty' && row.tur_tarihi) return row;
        return { ...row, tur_tarihi: bulkDate };
      })
    );
  }, [bulkDate]);

  const copyFirstRowDate = useCallback(() => {
    setRows((prev) => {
      const source = prev[0]?.tur_tarihi;
      if (!source) return prev;
      return prev.map((row, i) => (i === 0 ? row : { ...row, tur_tarihi: source }));
    });
  }, []);

  const applySequentialDates = useCallback(() => {
    const count = Math.min(Math.max(1, rangeDays), rows.length);
    setRows((prev) =>
      prev.map((row, i) =>
        i < count ? { ...row, tur_tarihi: addDays(bulkDate, i) } : row
      )
    );
  }, [bulkDate, rangeDays, rows.length]);

  const handleClear = () => {
    setRows(createRows(INITIAL_ROWS));
    setBulkDate(todayIso());
    setRangeDays(INITIAL_ROWS);
  };

  const handleSaveAll = async () => {
    const payloads = rows.filter(rowIsSavable).map(rowToPayload);
    if (payloads.length === 0 || saving) return;
    try {
      await onSaveBulk(payloads);
      setRows(createRows(INITIAL_ROWS));
    } catch {
      // toast üst bileşende
    }
  };

  const onToolbarKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSaveAll();
    }
  };

  return (
    <>
      <datalist id="bulk-durum-options">
        <option value="Tahsil edildi" />
        <option value="Görülmedi" />
        <option value="Misafir" />
      </datalist>

      <tr className="bg-blue-50/80 border-b border-accent/30">
        <td colSpan={columns.length} className="py-2 px-3">
          <div
            className="flex flex-col gap-2"
            onKeyDown={onToolbarKeyDown}
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold text-accent uppercase tracking-wide">
                Toplu Giriş
              </span>
              <span className="text-xs text-secondary">
                Ok tuşları gezin · Tab/Enter ↓ alt satır · Ctrl+Enter kaydet · {savableCount} kayıt hazır
                {skippedCount > 0 ? ` · ${skippedCount} satır alış fiyatı boş (yoksayılacak)` : ''}
              </span>
              <div className="flex-1" />
              <Button size="sm" variant="ghost" onClick={handleClear} disabled={saving}>
                Temizle
              </Button>
              <Button
                size="sm"
                onClick={handleSaveAll}
                disabled={saving || savableCount === 0}
              >
                {saving ? 'Kaydediliyor...' : `${savableCount} Bilet Kaydet`}
              </Button>
              <Button size="sm" variant="ghost" onClick={onClose} disabled={saving}>
                Kapat
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-accent/20">
              <span className="text-xs font-medium text-secondary">Tur tarihi</span>
              <input
                type="date"
                value={bulkDate}
                onChange={(e) => setBulkDate(e.target.value)}
                className="h-7 px-2 text-xs border border-border rounded bg-white text-primary focus:outline-none focus:border-accent"
                title="Toplu uygulanacak tur tarihi"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => applyDateToRows('all')}
                disabled={!bulkDate || saving}
                title="Seçili tarihi tüm satırlara yazar"
              >
                Tüm satırlara
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => applyDateToRows('empty')}
                disabled={!bulkDate || saving}
                title="Sadece tarihi boş satırlara yazar"
              >
                Boş satırlara
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={copyFirstRowDate}
                disabled={saving || !rows[0]?.tur_tarihi}
                title="1. satırdaki tarihi diğer tüm satırlara kopyalar"
              >
                1. satırdan kopyala
              </Button>
              <span className="text-secondary text-xs mx-1">|</span>
              <span className="text-xs text-secondary">Ardışık</span>
              <input
                type="number"
                min="1"
                max={rows.length}
                value={rangeDays}
                onChange={(e) => setRangeDays(Number(e.target.value) || 1)}
                className="h-7 w-12 px-1.5 text-xs text-center border border-border rounded bg-white font-data"
                title="Kaç satıra ardışık tarih yazılacak"
              />
              <span className="text-xs text-secondary">gün</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={applySequentialDates}
                disabled={!bulkDate || saving}
                title="İlk satıra seçili tarih, sonrakilere +1 gün"
              >
                Ardışık uygula
              </Button>
            </div>
          </div>
        </td>
      </tr>

      {rows.map((row, rowIndex) => (
        <tr
          key={row.key}
          className={`border-b border-accent/20 ${
            rowHasData(row) ? 'bg-blue-50' : 'bg-blue-50/40'
          }`}
        >
          {columns.map((col) => (
            <td key={col.id} style={{ width: col.getSize(), minWidth: col.getSize() }} className="py-0.5 px-0.5">
              <EntryCell
                colId={col.id}
                row={row}
                rowIndex={rowIndex}
                onChange={handleChange}
                onCellKeyDown={handleCellKeyDown}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
