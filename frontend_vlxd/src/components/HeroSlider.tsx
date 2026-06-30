'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { PublicBanner } from '@/types/catalog';

const AUTOPLAY_MS = 5000;

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
      <Link href={href} className="block h-full w-full">
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
    >
      {children}
    </a>
  );
}

/**
 * Slider banner trang chủ. Tự chạy, có nút trái/phải và chấm chỉ mục.
 * - 0 banner: không render.
 * - 1 banner: chỉ hiện ảnh, ẩn điều khiển.
 */
export function HeroSlider({ banners }: { banners: PublicBanner[] }) {
  const [index, setIndex] = useState(0);
  const count = banners.length;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [count]);

  if (count === 0) return null;

  return (
    <section
      className="relative overflow-hidden rounded-xl bg-gray-100"
      aria-roledescription="carousel"
    >
      {/* Khung tỉ lệ cố định để không nhảy layout. */}
      <div className="relative aspect-[16/6] w-full">
        {banners.map((b, i) => (
          <div
            key={b.id}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === index ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
            aria-hidden={i !== index}
          >
            <SlideLink href={b.linkUrl}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.image}
                alt={b.title ?? 'Banner'}
                className="h-full w-full object-cover"
                loading={i === 0 ? 'eager' : 'lazy'}
              />
            </SlideLink>
          </div>
        ))}
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
