'use client';

import { ImageIcon, ImageUp, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { adminApi, AdminApiError } from '@/lib/admin-api';
import { Button } from './ui/Button';
import styles from './ImageUploadField.module.scss';

interface UploadResult {
  url: string;
}

/**
 * Ô upload ảnh đơn giản dùng trong form (giá trị là URL string). Chọn ảnh →
 * upload lên Cloudinary (BE nén bằng sharp theo `kind`) → trả URL qua onChange.
 * Vẫn cho phép dán URL thủ công qua prop `allowUrl` (mặc định tắt).
 *
 * Khác `ImageUploadField` (gắn với settings, lưu cả public_id): component này
 * chỉ quản một URL, hợp cho ảnh danh mục/sản phẩm.
 */
export function InlineImageField({
  label,
  value,
  kind,
  hint,
  disabled = false,
  onChange,
}: {
  label: string;
  value: string;
  kind: string;
  hint?: string;
  disabled?: boolean;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [value]);
  const hasImage = Boolean(value) && !broken;

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // cho phép chọn lại cùng file
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn tệp ảnh.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const res = await adminApi.upload<UploadResult>('/admin/upload', file, {
        kind,
      });
      onChange(res.url);
    } catch (err) {
      setError(
        err instanceof AdminApiError ? err.message : 'Tải ảnh lên thất bại.',
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>

      <div className={styles.row}>
        <div
          className={[styles.preview, hasImage && styles.hasImage]
            .filter(Boolean)
            .join(' ')}
        >
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} onError={() => setBroken(true)} />
          ) : (
            <span className={styles.empty}>
              <ImageIcon size={22} />
              <span>Chưa có ảnh</span>
            </span>
          )}
        </div>

        {!disabled && (
          <div className={styles.actions}>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onPick}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              icon={<ImageUp size={15} />}
              loading={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {hasImage ? 'Đổi ảnh' : 'Tải ảnh lên'}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<Trash2 size={15} />}
                disabled={uploading}
                onClick={() => onChange('')}
              >
                Xóa
              </Button>
            )}
          </div>
        )}
      </div>

      {error ? (
        <span className={styles.error}>{error}</span>
      ) : (
        hint && <span className={styles.hint}>{hint}</span>
      )}
    </div>
  );
}
