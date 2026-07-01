import Link from 'next/link';
import styles from './SectionHeading.module.scss';

/** Tiêu đề khối trang chủ: chữ in hoa + gạch chân màu thương hiệu + link phụ. */
export function SectionHeading({
  title,
  href,
  moreLabel = 'Xem tất cả →',
}: {
  title: string;
  href?: string;
  moreLabel?: string;
}) {
  return (
    <div className={styles.head}>
      <h2 className={styles.title}>{title}</h2>
      {href && (
        <Link href={href} className={styles.more}>
          {moreLabel}
        </Link>
      )}
    </div>
  );
}
