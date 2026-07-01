/**
 * Kiểu dữ liệu cho khu công khai (public). Khớp response của
 * GET /public/categories (cây) và GET /public/categories/:slug.
 */

/** Sản phẩm tóm tắt (danh sách/lưới). */
export interface PublicProductListItem {
  id: number;
  name: string;
  slug: string;
  sku: string | null;
  price: number | null;
  priceUnit: string;
  priceType: 'fixed' | 'contact';
  thumbnail: string | null;
  shortDescription: string | null;
  isNew: boolean;
  isFeatured: boolean;
  category?: { id: number; name: string; slug: string } | null;
  /** Có khi gọi list với withSpecs=1 (card "Sản phẩm mới"). */
  attributeValues?: PublicProductAttrValue[];
}

export interface PublicProductImage {
  id: number;
  imagePath: string;
  altText: string | null;
  isPrimary: boolean;
}

export interface PublicProductAttrValue {
  attributeId: number;
  value: string;
  attribute?: { id: number; name: string; unit: string | null };
}

export interface PublicProductTestMedia {
  id: number;
  mediaType: 'youtube' | 'image';
  mediaValue: string;
  caption: string | null;
}

/** Chi tiết sản phẩm công khai. */
export interface PublicProduct extends PublicProductListItem {
  content: string | null;
  testResult: string | null;
  views: number;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  images: PublicProductImage[];
  attributeValues: PublicProductAttrValue[];
  testMedia: PublicProductTestMedia[];
  tags: { id: number; name: string; slug: string }[];
  related: PublicProductListItem[];
}

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

/** Video YouTube công khai (GET /public/videos). `position` là mảng (SET). */
export interface PublicVideo {
  id: number;
  title: string | null;
  youtubeUrl: string;
  position: string[];
  sortOrder: number;
}

/** Nhân viên/kênh "Hỗ trợ trực tuyến" (GET /public/support). */
export interface PublicSupport {
  id: number;
  name: string;
  phone: string | null;
  zalo: string | null;
  channel: string;
  sortOrder: number;
}
