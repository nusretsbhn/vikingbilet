import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { fetchOzet } from '../api/raporlar';
import { fmtTL, fmtNum, fmtDate } from '../utils/format';
import Spinner from '../components/ui/Spinner';
import Badge from '../components/ui/Badge';

const PIE_COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#6b7280'];

function StatCard({ label, value }) {
  return (
    <div className="bg-surface border border-border rounded-lg p-4">
      <div className="text-xs text-secondary uppercase tracking-wide mb-1">{label}</div>
      <div className="text-xl font-semibold font-data">{value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['raporlar', 'ozet'],
    queryFn: fetchOzet,
  });

  if (isLoading) return <Spinner className="py-20" />;
  if (error) return <div className="text-red">Dashboard yüklenemedi</div>;

  const { ozet, durumDagilimi, aylikCiro, sonBiletler } = data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard label="Toplam Bilet" value={fmtNum(ozet.toplam_bilet)} />
        <StatCard label="Toplam Kişi" value={fmtNum(ozet.toplam_kisi)} />
        <StatCard label="Toplam Ciro" value={fmtTL(ozet.toplam_ciro)} />
        <StatCard label="Toplam Komisyon" value={fmtTL(ozet.toplam_komisyon)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-surface border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">Aylık Ciro</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={aylikCiro}>
              <XAxis dataKey="ay" tick={{ fill: '#4b5563', fontSize: 11 }} />
              <YAxis tick={{ fill: '#4b5563', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#ffffff', border: '1px solid #d1d5db', borderRadius: 6, color: '#111827' }}
                labelStyle={{ color: '#111827' }}
              />
              <Bar dataKey="ciro" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-surface border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-4">Durum Dağılımı</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={durumDagilimi}
                dataKey="adet"
                nameKey="durum"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ durum, adet }) => `${durum}: ${adet}`}
              >
                {durumDagilimi.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#ffffff', border: '1px solid #d1d5db', borderRadius: 6, color: '#111827' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold">Son 10 Bilet</h3>
        </div>
        <div className="overflow-x-auto -mx-px lg:mx-0">
          <table className="data-table w-full min-w-[520px]">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Bilet No</th>
                <th>İsim</th>
                <th>Acenta</th>
                <th className="text-right">Alış</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {sonBiletler.map((b) => (
                <tr key={b.id}>
                  <td>{fmtDate(b.tur_tarihi)}</td>
                  <td className="font-data">{b.bilet_no || '—'}</td>
                  <td>{b.isim || '—'}</td>
                  <td>{b.gelen_yer || '—'}</td>
                  <td className="number-cell">{fmtTL(b.alis_fiyati)}</td>
                  <td><Badge>{b.durum}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
