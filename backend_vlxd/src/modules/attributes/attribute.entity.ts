import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  Index,
  PrimaryColumn,
} from 'typeorm';
import {
  bigintTransformer,
  booleanTransformer,
} from '../../common/util/column-transformers';

/**
 * Danh mục thuộc tính dùng chung (bảng `attributes`). Tạo một lần, khi nhập sản
 * phẩm sẽ liệt kê ra để điền giá trị. Bảng phẳng, chỉ có `created_at`.
 */
@Entity('attributes')
@Index('idx_attributes_active', ['isActive', 'sortOrder'])
export class Attribute {
  @PrimaryColumn({ type: 'bigint', unsigned: true, transformer: bigintTransformer })
  @Generated('increment')
  id: number;

  @Index({ unique: true })
  @Column({ length: 100 })
  name: string;

  /** Đơn vị gợi ý (vd "mm"). Tùy chọn. */
  @Column({ type: 'varchar', length: 30, nullable: true })
  unit: string | null;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({
    name: 'is_active',
    type: 'tinyint',
    default: 1,
    transformer: booleanTransformer,
  })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
