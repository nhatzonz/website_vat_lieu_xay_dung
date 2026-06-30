'use client';

/**
 * Lấy thông tin nhận diện (logo, favicon, tên công ty) từ API công khai
 * /public/settings cho khu admin (sidebar, trang đăng nhập...).
 * Cache ở mức module để nhiều component dùng chung 1 lần fetch.
 */
import { useEffect, useState } from 'react';
import { env } from './env';

export interface Branding {
  logo: string;
  favicon: string;
  companyName: string;
}

const EMPTY: Branding = { logo: '', favicon: '', companyName: '' };

let cache: Promise<Branding> | null = null;

export function fetchBranding(): Promise<Branding> {
  if (!cache) {
    cache = fetch(`${env.publicApiBaseUrl}/public/settings`, {
      cache: 'no-store',
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const d = (json && (json.data ?? json)) || {};
        return {
          logo: d.logo || '',
          favicon: d.favicon || '',
          companyName: d.company_name || '',
        };
      })
      .catch(() => EMPTY);
  }
  return cache;
}

/** Xóa cache để lần lấy sau nhận giá trị mới (gọi sau khi lưu cấu hình). */
export function clearBrandingCache(): void {
  cache = null;
}

export function useBranding(): Branding {
  const [branding, setBranding] = useState<Branding>(EMPTY);
  useEffect(() => {
    let alive = true;
    fetchBranding().then((b) => {
      if (alive) setBranding(b);
    });
    return () => {
      alive = false;
    };
  }, []);
  return branding;
}
