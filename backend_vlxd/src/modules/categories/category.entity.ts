import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  bigintTransformer,
  booleanTransformer,
} from '../../common/util/column-transformers';

/**
 * Danh mục sản phẩm phân cấp cha–con (bảng `categories`).
 * parent_id NULL = danh mục gốc.
 */
@Entity('categories')
export class Category {
  @PrimaryColumn({ type: 'bigint', unsigned: true, transformer: bigintTransformer })
  @Generated('increment')
  id: number;

  @Column({ name: 'parent_id', type: 'bigint', unsigned: true, nullable: true, transformer: bigintTransformer })
  parentId: number | null;

  @ManyToOne(() => Category, (c) => c.children, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  parent?: Category | null;

  @OneToMany(() => Category, (c) => c.parent)
  children?: Category[];

  @Column({ length: 150 })
  name: string;

  @Index({ unique: true })
  @Column({ length: 180 })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({
    name: 'is_active',
    type: 'tinyint',
    default: 1,
    transformer: booleanTransformer,
  })
  isActive: boolean;

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
}
