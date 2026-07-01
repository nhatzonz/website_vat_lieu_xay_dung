import { apiGet, apiGetPaginated } from './api';
import type { PublicProduct, PublicProductListItem } from '@/types/catalog';

export interface ProductListParams {
  page?: number;
  limit?: number;
  category?: string;
  tag?: string;
  isFeatured?: boolean;
  isNew?: boolean;
  sort?: string;
  q?: string;
  withSpecs?: boolean;
}

function buildQuery(params: ProductListParams): string {
  const sp = new URLSearchParams();
  if (params.page) sp.set('page', String(params.page));
  if (params.limit) sp.set('limit', String(params.limit));
  if (params.category) sp.set('category', params.category);
  if (params.tag) sp.set('tag', params.tag);
  if (params.isFeatured) sp.set('isFeatured', '1');
  if (params.isNew) sp.set('isNew', '1');
  if (params.sort) sp.set('sort', params.sort);
  if (params.q) sp.set('q', params.q);
  if (params.withSpecs) sp.set('withSpecs', '1');
  const s = sp.toString();
  return s ? `?${s}` : '';
}

/** Danh sách sản phẩm công khai (phân trang). */
export function getProducts(params: ProductListParams = {}) {
  return apiGetPaginated<PublicProductListItem>(
    `/public/products${buildQuery(params)}`,
    { revalidate: 120, tags: ['products'] },
  );
}

/** Lấy nhanh 1 danh sách ngắn (trang chủ) — chỉ cần mảng. */
export async function getProductList(
  params: ProductListParams = {},
): Promise<PublicProductListItem[]> {
  const res = await getProducts(params).catch(() => null);
  return res?.data ?? [];
}

/** Chi tiết sản phẩm theo slug. */
export function getProductBySlug(slug: string): Promise<PublicProduct> {
  return apiGet<PublicProduct>(`/public/products/${slug}`, {
    revalidate: 120,
    tags: ['products', `product:${slug}`],
  });
}
