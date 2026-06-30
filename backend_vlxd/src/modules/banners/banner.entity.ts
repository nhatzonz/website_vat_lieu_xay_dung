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
import { DEFAULT_BANNER_POSITION } from './banner-positions';

/**
 * Banner/slider hiển thị trên web (bảng `banners`). Bảng phẳng, không quan hệ,
 * chỉ có `created_at` (không có updated_at) — entity bám đúng schema.
 */
@Entity('banners')
@Index('idx_banners_pos', ['position', 'isActive', 'sortOrder'])
export class Banner {
  @PrimaryColumn({ type: 'bigint', unsigned: true, transformer: bigintTransformer })
  @Generated('increment')
  id: number;

  @Column({ type: 'varchar', length: 150, nullable: true })
  title: string | null;

  @Column({ type: 'varchar', length: 255 })
  image: string;

  @Column({ name: 'link_url', type: 'varchar', length: 255, nullable: true })
  linkUrl: string | null;

  @Column({ type: 'varchar', length: 50, default: DEFAULT_BANNER_POSITION })
  position: string;

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
