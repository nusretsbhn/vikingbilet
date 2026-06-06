import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchGunlukRapor, fetchAylikRapor, fetchYillikRapor } from '../api/raporlar';
import { fmtTL, fmtNum } from '../utils/format';
import Spinner from '../components/ui/Spinner';

const AYLAR = ['', 'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];

export default function RaporlarPage() {
  const now = new Date();
  const [yil, setYil] = useState(now.getFullYear());
  const [ay, setAy] = useState(now.getMonth() + 1);

  const { data: gunluk, isLoading: l1 } = useQuery({
    queryKey: ['raporlar', 'gunluk', yil, ay],
    queryFn: () => fetchGunlukRapor({ yil, ay }),
  });

  const { data: aylik, isLoading: l2 } = useQuery({
    queryKey: ['raporlar', 'aylik', yil],
    queryFn: () => fetchAylikRapor({ yil }),
  });

  const { data: yillik, isLoading: l3 } = useQuery({
    queryKey: ['raporlar', 'yillik'],
    queryFn: fetchYillikRapor,
  });

  const loading = l1 || l2 || l3;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3 bg-surface border border-border rounded-lg p-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-secondary font-medium">Yıl</label>
          <select
            value={yil}
            onChange={(e) => setYil(parseInt(e.target.value, 10))}
            className="h-[30px] px-2.5 rounded border border-border bg-white text-primary text-sm"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-secondary font-medium">Ay</label>
          <select
            value={ay}
            onChange={(e) => setAy(parseInt(e.target.value, 10))}
            className="h-[30px] px-2.5 rounded border border-border bg-white text-primary text-sm"
          >
            {AYLAR.slice(1).map((a, i) => (
              <option key={i + 1} value={i + 1}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <Spinner className="py-20" />
      ) : (
        <>
          <ReportTable
            title={`Günlük Rapor — ${AYLAR[ay]} ${yil}`}
            headers={['Tarih', 'Büyük', 'Küçük', 'Günlük Ciro', 'Kişi Başı Ort.']}
            rows={gunluk?.rapor.map((r) => [
              r.tarih?.slice?.(0, 10) || r.tarih,
              fmtNum(r.buyuk),
              fmtNum(r.kucuk),
              fmtTL(r.gunluk_ciro),
              fmtTL(r.kisi_basi_ort),
            ])}
          />

          <ReportTable
            title={`Aylık Rapor — ${yil}`}
            headers={['Ay', 'Toplam Kişi', 'Aylık Ciro', 'Kişi Başı Ort.']}
            rows={aylik?.rapor.map((r) => [
              AYLAR[r.ay],
              fmtNum(r.toplam_kisi),
              fmtTL(r.aylik_ciro),
              fmtTL(r.kisi_basi_ort),
            ])}
          />

          <ReportTable
            title="Yıllık Rapor"
            headers={['Yıl', 'Toplam Kişi', 'Yıllık Ciro', 'Kişi Başı Ort.']}
            rows={yillik?.rapor.map((r) => [
              r.yil,
              fmtNum(r.toplam_kisi),
              fmtTL(r.yillik_ciro),
              fmtTL(r.kisi_basi_ort),
            ])}
          />
        </>
      )}
    </div>
  );
}

function ReportTable({ title, headers, rows = [] }) {
  return (
    <div className="bg-surface border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="overflow-x-auto -mx-px">
        <table className="data-table w-full min-w-[480px]">
          <thead>
            <tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows?.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className={j > 0 ? 'number-cell' : ''}>{cell}</td>
                ))}
              </tr>
            ))}
            {(!rows || rows.length === 0) && (
              <tr><td colSpan={headers.length} className="text-center text-secondary py-6">Veri yok</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
