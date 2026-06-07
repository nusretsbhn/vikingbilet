import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import AcentaCombobox from './AcentaCombobox';
import { toInputDate, calcKomisyon, parseOptionalPrice, parseMoneyDefaultZero } from '../../utils/format';

const EMPTY = {
  tur_tarihi: '',
  bilet_no: '',
  m: '',
  durum: '',
  buyuk_kisi: 0,
  kucuk_kisi: 0,
  free_kisi: 0,
  satis_fiyati: '',
  alis_fiyati: '',
  teknede_odeme: '',
  isim: '',
  iletisim: '',
  otel: '',
  oda: '',
  gelen_yer: '',
  notlar: '',
};

export default function BiletForm({ open, bilet, loading, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (bilet) {
      setForm({
        ...EMPTY,
        ...bilet,
        tur_tarihi: toInputDate(bilet.tur_tarihi),
        satis_fiyati: bilet.satis_fiyati ?? '',
        alis_fiyati: bilet.alis_fiyati ?? '',
        teknede_odeme: bilet.teknede_odeme ?? '',
      });
    } else {
      setForm({ ...EMPTY, tur_tarihi: new Date().toISOString().slice(0, 10) });
    }
  }, [bilet, open]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const komisyon = calcKomisyon(form.satis_fiyati, form.alis_fiyati);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      buyuk_kisi: parseInt(form.buyuk_kisi, 10) || 0,
      kucuk_kisi: parseInt(form.kucuk_kisi, 10) || 0,
      free_kisi: parseInt(form.free_kisi, 10) || 0,
      satis_fiyati: parseOptionalPrice(form.satis_fiyati),
      alis_fiyati: parseOptionalPrice(form.alis_fiyati),
      teknede_odeme: parseMoneyDefaultZero(form.teknede_odeme),
    });
  };

  const Section = ({ title, children }) => (
    <div>
      <div className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2 border-b border-border pb-1">
        {title}
      </div>
      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={bilet ? 'Bilet Düzenle' : 'Yeni Bilet'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>İptal</Button>
          <Button variant="primary" loading={loading} onClick={handleSubmit}>Kaydet</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Section title="Tur Bilgileri">
          <Input label="Tur Tarihi *" type="date" value={form.tur_tarihi} onChange={(e) => handleChange('tur_tarihi', e.target.value)} required />
          <Input label="Bilet No" value={form.bilet_no || ''} onChange={(e) => handleChange('bilet_no', e.target.value)} />
          <Input label="Durum" value={form.durum || ''} onChange={(e) => handleChange('durum', e.target.value)} />
          <Input label="M (özel işaret)" value={form.m || ''} onChange={(e) => handleChange('m', e.target.value)} />
        </Section>

        <Section title="Kişi Sayıları">
          <Input label="Büyük (Double)" type="number" min="0" value={form.buyuk_kisi} onChange={(e) => handleChange('buyuk_kisi', e.target.value)} />
          <Input label="Küçük (Single)" type="number" min="0" value={form.kucuk_kisi} onChange={(e) => handleChange('kucuk_kisi', e.target.value)} />
          <Input label="Free" type="number" min="0" value={form.free_kisi} onChange={(e) => handleChange('free_kisi', e.target.value)} />
        </Section>

        <Section title="Fiyatlar">
          <Input label="Satış Fiyatı ₺" type="number" step="0.01" value={form.satis_fiyati ?? ''} onChange={(e) => handleChange('satis_fiyati', e.target.value)} />
          <Input label="Alış Fiyatı ₺" type="number" step="0.01" value={form.alis_fiyati ?? ''} onChange={(e) => handleChange('alis_fiyati', e.target.value)} />
          <Input label="To Pay ₺" type="number" step="0.01" value={form.teknede_odeme ?? ''} onChange={(e) => handleChange('teknede_odeme', e.target.value)} />
          <div className="flex flex-col gap-1">
            <label className="text-xs text-secondary font-medium">Komisyon (otomatik)</label>
            <div className="h-[30px] px-2.5 flex items-center rounded border border-border bg-row-alt text-komisyon font-data text-sm">
              {komisyon === null ? '—' : `${komisyon.toFixed(2)} ₺`}
            </div>
          </div>
        </Section>

        <Section title="Misafir / Otel">
          <Input label="İsim" value={form.isim || ''} onChange={(e) => handleChange('isim', e.target.value)} />
          <Input label="İletişim" value={form.iletisim || ''} onChange={(e) => handleChange('iletisim', e.target.value)} />
          <Input label="Otel" value={form.otel || ''} onChange={(e) => handleChange('otel', e.target.value)} />
          <Input label="Oda" value={form.oda || ''} onChange={(e) => handleChange('oda', e.target.value)} />
        </Section>

        <div>
          <div className="text-xs font-semibold text-secondary uppercase tracking-wide mb-2 border-b border-border pb-1">
            Acenta / Notlar
          </div>
          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-secondary font-medium">Gelen Yer (Acenta)</label>
              <AcentaCombobox
                value={form.gelen_yer || ''}
                onChange={(v) => handleChange('gelen_yer', v)}
                placeholder="Acenta seçin veya yeni yazın..."
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-secondary font-medium">Notlar</label>
              <textarea
                value={form.notlar || ''}
                onChange={(e) => handleChange('notlar', e.target.value)}
                rows={3}
                className="px-2.5 py-2 rounded border border-border bg-white text-primary text-sm focus:outline-none focus:border-border-focus resize-none"
              />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
