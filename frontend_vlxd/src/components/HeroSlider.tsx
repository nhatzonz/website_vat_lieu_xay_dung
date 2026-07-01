'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { PublicBanner } from '@/types/catalog';

const AUTOPLAY_MS = 5000;
/** Kéo quá tỉ lệ này của bề rộng thì chuyển slide (ngược lại bật về chỗ cũ). */
const SWIPE_RATIO = 0.15;

/** Bọc slide trong link nếu có (nội bộ → next/link, ngoài → thẻ a). */
function SlideLink({
  href,
  children,
}: {
  href: string | null;
  children: React.ReactNode;
}) {
  if (!href) return <>{children}</>;
  if (href.startsWith('/')) {
    return (
      <Link href={href} className="block h-full w-full" draggable={false}>
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full w-full"
      draggable={false}
    >
      {children}
    </a>
  );
}

/**
 * Slider banner trang chủ. Tự chạy + kéo/vuốt để cuộn (băng trượt ngang bám
 * theo tay, thả thì bật về slide gần nhất) + nút trái/phải + chấm chỉ mục.
 * - 0 banner: không render.
 * - 1 banner: chỉ hiện ảnh, ẩn điều khiển.
 */
export function HeroSlider({ banners }: { banners: PublicBanner[] }) {
  const [index, setIndex] = useState(0);
  const [dragPx, setDragPx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const count = banners.length;

  const trackRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const movedRef = useRef(false);

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  // Tự chạy (tạm dừng khi đang kéo).
  useEffect(() => {
    if (count <= 1 || dragging) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [count, dragging]);

  function onPointerDown(e: React.PointerEvent) {
    if (count <= 1) return;
    setDragging(true);
    startXRef.current = e.clientX;
    movedRef.current = false;
    setDragPx(0);
    trackRef.current?.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragging) return;
    const dx = e.clientX - startXRef.current;
    if (Math.abs(dx) > 5) movedRef.current = true;
    setDragPx(dx);
  }

  function endDrag() {
    if (!dragging) return;
    const width = trackRef.current?.offsetWidth ?? 1;
    const threshold = width * SWIPE_RATIO;
    if (dragPx <= -threshold) go(index + 1);
    else if (dragPx >= threshold) go(index - 1);
    setDragPx(0);
    setDragging(false);
  }

  // Nếu vừa kéo (không phải click gọn) thì chặn mở link.
  function onClickCapture(e: React.MouseEvent) {
    if (movedRef.current) {
      e.preventDefault();
      e.stopPropagation();
      movedRef.current = false;
    }
  }

  if (count === 0) return null;

  return (
    <section
      className="relative overflow-hidden rounded-xl bg-gray-100"
      aria-roledescription="carousel"
    >
      {/* Khung tỉ lệ cố định 16:6 để đồng đều & không nhảy layout. */}
      <div className="relative aspect-[16/6] w-full">
        <div
          ref={trackRef}
          className={`flex h-full ${
            count > 1 ? 'cursor-grab active:cursor-grabbing' : ''
          } ${dragging ? '' : 'transition-transform duration-500 ease-out'}`}
          style={{
            transform: `translateX(calc(${-index * 100}% + ${dragPx}px))`,
            touchAction: 'pan-y',
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onClickCapture={onClickCapture}
        >
          {banners.map((b, i) => (
            <div key={b.id} className="relative h-full w-full flex-shrink-0">
              <SlideLink href={b.linkUrl}>
                <div className="relative h-full w-full overflow-hidden">
                  {/* Nền: chính ảnh đó, phóng to + làm mờ để lấp đầy khung. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={b.image}
                    alt=""
                    aria-hidden
                    draggable={false}
                    className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl"
                  />
                  {/* Ảnh chính: hiển thị TRỌN VẸN, không cắt, không méo. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={b.image}
                    alt={b.title ?? 'Banner'}
                    draggable={false}
                    className="relative h-full w-full select-none object-contain"
                    loading={i === 0 ? 'eager' : 'lazy'}
                  />
                </div>
              </SlideLink>
            </div>
          ))}
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(index - 1)}
            aria-label="Banner trước"
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/35 p-2 text-white transition hover:bg-black/55"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={() => go(index + 1)}
            aria-label="Banner sau"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/35 p-2 text-white transition hover:bg-black/55"
          >
            <ChevronRight size={22} />
          </button>

          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
            {banners.map((b, i) => (
              <button
                key={b.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Tới banner ${i + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  i === index ? 'w-6 bg-white' : 'w-2.5 bg-white/60 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
