'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Spinner } from '@/components/admin/ui/Spinner';
import { adminApi } from '@/lib/admin-api';
import { getToken, getStoredUser, setStoredUser } from '@/lib/auth-store';
import type { AdminUser } from '@/types/admin';

/**
 * Layout cho khu đã đăng nhập: chặn truy cập khi thiếu token, xác thực lại
 * token với BE (/me) để chắc tài khoản còn hiệu lực rồi mới dựng giao diện.
 */
export default function PanelLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace('/admin/login');
      return;
    }
    // Hiển thị tạm thông tin đã lưu trong lúc xác thực lại với máy chủ.
    setUser(getStoredUser());

    let alive = true;
    adminApi
      .get<AdminUser>('/admin/auth/me')
      .then((fresh) => {
        if (!alive) return;
        setStoredUser(fresh);
        setUser(fresh);
      })
      .catch(() => {
        // 401 đã được admin-api xử lý (xóa phiên + chuyển trang login).
      })
      .finally(() => {
        if (alive) setChecking(false);
      });

    return () => {
      alive = false;
    };
  }, [router]);

  if (checking || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spinner label="Đang tải..." />
      </div>
    );
  }

  return (
    <div className="adminPage">
      <AdminShell user={user}>{children}</AdminShell>
    </div>
  );
}
