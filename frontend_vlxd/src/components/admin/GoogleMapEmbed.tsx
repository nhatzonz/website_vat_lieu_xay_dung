import { toEmbedSrc } from '@/lib/google-map';

/**
 * Render bản đồ Google Maps từ giá trị settings `map_embed`.
 * Tái dùng được ở khu admin (preview) lẫn trang công khai (footer, giới thiệu).
 * Không có giá trị hợp lệ → không render gì.
 */
export function GoogleMapEmbed({
  value,
  height = 260,
  title = 'Bản đồ',
  className,
}: {
  value: string | null | undefined;
  height?: number;
  title?: string;
  className?: string;
}) {
  const src = toEmbedSrc(value);
  if (!src) return null;

  return (
    <iframe
      className={className}
      src={src}
      title={title}
      width="100%"
      height={height}
      style={{ border: 0, borderRadius: 8, display: 'block' }}
      loading="lazy"
      allowFullScreen
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
}
