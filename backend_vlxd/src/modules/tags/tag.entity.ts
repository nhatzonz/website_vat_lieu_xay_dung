import { Column, Entity, Generated, Index, PrimaryColumn } from 'typeorm';
import { bigintTransformer } from '../../common/util/column-transformers';

/**
 * Thẻ gắn cho sản phẩm (bảng `tags`). Quan hệ n–n với sản phẩm qua
 * `product_tags`. Bảng tối giản: chỉ id, name, slug.
 */
@Entity('tags')
export class Tag {
  @PrimaryColumn({ type: 'bigint', unsigned: true, transformer: bigintTransformer })
  @Generated('increment')
  id: number;

  @Column({ length: 100 })
  name: string;

  @Index({ unique: true })
  @Column({ length: 120 })
  slug: string;
}
