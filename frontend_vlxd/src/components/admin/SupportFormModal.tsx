'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { adminApi, AdminApiError } from '@/lib/admin-api';
import {
  SUPPORT_CHANNELS,
  type SupportChannel,
  type SupportContact,
  type SupportContactInput,
} from '@/types/admin';
import { Button } from './ui/Button';
import { SelectField, Switch, TextField } from './ui/Field';
import { Modal } from './ui/Modal';
import { useToast } from './ui/Toast';
import styles from './BannerFormModal.module.scss';

interface Props {
  open: boolean;
  /** null = tạo mới. */
  editing: SupportContact | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  name: string;
  phone: string;
  zalo: string;
  channel: SupportChannel;
  sortOrder: string;
  isActive: boolean;
}

function emptyState(): FormState {
  return {
    name: '',
    phone: '',
    zalo: '',
    channel: 'hotline',
    sortOrder: '0',
    isActive: true,
  };
}

function fromContact(c: SupportContact): FormState {
  return {
    name: c.name,
    phone: c.phone ?? '',
    zalo: c.zalo ?? '',
    channel: c.channel as SupportChannel,
    sortOrder: String(c.sortOrder),
    isActive: c.isActive,
  };
}

export function SupportFormModal({ open, editing, onClose, onSaved }: Props) {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(emptyState());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? fromContact(editing) : emptyState());
    setError(null);
  }, [open, editing]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function close() {
    if (saving) return;
    onClose();
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError('Vui lòng nhập tên nhân viên/kênh hỗ trợ.');
      return;
    }
    if (!form.phone.trim() && !form.zalo.trim()) {
      setError('Cần ít nhất một số điện thoại hoặc Zalo.');
      return;
    }
    const payload: SupportContactInput = {
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      zalo: form.zalo.trim() || undefined,
      channel: form.channel,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      if (editing) {
        await adminApi.put(`/admin/support/${editing.id}`, payload);
        toast.success('Đã cập nhật mục hỗ trợ.');
      } else {
        await adminApi.post('/admin/support', payload);
        toast.success('Đã thêm mục hỗ trợ.');
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(
        err instanceof AdminApiError ? err.message : 'Lưu thất bại.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      size="lg"
      title={editing ? 'Sửa mục hỗ trợ' : 'Thêm mục hỗ trợ'}
      onClose={close}
      busy={saving}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={saving}>
            Hủy
          </Button>
          <Button type="submit" form="support-form" loading={saving}>
            {editing ? 'Lưu' : 'Thêm'}
          </Button>
        </>
      }
    >
      <form id="support-form" onSubmit={submit} className={styles.form}>
        {error && <div className={styles.alert}>{error}</div>}

        <TextField
          id="support-name"
          label="Tên hiển thị *"
          placeholder="Hotline 24/7, Mr Công, Ms Anh..."
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
        />

        <div className={styles.row}>
          <TextField
            id="support-phone"
            label="Số điện thoại"
            placeholder="0844 444 933"
            hint="Dùng cho nút gọi (tel:)."
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
          />
          <TextField
            id="support-zalo"
            label="Zalo"
            placeholder="0972 217 770 hoặc link zalo.me"
            hint="Số hoặc link Zalo."
            value={form.zalo}
            onChange={(e) => set('zalo', e.target.value)}
          />
        </div>

        <div className={styles.row}>
          <SelectField
            id="support-channel"
            label="Kênh chính"
            value={form.channel}
            onChange={(e) => set('channel', e.target.value as SupportChannel)}
          >
            {SUPPORT_CHANNELS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </SelectField>
          <TextField
            id="support-sort"
            label="Thứ tự sắp xếp"
            type="number"
            value={form.sortOrder}
            onChange={(e) => set('sortOrder', e.target.value)}
          />
        </div>

        <Switch
          checked={form.isActive}
          onChange={(v) => set('isActive', v)}
          label="Hiển thị trên web"
        />
      </form>
    </Modal>
  );
}
