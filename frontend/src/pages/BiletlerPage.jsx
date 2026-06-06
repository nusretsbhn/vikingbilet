import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../store/authStore';
import { fetchBiletler, createBilet, createBiletBulk, updateBilet, deleteBilet, exportBiletler } from '../api/biletler';
import { useToast } from '../components/ui/Toast';
import BiletFilters from '../components/bilet/BiletFilters';
import BiletTable from '../components/bilet/BiletTable';
import BiletForm from '../components/bilet/BiletForm';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Spinner from '../components/ui/Spinner';

function filtersFromSearchParams(searchParams) {
  return {
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '100',
    tarih_baslangic: searchParams.get('tarih_baslangic') || '',
    tarih_bitis: searchParams.get('tarih_bitis') || '',
    gelen_yer: searchParams.get('gelen_yer') || '',
    isim: searchParams.get('isim') || '',
    durum: searchParams.get('durum') || '',
    sort_by: searchParams.get('sort_by') || 'tur_tarihi',
    sort_dir: searchParams.get('sort_dir') || 'desc',
  };
}

export default function BiletlerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const [editBilet, setEditBilet] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSessionKey, setBulkSessionKey] = useState(0);
  const filters = filtersFromSearchParams(searchParams);
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const canEdit = user?.role === 'admin' || user?.role === 'editor';
  const canDelete = user?.role === 'admin';

  const { data, isLoading, error } = useQuery({
    queryKey: ['biletler', filters],
    queryFn: () => fetchBiletler(filters),
  });

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editBilet ? updateBilet(editBilet.id, payload) : createBilet(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biletler'] });
      setFormOpen(false);
      setEditBilet(null);
      showToast(editBilet ? 'Bilet güncellendi' : 'Bilet eklendi', 'success');
    },
    onError: () => showToast('Kayıt başarısız', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteBilet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biletler'] });
      setDeleteId(null);
      showToast('Bilet silindi', 'success');
    },
    onError: () => showToast('Silme başarısız', 'error'),
  });

  const bulkCreateMutation = useMutation({
    mutationFn: createBiletBulk,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['biletler'] });
      showToast(`${result.count} bilet eklendi`, 'success');
    },
    onError: () => showToast('Toplu kayıt başarısız', 'error'),
  });

  const quickCreateMutation = useMutation({
    mutationFn: createBilet,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biletler'] });
      showToast('Bilet eklendi', 'success');
    },
    onError: () => showToast('Kayıt başarısız', 'error'),
  });

  const openBulkMode = () => {
    setBulkSessionKey((k) => k + 1);
    setBulkMode(true);
  };

  const updateFilters = (newFilters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  };

  const handleExport = async () => {
    try {
      const blob = await exportBiletler(filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'biletler.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast('Dışa aktarma başarısız', 'error');
    }
  };

  const activeFilterCount = [
    filters.tarih_baslangic,
    filters.tarih_bitis,
    filters.gelen_yer,
    filters.isim,
    filters.durum,
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      <BiletFilters
        filters={filters}
        onFilter={updateFilters}
        activeFilterCount={activeFilterCount}
        canEdit={canEdit}
        canImport={user?.role === 'admin'}
        onNew={() => { setEditBilet(null); setFormOpen(true); }}
        onBulkEntry={openBulkMode}
        bulkMode={bulkMode}
        onExport={handleExport}
        onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ['biletler'] })}
      />

      {isLoading ? (
        <Spinner className="py-20" />
      ) : error ? (
        <div className="text-red">Biletler yüklenemedi</div>
      ) : (
        <BiletTable
          data={data.data}
          pagination={data.pagination}
          filters={filters}
          onFilter={updateFilters}
          canEdit={canEdit}
          canDelete={canDelete}
          onEdit={(b) => { setEditBilet(b); setFormOpen(true); }}
          onDelete={setDeleteId}
          onInlineSave={(id, payload) => updateBilet(id, payload).then(() => {
            queryClient.invalidateQueries({ queryKey: ['biletler'] });
          })}
          onBulkCreate={(payloads) => bulkCreateMutation.mutateAsync(payloads)}
          bulkSaving={bulkCreateMutation.isPending}
          bulkMode={bulkMode}
          bulkSessionKey={bulkSessionKey}
          onBulkModeClose={() => setBulkMode(false)}
          onQuickCreate={(payload) => quickCreateMutation.mutateAsync(payload)}
          quickSaving={quickCreateMutation.isPending}
        />
      )}

      <BiletForm
        open={formOpen}
        bilet={editBilet}
        loading={saveMutation.isPending}
        onClose={() => { setFormOpen(false); setEditBilet(null); }}
        onSave={saveMutation.mutate}
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Bilet Sil"
        message="Bu bilet kaydını silmek istediğinize emin misiniz?"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
