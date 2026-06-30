'use client';

/**
 * Lưu/đọc phiên đăng nhập admin trong localStorage (khu admin chạy CSR).
 * Token gắn vào header Bearer khi gọi /api/admin/*. Khi token hết hạn/không
 * hợp lệ, admin-api sẽ gọi clearSession() rồi điều hướng về /admin/login.
 */
import type { AdminUser } from '@/types/admin';

const TOKEN_KEY = 'vlxd_admin_token';
const USER_KEY = 'vlxd_admin_user';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function saveSession(token: string, user: AdminUser): void {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function setStoredUser(user: AdminUser): void {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function isSuperAdmin(user: AdminUser | null): boolean {
  return user?.role === 'super_admin';
}
