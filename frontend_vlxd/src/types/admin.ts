/**
 * Kiểu dữ liệu khớp đúng response BE cho khu admin.
 * Tham chiếu: auth.service.ts (PublicAdmin/AuthResult), settings.service.ts
 * (AdminSettingField), category.entity.ts.
 */

export type AdminRole = 'super_admin' | 'sales';

/** Trả về từ /admin/auth/login.admin và /admin/auth/me. */
export interface AdminUser {
  id: number;
  username: string;
  fullName: string;
  email: string | null;
  role: AdminRole;
}

/** Trả về từ /admin/auth/login. */
export interface LoginResult {
  accessToken: string;
  admin: AdminUser;
}

// ---------- Settings ----------

export type SettingGroup =
  | 'company'
  | 'contact'
  | 'address'
  | 'map'
  | 'social'
  | 'seo';

/** 1 field trong view admin (settings.service.ts → AdminSettingField). */
export interface SettingField {
  key: string;
  label: string;
  value: string;
  group: SettingGroup;
  public: boolean;
  multiline: boolean;
}

/** GET /admin/settings trả object gom theo nhóm. */
export type SettingsAdminView = Record<SettingGroup, SettingField[]>;

/** Body PUT /admin/settings. */
export interface UpdateSettingsBody {
  items: { key: string; value: string | null }[];
}

// ---------- Categories ----------

export interface Category {
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
  createdAt: string;
  updatedAt: string;
  /** Có khi gọi GET /admin/categories: số sản phẩm trực tiếp thuộc danh mục. */
  productCount?: number;
  /** Có ở thùng rác (GET /admin/categories/trash): thời điểm xóa mềm. */
  deletedAt?: string | null;
}

/** 1 dòng trong PATCH /admin/categories/reorder. */
export interface ReorderItem {
  id: number;
  sortOrder: number;
  parentId?: number | null;
}

export type BulkCategoryAction = 'activate' | 'deactivate' | 'delete';

// ---------- Banners ----------

/**
 * Vị trí hiển thị banner — khớp BANNER_POSITIONS ở backend.
 * Tạm ẩn 'home_banner' (Banner phụ trang chủ) vì chưa dùng tới; bỏ comment để
 * bật lại. Backend vẫn chấp nhận giá trị này nên không mất dữ liệu.
 */
export const BANNER_POSITIONS = [
  { value: 'home_slider', label: 'Slider trang chủ' },
  // { value: 'home_banner', label: 'Banner phụ trang chủ' },
  { value: 'sidebar', label: 'Cột bên' },
] as const;

export type BannerPosition = (typeof BANNER_POSITIONS)[number]['value'];

export function bannerPositionLabel(value: string): string {
  return BANNER_POSITIONS.find((p) => p.value === value)?.label ?? value;
}

export interface Banner {
  id: number;
  title: string | null;
  image: string;
  linkUrl: string | null;
  position: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

/** Body POST/PUT /admin/banners (field optional cho update). */
export interface BannerInput {
  title?: string;
  image: string;
  linkUrl?: string;
  position?: BannerPosition;
  sortOrder?: number;
  isActive?: boolean;
}

// ---------- Attributes ----------

export interface Attribute {
  id: number;
  name: string;
  unit: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

/** Body POST/PUT /admin/attributes. */
export interface AttributeInput {
  name: string;
  unit?: string;
  sortOrder?: number;
  isActive?: boolean;
}

// ---------- Tags ----------

export interface Tag {
  id: number;
  name: string;
  slug: string;
  /** Có khi gọi GET /admin/tags: số sản phẩm đang gắn thẻ. */
  productCount?: number;
}

/** Body POST/PUT /admin/tags. */
export interface TagInput {
  name: string;
  slug?: string;
}

// ---------- Products ----------

export type PriceType = 'fixed' | 'contact';

export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ProductImageItem {
  id?: number;
  imagePath: string;
  altText?: string | null;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface ProductAttrValue {
  attributeId: number;
  value: string;
  attribute?: Attribute;
}

export interface ProductTestMediaItem {
  mediaType: 'youtube' | 'image';
  mediaValue: string;
  caption?: string | null;
  sortOrder?: number;
}

/** Dòng trong bảng danh sách (tóm tắt). */
export interface ProductListItem {
  id: number;
  name: string;
  slug: string;
  sku: string | null;
  price: number | null;
  priceUnit: string;
  priceType: PriceType;
  thumbnail: string | null;
  shortDescription: string | null;
  isNew: boolean;
  isFeatured: boolean;
  isActive: boolean;
  views: number;
  sortOrder: number;
  createdAt: string;
  category?: { id: number; name: string; slug: string } | null;
}

/** Chi tiết đầy đủ (form sửa). */
export interface Product extends ProductListItem {
  content: string | null;
  testResult: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  ogImage: string | null;
  canonicalUrl: string | null;
  images: ProductImageItem[];
  attributeValues: ProductAttrValue[];
  testMedia: ProductTestMediaItem[];
  tags: Tag[];
}

/** Body POST/PUT /admin/products. */
export interface ProductInput {
  categoryId: number;
  name: string;
  slug?: string;
  sku?: string;
  price?: number | null;
  priceUnit?: string;
  priceType?: PriceType;
  thumbnail?: string;
  shortDescription?: string;
  content?: string;
  testResult?: string;
  isNew?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
  images?: ProductImageItem[];
  attributeValues?: { attributeId: number; value: string }[];
  testMedia?: ProductTestMediaItem[];
  tagIds?: number[];
}

/** Body POST/PUT /admin/categories (field optional cho update). */
export interface CategoryInput {
  name: string;
  slug?: string;
  parentId?: number | null;
  description?: string;
  image?: string;
  sortOrder?: number;
  isActive?: boolean;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  ogImage?: string;
  canonicalUrl?: string;
}
