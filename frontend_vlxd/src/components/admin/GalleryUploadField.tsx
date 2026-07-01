'use client';

import { ImagePlus, Star, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { adminApi, AdminApiError } from '@/lib/admin-api';
import type { ProductImageItem } from '@/types/admin';
import { Button } from './ui/Button';
import styles from './GalleryUploadField.module.scss';

interface UploadResult {
  url: string;
}

/**
 * Thư viện ảnh sản phẩm: tải nhiều ảnh, đặt ảnh chính, xóa. Ảnh chính (Star)
 * dùng làm thumbnail nếu chưa chọn ảnh đại diện riêng.
 */
export function GalleryUploadField({
  value,
  onChange,
}: {
  value: ProductImageItem[];
  onChange: (next: ProductImageItem[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      const uploaded: ProductImageItem[] = [];
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const res = await adminApi.upload<UploadResult>('/admin/upload', file, {
          kind: 'product',
        });
        uploaded.push({ imagePath: res.url });
      }
      const next = [...value, ...uploaded];
      // Đảm bảo có 1 ảnh chính.
      if (!next.some((i) => i.isPrimary) && next.length) next[0].isPrimary = true;
      onChange(next);
    } catch (err) {
      setError(
        err instanceof AdminApiError ? err.message : 'Tải ảnh lên thất bại.',
      );
    } finally {
      setUploading(false);
    }
  }

  function remove(index: number) {
    const next = value.filter((_, i) => i !== index);
    if (!next.some((i) => i.isPrimary) && next.length) next[0].isPrimary = true;
    onChange(next);
  }

  function setPrimary(index: number) {
    onChange(value.map((img, i) => ({ ...img, isPrimary: i === index })));
  }

  return (
    <div className={styles.field}>
      <div className={styles.grid}>
        {value.map((img, i) => (
          <div
            key={img.id ?? img.imagePath + i}
            className={[styles.item, img.isPrimary ? styles.primary : '']
              .filter(Boolean)
              .join(' ')}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.imagePath} alt={img.altText ?? ''} />
            {img.isPrimary && <span className={styles.primaryTag}>Ảnh chính</span>}
            <div className={styles.itemActions}>
              <button
                type="button"
                title="Đặt làm ảnh chính"
                className={styles.miniBtn}
                onClick={() => setPrimary(i)}
              >
                <Star size={14} fill={img.isPrimary ? 'currentColor' : 'none'} />
              </button>
              <button
                type="button"
                title="Xóa ảnh"
                className={[styles.miniBtn, styles.del].join(' ')}
                onClick={() => remove(i)}
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          className={styles.add}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          <ImagePlus size={22} />
          <span>{uploading ? 'Đang tải…' : 'Thêm ảnh'}</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={onPick}
      />

      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
