import { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import BiletImport from './BiletImport';
import MultiDatePicker from './MultiDatePicker';
import AcentaCombobox from './AcentaCombobox';

const DURUM_OPTIONS = ['', 'Tahsil edildi', 'Görülmedi', 'Misafir'];

export default function BiletFilters({
  filters,
  onFilter,
  activeFilterCount,
  canEdit,
  canImport,
  onNew,
  onBulkEntry,
  bulkMode,
  onExport,
  onImportSuccess,
}) {
  const [local, setLocal] = useState(filters);
  const [importOpen, setImportOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setLocal(filters);
  }, [filters]);

  const handleChange = (key, value) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
  };

  const handleFilter = () => {
    onFilter({ ...local, page: '1' });
    setFiltersOpen(false);
  };

  const handleClear = () => {
    const cleared = {
      page: '1',
      limit: local.limit || '100',
      tur_tarihleri: '',
      gelen_yer: '',
      isim: '',
      durum: '',
      sort_by: 'tur_tarihi',
      sort_dir: 'desc',
    };
    setLocal(cleared);
    onFilter(cleared);
    setFiltersOpen(false);
  };

  const filterFields = (
    <>
      <MultiDatePicker
        value={local.tur_tarihleri || ''}
        onChange={(value) => handleChange('tur_tarihleri', value)}
        className="w-full sm:w-44"
      />
      <div className="flex flex-col gap-1 w-full sm:w-44">
        <label className="text-xs text-secondary font-medium">Acenta Ara</label>
        <AcentaCombobox
          value={local.gelen_yer}
          onChange={(v) => handleChange('gelen_yer', v)}
          placeholder="Acenta yazın veya seçin..."
          showNewHint={false}
        />
      </div>
      <Input
        label="İsim Ara"
        placeholder="İsim..."
        value={local.isim}
        onChange={(e) => handleChange('isim', e.target.value)}
        className="w-full sm:w-36"
      />
      <div className="flex flex-col gap-1 w-full sm:w-36">
        <label className="text-xs text-secondary font-medium">Durum</label>
        <select
          value={local.durum}
          onChange={(e) => handleChange('durum', e.target.value)}
          className="h-[30px] px-2.5 rounded border border-border bg-white text-primary text-sm focus:outline-none focus:border-border-focus w-full"
        >
          {DURUM_OPTIONS.map((d) => (
            <option key={d} value={d}>{d || 'Tümü'}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <Button onClick={handleFilter} className="flex-1 sm:flex-none">
          Filtrele
          {activeFilterCount > 0 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-accent/20 text-accent text-xs">
              {activeFilterCount}
            </span>
          )}
        </Button>
        <Button variant="ghost" onClick={handleClear} className="flex-1 sm:flex-none">
          Temizle
        </Button>
      </div>
    </>
  );

  return (
    <>
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        {/* Mobil üst çubuk */}
        <div className="lg:hidden p-3 space-y-3">
          <div className="flex gap-2">
            <Button
              variant="default"
              className="flex-1"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              🔍 Filtreler
              {activeFilterCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-accent/20 text-accent text-xs">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <Button variant="ghost" onClick={onExport} className="shrink-0">
              ↓
            </Button>
          </div>
          {filtersOpen && (
            <div className="grid grid-cols-1 gap-2 pt-2 border-t border-border">
              {filterFields}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {canEdit && !bulkMode && (
              <>
                <Button variant="default" onClick={onBulkEntry} className="flex-1 min-w-[120px]">
                  ⊞ Toplu Giriş
                </Button>
                <Button variant="primary" onClick={onNew} className="flex-1 min-w-[120px]">
                  + Yeni Bilet
                </Button>
              </>
            )}
            {canEdit && bulkMode && (
              <span className="w-full text-center inline-flex items-center justify-center px-3 h-[30px] rounded border border-accent/40 bg-accent/10 text-accent text-sm font-medium">
                Toplu giriş modu aktif
              </span>
            )}
            {canImport && (
              <Button onClick={() => setImportOpen(true)} className="flex-1 min-w-[100px]">
                ↑ İçe Aktar
              </Button>
            )}
          </div>
        </div>

        {/* Masaüstü filtreler */}
        <div className="hidden lg:block p-3">
          <div className="flex flex-wrap items-end gap-2">
            {filterFields}
            <div className="ml-auto flex gap-2">
              {canEdit && !bulkMode && (
                <>
                  <Button variant="default" onClick={onBulkEntry}>
                    ⊞ Toplu Giriş
                  </Button>
                  <Button variant="primary" onClick={onNew}>+ Yeni Bilet</Button>
                </>
              )}
              {canEdit && bulkMode && (
                <span className="inline-flex items-center px-3 h-[30px] rounded border border-accent/40 bg-accent/10 text-accent text-sm font-medium">
                  Toplu giriş modu aktif
                </span>
              )}
              {canImport && (
                <Button onClick={() => setImportOpen(true)}>↑ İçe Aktar</Button>
              )}
              <Button onClick={onExport}>↓ Dışa Aktar</Button>
            </div>
          </div>
        </div>
      </div>

      <BiletImport
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={onImportSuccess}
      />
    </>
  );
}
