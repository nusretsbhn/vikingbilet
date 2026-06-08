import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAcentalar, downloadAcentaDokum } from '../api/raporlar';
import { fetchTahsilat, createTahsilat, deleteTahsilat } from '../api/tahsilat';
import AcentaCombobox from '../components/bilet/AcentaCombobox';
import AcentaDokumModal from '../components/bilet/AcentaDokumModal';
import useAuthStore from '../store/authStore';
import { fmtTL, fmtNum, fmtDate } from '../utils/format';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Spinner from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';

export default function AcentalarPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [dokumOpen, setDokumOpen] = useState(false);
  const [dokumLoading, setDokumLoading] = useState(false);
  const [form, setForm] = useState({
    acenta_adi: '',
    tahsilat_tarihi: new Date().toISOString().slice(0, 10),
    tutar: '',
    aciklama: '',
  });
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const canEdit = user?.role === 'admin' || user?.role === 'editor';

  const { data, isLoading } = useQuery({
    queryKey: ['raporlar', 'acentalar', search],
    queryFn: () => fetchAcentalar(search ? { acenta: search } : {}),
  });

  const { data: tahsilatData, isLoading: tahsilatLoading } = useQuery({
    queryKey: ['tahsilat', selected],
    queryFn: () => fetchTahsilat({ acenta: selected }),
    enabled: !!selected,
  });

  const createMutation = useMutation({
    mutationFn: createTahsilat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raporlar', 'acentalar'] });
      queryClient.invalidateQueries({ queryKey: ['tahsilat'] });
      setModalOpen(false);
      setForm({
        acenta_adi: selected || '',
        tahsilat_tarihi: new Date().toISOString().slice(0, 10),
        tutar: '',
        aciklama: '',
      });
      showToast('Tahsilat eklendi', 'success');
    },
    onError: () => showToast('Tahsilat eklenemedi', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTahsilat,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['raporlar', 'acentalar'] });
      queryClient.invalidateQueries({ queryKey: ['tahsilat'] });
      showToast('Tahsilat silindi', 'success');
    },
  });

  const openTahsilatModal = (acentaAdi = '') => {
    setForm({
      acenta_adi: acentaAdi,
      tahsilat_tarihi: new Date().toISOString().slice(0, 10),
      tutar: '',
      aciklama: '',
    });
    setModalOpen(true);
  };

  const handleDokumDownload = async ({ acenta_adi, tarih_baslangic, tarih_bitis, durumlar = [] }) => {
    setDokumLoading(true);
    try {
      const params = {
        acenta: acenta_adi,
        tarih_baslangic,
        tarih_bitis,
      };
      if (durumlar.length > 0) {
        params.durumlar = durumlar.join(',');
      }
      const blob = await downloadAcentaDokum(params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hizmet-dokumu_${acenta_adi.replace(/\s+/g, '_')}_${tarih_baslangic}_${tarih_bitis}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setDokumOpen(false);
      showToast('PDF indirildi', 'success');
    } catch {
      showToast('PDF oluşturulamadı', 'error');
    } finally {
      setDokumLoading(false);
    }
  };

  if (isLoading) return <Spinner className="py-20" />;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <Input
          label="Acenta Ara"
          placeholder="Acenta adı..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64"
        />
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <Button onClick={() => setDokumOpen(true)} className="flex-1 sm:flex-none">
            Döküm Al
          </Button>
          {canEdit && (
            <Button variant="primary" onClick={() => openTahsilatModal(selected || '')} className="flex-1 sm:flex-none">
              + Tahsilat Ekle
            </Button>
          )}
        </div>
      </div>

      <div className="bg-surface border border-border rounded-lg overflow-x-auto -mx-px">
        <table className="data-table w-full min-w-[720px]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-header min-w-[120px]">Acenta Adı</th>
              <th className="text-right">Büyük</th>
              <th className="text-right">Küçük</th>
              <th className="text-right">Toplam Kişi</th>
              <th className="text-right">Toplam Alış</th>
              <th className="text-right">To Pay</th>
              <th className="text-right">Bilet Hesap</th>
              <th className="text-right">Kalan Alacak</th>
            </tr>
          </thead>
          <tbody>
            {data.acentalar.map((a) => (
              <tr
                key={a.acenta_adi}
                onClick={() => setSelected(a.acenta_adi)}
                className={`cursor-pointer ${selected === a.acenta_adi ? 'bg-accent/10' : ''}`}
              >
                <td className={`font-medium sticky left-0 z-[1] min-w-[120px] ${selected === a.acenta_adi ? 'bg-accent/10' : 'bg-surface'}`}>
                  {a.acenta_adi}
                </td>
                <td className="number-cell">{fmtNum(a.buyuk)}</td>
                <td className="number-cell">{fmtNum(a.kucuk)}</td>
                <td className="number-cell">{fmtNum(a.toplam_kisi)}</td>
                <td className="number-cell font-semibold">{fmtTL(a.toplam_alis)}</td>
                <td className="number-cell text-accent">{fmtTL(a.to_pay_odeme)}</td>
                <td className="number-cell">{fmtTL(a.bilet_hesap_tahsilat)}</td>
                <td className={`number-cell font-semibold ${parseFloat(a.kalan_alacak) > 0 ? 'text-red' : 'text-green'}`}>
                  {fmtTL(a.kalan_alacak)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="bg-surface border border-border rounded-lg">
          <div className="px-3 sm:px-4 py-3 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-sm font-semibold truncate">{selected} — Tahsilat Detayı</h3>
              {tahsilatData?.ozet && (
                <p className="text-xs text-secondary mt-1">
                  Alış: {fmtTL(tahsilatData.ozet.toplam_alis)} ·
                  To Pay: {fmtTL(tahsilatData.ozet.to_pay_toplam)} ·
                  Bilet Hesap: {fmtTL(tahsilatData.ozet.bilet_hesap_toplam)} ·
                  Kalan: {fmtTL(tahsilatData.ozet.kalan_alacak)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {canEdit && (
                <Button size="sm" variant="primary" onClick={() => openTahsilatModal(selected)}>
                  + Tahsilat
                </Button>
              )}
              <button onClick={() => setSelected(null)} className="text-secondary hover:text-primary text-sm">Kapat</button>
            </div>
          </div>

          {tahsilatLoading ? (
            <Spinner className="py-8" />
          ) : (
            <div className="overflow-x-auto -mx-px">
              <table className="data-table w-full min-w-[480px]">
                <thead>
                  <tr>
                    <th>Tarih</th>
                    <th>Tür</th>
                    <th className="text-right">Tutar</th>
                    <th>Açıklama</th>
                    {canEdit && <th>İşlem</th>}
                  </tr>
                </thead>
                <tbody>
                  {tahsilatData?.to_pay_odemeler?.map((t) => (
                    <tr key={`topay-${t.id}`} className="bg-blue-50/50">
                      <td>{fmtDate(t.tur_tarihi)}</td>
                      <td><span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-accent/15 text-accent">To Pay</span></td>
                      <td className="number-cell">{fmtTL(t.tutar)}</td>
                      <td className="text-secondary text-xs">
                        {[t.bilet_no && `Bilet: ${t.bilet_no}`, t.isim].filter(Boolean).join(' · ') || 'Teknede ödeme'}
                      </td>
                      {canEdit && <td className="text-dim text-xs">Bilet kaydı</td>}
                    </tr>
                  ))}

                  {tahsilatData?.tahsilatlar?.map((t) => (
                    <tr key={`tah-${t.id}`}>
                      <td>{fmtDate(t.tahsilat_tarihi)}</td>
                      <td><span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green/15 text-green">Bilet Hesap</span></td>
                      <td className="number-cell">{fmtTL(t.tutar)}</td>
                      <td>{t.aciklama || '—'}</td>
                      {canEdit && (
                        <td>
                          <button
                            onClick={() => deleteMutation.mutate(t.id)}
                            className="text-red hover:text-red/80 text-xs"
                          >
                            Sil
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}

                  {!tahsilatData?.to_pay_odemeler?.length && !tahsilatData?.tahsilatlar?.length && (
                    <tr>
                      <td colSpan={canEdit ? 5 : 4} className="text-center text-secondary py-4">
                        Tahsilat kaydı yok
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Tahsilat Ekle — Bilet Hesap"
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)}>İptal</Button>
            <Button
              variant="primary"
              loading={createMutation.isPending}
              disabled={!form.acenta_adi || !form.tahsilat_tarihi || !form.tutar}
              onClick={() => createMutation.mutate({
                ...form,
                tutar: parseFloat(form.tutar) || 0,
              })}
            >
              Kaydet
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-secondary font-medium">Acenta Adı *</label>
            <AcentaCombobox
              value={form.acenta_adi}
              onChange={(v) => setForm({ ...form, acenta_adi: v })}
              placeholder="Acenta seçin veya yeni yazın..."
            />
          </div>
          <Input
            label="Tahsilat Tarihi *"
            type="date"
            value={form.tahsilat_tarihi}
            onChange={(e) => setForm({ ...form, tahsilat_tarihi: e.target.value })}
          />
          <Input
            label="Tutar *"
            type="number"
            step="0.01"
            value={form.tutar}
            onChange={(e) => setForm({ ...form, tutar: e.target.value })}
          />
          <Input
            label="Açıklama"
            value={form.aciklama}
            onChange={(e) => setForm({ ...form, aciklama: e.target.value })}
            placeholder="Örn: Nakit tahsilat, havale..."
          />
          <p className="text-xs text-secondary">
            To Pay ödemeleri bilet kayıtlarındaki &quot;To Pay&quot; alanından otomatik hesaplanır.
          </p>
        </div>
      </Modal>

      <AcentaDokumModal
        open={dokumOpen}
        onClose={() => setDokumOpen(false)}
        onDownload={handleDokumDownload}
        loading={dokumLoading}
        initialAcenta={selected || ''}
      />
    </div>
  );
}
