'use client';

import {
  FolderTree,
  GalleryHorizontalEnd,
  Headphones,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Package,
  Settings,
  Tags,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { useBranding } from '@/lib/branding';
import { clearSession } from '@/lib/auth-store';
import type { AdminUser } from '@/types/admin';
import { BrandLogo } from './BrandLogo';
import styles from './AdminShell.module.scss';

const NAV = [
  { href: '/admin', label: 'Tổng quan', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'Sản phẩm', icon: Package },
  { href: '/admin/categories', label: 'Danh mục', icon: FolderTree },
  { href: '/admin/attributes', label: 'Thuộc tính', icon: ListChecks },
  { href: '/admin/tags', label: 'Thẻ', icon: Tags },
  { href: '/admin/banners', label: 'Banner', icon: GalleryHorizontalEnd },
  { href: '/admin/support', label: 'Hỗ trợ', icon: Headphones },
  { href: '/admin/settings', label: 'Cấu hình', icon: Settings },
];

const ROLE_LABEL: Record<AdminUser['role'], string> = {
  super_admin: 'Quản trị viên',
  sales: 'Nhân viên',
};

export function AdminShell({
  user,
  children,
}: {
  user: AdminUser;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const branding = useBranding();

  const active = NAV.find((item) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href),
  );

  function logout() {
    clearSession();
    router.replace('/admin/login');
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <BrandLogo
            src={branding.logo}
            alt={branding.companyName || 'Logo'}
            className={styles.brandLogo}
            fallback={<span className={styles.brandMark}>VLXD</span>}
          />
          <span className={styles.brandText}>Quản trị</span>
        </div>
        <nav className={styles.nav}>
          {NAV.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[styles.navItem, isActive && styles.navActive]
                  .filter(Boolean)
                  .join(' ')}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <h1 className={styles.pageTitle}>{active?.label ?? 'Quản trị'}</h1>
          <div className={styles.user}>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user.fullName}</span>
              <span className={styles.userRole}>{ROLE_LABEL[user.role]}</span>
            </div>
            <button type="button" className={styles.logout} onClick={logout}>
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
