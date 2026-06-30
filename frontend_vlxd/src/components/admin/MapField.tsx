'use client';

import { MapPin, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { adminApi, AdminApiError } from '@/lib/admin-api';
import { toEmbedSrc } from '@/lib/google-map';
import { Button } from './ui/Button';
import { TextArea } from './ui/Field';
import { GoogleMapEmbed } from './GoogleMapEmbed';
import styles from './MapField.module.scss';

/** Input là mã nhúng (iframe / link /maps/embed) → hiện ĐÚNG tên + thẻ địa điểm. */
function isEmbedInput(v: string): boolean {
  return (
    /<iframe/i.test(v) || /\/maps\/embed/i.test(v) || /[?&]output=embed/i.test(v)
  );
}

/**
 * Ô bản đồ nhận 2 dạng:
 *  - Mã nhúng (Chia sẻ → Nhúng bản đồ): dùng trực tiếp → hiện tên + thẻ địa điểm
 *    (miễn phí, giống ảnh mẫu). Ưu tiên cách này.
 *  - Link chia sẻ (maps.app.goo.gl / link Google Maps): gọi BE giải tọa độ →
 *    nhúng theo `q=lat,lng` (chỉ là chấm, không có tên).
 */
export function MapField({
  link,
  embed,
  disabled = false,
  onChange,
}: {
  link: string;
  embed: string;
  disabled?: boolean;
  onChange: (patch: Record<string, string>) => void;
}) {
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [named, setNamed] = useState<boolean>(() => isEmbedInput(link));

  async function process(current: string) {
    const v = current.trim();
    if (!v) {
      setError(null);
      setNamed(false);
      onChange({ map_link: '', map_embed: '' });
      return;
    }

    // 1) Mã nhúng → bóc src dùng luôn, không cần gọi BE (giữ được tên địa điểm).
    if (isEmbedInput(v)) {
      const src = toEmbedSrc(v);
      if (src) {
        setError(null);
        setNamed(true);
        onChange({ map_link: v, map_embed: src });
        return;
      }
    }

    // 2) Link chia sẻ → BE giải tọa độ.
    setResolving(true);
    setError(null);
    try {
      const r = await adminApi.get<{ embedUrl: string }>(
        `/admin/settings/resolve-map?url=${encodeURIComponent(v)}`,
      );
      setNamed(false);
      onChange({ map_link: v, map_embed: r.embedUrl });
    } catch (err) {
      onChange({ map_link: v, map_embed: '' });
      setError(
        err instanceof AdminApiError ? err.message : 'Không xử lý được nội dung.',
      );
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.inputRow}>
        <div className={styles.grow}>
          <TextArea
            id="map-input"
            label="Mã nhúng hoặc link Google Maps"
            rows={3}
            placeholder='Khuyên dùng: dán MÃ NHÚNG — vd <iframe src="https://www.google.com/maps/embed?pb=..."></iframe>
Hoặc dán link: https://maps.app.goo.gl/...'
            hint="Để hiện ĐÚNG tên công ty: Google Maps → Chia sẻ → Nhúng bản đồ → Sao chép HTML → dán vào đây."
            value={link}
            disabled={disabled}
            onChange={(e) => onChange({ map_link: e.target.value })}
            onBlur={(e) => process(e.target.value)}
          />
        </div>
        {!disabled && (
          <Button
            type="button"
            variant="secondary"
            icon={<RefreshCw size={15} />}
            loading={resolving}
            onClick={() => process(link)}
            className={styles.btn}
          >
            Tải bản đồ
          </Button>
        )}
      </div>

      {error && <p className={styles.note}>{error}</p>}

      {embed && (
        <div className={styles.preview}>
          <span className={styles.previewLabel}>
            <MapPin size={14} /> Xem trước
            {named
              ? ' — có tên địa điểm ✓'
              : ' — chỉ chấm tọa độ (dán mã nhúng để hiện tên)'}
          </span>
          <GoogleMapEmbed value={embed} height={280} />
        </div>
      )}
    </div>
  );
}
