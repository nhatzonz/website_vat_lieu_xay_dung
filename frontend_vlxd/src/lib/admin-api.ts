'use client';

/**
 * Client gọi API admin (CSR). Khác `lib/api.ts` (server, public): luôn gắn
 * Bearer token, bóc envelope { success, data }, và khi gặp 401 thì xóa phiên
 * + điều hướng về /admin/login (token hết hạn / tài khoản bị khóa).
 */
import { env } from './env';
import { clearSession, getToken } from './auth-store';

export class AdminApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'AdminApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Tự xử lý 401 (xóa phiên + redirect). Mặc định true; tắt cho trang login. */
  handleUnauthorized?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, handleUnauthorized = true } = options;
  const url = `${env.publicApiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const token = getToken();

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  if (handleUnauthorized && res.status === 401 && typeof window !== 'undefined') {
    clearSession();
    if (!window.location.pathname.startsWith('/admin/login')) {
      window.location.href = '/admin/login';
    }
  }

  // 204 No Content (vd change-password, delete category).
  if (res.status === 204) {
    return undefined as T;
  }

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (json && (json.message || json.error)) || `Lỗi API ${res.status}`;
    // message của Nest có thể là mảng (validation) → gộp 1 dòng.
    const text = Array.isArray(message) ? message.join(', ') : String(message);
    throw new AdminApiError(res.status, text, json);
  }

  if (json && typeof json === 'object' && 'data' in json) {
    return (json as { data: T }).data;
  }
  return json as T;
}

export const adminApi = {
  get: <T>(path: string) => request<T>(path),
  /** GET danh sách phân trang — trả nguyên gói { data, meta } (không bóc). */
  getPaged: async <T>(
    path: string,
  ): Promise<{ data: T[]; meta: { total: number; page: number; limit: number; totalPages: number } }> => {
    const url = `${env.publicApiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    const token = getToken();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(url, { headers, cache: 'no-store' });
    if (res.status === 401 && typeof window !== 'undefined') {
      clearSession();
      if (!window.location.pathname.startsWith('/admin/login')) {
        window.location.href = '/admin/login';
      }
    }
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = (json && (json.message || json.error)) || `Lỗi API ${res.status}`;
      throw new AdminApiError(
        res.status,
        Array.isArray(msg) ? msg.join(', ') : String(msg),
        json,
      );
    }
    return json as { data: T[]; meta: { total: number; page: number; limit: number; totalPages: number } };
  },
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: 'POST', body }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  /** Upload 1 file (multipart) kèm query params. KHÔNG tự đặt Content-Type. */
  upload: <T>(
    path: string,
    file: File,
    params?: Record<string, string>,
  ): Promise<T> => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
    const url = `${env.publicApiBaseUrl}${path}${qs}`;
    const token = getToken();
    const form = new FormData();
    form.append('file', file);
    return fetch(url, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
      cache: 'no-store',
    }).then(async (res) => {
      if (res.status === 401 && typeof window !== 'undefined') {
        clearSession();
        if (!window.location.pathname.startsWith('/admin/login')) {
          window.location.href = '/admin/login';
        }
      }
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        const msg = (json && (json.message || json.error)) || `Lỗi ${res.status}`;
        throw new AdminApiError(
          res.status,
          Array.isArray(msg) ? msg.join(', ') : String(msg),
          json,
        );
      }
      return (json && typeof json === 'object' && 'data' in json
        ? (json as { data: T }).data
        : (json as T)) as T;
    });
  },
};
