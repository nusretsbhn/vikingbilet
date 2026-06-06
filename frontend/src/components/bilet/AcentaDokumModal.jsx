import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import AcentaCombobox from './AcentaCombobox';

export default function AcentaDokumModal({ open, onClose, onDownload, loading, initialAcenta = '' }) {
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
  const lastDay = today.toISOString().slice(0, 10);

  const [form, setForm] = useState({
    acenta_adi: initialAcenta,
    tarih_baslangic: firstDay,
    tarih_bitis: lastDay,
  });

  useEffect(() => {
    if (open) {
      setForm({
        acenta_adi: initialAcenta,
        tarih_baslangic: firstDay,
        tarih_bitis: lastDay,
      });
    }
  }, [open, initialAcenta, firstDay, lastDay]);

  const handleSubmit = () => {
    if (!form.acenta_adi || !form.tarih_baslangic || !form.tarih_bitis) return;
    onDownload(form);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Hizmet Dökümü Al"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>İptal</Button>
          <Button
            variant="primary"
            loading={loading}
            disabled={!form.acenta_adi || !form.tarih_baslangic || !form.tarih_bitis}
            onClick={handleSubmit}
          >
            PDF İndir
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-xs text-secondary">
          Seçilen acenta ve tarih aralığındaki biletler, tahsilatlar ve özet tutarlar PDF olarak indirilir.
        </p>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-secondary font-medium">Acenta *</label>
          <AcentaCombobox
            value={form.acenta_adi}
            onChange={(v) => setForm({ ...form, acenta_adi: v })}
            placeholder="Acenta seçin..."
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Tarih Başlangıç *"
            type="date"
            value={form.tarih_baslangic}
            onChange={(e) => setForm({ ...form, tarih_baslangic: e.target.value })}
          />
          <Input
            label="Tarih Bitiş *"
            type="date"
            value={form.tarih_bitis}
            onChange={(e) => setForm({ ...form, tarih_bitis: e.target.value })}
          />
        </div>
      </div>
    </Modal>
  );
}
