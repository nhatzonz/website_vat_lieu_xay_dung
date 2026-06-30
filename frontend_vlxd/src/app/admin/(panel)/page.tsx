'use client';

import { FolderTree, KeyRound, Settings, UserPen } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { ChangePasswordModal } from '@/components/admin/ChangePasswordModal';
import { ProfileEditModal } from '@/components/admin/ProfileEditModal';
import { Button } from '@/components/admin/ui/Button';
import { getStoredUser } from '@/lib/auth-store';
import type { AdminUser } from '@/types/admin';
import styles from './dashboard.module.scss';

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Quản trị viên (toàn quyền)',
  sales: 'Nhân viên (xem + đăng bài)',
};

export default function DashboardPage() {
  const [user, setUser] = useState<AdminUser | null>(() => getStoredUser());
  const [pwOpen, setPwOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className={styles.wrap}>
      <section className={styles.hero}>
        <h2 className={styles.hello}>Xin chào, {user?.fullName} 👋</h2>
        <p className={styles.sub}>Chào mừng quay lại trang quản trị Vật liệu xây dựng.</p>
      </section>

      <div className={styles.grid}>
        <Link href="/admin/categories" className={styles.tile}>
          <FolderTree size={22} />
          <div>
            <h3>Danh mục</h3>
            <p>Quản lý cây danh mục sản phẩm</p>
          </div>
        </Link>
        <Link href="/admin/settings" className={styles.tile}>
          <Settings size={22} />
          <div>
            <h3>Cấu hình</h3>
            <p>Thông tin công ty, liên hệ, SEO</p>
          </div>
        </Link>
      </div>

      <section className={styles.account}>
        <h3 className={styles.cardTitle}>Tài khoản</h3>
        <dl className={styles.info}>
          <div>
            <dt>Tài khoản</dt>
            <dd>{user?.username}</dd>
          </div>
          <div>
            <dt>Họ tên</dt>
            <dd>{user?.fullName}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{user?.email || '—'}</dd>
          </div>
          <div>
            <dt>Vai trò</dt>
            <dd>{user ? ROLE_LABEL[user.role] : '—'}</dd>
          </div>
        </dl>
        <div className={styles.accountActions}>
          <Button
            variant="secondary"
            size="sm"
            icon={<UserPen size={15} />}
            onClick={() => setProfileOpen(true)}
          >
            Sửa thông tin
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<KeyRound size={15} />}
            onClick={() => setPwOpen(true)}
          >
            Đổi mật khẩu
          </Button>
        </div>
      </section>

      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
      <ProfileEditModal
        open={profileOpen}
        user={user}
        onClose={() => setProfileOpen(false)}
        onSaved={setUser}
      />
    </div>
  );
}
