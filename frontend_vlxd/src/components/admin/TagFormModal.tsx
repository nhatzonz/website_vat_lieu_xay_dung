'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { adminApi, AdminApiError } from '@/lib/admin-api';
import type { Tag, TagInput } from '@/types/admin';
import { Button } from './ui/Button';
import { TextField } from './ui/Field';
import { Modal } from './ui/Modal';
import { useToast } from './ui/Toast';
import styles from './FormModal.module.scss';

interface Props {
  open: boolean;
  editing: Tag | null;
  onClose: () => void;
  onSaved: () => void;
}

export function TagFormModal({ open, editing, onClose, onSaved }: Props) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? '');
    setSlug(editing?.slug ?? '');
    setError(null);
  }, [open, editing]);

  function close() {
    if (saving) return;
    onClose();
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Vui lòng nhập tên thẻ.');
      return;
    }
    const payload: TagInput = {
      name: name.trim(),
      slug: slug.trim() || undefined,
    };

    setSaving(true);
    try {
      if (editing) {
        await adminApi.put(`/admin/tags/${editing.id}`, payload);
        toast.success('Đã cập nhật thẻ.');
      } else {
        await adminApi.post('/admin/tags', payload);
        toast.success('Đã thêm thẻ.');
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Lưu thẻ thất bại.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      title={editing ? 'Sửa thẻ' : 'Thêm thẻ'}
      onClose={close}
      busy={saving}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={saving}>
            Hủy
          </Button>
          <Button type="submit" form="tag-form" loading={saving}>
            {editing ? 'Lưu' : 'Thêm'}
          </Button>
        </>
      }
    >
      <form id="tag-form" onSubmit={submit} className={styles.form}>
        {error && <div className={styles.alert}>{error}</div>}

        <TextField
          id="tag-name"
          label="Tên thẻ *"
          placeholder="Vd: Khuyến mãi, Nổi bật…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <TextField
          id="tag-slug"
          label="Slug"
          hint="Để trống sẽ tự sinh từ tên."
          placeholder="tu-dong-tu-ten"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
      </form>
    </Modal>
  );
}
