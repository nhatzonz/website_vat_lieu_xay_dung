'use client';

import { Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import styles from './SiteHeader.module.scss';

const NAV = [
  { href: '/', label: 'Trang chủ', exact: true },
  { href: '/gioi-thieu', label: 'Giới thiệu' },
  { href: '/san-pham', label: 'Sản phẩm' },
  { href: '/bang-gia', label: 'Bảng giá' },
  { href: '/tin-tuc', label: 'Tin tức' },
  { href: '/lien-he', label: 'Liên hệ' },
];

export function SiteHeader({
  logo,
  companyName,
}: {
  logo?: string;
  companyName?: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand} onClick={() => setOpen(false)}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt={companyName || 'Logo'} className={styles.logo} />
          ) : (
            <span className={styles.brandText}>{companyName || 'VLXD'}</span>
          )}
        </Link>

        <nav className={[styles.nav, open ? styles.navOpen : ''].join(' ')}>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={[
                styles.navItem,
                isActive(item.href, item.exact) ? styles.navActive : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className={styles.burger}
          aria-label="Mở menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
}
