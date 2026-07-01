'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { adminApi, AdminApiError } from '@/lib/admin-api';
import {
  BANNER_POSITIONS,
  type Banner,
  type BannerInput,
  type BannerPosition,
} from '@/types/admin';
import { InlineImageField } from './InlineImageField';
import { Button } from './ui/Button';
import { SelectField, Switch, TextField } from './ui/Field';
import { Modal } from './ui/Modal';
import { useToast } from './ui/Toast';
import styles from './BannerFormModal.module.scss';

interface Props {
  open: boolean;
  /** null = tạo mới. */
  editing: Banner | null;
  /** Vị trí mặc định khi tạo mới (theo tab đang xem). */
  defaultPosition: BannerPosition;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  image: string;
  title: string;
  linkUrl: string;
  position: BannerPosition;
  sortOrder: string;
  isActive: boolean;
}

function emptyState(position: BannerPosition): FormState {
  return {
    image: '',
    title: '',
    linkUrl: '',
    position,
    sortOrder: '0',
    isActive: true,
  };
}

function fromBanner(b: Banner): FormState {
  return {
    image: b.image,
    title: b.title ?? '',
    linkUrl: b.linkUrl ?? '',
    position: b.position as BannerPosition,
    sortOrder: String(b.sortOrder),
    isActive: b.isActive,
  };
}

export function BannerFormModal({
  open,
  editing,
  defaultPosition,
  onClose,
  onSaved,
}: Props) {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(emptyState(defaultPosition));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? fromBanner(editing) : emptyState(defaultPosition));
    setError(null);
  }, [open, editing, defaultPosition]);

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
    if (!form.image.trim()) {
      setError('Vui lòng tải lên ảnh banner.');
      return;
    }
    const payload: BannerInput = {
      image: form.image.trim(),
      title: form.title.trim() || undefined,
      linkUrl: form.linkUrl.trim() || undefined,
      position: form.position,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      if (editing) {
        await adminApi.put(`/admin/banners/${editing.id}`, payload);
        toast.success('Đã cập nhật banner.');
      } else {
        await adminApi.post('/admin/banners', payload);
        toast.success('Đã thêm banner.');
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(
        err instanceof AdminApiError ? err.message : 'Lưu banner thất bại.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      size="lg"
      title={editing ? 'Sửa banner' : 'Thêm banner'}
      onClose={close}
      busy={saving}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={saving}>
            Hủy
          </Button>
          <Button type="submit" form="banner-form" loading={saving}>
            {editing ? 'Lưu' : 'Thêm'}
          </Button>
        </>
      }
    >
      <form id="banner-form" onSubmit={submit} className={styles.form}>
        {error && <div className={styles.alert}>{error}</div>}

        <InlineImageField
          label="Ảnh banner *"
          kind="banner"
          value={form.image}
          hint="Kích thước khuyên dùng: 1920 × 720 px (tỉ lệ 16:6) để lấp đầy khung, không có viền. Ảnh khác tỉ lệ vẫn hiển thị đầy đủ (không bị cắt). JPEG/PNG/WebP, tối đa 8MB."
          onChange={(url) => set('image', url)}
        />

        <TextField
          id="banner-title"
          label="Tiêu đề"
          hint="Tùy chọn — dùng cho alt ảnh & nội dung hiển thị (nếu có)."
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
        />

        <TextField
          id="banner-link"
          label="Liên kết khi bấm"
          placeholder="/danh-muc/tran-nhom hoặc https://..."
          hint="Để trống nếu banner không bấm được."
          value={form.linkUrl}
          onChange={(e) => set('linkUrl', e.target.value)}
        />

        <div className={styles.row}>
          <SelectField
            id="banner-position"
            label="Vị trí hiển thị"
            value={form.position}
            onChange={(e) => set('position', e.target.value as BannerPosition)}
          >
            {BANNER_POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </SelectField>
          <TextField
            id="banner-sort"
            label="Thứ tự sắp xếp"
            type="number"
            value={form.sortOrder}
            onChange={(e) => set('sortOrder', e.target.value)}
          />
        </div>

        <Switch
          checked={form.isActive}
          onChange={(v) => set('isActive', v)}
          label="Hiển thị banner"
        />
      </form>
    </Modal>
  );
}
