import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  bigintTransformer,
  booleanTransformer,
  decimalTransformer,
} from '../../../common/util/column-transformers';
import { Category } from '../../categories/category.entity';
import { Tag } from '../../tags/tag.entity';
import { ProductAttributeValue } from './product-attribute-value.entity';
import { ProductImage } from './product-image.entity';
import { ProductTestMedia } from './product-test-media.entity';

export type PriceType = 'fixed' | 'contact';

/**
 * Sản phẩm (bảng `products`). Quan hệ: 1 danh mục, nhiều ảnh, nhiều giá trị
 * thuộc tính, nhiều media kết quả thử nghiệm, nhiều thẻ (n–n).
 */
@Entity('products')
@Index('idx_products_flags', ['isActive', 'isNew', 'isFeatured'])
export class Product {
  @PrimaryColumn({ type: 'bigint', unsigned: true, transformer: bigintTransformer })
  @Generated('increment')
  id: number;

  @Column({ name: 'category_id', type: 'bigint', unsigned: true, transformer: bigintTransformer })
  categoryId: number;

  @ManyToOne(() => Category, { onDelete: 'RESTRICT', onUpdate: 'CASCADE' })
  @JoinColumn({ name: 'category_id' })
  category?: Category;

  @Column({ length: 255 })
  name: string;

  @Index({ unique: true })
  @Column({ length: 280 })
  slug: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku: string | null;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true, transformer: decimalTransformer })
  price: number | null;

  @Column({ name: 'price_unit', type: 'varchar', length: 20, default: 'đ/m2' })
  priceUnit: string;

  @Column({ name: 'price_type', type: 'enum', enum: ['fixed', 'contact'], default: 'fixed' })
  priceType: PriceType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  thumbnail: string | null;

  @Column({ name: 'short_description', type: 'varchar', length: 500, nullable: true })
  shortDescription: string | null;

  @Column({ type: 'longtext', nullable: true })
  content: string | null;

  @Column({ name: 'test_result', type: 'longtext', nullable: true })
  testResult: string | null;

  @Column({ name: 'is_new', type: 'tinyint', default: 0, transformer: booleanTransformer })
  isNew: boolean;

  @Column({ name: 'is_featured', type: 'tinyint', default: 0, transformer: booleanTransformer })
  isFeatured: boolean;

  @Column({ name: 'is_active', type: 'tinyint', default: 1, transformer: booleanTransformer })
  isActive: boolean;

  @Column({ type: 'int', unsigned: true, default: 0 })
  views: number;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({ name: 'meta_title', type: 'varchar', length: 255, nullable: true })
  metaTitle: string | null;

  @Column({ name: 'meta_description', type: 'varchar', length: 500, nullable: true })
  metaDescription: string | null;

  @Column({ name: 'meta_keywords', type: 'varchar', length: 500, nullable: true })
  metaKeywords: string | null;

  @Column({ name: 'og_image', type: 'varchar', length: 255, nullable: true })
  ogImage: string | null;

  @Column({ name: 'canonical_url', type: 'varchar', length: 255, nullable: true })
  canonicalUrl: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  @OneToMany(() => ProductImage, (i) => i.product, { cascade: true })
  images?: ProductImage[];

  @OneToMany(() => ProductAttributeValue, (v) => v.product, { cascade: true })
  attributeValues?: ProductAttributeValue[];

  @OneToMany(() => ProductTestMedia, (m) => m.product, { cascade: true })
  testMedia?: ProductTestMedia[];

  @ManyToMany(() => Tag)
  @JoinTable({
    name: 'product_tags',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags?: Tag[];
}
