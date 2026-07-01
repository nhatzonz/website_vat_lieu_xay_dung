import { PackageOpen } from 'lucide-react';
import styles from './NewProducts.module.scss';

/**
 * Khối "Sản phẩm mới". Dựng sẵn bố cục lưới; hiện chưa có module sản phẩm nên
 * để trạng thái trống. Khi có API sản phẩm, truyền `items` và render thẻ trong
 * `.grid` (đã chuẩn bị sẵn class).
 */
export function NewProducts() {
  const items: unknown[] = []; // TODO: nối API /public/products?is_new=1

  return (
    <section className={styles.section}>
      <div className={styles.head}>
        <h2 className={styles.title}>Sản phẩm mới</h2>
      </div>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <PackageOpen size={40} />
          <p>Sản phẩm đang được cập nhật.</p>
        </div>
      ) : (
        <div className={styles.grid}>{/* thẻ sản phẩm sẽ render ở đây */}</div>
      )}
    </section>
  );
}
