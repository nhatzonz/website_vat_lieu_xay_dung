'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { adminApi, AdminApiError } from '@/lib/admin-api';
import type { Attribute, AttributeInput } from '@/types/admin';
import { Button } from './ui/Button';
import { Switch, TextField } from './ui/Field';
import { Modal } from './ui/Modal';
import { useToast } from './ui/Toast';
import styles from './FormModal.module.scss';

interface Props {
  open: boolean;
  editing: Attribute | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  name: string;
  unit: string;
  sortOrder: string;
  isActive: boolean;
}

const EMPTY: FormState = { name: '', unit: '', sortOrder: '0', isActive: true };

function fromAttribute(a: Attribute): FormState {
  return {
    name: a.name,
    unit: a.unit ?? '',
    sortOrder: String(a.sortOrder),
    isActive: a.isActive,
  };
}

export function AttributeFormModal({ open, editing, onClose, onSaved }: Props) {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? fromAttribute(editing) : EMPTY);
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
      setError('Vui lòng nhập tên thuộc tính.');
      return;
    }
    const payload: AttributeInput = {
      name: form.name.trim(),
      unit: form.unit.trim() || undefined,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      if (editing) {
        await adminApi.put(`/admin/attributes/${editing.id}`, payload);
        toast.success('Đã cập nhật thuộc tính.');
      } else {
        await adminApi.post('/admin/attributes', payload);
        toast.success('Đã thêm thuộc tính.');
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(
        err instanceof AdminApiError ? err.message : 'Lưu thuộc tính thất bại.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={editing ? 'Sửa thuộc tính' : 'Thêm thuộc tính'}
      onClose={close}
      busy={saving}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={saving}>
            Hủy
          </Button>
          <Button type="submit" form="attr-form" loading={saving}>
            {editing ? 'Lưu' : 'Thêm'}
          </Button>
        </>
      }
    >
      <form id="attr-form" onSubmit={submit} className={styles.form}>
        {error && <div className={styles.alert}>{error}</div>}

        <div className={styles.row}>
          <TextField
            id="attr-name"
            label="Tên thuộc tính *"
            placeholder="Vd: Vật liệu, Chiều dày…"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
          />
          <TextField
            id="attr-unit"
            label="Đơn vị"
            hint="Tùy chọn — vd: mm, m, kg."
            placeholder="mm"
            value={form.unit}
            onChange={(e) => set('unit', e.target.value)}
          />
        </div>

        <TextField
          id="attr-sort"
          label="Thứ tự sắp xếp"
          type="number"
          value={form.sortOrder}
          onChange={(e) => set('sortOrder', e.target.value)}
        />

        <Switch
          checked={form.isActive}
          onChange={(v) => set('isActive', v)}
          label="Đang sử dụng"
        />
      </form>
    </Modal>
  );
}
