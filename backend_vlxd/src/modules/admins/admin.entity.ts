import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import {
  bigintTransformer,
  booleanTransformer,
} from '../../common/util/column-transformers';

export type AdminRole = 'super_admin' | 'sales';

/**
 * Tài khoản quản trị CMS (bảng `admins`).
 * Mật khẩu LUÔN lưu hash bcrypt; cột passwordHash để `select: false` nên
 * mặc định KHÔNG bị query ra — chỉ lấy có chủ đích khi xác thực.
 */
@Entity('admins')
export class Admin {
  @PrimaryColumn({ type: 'bigint', unsigned: true, transformer: bigintTransformer })
  @Generated('increment')
  id: number;

  @Column({ length: 50, unique: true })
  username: string;

  @Column({ name: 'password_hash', length: 255, select: false })
  passwordHash: string;

  @Column({ name: 'full_name', length: 100 })
  fullName: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string | null;

  @Column({ type: 'enum', enum: ['super_admin', 'sales'], default: 'sales' })
  role: AdminRole;

  @Column({
    name: 'is_active',
    type: 'tinyint',
    default: 1,
    transformer: booleanTransformer,
  })
  isActive: boolean;

  @Column({ name: 'last_login_at', type: 'datetime', nullable: true })
  lastLoginAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
