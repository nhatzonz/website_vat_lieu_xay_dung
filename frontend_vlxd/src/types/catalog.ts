/**
 * Kiểu dữ liệu cho khu công khai (public). Khớp response của
 * GET /public/categories (cây) và GET /public/categories/:slug.
 */

/** Banner công khai (GET /public/banners). */
export interface PublicBanner {
  id: number;
  title: string | null;
  image: string;
  linkUrl: string | null;
  position: string;
  sortOrder: number;
}

/** Node danh mục công khai; `children` có khi lấy từ cây/chi tiết. */
export interface PublicCategory {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  sortOrder: number;
  isActive: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  children?: PublicCategory[];
}
