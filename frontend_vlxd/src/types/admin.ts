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
