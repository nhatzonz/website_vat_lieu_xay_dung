import { Tag } from 'lucide-react';
import Link from 'next/link';
import type { PublicBanner } from '@/types/catalog';
import styles from './SidebarBanners.module.scss';

/** Bọc ảnh trong link nếu có (nội bộ → next/link, ngoài → thẻ a). */
function BannerLink({
  href,
  children,
}: {
  href: string | null;
  children: React.ReactNode;
}) {
  if (!href) return <div className={styles.item}>{children}</div>;
  if (href.startsWith('/')) {
    return (
      <Link href={href} className={styles.item}>
        {children}
      </Link>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.item}
    >
      {children}
    </a>
  );
}

/** Banner vị trí "Cột bên": header "Ưu đãi", tag HOT nhấp nháy, zoom khi hover. */
export function SidebarBanners({ banners }: { banners: PublicBanner[] }) {
  if (banners.length === 0) return null;

  return (
    <aside className={styles.box}>
      <div className={styles.head}>
        <Tag size={18} />
        Ưu đãi
      </div>
      <div className={styles.list}>
        {banners.map((b) => (
          <BannerLink key={b.id} href={b.linkUrl}>
            <span className={styles.thumb}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={b.image} alt={b.title ?? 'Ưu đãi'} loading="lazy" />
            </span>
            {/* Tag HOT: đặt ảnh /hot.png vào thư mục public/. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/hot.png"
              alt="Hot"
              aria-hidden
              className={styles.hotTag}
            />
          </BannerLink>
        ))}
      </div>
    </aside>
  );
}
