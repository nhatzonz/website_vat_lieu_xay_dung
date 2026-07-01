import { Column, Entity, Generated, Index, PrimaryColumn } from 'typeorm';
import {
  bigintTransformer,
  booleanTransformer,
} from '../../common/util/column-transformers';
import { DEFAULT_SUPPORT_CHANNEL } from './support-channels';

/**
 * Nhân viên/kênh "Hỗ trợ trực tuyến" hiển thị trên web (bảng `support_contacts`).
 * Do admin nhập để KHÁCH xem (khác với bảng `contacts` là tin khách gửi vào).
 * Bảng phẳng, không quan hệ, không có cột thời gian — entity bám đúng schema.
 */
@Entity('support_contacts')
@Index('idx_support_active', ['isActive', 'sortOrder'])
export class SupportContact {
  @PrimaryColumn({ type: 'bigint', unsigned: true, transformer: bigintTransformer })
  @Generated('increment')
  id: number;

  /** Tên nhân viên tư vấn, vd "Mr Công". */
  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone: string | null;

  /** Số điện thoại Zalo hoặc link Zalo. */
  @Column({ type: 'varchar', length: 30, nullable: true })
  zalo: string | null;

  @Column({ type: 'varchar', length: 50, default: DEFAULT_SUPPORT_CHANNEL })
  channel: string;

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number;

  @Column({
    name: 'is_active',
    type: 'tinyint',
    default: 1,
    transformer: booleanTransformer,
  })
  isActive: boolean;
}
