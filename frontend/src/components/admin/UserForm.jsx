import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';

const ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editör' },
  { value: 'viewer', label: 'Görüntüleyici' },
];

const EMPTY = {
  username: '',
  email: '',
  password: '',
  role: 'viewer',
  is_active: true,
};

export default function UserForm({ open, user, loading, onClose, onSave }) {
  const [form, setForm] = useState(EMPTY);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        username: user.username,
        email: user.email,
        password: '',
        role: user.role,
        is_active: user.is_active,
      });
    } else {
      setForm(EMPTY);
    }
    setShowPassword(false);
  }, [user, open]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      username: form.username,
      email: form.email,
      role: form.role,
      is_active: form.is_active,
    };
    if (!user) {
      payload.password = form.password;
    } else if (form.password) {
      payload.password = form.password;
    }
    onSave(payload);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={user ? 'Kullanıcı Düzenle' : 'Yeni Kullanıcı'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>İptal</Button>
          <Button variant="primary" loading={loading} onClick={handleSubmit}>Kaydet</Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          label="Kullanıcı Adı *"
          value={form.username}
          onChange={(e) => handleChange('username', e.target.value)}
          required
        />
        <Input
          label="E-posta *"
          type="email"
          value={form.email}
          onChange={(e) => handleChange('email', e.target.value)}
          required
        />
        <div className="flex flex-col gap-1">
          <label className="text-xs text-secondary font-medium">
            Şifre {user ? '(boş bırakılırsa değişmez)' : '*'}
          </label>
          <div className="flex gap-2">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              required={!user}
              minLength={8}
              placeholder={user ? 'Yeni şifre...' : 'En az 8 karakter'}
              className="flex-1 h-[30px] px-2.5 rounded border border-border bg-white text-primary text-sm focus:outline-none focus:border-border-focus"
            />
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? 'Gizle' : 'Göster'}
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-secondary font-medium">Rol *</label>
          <select
            value={form.role}
            onChange={(e) => handleChange('role', e.target.value)}
            className="h-[30px] px-2.5 rounded border border-border bg-white text-primary text-sm focus:outline-none focus:border-border-focus"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </div>
        {user && (
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => handleChange('is_active', e.target.checked)}
              className="rounded border-border"
            />
            <span>Aktif kullanıcı</span>
          </label>
        )}
      </form>
    </Modal>
  );
}
