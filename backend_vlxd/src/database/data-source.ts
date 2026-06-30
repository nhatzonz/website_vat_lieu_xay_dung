import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';

/**
 * DataSource độc lập dùng cho TypeORM CLI (migration:generate / run / revert).
 * Tách khỏi NestJS để chạy ngoài runtime của app.
 *
 * Lưu ý: cần `dotenv` — đã có sẵn vì @nestjs/config kéo theo. Nếu thiếu,
 * cài: npm i -D dotenv
 */
loadEnv();

export default new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '3306', 10),
  username: process.env.DB_USERNAME ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_DATABASE ?? 'ceiling_db',
  charset: 'utf8mb4',
  timezone: 'Z',
  // Nạp mọi entity trong src — thêm module mới không cần sửa file này.
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
});
