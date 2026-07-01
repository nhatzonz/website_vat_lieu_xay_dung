import { ChevronRight, List } from 'lucide-react';
import Link from 'next/link';
import type { PublicCategory } from '@/types/catalog';
import styles from './CategorySidebar.module.scss';

/** Sidebar "Danh mục sản phẩm": danh mục gốc + danh mục con 1 cấp. */
export function CategorySidebar({
  categories,
}: {
  categories: PublicCategory[];
}) {
  return (
    <aside className={styles.box}>
      <div className={styles.head}>
        <List size={18} />
        Danh mục sản phẩm
      </div>

      {categories.length === 0 ? (
        <p className={styles.empty}>Chưa có danh mục.</p>
      ) : (
        <ul className={styles.list}>
          {categories.map((root) => (
            <li key={root.id} className={styles.group}>
              <Link href={`/danh-muc/${root.slug}`} className={styles.root}>
                {root.name}
              </Link>
              {root.children && root.children.length > 0 && (
                <ul className={styles.sub}>
                  {root.children.map((child) => (
                    <li key={child.id}>
                      <Link
                        href={`/danh-muc/${child.slug}`}
                        className={styles.child}
                      >
                        <ChevronRight size={14} />
                        {child.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
