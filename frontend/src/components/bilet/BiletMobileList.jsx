import { fmtTL, fmtDate, fmtNum } from '../../utils/format';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function BiletMobileList({
  data,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
  filters,
  onFilter,
  sortable,
  sortIcon,
  toggleSort,
}) {
  if (!data?.length) {
    return (
      <div className="text-center text-secondary py-10 text-sm">Kayıt bulunamadı</div>
    );
  }

  return (
    <div className="divide-y divide-border">
      <div className="px-3 py-2 flex gap-2 overflow-x-auto no-scrollbar bg-header/50">
        {sortable.slice(0, 4).map((col) => (
          <button
            key={col}
            type="button"
            onClick={() => toggleSort(col)}
            className={`shrink-0 px-2.5 py-1 rounded-full text-xs border transition-colors ${
              filters.sort_by === col
                ? 'bg-accent/15 border-accent/40 text-accent'
                : 'bg-white border-border text-secondary'
            }`}
          >
            {col === 'tur_tarihi' && 'Tarih'}
            {col === 'satis_fiyati' && 'Satış'}
            {col === 'bilet_no' && 'Bilet No'}
            {col === 'buyuk_kisi' && 'Kişi'}
            <span className="ml-1 opacity-60">{sortIcon(col)}</span>
          </button>
        ))}
      </div>

      {data.map((b) => (
        <article key={b.id} className="p-3 hover:bg-row-hover/50 active:bg-row-hover">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div>
              <div className="text-sm font-semibold text-primary">{b.isim || '—'}</div>
              <div className="text-xs text-secondary mt-0.5">
                {fmtDate(b.tur_tarihi)}
                {b.bilet_no ? ` · ${b.bilet_no}` : ''}
              </div>
            </div>
            {b.durum && <Badge>{b.durum}</Badge>}
          </div>

          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs mb-2">
            <div>
              <span className="text-dim">Acenta</span>
              <div className="text-primary truncate">{b.gelen_yer || '—'}</div>
            </div>
            <div>
              <span className="text-dim">Otel</span>
              <div className="text-primary truncate">{b.otel || '—'}</div>
            </div>
            <div>
              <span className="text-dim">Kişi</span>
              <div className="font-data">
                {fmtNum(b.buyuk_kisi)}+{fmtNum(b.kucuk_kisi)}
                {b.free_kisi > 0 ? `+${fmtNum(b.free_kisi)}f` : ''}
              </div>
            </div>
            <div>
              <span className="text-dim">Satış</span>
              <div className="font-data font-semibold">{fmtTL(b.satis_fiyati)}</div>
            </div>
          </div>

          {(canEdit || canDelete) && (
            <div className="flex gap-2 pt-1">
              {canEdit && (
                <Button size="sm" variant="default" className="flex-1" onClick={() => onEdit(b)}>
                  Düzenle
                </Button>
              )}
              {canDelete && (
                <Button size="sm" variant="ghost" onClick={() => onDelete(b.id)}>
                  Sil
                </Button>
              )}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
