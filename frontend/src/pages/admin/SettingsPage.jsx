import { useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../../store/authStore';
import {
  deleteFavicon,
  fetchFaviconConfig,
  faviconFileUrl,
  purgeAllData,
  uploadFavicon,
} from '../../api/settings';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { applyFaviconMeta } from '../../utils/favicon';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const ACCEPT = '.png,.jpg,.jpeg,.ico,.svg,.webp,image/png,image/jpeg,image/x-icon,image/svg+xml,image/webp';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [resetOpen, setResetOpen] = useState(false);
  const [purgeOpen, setPurgeOpen] = useState(false);
  const [purgePassword, setPurgePassword] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);

  const isAdmin = user?.role === 'admin';

  const { data: favicon, isLoading } = useQuery({
    queryKey: ['favicon-config'],
    queryFn: fetchFaviconConfig,
    enabled: isAdmin,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadFavicon,
    onSuccess: (data) => {
      queryClient.setQueryData(['favicon-config'], data);
      applyFaviconMeta(data);
      setPreviewUrl(null);
      showToast('Favicon güncellendi', 'success');
    },
    onError: (err) => {
      setPreviewUrl(null);
      showToast(err.response?.data?.error || 'Yükleme başarısız', 'error');
    },
  });

  const purgeMutation = useMutation({
    mutationFn: purgeAllData,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biletler'] });
      queryClient.invalidateQueries({ queryKey: ['raporlar'] });
      queryClient.invalidateQueries({ queryKey: ['tahsilat'] });
      setPurgeOpen(false);
      setPurgePassword('');
      showToast('Tüm bilet ve cari kayıtları silindi', 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.error || 'Silme işlemi başarısız', 'error');
    },
  });

  const resetMutation = useMutation({
    mutationFn: deleteFavicon,
    onSuccess: (data) => {
      queryClient.setQueryData(['favicon-config'], data);
      applyFaviconMeta(data);
      setResetOpen(false);
      showToast('Favicon varsayılana döndürüldü', 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.error || 'Sıfırlama başarısız', 'error');
    },
  });

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (file.size > 512 * 1024) {
      showToast('Dosya boyutu en fazla 512 KB olabilir', 'error');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    uploadMutation.mutate(file, {
      onSettled: () => URL.revokeObjectURL(objectUrl),
    });
  };

  const currentPreview = previewUrl
    || (favicon?.custom ? faviconFileUrl(favicon.updatedAt) : '/favicon.svg');

  if (isLoading) return <Spinner className="py-20" />;

  return (
    <div className="space-y-4 max-w-2xl">
      <section className="mobile-card lg:p-5">
        <h2 className="text-base font-semibold mb-1">Favicon</h2>
        <p className="text-sm text-secondary mb-4">
          Tarayıcı sekmesinde görünen simgeyi değiştirin. PNG, JPG, ICO, SVG veya WebP
          yükleyebilirsiniz (en fazla 512 KB).
        </p>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center justify-center w-20 h-20 rounded-lg border border-border bg-base shrink-0">
            <img
              src={currentPreview}
              alt="Favicon önizleme"
              className="w-12 h-12 object-contain"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? 'Yükleniyor…' : 'Favicon Yükle'}
            </Button>
            {favicon?.custom && (
              <Button
                variant="ghost"
                onClick={() => setResetOpen(true)}
                disabled={resetMutation.isPending}
              >
                Varsayılana Dön
              </Button>
            )}
          </div>
        </div>

        <p className="text-xs text-dim mt-3">
          {favicon?.custom
            ? 'Özel favicon aktif.'
            : 'Varsayılan favicon kullanılıyor.'}
        </p>
      </section>

      <section className="mobile-card lg:p-5 border-red/30">
        <h2 className="text-base font-semibold mb-1 text-red">Tehlikeli Bölge</h2>
        <p className="text-sm text-secondary mb-4">
          Tüm bilet kayıtlarını ve cari (tahsilat) kayıtlarını kalıcı olarak siler.
          Kullanıcılar ve ayarlar etkilenmez. İşlem geri alınamaz.
        </p>
        <Button variant="danger" onClick={() => setPurgeOpen(true)}>
          Tüm Bilet ve Carileri Sil
        </Button>
      </section>

      <section className="mobile-card lg:p-5">
        <h2 className="text-base font-semibold mb-1">Kullanıcı Yönetimi</h2>
        <p className="text-sm text-secondary mb-4">
          Sistem kullanıcılarını ve rollerini yönetin.
        </p>
        <Link to="/admin/users">
          <Button variant="ghost">Kullanıcıları Aç →</Button>
        </Link>
      </section>

      <ConfirmDialog
        open={resetOpen}
        title="Faviconu sıfırla"
        message="Özel favicon kaldırılacak ve varsayılan simge kullanılacak. Devam edilsin mi?"
        onConfirm={() => resetMutation.mutate()}
        onClose={() => setResetOpen(false)}
      />

      <Modal
        open={purgeOpen}
        onClose={() => {
          if (!purgeMutation.isPending) {
            setPurgeOpen(false);
            setPurgePassword('');
          }
        }}
        title="Tüm Bilet ve Carileri Sil"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setPurgeOpen(false);
                setPurgePassword('');
              }}
              disabled={purgeMutation.isPending}
            >
              İptal
            </Button>
            <Button
              variant="danger"
              loading={purgeMutation.isPending}
              disabled={!purgePassword}
              onClick={() => purgeMutation.mutate(purgePassword)}
            >
              Kalıcı Olarak Sil
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-secondary">
            Bu işlem tüm bilet ve tahsilat kayıtlarını veritabanından siler.
            Onaylamak için admin şifrenizi girin.
          </p>
          <Input
            label="Admin Şifresi"
            type="password"
            value={purgePassword}
            onChange={(e) => setPurgePassword(e.target.value)}
            autoComplete="current-password"
            placeholder="Şifreniz"
          />
        </div>
      </Modal>
    </div>
  );
}
