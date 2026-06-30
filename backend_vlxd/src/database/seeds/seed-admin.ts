import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import dataSource from '../data-source';

/**
 * Tạo tài khoản super admin đầu tiên để đăng nhập CMS.
 *
 * Chạy:  npm run seed:admin
 * Tùy biến qua biến môi trường:
 *   SEED_ADMIN_USERNAME (mặc định: admin)
 *   SEED_ADMIN_PASSWORD (mặc định: Admin@123)
 *   SEED_ADMIN_NAME     (mặc định: Quản trị viên)
 */
async function run() {
  const username = process.env.SEED_ADMIN_USERNAME ?? 'admin';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123';
  const fullName = process.env.SEED_ADMIN_NAME ?? 'Quản trị viên';

  await dataSource.initialize();
  try {
    const existing = await dataSource.query(
      'SELECT id FROM admins WHERE username = ? LIMIT 1',
      [username],
    );
    const passwordHash = await bcrypt.hash(password, 12);

    if (existing.length > 0) {
      await dataSource.query(
        'UPDATE admins SET password_hash = ?, is_active = 1 WHERE username = ?',
        [passwordHash, username],
      );
      console.log(`Đã cập nhật mật khẩu cho admin "${username}".`);
    } else {
      await dataSource.query(
        `INSERT INTO admins (username, password_hash, full_name, role, is_active)
         VALUES (?, ?, ?, 'super_admin', 1)`,
        [username, passwordHash, fullName],
      );
      console.log(`Đã tạo admin "${username}".`);
    }
    console.log(`Mật khẩu: ${password}  (đổi ngay sau khi đăng nhập)`);
  } finally {
    await dataSource.destroy();
  }
}

run().catch((err) => {
  console.error('Seed admin thất bại:', err);
  process.exit(1);
});
