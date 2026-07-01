import {
  Column,
  Entity,
  Generated,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { bigintTransformer } from '../../../common/util/column-transformers';
import { Product } from './product.entity';

export type TestMediaType = 'youtube' | 'image';

/** Media tab "Kết quả thử nghiệm" (bảng `product_test_media`). */
@Entity('product_test_media')
@Index('idx_ptmedia_product', ['productId', 'sortOrder'])
export class ProductTestMedia {
  @PrimaryColumn({ type: 'bigint', unsigned: true, transformer: bigintTransformer })
  @Generated('increment')
  id: number;

  @Column({ name: 'product_id', type: 'bigint', unsigned: true, transformer: bigintTransformer })
  productId: number;

  @ManyToOne(() => Product, (p) => p.testMedia, { onDelete: 'CASCADE', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product?: Product;

  @Column({ name: 'media_type', type: 'enum', enum: ['youtube', 'image'] })
  mediaType: TestMediaType;

  @Column({ name: 'media_value', length: 255 })
  mediaValue: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  caption: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;
}
