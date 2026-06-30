'use client';

import { useState, type FormEvent } from 'react';
import { adminApi, AdminApiError } from '@/lib/admin-api';
import { Button } from './ui/Button';
import { TextField } from './ui/Field';
import { Modal } from './ui/Modal';
import { useToast } from './ui/Toast';

export function ChangePasswordModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function reset() {
    setCurrent('');
    setNext('');
    setConfirm('');
    setError(null);
  }

  function close() {
    if (saving) return;
    reset();
    onClose();
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (next.length < 8 || !/[A-Za-z]/.test(next) || !/[0-9]/.test(next)) {
      setError('Mật khẩu mới tối thiểu 8 ký tự, có cả chữ và số.');
      return;
    }
    if (next !== confirm) {
      setError('Xác nhận mật khẩu không khớp.');
      return;
    }

    setSaving(true);
    try {
      await adminApi.post('/admin/auth/change-password', {
        currentPassword: current,
        newPassword: next,
      });
      toast.success('Đổi mật khẩu thành công.');
      reset();
      onClose();
    } catch (err) {
      setError(
        err instanceof AdminApiError ? err.message : 'Không đổi được mật khẩu.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title="Đổi mật khẩu"
      onClose={close}
      busy={saving}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={saving}>
            Hủy
          </Button>
          <Button type="submit" form="change-pw-form" loading={saving}>
            Cập nhật
          </Button>
        </>
      }
    >
      <form
        id="change-pw-form"
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
          id="cur-pw"
          label="Mật khẩu hiện tại"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          required
        />
        <TextField
          id="new-pw"
          label="Mật khẩu mới"
          type="password"
          autoComplete="new-password"
          hint="Tối thiểu 8 ký tự, gồm cả chữ và số."
          value={next}
          onChange={(e) => setNext(e.target.value)}
          required
        />
        <TextField
          id="confirm-pw"
          label="Xác nhận mật khẩu mới"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </form>
    </Modal>
  );
}
