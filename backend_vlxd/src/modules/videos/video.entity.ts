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
import { VIDEO_POSITIONS } from './video-positions';

/**
 * Video YouTube nhúng trên web (bảng `videos`). Cột `position` là SET nên
 * TypeORM ánh xạ thành `string[]` (một video có thể ở nhiều vị trí). Bảng phẳng,
 * chỉ có `created_at` — entity bám đúng schema.
 */
@Entity('videos')
@Index('idx_videos_active', ['isActive', 'sortOrder'])
export class Video {
  @PrimaryColumn({ type: 'bigint', unsigned: true, transformer: bigintTransformer })
  @Generated('increment')
  id: number;

  @Column({ type: 'varchar', length: 200, nullable: true })
  title: string | null;

  @Column({ name: 'youtube_url', type: 'varchar', length: 255 })
  youtubeUrl: string;

  /** SET → mảng vị trí, vd ['home','sidebar']. */
  @Column({ type: 'set', enum: VIDEO_POSITIONS })
  position: string[];

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
