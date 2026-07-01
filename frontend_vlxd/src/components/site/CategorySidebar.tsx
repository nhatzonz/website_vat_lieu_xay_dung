import { ChevronRight, List } from 'lucide-react';
import Link from 'next/link';
import { getProductList } from '@/lib/products';
import type { PublicCategory } from '@/types/catalog';
import styles from './CategorySidebar.module.scss';

/** Số sản phẩm tối đa hiện dưới mỗi danh mục ở sidebar. */
const MAX_PER_CATEGORY = 15;

/**
 * Sidebar "Danh mục sản phẩm": mỗi danh mục gốc kèm danh sách tên sản phẩm
 * (tối đa 15). Danh mục chưa có sản phẩm thì hiện danh mục con thay thế.
 */
export async function CategorySidebar({
  categories,
}: {
  categories: PublicCategory[];
}) {
  const groups = await Promise.all(
    categories.map(async (category) => ({
      category,
      products: await getProductList({
        category: category.slug,
        limit: MAX_PER_CATEGORY,
        sort: 'newest',
      }),
    })),
  );

  return (
    <aside className={styles.box}>
      <div className={styles.head}>
        <List size={18} />
        Danh mục sản phẩm
      </div>

      {groups.length === 0 ? (
        <p className={styles.empty}>Chưa có danh mục.</p>
      ) : (
        <ul className={styles.list}>
          {groups.map(({ category, products }) => {
            const children = category.children ?? [];
            return (
              <li key={category.id} className={styles.group}>
                <Link
                  href={`/san-pham?category=${category.slug}`}
                  className={styles.root}
                >
                  {category.name}
                </Link>

                {products.length > 0 ? (
                  <ul className={styles.sub}>
                    {products.map((p) => (
                      <li key={p.id}>
                        <Link href={`/san-pham/${p.slug}`} className={styles.child}>
                          <ChevronRight size={14} />
                          {p.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : children.length > 0 ? (
                  <ul className={styles.sub}>
                    {children.map((child) => (
                      <li key={child.id}>
                        <Link
                          href={`/san-pham?category=${child.slug}`}
                          className={styles.child}
                        >
                          <ChevronRight size={14} />
                          {child.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
