import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import useAuthStore from '../../store/authStore';
import { fetchUsers, createUser, updateUser, deleteUser } from '../../api/users';
import { fmtDate } from '../../utils/format';
import { useToast } from '../../components/ui/Toast';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import UserForm from '../../components/admin/UserForm';

const roleLabels = { admin: 'Admin', editor: 'Editör', viewer: 'Görüntüleyici' };

export default function UsersPage() {
  const { user: currentUser } = useAuthStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const isAdmin = currentUser?.role === 'admin';

  const { data, isLoading, error } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
    enabled: isAdmin,
  });

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editUser ? updateUser(editUser.id, payload) : createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setFormOpen(false);
      setEditUser(null);
      showToast(editUser ? 'Kullanıcı güncellendi' : 'Kullanıcı oluşturuldu', 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.error || 'İşlem başarısız', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteId(null);
      showToast('Kullanıcı silindi', 'success');
    },
    onError: (err) => {
      showToast(err.response?.data?.error || 'Silme başarısız', 'error');
    },
  });

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading) return <Spinner className="py-20" />;
  if (error) return <div className="text-red">Kullanıcılar yüklenemedi</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="primary" onClick={() => { setEditUser(null); setFormOpen(true); }}>
          + Yeni Kullanıcı
        </Button>
      </div>

      <div className="lg:hidden space-y-2">
        {data.users.map((u) => (
          <div key={u.id} className="mobile-card">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="font-semibold text-sm">{u.username}</div>
                <div className="text-xs text-secondary truncate">{u.email}</div>
              </div>
              <Badge>{roleLabels[u.role] || u.role}</Badge>
            </div>
            <div className="flex items-center justify-between text-xs mb-2">
              <span className={u.is_active ? 'text-green' : 'text-red'}>
                {u.is_active ? 'Aktif' : 'Pasif'}
              </span>
              <span className="text-dim">{fmtDate(u.created_at)}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="default" className="flex-1" onClick={() => { setEditUser(u); setFormOpen(true); }}>
                Düzenle
              </Button>
              {u.id !== currentUser.id && (
                <Button size="sm" variant="ghost" onClick={() => setDeleteId(u.id)}>Sil</Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden lg:block bg-surface border border-border rounded-lg overflow-x-auto">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>ID</th>
              <th>Kullanıcı Adı</th>
              <th>E-posta</th>
              <th>Rol</th>
              <th>Durum</th>
              <th>Oluşturulma</th>
              <th>İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {data.users.map((u) => (
              <tr key={u.id}>
                <td className="font-data text-dim">{u.id}</td>
                <td className="font-medium">{u.username}</td>
                <td>{u.email}</td>
                <td>
                  <Badge>{roleLabels[u.role] || u.role}</Badge>
                </td>
                <td>
                  <span className={u.is_active ? 'text-green' : 'text-red'}>
                    {u.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td>{fmtDate(u.created_at)}</td>
                <td>
                  <div className="flex gap-1">
                    <button
                      onClick={() => { setEditUser(u); setFormOpen(true); }}
                      className="text-secondary hover:text-accent text-xs px-1"
                      title="Düzenle"
                    >
                      ✎
                    </button>
                    {u.id !== currentUser.id && (
                      <button
                        onClick={() => setDeleteId(u.id)}
                        className="text-secondary hover:text-red text-xs px-1"
                        title="Sil"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UserForm
        open={formOpen}
        user={editUser}
        loading={saveMutation.isPending}
        onClose={() => { setFormOpen(false); setEditUser(null); }}
        onSave={saveMutation.mutate}
      />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        title="Kullanıcı Sil"
        message="Bu kullanıcıyı silmek istediğinize emin misiniz?"
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
