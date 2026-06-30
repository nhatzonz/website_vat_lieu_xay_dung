import { env } from './env';

/**
 * Client gọi NestJS từ server components.
 *
 * - Tự ghép prefix API.
 * - Bóc envelope { success, data } của backend, trả thẳng `data`.
 * - Hỗ trợ ISR qua `revalidate` (giây) hoặc tắt cache với `cache: 'no-store'`.
 *
 * Dùng:
 *   const products = await apiGet<Product[]>('/public/products', { revalidate: 120 });
 */
export interface ApiOptions {
  /** Số giây ISR. Bỏ qua nếu đặt `cache`. */
  revalidate?: number;
  /** 'no-store' cho dữ liệu động (SSR mỗi request). */
  cache?: RequestCache;
  /** Tag để revalidateTag() khi cần. */
  tags?: string[];
  headers?: Record<string, string>;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function buildNextOptions(options: ApiOptions): RequestInit {
  if (options.cache) {
    return { cache: options.cache };
  }
  return {
    next: {
      revalidate: options.revalidate ?? 60,
      tags: options.tags,
    },
  };
}

export async function apiGet<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const url = `${env.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json', ...options.headers },
    ...buildNextOptions(options),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (json && (json.message || json.error)) || `Lỗi API ${res.status}`;
    throw new ApiError(res.status, String(message), json);
  }

  // Backend bọc { success, data } (TransformInterceptor) — bóc ra nếu có.
  if (json && typeof json === 'object' && 'data' in json) {
    return json.data as T;
  }
  return json as T;
}

/**
 * Lấy cả gói phân trang { data, meta } từ backend (PaginatedResult).
 */
export async function apiGetPaginated<T>(
  path: string,
  options: ApiOptions = {},
): Promise<{ data: T[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
  const url = `${env.apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json', ...options.headers },
    ...buildNextOptions(options),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (json && (json.message || json.error)) || `Lỗi API ${res.status}`;
    throw new ApiError(res.status, String(message), json);
  }
  return json as never;
}
