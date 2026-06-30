'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { adminApi, AdminApiError } from '@/lib/admin-api';
import { descendantIds, flattenTree } from '@/lib/category-tree';
import type { Category, CategoryInput } from '@/types/admin';
import { InlineImageField } from './InlineImageField';
import { Button } from './ui/Button';
import { SelectField, Switch, TextArea, TextField } from './ui/Field';
import { Modal } from './ui/Modal';
import { useToast } from './ui/Toast';
import styles from './CategoryFormModal.module.scss';

interface Props {
  open: boolean;
  /** null = tạo mới. */
  editing: Category | null;
  /** Toàn bộ danh mục (để dựng select cha + chặn chu trình). */
  all: Category[];
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  name: string;
  slug: string;
  parentId: string; // '' = gốc
  description: string;
  image: string;
  sortOrder: string;
  isActive: boolean;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogImage: string;
  canonicalUrl: string;
}

/** Tạm ẩn khối SEO (chưa dùng tới). Đổi thành true để bật lại. */
const SHOW_SEO = false;

const EMPTY: FormState = {
  name: '',
  slug: '',
  parentId: '',
  description: '',
  image: '',
  sortOrder: '0',
  isActive: true,
  metaTitle: '',
  metaDescription: '',
  metaKeywords: '',
  ogImage: '',
  canonicalUrl: '',
};

function fromCategory(c: Category): FormState {
  return {
    name: c.name,
    slug: c.slug,
    parentId: c.parentId !== null ? String(c.parentId) : '',
    description: c.description ?? '',
    image: c.image ?? '',
    sortOrder: String(c.sortOrder),
    isActive: c.isActive,
    metaTitle: c.metaTitle ?? '',
    metaDescription: c.metaDescription ?? '',
    metaKeywords: c.metaKeywords ?? '',
    ogImage: c.ogImage ?? '',
    canonicalUrl: c.canonicalUrl ?? '',
  };
}

export function CategoryFormModal({
  open,
  editing,
  all,
  onClose,
  onSaved,
}: Props) {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showSeo, setShowSeo] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? fromCategory(editing) : EMPTY);
    setError(null);
    setShowSeo(false);
  }, [open, editing]);

  // Lựa chọn danh mục cha: loại chính nó + hậu duệ khi đang sửa.
  const parentOptions = useMemo(() => {
    const blocked = editing ? descendantIds(all, editing.id) : new Set<number>();
    return flattenTree(all)
      .filter((row) => !blocked.has(row.category.id))
      .map((row) => ({
        id: row.category.id,
        label: `${'— '.repeat(row.depth)}${row.category.name}`,
      }));
  }, [all, editing]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function close() {
    if (saving) return;
    onClose();
  }

  function buildPayload(): CategoryInput {
    const payload: CategoryInput = {
      name: form.name.trim(),
      slug: form.slug.trim() || undefined,
      parentId: form.parentId ? Number(form.parentId) : null,
      description: form.description.trim() || undefined,
      image: form.image.trim() || undefined,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
      metaTitle: form.metaTitle.trim() || undefined,
      metaDescription: form.metaDescription.trim() || undefined,
      metaKeywords: form.metaKeywords.trim() || undefined,
      ogImage: form.ogImage.trim() || undefined,
      canonicalUrl: form.canonicalUrl.trim() || undefined,
    };
    return payload;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError('Vui lòng nhập tên danh mục.');
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editing) {
        await adminApi.put(`/admin/categories/${editing.id}`, payload);
        toast.success('Đã cập nhật danh mục.');
      } else {
        await adminApi.post('/admin/categories', payload);
        toast.success('Đã thêm danh mục.');
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(
        err instanceof AdminApiError ? err.message : 'Lưu danh mục thất bại.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      size="lg"
      title={editing ? 'Sửa danh mục' : 'Thêm danh mục'}
      onClose={close}
      busy={saving}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={saving}>
            Hủy
          </Button>
          <Button type="submit" form="cat-form" loading={saving}>
            {editing ? 'Lưu' : 'Thêm'}
          </Button>
        </>
      }
    >
      <form id="cat-form" onSubmit={submit} className={styles.form}>
        {error && <div className={styles.alert}>{error}</div>}

        <div className={styles.row}>
          <TextField
            id="cat-name"
            label="Tên danh mục *"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
          />
          <TextField
            id="cat-slug"
            label="Slug"
            hint="Để trống sẽ tự sinh từ tên."
            placeholder="tu-dong-tu-ten"
            value={form.slug}
            onChange={(e) => set('slug', e.target.value)}
          />
        </div>

        <div className={styles.row}>
          <SelectField
            id="cat-parent"
            label="Danh mục cha"
            value={form.parentId}
            onChange={(e) => set('parentId', e.target.value)}
          >
            <option value="">— Danh mục gốc —</option>
            {parentOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </SelectField>
          <TextField
            id="cat-sort"
            label="Thứ tự sắp xếp"
            type="number"
            value={form.sortOrder}
            onChange={(e) => set('sortOrder', e.target.value)}
          />
        </div>

        <InlineImageField
          label="Ảnh danh mục"
          kind="category"
          value={form.image}
          hint="JPEG/PNG/WebP, tối đa 8MB. Ảnh sẽ được nén & tối ưu tự động."
          onChange={(url) => set('image', url)}
        />

        <TextArea
          id="cat-desc"
          label="Mô tả"
          rows={3}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
        />

        <Switch
          checked={form.isActive}
          onChange={(v) => set('isActive', v)}
          label="Hiển thị danh mục"
        />

        {SHOW_SEO && (
          <button
            type="button"
            className={styles.seoToggle}
            onClick={() => setShowSeo((s) => !s)}
          >
            {showSeo ? '▾' : '▸'} Tùy chọn SEO
          </button>
        )}

        {SHOW_SEO && showSeo && (
          <div className={styles.seo}>
            <TextField
              id="cat-mtitle"
              label="Meta title"
              value={form.metaTitle}
              onChange={(e) => set('metaTitle', e.target.value)}
            />
            <TextArea
              id="cat-mdesc"
              label="Meta description"
              rows={2}
              value={form.metaDescription}
              onChange={(e) => set('metaDescription', e.target.value)}
            />
            <TextField
              id="cat-mkw"
              label="Meta keywords"
              value={form.metaKeywords}
              onChange={(e) => set('metaKeywords', e.target.value)}
            />
            <InlineImageField
              label="OG image (ảnh chia sẻ MXH)"
              kind="og"
              value={form.ogImage}
              hint="Chuẩn 1200×630. Hiện khi chia sẻ lên Facebook/Zalo."
              onChange={(url) => set('ogImage', url)}
            />
            <TextField
              id="cat-canon"
              label="Canonical URL"
              value={form.canonicalUrl}
              onChange={(e) => set('canonicalUrl', e.target.value)}
            />
          </div>
        )}
      </form>
    </Modal>
  );
}
