import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { AppConfig } from '../config/configuration';

/**
 * Kết nối MySQL qua TypeORM. Entity được nạp tự động theo glob *.entity.{ts,js}
 * nên khi thêm module mới (có entity) không phải sửa file này.
 *
 * synchronize: LUÔN false — dùng migration để đổi schema, tránh mất dữ liệu.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const db = config.get('database', { infer: true });
        return {
          type: 'mysql',
          host: db.host,
          port: db.port,
          username: db.username,
          password: db.password,
          database: db.database,
          charset: 'utf8mb4',
          timezone: 'Z',
          autoLoadEntities: true,
          synchronize: false,
          logging: db.logging,
          migrations: [__dirname + '/migrations/*.{ts,js}'],
        };
      },
    }),
  ],
})
export class DatabaseModule {}
