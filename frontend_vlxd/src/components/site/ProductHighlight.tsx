import Link from 'next/link';
import type { PublicProductListItem } from '@/types/catalog';
import { formatProductPrice } from './ProductCard';
import styles from './ProductHighlight.module.scss';

/** Card ngang (ảnh trái + thông tin phải) cho khối "Sản phẩm mới". */
export function ProductHighlight({ product }: { product: PublicProductListItem }) {
  const isContact = product.priceType === 'contact' || product.price === null;

  return (
    <Link
      href={`/san-pham/${product.slug}`}
      className={styles.card}
      draggable={false}
    >
      <div className={styles.thumb}>
        {product.thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.thumbnail}
            alt={product.name}
            loading="lazy"
            draggable={false}
          />
        ) : (
          <div className={styles.noImg}>Chưa có ảnh</div>
        )}
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{product.name}</h3>
        <div className={styles.priceRow}>
          <span className={styles.priceLabel}>Giá:</span>
          <span className={[styles.price, isContact ? styles.contact : ''].join(' ')}>
            {formatProductPrice(product)}
          </span>
        </div>
        {product.attributeValues && product.attributeValues.length > 0 ? (
          <ul className={styles.specs}>
            {product.attributeValues.slice(0, 4).map((a) => (
              <li key={a.attributeId}>
                <span className={styles.specName}>{a.attribute?.name}:</span> {a.value}
                {a.attribute?.unit ? ` ${a.attribute.unit}` : ''}
              </li>
            ))}
          </ul>
        ) : (
          product.shortDescription && (
            <p className={styles.desc}>{product.shortDescription}</p>
          )
        )}
      </div>
    </Link>
  );
}
