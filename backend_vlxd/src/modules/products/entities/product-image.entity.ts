import {
  Column,
  Entity,
  Generated,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import {
  bigintTransformer,
  booleanTransformer,
} from '../../../common/util/column-transformers';
import { Product } from './product.entity';

/** Ảnh trong thư viện của sản phẩm (bảng `product_images`). */
@Entity('product_images')
@Index('idx_pimages_product', ['productId'])
export class ProductImage {
  @PrimaryColumn({ type: 'bigint', unsigned: true, transformer: bigintTransformer })
  @Generated('increment')
  id: number;

  @Column({ name: 'product_id', type: 'bigint', unsigned: true, transformer: bigintTransformer })
  productId: number;

  @ManyToOne(() => Product, (p) => p.images, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @Column({ name: 'image_path', length: 255 })
  imagePath: string;

  @Column({ name: 'alt_text', type: 'varchar', length: 255, nullable: true })
  altText: string | null;

  @Column({ name: 'is_primary', type: 'tinyint', default: 0, transformer: booleanTransformer })
  isPrimary: boolean;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;
}
