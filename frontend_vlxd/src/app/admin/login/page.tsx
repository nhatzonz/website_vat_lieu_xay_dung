'use client';

import { LogIn } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { Button } from '@/components/admin/ui/Button';
import { TextField } from '@/components/admin/ui/Field';
import { BrandLogo } from '@/components/admin/BrandLogo';
import { adminApi, AdminApiError } from '@/lib/admin-api';
import { getToken, saveSession } from '@/lib/auth-store';
import { useBranding } from '@/lib/branding';
import type { LoginResult } from '@/types/admin';
import styles from './login.module.scss';

export default function LoginPage() {
  const router = useRouter();
  const branding = useBranding();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Đã đăng nhập thì vào thẳng trang quản trị.
  useEffect(() => {
    if (getToken()) router.replace('/admin');
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await adminApi.post<LoginResult>(
        '/admin/auth/login',
        { username: username.trim(), password },
        { handleUnauthorized: false },
      );
      saveSession(result.accessToken, result.admin);
      router.replace('/admin');
    } catch (err) {
      if (err instanceof AdminApiError) {
        setError(
          err.status === 429
            ? 'Bạn thử quá nhiều lần. Vui lòng chờ một phút rồi thử lại.'
            : err.message,
        );
      } else {
        setError('Không kết nối được máy chủ. Kiểm tra lại kết nối.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <form className={styles.card} onSubmit={onSubmit}>
        <div className={styles.head}>
          <BrandLogo
            src={branding.logo}
            alt={branding.companyName || 'Logo'}
            className={styles.markLogo}
            fallback={<span className={styles.mark}>VLXD</span>}
          />
          <h1 className={styles.title}>Đăng nhập quản trị</h1>
          <p className={styles.subtitle}>
            {branding.companyName || 'Vật liệu xây dựng'}
          </p>
        </div>

        {error && <div className={styles.alert}>{error}</div>}

        <TextField
          id="username"
          label="Tài khoản"
          placeholder="Tên đăng nhập"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoFocus
        />
        <TextField
          id="password"
          label="Mật khẩu"
          type="password"
          placeholder="Mật khẩu"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button
          type="submit"
          loading={loading}
          icon={<LogIn size={16} />}
          className={styles.submit}
        >
          Đăng nhập
        </Button>
      </form>
    </div>
  );
}
