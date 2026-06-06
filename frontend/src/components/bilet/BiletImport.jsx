import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { importBiletler } from '../../api/biletler';
import { parseVikingPreview } from '../../utils/vikingExcel';
import { useToast } from '../ui/Toast';

export default function BiletImport({ open, onClose, onSuccess }) {
  const [preview, setPreview] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [sheetName, setSheetName] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const result = parseVikingPreview(ev.target.result);
        setPreview(result.preview);
        setTotalRows(result.total);
        setSheetName(result.sheetName);
      } catch {
        showToast('Dosya okunamadı', 'error');
        setPreview([]);
        setTotalRows(0);
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const result = await importBiletler(file);
      showToast(`${result.count} bilet içe aktarıldı (${result.sheet})`, 'success');
      onSuccess?.();
      handleClose();
    } catch (err) {
      showToast(err.response?.data?.error || 'İçe aktarma başarısız', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setTotalRows(0);
    setSheetName('');
    onClose();
  };

  const columns = preview.length > 0 ? Object.keys(preview[0]) : [];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Excel İçe Aktar — Viking Formatı"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose}>İptal</Button>
          <Button variant="primary" loading={loading} disabled={!file || totalRows === 0} onClick={handleImport}>
            {totalRows > 0 ? `${totalRows} Bilet İçe Aktar` : 'İçe Aktar'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-xs text-secondary">
          Desteklenen format: <strong className="text-primary">BİLET VİKİNG 2026.xlsx</strong> — sayfa1,
          3. satırdan itibaren veri okunur.
        </p>

        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFile}
          className="text-sm text-secondary file:mr-3 file:px-3 file:py-1.5 file:rounded file:border file:border-border file:bg-header file:text-primary file:text-sm file:cursor-pointer"
        />

        {sheetName && (
          <p className="text-sm text-secondary">
            Sayfa: <span className="text-primary">{sheetName}</span> ·
            Toplam <span className="text-accent font-medium">{totalRows}</span> kayıt bulundu
          </p>
        )}

        {preview.length > 0 && (
          <div>
            <p className="text-xs text-secondary mb-2">Önizleme (ilk 5 kayıt)</p>
            <div className="overflow-x-auto border border-border rounded">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    {columns.map((col) => (
                      <th key={col}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i}>
                      {columns.map((col) => (
                        <td key={col}>{String(row[col] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
