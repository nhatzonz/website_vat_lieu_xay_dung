import { ChevronsRight, Phone } from 'lucide-react';
import type { PublicSupport } from '@/types/catalog';
import styles from './SupportBox.module.scss';

/** Chuẩn hóa link Zalo: nếu là URL thì giữ nguyên, nếu là số thì ghép zalo.me. */
function zaloHref(zalo: string): string {
  return zalo.startsWith('http') ? zalo : `https://zalo.me/${zalo.replace(/\s/g, '')}`;
}

/** Link liên hệ cho một dòng: ưu tiên gọi điện, không có số thì mở Zalo. */
function contactHref(c: PublicSupport): string | null {
  if (c.phone) return `tel:${c.phone.replace(/\s/g, '')}`;
  if (c.zalo) return zaloHref(c.zalo);
  return null;
}

/**
 * Khối "Hỗ trợ trực tuyến" ở sidebar: header navy + dải chevron, danh sách nhân
 * viên tư vấn kèm hotline/Zalo. Dữ liệu từ GET /public/support. Đặt dưới danh mục.
 */
export function SupportBox({ contacts }: { contacts: PublicSupport[] }) {
  if (contacts.length === 0) return null;

  return (
    <aside className={styles.box}>
      <div className={styles.head}>
        <span className={styles.ribbon} aria-hidden>
          <ChevronsRight size={20} strokeWidth={2.5} />
        </span>
        Hỗ trợ trực tuyến
      </div>

      <div className={styles.body}>
        <ul className={styles.list}>
          {contacts.map((c) => {
            const href = contactHref(c);
            const value = c.phone ?? c.zalo;
            const inner = (
              <>
                <Phone size={15} strokeWidth={2.4} aria-hidden />
                <span className={styles.text}>
                  <span className={styles.name}>{c.name}:</span>{' '}
                  {value && <span className={styles.value}>{value}</span>}
                </span>
              </>
            );
            return (
              <li key={c.id} className={styles.item}>
                {href ? (
                  <a
                    href={href}
                    className={styles.row}
                    {...(c.channel === 'zalo' || !c.phone
                      ? { target: '_blank', rel: 'noopener noreferrer' }
                      : {})}
                  >
                    {inner}
                  </a>
                ) : (
                  <span className={styles.row}>{inner}</span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
