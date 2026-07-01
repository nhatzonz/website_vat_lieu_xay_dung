import { Mail, Phone } from 'lucide-react';
import styles from './SiteTopBar.module.scss';

/** Thanh liên hệ nhỏ trên cùng: hotline + email (nền màu thương hiệu). */
export function SiteTopBar({
  hotline,
  email,
}: {
  hotline?: string;
  email?: string;
}) {
  if (!hotline && !email) return null;

  return (
    <div className={styles.bar}>
      <div className={`container ${styles.inner}`}>
        {hotline && (
          <a href={`tel:${hotline.replace(/\s/g, '')}`} className={styles.item}>
            <Phone size={15} />
            <span>
              Hotline: <strong>{hotline}</strong>
            </span>
          </a>
        )}
        {email && (
          <a href={`mailto:${email}`} className={styles.item}>
            <Mail size={15} />
            <span>Email: {email}</span>
          </a>
        )}
      </div>
    </div>
  );
}
