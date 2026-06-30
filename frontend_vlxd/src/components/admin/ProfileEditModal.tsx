'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { adminApi, AdminApiError } from '@/lib/admin-api';
import { setStoredUser } from '@/lib/auth-store';
import type { AdminUser } from '@/types/admin';
import { Button } from './ui/Button';
import { TextField } from './ui/Field';
import { Modal } from './ui/Modal';
import { useToast } from './ui/Toast';

export function ProfileEditModal({
  open,
  user,
  onClose,
  onSaved,
}: {
  open: boolean;
  user: AdminUser | null;
  onClose: () => void;
  onSaved: (updated: AdminUser) => void;
}) {
  const toast = useToast();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFullName(user?.fullName ?? '');
    setEmail(user?.email ?? '');
    setError(null);
  }, [open, user]);

  function close() {
    if (saving) return;
    onClose();
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) {
      setError('Vui lòng nhập họ tên.');
      return;
    }
    setSaving(true);
    try {
      const updated = await adminApi.patch<AdminUser>('/admin/auth/me', {
        fullName: fullName.trim(),
        email: email.trim(), // '' → BE chuyển thành null (xóa email)
      });
      setStoredUser(updated);
      onSaved(updated);
      toast.success('Đã cập nhật thông tin.');
      onClose();
    } catch (err) {
      setError(
        err instanceof AdminApiError ? err.message : 'Cập nhật thất bại.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Sửa thông tin"
      onClose={close}
      busy={saving}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={saving}>
            Hủy
          </Button>
          <Button type="submit" form="profile-form" loading={saving}>
            Lưu
          </Button>
        </>
      }
    >
      <form
        id="profile-form"
        onSubmit={submit}
        style={{ display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        {error && (
          <div
            style={{
              padding: 12,
              borderRadius: 8,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}
        <TextField
          id="pf-username"
          label="Tài khoản"
          value={user?.username ?? ''}
          disabled
          hint="Không thể đổi tên đăng nhập."
        />
        <TextField
          id="pf-fullname"
          label="Họ tên *"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <TextField
          id="pf-email"
          label="Email"
          type="email"
          placeholder="email@vidu.com"
          hint="Để trống nếu muốn xóa email."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </form>
    </Modal>
  );
}
