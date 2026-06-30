'use client';

import { ImageIcon, ImageUp, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { adminApi, AdminApiError } from '@/lib/admin-api';
import { Button } from './ui/Button';
import styles from './ImageUploadField.module.scss';

interface UploadResult {
  url: string;
  publicId: string;
}

/** Preset xử lý ảnh phía BE (khác với key settings). */
type UploadKind = 'logo' | 'favicon' | 'og';

/**
 * Ô upload ảnh lên Cloudinary (logo / favicon / ảnh chia sẻ MXH). Hiện preview,
 * nút tải lên / đổi / xóa. Khi chọn ảnh → upload (BE nén bằng sharp) → lưu
 * url + public_id vào settings; ảnh cũ sẽ bị xóa khi Lưu (BE xử lý).
 *
 * - settingKey: key lưu URL (vd 'logo', 'seo_default_og_image'). public_id lưu
 *   ở `${settingKey}_public_id`.
 * - uploadKind: preset nén ảnh ở BE (logo/favicon/og).
 */
export function ImageUploadField({
  settingKey,
  uploadKind,
  label,
  url,
  disabled = false,
  hint,
  onChange,
}: {
  settingKey: string;
  uploadKind: UploadKind;
  label: string;
  url: string;
  disabled?: boolean;
  hint?: string;
  onChange: (patch: Record<string, string>) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Ảnh tải lỗi (URL chết, vd giá trị seed cũ) → coi như chưa có ảnh.
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [url]);
  const hasImage = Boolean(url) && !broken;

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
        kind: uploadKind,
      });
      // Chỉ cập nhật giá trị. Ảnh cũ (nếu có) sẽ được BE xóa khi bấm Lưu —
      // tránh xóa nhầm ảnh đang dùng nếu người dùng Hoàn tác.
      onChange({
        [settingKey]: res.url,
        [`${settingKey}_public_id`]: res.publicId,
      });
    } catch (err) {
      setError(
        err instanceof AdminApiError ? err.message : 'Tải ảnh lên thất bại.',
      );
    } finally {
      setUploading(false);
    }
  }

  function remove() {
    // Đặt rỗng; BE sẽ xóa ảnh cũ trên Cloudinary khi Lưu (public_id → '').
    onChange({ [settingKey]: '', [`${settingKey}_public_id`]: '' });
  }

  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>

      <div className={styles.row}>
        <div
          className={[
            styles.preview,
            uploadKind === 'favicon' && styles.favicon,
            uploadKind === 'og' && styles.og,
            hasImage && styles.hasImage,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {hasImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt={label} onError={() => setBroken(true)} />
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
            {url && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                icon={<Trash2 size={15} />}
                disabled={uploading}
                onClick={remove}
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
