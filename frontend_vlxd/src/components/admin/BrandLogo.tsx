'use client';

import { useEffect, useState, type ReactNode } from 'react';

/**
 * Hiện logo công ty; nếu chưa có hoặc ảnh lỗi (URL chết) thì hiện `fallback`
 * (vd chữ "VLXD"). Dùng cho sidebar admin, trang đăng nhập...
 */
export function BrandLogo({
  src,
  alt,
  className,
  fallback,
}: {
  src: string;
  alt: string;
  className?: string;
  fallback: ReactNode;
}) {
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);

  if (!src || broken) return <>{fallback}</>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setBroken(true)}
    />
  );
}
