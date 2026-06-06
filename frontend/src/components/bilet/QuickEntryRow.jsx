import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import AcentaCombobox from './AcentaCombobox';
import {
  getNavigableColumns,
  handleEntryGridKeyDown,
  gridCellProps,
} from './entryGridNav';

const EMPTY = () => ({
  tur_tarihi: new Date().toISOString().slice(0, 10),
  bilet_no: '',
  buyuk_kisi: '',
  kucuk_kisi: '',
  free_kisi: '',
  satis_fiyati: '',
  alis_fiyati: '',
  otel: '',
  isim: '',
  gelen_yer: '',
  durum: '',
});

const inputClass =
  'h-7 w-full px-1.5 text-xs border border-accent/40 rounded bg-white text-primary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30';

export default function QuickEntryRow({ columns, onSave, saving }) {
  const [form, setForm] = useState(EMPTY);
  const firstRef = useRef(null);

  const navigableCols = useMemo(
    () => getNavigableColumns(columns.map((c) => c.id)),
    [columns]
  );

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  const reset = useCallback(() => {
    setForm(EMPTY());
    setTimeout(() => firstRef.current?.focus(), 0);
  }, []);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.tur_tarihi || saving) return;

    const payload = {
      tur_tarihi: form.tur_tarihi,
      bilet_no: form.bilet_no || null,
      buyuk_kisi: parseInt(form.buyuk_kisi, 10) || 0,
      kucuk_kisi: parseInt(form.kucuk_kisi, 10) || 0,
      free_kisi: parseInt(form.free_kisi, 10) || 0,
      satis_fiyati: parseFloat(form.satis_fiyati) || 0,
      alis_fiyati: parseFloat(form.alis_fiyati) || 0,
      otel: form.otel || null,
      isim: form.isim || null,
      gelen_yer: form.gelen_yer || null,
      durum: form.durum || null,
    };

    try {
      await onSave(payload);
      reset();
    } catch {
      // hata üst bileşende toast ile gösterilir
    }
  };

  const onKeyDown = (colId) => (e) => {
    handleEntryGridKeyDown(e, {
      rowIndex: 0,
      colId,
      navigableCols,
      rowCount: 1,
      onEnter: () => handleSave(),
    });
  };

  const satis = parseFloat(form.satis_fiyati) || 0;
  const alis = parseFloat(form.alis_fiyati) || 0;
  const komisyon = satis - alis;

  const renderCell = (colId) => {
    switch (colId) {
      case 'tur_tarihi':
        return (
          <input
            ref={firstRef}
            type="date"
            value={form.tur_tarihi}
            onChange={(e) => handleChange('tur_tarihi', e.target.value)}
            onKeyDown={onKeyDown('tur_tarihi')}
            className={inputClass}
            title="Tur tarihi (zorunlu)"
            {...gridCellProps(0, 'tur_tarihi')}
          />
        );
      case 'bilet_no':
        return (
          <input
            type="text"
            value={form.bilet_no}
            onChange={(e) => handleChange('bilet_no', e.target.value)}
            onKeyDown={onKeyDown('bilet_no')}
            className={inputClass}
            placeholder="No"
            {...gridCellProps(0, 'bilet_no')}
          />
        );
      case 'buyuk_kisi':
        return (
          <input
            type="number"
            min="0"
            value={form.buyuk_kisi}
            onChange={(e) => handleChange('buyuk_kisi', e.target.value)}
            onKeyDown={onKeyDown('buyuk_kisi')}
            className={`${inputClass} text-right font-data`}
            placeholder="0"
            {...gridCellProps(0, 'buyuk_kisi')}
          />
        );
      case 'kucuk_kisi':
        return (
          <input
            type="number"
            min="0"
            value={form.kucuk_kisi}
            onChange={(e) => handleChange('kucuk_kisi', e.target.value)}
            onKeyDown={onKeyDown('kucuk_kisi')}
            className={`${inputClass} text-right font-data`}
            placeholder="0"
            {...gridCellProps(0, 'kucuk_kisi')}
          />
        );
      case 'free_kisi':
        return (
          <input
            type="number"
            min="0"
            value={form.free_kisi}
            onChange={(e) => handleChange('free_kisi', e.target.value)}
            onKeyDown={onKeyDown('free_kisi')}
            className={`${inputClass} text-right font-data`}
            placeholder="0"
            {...gridCellProps(0, 'free_kisi')}
          />
        );
      case 'satis_fiyati':
        return (
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.satis_fiyati}
            onChange={(e) => handleChange('satis_fiyati', e.target.value)}
            onKeyDown={onKeyDown('satis_fiyati')}
            className={`${inputClass} text-right font-data`}
            placeholder="0"
            {...gridCellProps(0, 'satis_fiyati')}
          />
        );
      case 'alis_fiyati':
        return (
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.alis_fiyati}
            onChange={(e) => handleChange('alis_fiyati', e.target.value)}
            onKeyDown={onKeyDown('alis_fiyati')}
            className={`${inputClass} text-right font-data`}
            placeholder="0"
            {...gridCellProps(0, 'alis_fiyati')}
          />
        );
      case 'komisyon':
        return (
          <span className="number-cell text-komisyon text-xs block px-1">
            {satis || alis ? komisyon.toFixed(2) : '—'}
          </span>
        );
      case 'otel':
        return (
          <input
            type="text"
            value={form.otel}
            onChange={(e) => handleChange('otel', e.target.value)}
            onKeyDown={onKeyDown('otel')}
            className={inputClass}
            placeholder="Otel"
            {...gridCellProps(0, 'otel')}
          />
        );
      case 'isim':
        return (
          <input
            type="text"
            value={form.isim}
            onChange={(e) => handleChange('isim', e.target.value)}
            onKeyDown={onKeyDown('isim')}
            className={inputClass}
            placeholder="İsim"
            {...gridCellProps(0, 'isim')}
          />
        );
      case 'gelen_yer':
        return (
          <AcentaCombobox
            value={form.gelen_yer}
            onChange={(v) => handleChange('gelen_yer', v)}
            onKeyDown={onKeyDown('gelen_yer')}
            className={inputClass}
            placeholder="Acenta"
            compact
            gridCellProps={gridCellProps(0, 'gelen_yer')}
          />
        );
      case 'durum':
        return (
          <input
            type="text"
            value={form.durum}
            onChange={(e) => handleChange('durum', e.target.value)}
            onKeyDown={onKeyDown('durum')}
            className={inputClass}
            placeholder="Durum"
            list="durum-options"
            {...gridCellProps(0, 'durum')}
          />
        );
      case 'actions':
        return (
          <span className="text-xs text-accent whitespace-nowrap" title="Enter kaydet · ok tuşları ile gezin">
            {saving ? '...' : '↵ Enter'}
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <datalist id="durum-options">
        <option value="Tahsil edildi" />
        <option value="Görülmedi" />
        <option value="Misafir" />
      </datalist>
      <tr className="bg-blue-50 border-b-2 border-accent/40">
        {columns.map((col) => (
          <td key={col.id} style={{ width: col.getSize(), minWidth: col.getSize() }} className="py-1">
            {renderCell(col.id)}
          </td>
        ))}
      </tr>
    </>
  );
}
