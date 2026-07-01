import Link from 'next/link';
import type { PublicProductListItem } from '@/types/catalog';
import styles from './ProductCard.module.scss';

export function formatProductPrice(p: {
  price: number | null;
  priceUnit: string;
  priceType: 'fixed' | 'contact';
}): string {
  if (p.priceType === 'contact' || p.price === null) return 'Liên hệ';
  return `${p.price.toLocaleString('vi-VN')} ${p.priceUnit}`;
}

export function ProductCard({ product }: { product: PublicProductListItem }) {
  const isContact = product.priceType === 'contact' || product.price === null;

  return (
    <Link href={`/san-pham/${product.slug}`} className={styles.card}>
      <div className={styles.thumb}>
        {product.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.thumbnail} alt={product.name} loading="lazy" />
        ) : (
          <div className={styles.noImg}>Chưa có ảnh</div>
        )}
        <div className={styles.badges}>
          {product.isNew && <span className={[styles.badge, styles.new].join(' ')}>Mới</span>}
          {product.isFeatured && (
            <span className={[styles.badge, styles.hot].join(' ')}>Nổi bật</span>
          )}
        </div>
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{product.name}</h3>
        <div className={[styles.price, isContact ? styles.contact : ''].join(' ')}>
          {formatProductPrice(product)}
        </div>
      </div>
    </Link>
  );
}
