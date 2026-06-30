import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Cấu hình website dạng key-value (bảng `settings`).
 * Vd: company_name, hotline, email, logo, social_*, addr_*, map_*.
 */
@Entity('settings')
export class Setting {
  @PrimaryColumn({ name: 'setting_key', length: 100 })
  key: string;

  @Column({ name: 'setting_value', type: 'text', nullable: true })
  value: string | null;

  @Column({ name: 'setting_group', type: 'varchar', length: 50, default: 'general', nullable: true })
  group: string | null;
}
