import { PackageOpen } from 'lucide-react';
import type { PublicProductListItem } from '@/types/catalog';
import { ProductSlider } from './ProductSlider';
import { SectionHeading } from './SectionHeading';
import styles from './NewProducts.module.scss';

/** Khối "Sản phẩm mới" trang chủ — slider tự lướt 2 card/lần. */
export function NewProducts({ products }: { products: PublicProductListItem[] }) {
  return (
    <section>
      <SectionHeading title="Sản phẩm mới" href="/san-pham" />

      {products.length === 0 ? (
        <div className={styles.empty}>
          <PackageOpen size={40} />
          <p>Sản phẩm đang được cập nhật.</p>
        </div>
      ) : (
        <ProductSlider products={products} />
      )}
    </section>
  );
}
