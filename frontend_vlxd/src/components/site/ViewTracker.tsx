'use client';

import { useEffect } from 'react';
import { env } from '@/lib/env';

/** Tăng lượt xem sản phẩm khi mở trang (fire-and-forget, không chặn UI). */
export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`${env.publicApiBaseUrl}/public/products/${slug}/view`, {
      method: 'POST',
      keepalive: true,
    }).catch(() => {});
  }, [slug]);
  return null;
}
