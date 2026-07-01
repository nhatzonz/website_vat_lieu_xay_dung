import type { PublicCategory, PublicProductListItem } from '@/types/catalog';
import { ProductCard } from './ProductCard';
import { SectionHeading } from './SectionHeading';
import styles from './CategoryProductSection.module.scss';

/** Khối sản phẩm của một danh mục (heading + lưới). Rỗng thì không render. */
export function CategoryProductSection({
  category,
  products,
}: {
  category: PublicCategory;
  products: PublicProductListItem[];
}) {
  if (products.length === 0) return null;

  return (
    <section>
      <SectionHeading title={category.name} href={`/san-pham?category=${category.slug}`} />
      <div className={styles.grid}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
