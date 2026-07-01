'use client';

import { ChevronLeft, ChevronRight, ZoomIn, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { PublicProductImage } from '@/types/catalog';
import styles from './ProductGallery.module.scss';

/** Độ phóng đại khi rê chuột lên ảnh. */
const ZOOM = 2.4;

/** Gallery: ảnh lớn + dải thumbnail chọn được. */
export function ProductGallery({
  images,
  fallback,
  name,
}: {
  images: PublicProductImage[];
  fallback: string | null;
  name: string;
}) {
  const list =
    images.length > 0
      ? // ảnh chính (isPrimary) luôn lên đầu, giữ nguyên thứ tự còn lại
        [...images].sort(
          (a, b) => Number(b.isPrimary) - Number(a.isPrimary),
        )
      : fallback
        ? [{ id: 0, imagePath: fallback, altText: name, isPrimary: true }]
        : [];
  const [active, setActive] = useState(0);
  const [zooming, setZooming] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [lightbox, setLightbox] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  const count = list.length;

  // Chuyển ảnh trước/sau (cuộn vòng), dùng functional update để không stale.
  function step(delta: number) {
    setActive((a) => (a + delta + count) % count);
  }

  // Điều khiển modal bằng bàn phím: Esc đóng, ←/→ đổi ảnh + khóa cuộn nền.
  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightbox(false);
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'ArrowRight') step(1);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lightbox, count]);

  if (list.length === 0) {
    return <div className={styles.noImg}>Chưa có ảnh</div>;
  }

  const current = list[Math.min(active, list.length - 1)];

  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = mainRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Vị trí con trỏ theo % trong khung ảnh, kẹp 0–100.
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    setPos({ x, y });
  }

  return (
    <>
    <div className={styles.gallery}>
      <div
        ref={mainRef}
        className={styles.main}
        onMouseEnter={() => setZooming(true)}
        onMouseLeave={() => setZooming(false)}
        onMouseMove={onMove}
      >
        <button
          type="button"
          className={styles.frame}
          onClick={() => setLightbox(true)}
          aria-label="Phóng to ảnh"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={current.imagePath} alt={current.altText || name} />
          {/* Ô kính lúp báo vùng đang phóng to */}
          {zooming && (
            <span
              className={styles.lens}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                width: `${100 / ZOOM}%`,
                height: `${100 / ZOOM}%`,
              }}
            />
          )}
          {/* Icon kính lúp gợi ý click phóng to */}
          <span className={styles.zoomHint}>
            <ZoomIn size={18} />
          </span>
        </button>
        {/* Panel phóng to hiển thị bên phải (tràn ra ngoài khung) */}
        {zooming && (
          <div
            className={styles.zoomPanel}
            style={{
              backgroundImage: `url(${current.imagePath})`,
              backgroundSize: `${ZOOM * 100}%`,
              backgroundPosition: `${pos.x}% ${pos.y}%`,
            }}
          />
        )}
      </div>
      {list.length > 1 && (
        <div className={styles.thumbs}>
          {list.map((img, i) => (
            <button
              key={img.id || i}
              type="button"
              className={[styles.thumb, i === active ? styles.thumbActive : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => setActive(i)}
              aria-label={`Ảnh ${i + 1}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.imagePath} alt={img.altText || `${name} ${i + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>

    {/* Modal xem ảnh toàn màn hình */}
    {lightbox && (
      <div
        className={styles.lightbox}
        onClick={() => setLightbox(false)}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className={styles.closeBtn}
          onClick={() => setLightbox(false)}
          aria-label="Đóng"
        >
          <X size={24} />
        </button>
        {count > 1 && (
          <>
            <button
              type="button"
              className={`${styles.navBtn} ${styles.navPrev}`}
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              aria-label="Ảnh trước"
            >
              <ChevronLeft size={28} />
            </button>
            <button
              type="button"
              className={`${styles.navBtn} ${styles.navNext}`}
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
              aria-label="Ảnh sau"
            >
              <ChevronRight size={28} />
            </button>
            <span className={styles.counter}>
              {(active % count) + 1}/{count}
            </span>
          </>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.imagePath}
          alt={current.altText || name}
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    )}
    </>
  );
}
