import { Phone } from 'lucide-react';
import styles from './FloatingContact.module.scss';

/** Nút liên hệ nổi (góc dưới trái): gọi hotline + chat Zalo. */
export function FloatingContact({
  hotline,
  zalo,
}: {
  hotline?: string;
  zalo?: string;
}) {
  if (!hotline && !zalo) return null;

  const zaloHref = zalo
    ? zalo.startsWith('http')
      ? zalo
      : `https://zalo.me/${zalo.replace(/\s/g, '')}`
    : null;

  return (
    <div className={styles.wrap}>
      {hotline && (
        <a
          href={`tel:${hotline.replace(/\s/g, '')}`}
          className={[styles.btn, styles.phone].join(' ')}
          aria-label={`Gọi ${hotline}`}
        >
          <span className={styles.ring} aria-hidden />
          <Phone size={22} />
        </a>
      )}
      {zaloHref && (
        <a
          href={zaloHref}
          target="_blank"
          rel="noopener noreferrer"
          className={[styles.btn, styles.zalo].join(' ')}
          aria-label="Chat Zalo"
        >
          Zalo
        </a>
      )}
    </div>
  );
}
