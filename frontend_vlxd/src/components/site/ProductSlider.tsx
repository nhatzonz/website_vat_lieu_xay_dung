'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { PublicProductListItem } from '@/types/catalog';
import { ProductHighlight } from './ProductHighlight';
import styles from './ProductSlider.module.scss';

const AUTOPLAY_MS = 4000;
const GAP = 16; // = $space-4

/**
 * "Sản phẩm mới": cuộn ngang thật (vuốt / trackpad / GIỮ CHUỘT kéo), có bám
 * điểm + tự lướt. Hiện 2 card/lần (1 trên mobile). Click card vẫn mở chi tiết.
 */
export function ProductSlider({ products }: { products: PublicProductListItem[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [active, setActive] = useState(0);
  const [perView, setPerView] = useState(2);
  const [dragging, setDragging] = useState(false);
  const down = useRef(false);
  const moved = useRef(false);
  const paused = useRef(false);
  const startX = useRef(0);
  const startScroll = useRef(0);

  const count = products.length;
  const maxIndex = Math.max(0, count - perView);
  const canSlide = count > perView;

  const measure = useCallback(() => {
    const first = ref.current?.firstElementChild as HTMLElement | null;
    setPerView(window.innerWidth <= 640 ? 1 : 2);
    if (first) setStep(first.offsetWidth + GAP);
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  // Tự lướt (tạm dừng khi rê chuột hoặc đang kéo).
  useEffect(() => {
    if (!canSlide || step === 0) return;
    const t = setInterval(() => {
      const el = ref.current;
      if (!el || paused.current || down.current) return;
      const next = el.scrollLeft + step;
      const atEnd = next > (maxIndex + 0.5) * step;
      el.scrollTo({ left: atEnd ? 0 : next, behavior: 'smooth' });
    }, AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [canSlide, step, maxIndex]);

  function onScroll() {
    const el = ref.current;
    if (!el || step === 0) return;
    setActive(Math.min(maxIndex, Math.round(el.scrollLeft / step)));
  }

  // Kéo chuột để cuộn (desktop/pen). Touch dùng cuộn gốc của trình duyệt.
  function onPointerDown(e: React.PointerEvent) {
    if (!canSlide || e.pointerType === 'touch') return;
    down.current = true;
    moved.current = false;
    startX.current = e.clientX;
    startScroll.current = ref.current?.scrollLeft ?? 0;
    setDragging(true);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!down.current || !ref.current) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 4) moved.current = true;
    ref.current.scrollLeft = startScroll.current - dx;
  }
  function stop() {
    if (!down.current) return;
    down.current = false;
    setDragging(false);
  }
  // Chỉ chặn click khi thực sự đã kéo (để click mở chi tiết vẫn hoạt động).
  function onClickCapture(e: React.MouseEvent) {
    if (moved.current) {
      e.preventDefault();
      e.stopPropagation();
      moved.current = false;
    }
  }

  function goTo(i: number) {
    ref.current?.scrollTo({ left: i * step, behavior: 'smooth' });
  }

  return (
    <div>
      <div
        ref={ref}
        className={[
          styles.track,
          canSlide ? styles.grab : '',
          dragging ? styles.dragging : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onScroll={onScroll}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={stop}
        onPointerLeave={stop}
        onClickCapture={onClickCapture}
        // Chặn trình duyệt tự kéo ảnh/link (làm hỏng kéo-cuộn).
        onDragStart={(e) => e.preventDefault()}
        onMouseEnter={() => (paused.current = true)}
        onMouseLeave={() => (paused.current = false)}
      >
        {products.map((p) => (
          <div key={p.id} className={styles.slide}>
            <ProductHighlight product={p} />
          </div>
        ))}
      </div>

      {canSlide && (
        <div className={styles.dots}>
          {Array.from({ length: maxIndex + 1 }, (_, i) => (
            <button
              key={i}
              type="button"
              className={[styles.dot, i === active ? styles.dotOn : ''].join(' ')}
              onClick={() => goTo(i)}
              aria-label={`Nhóm ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
