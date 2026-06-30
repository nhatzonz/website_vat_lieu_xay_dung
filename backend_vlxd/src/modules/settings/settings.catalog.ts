/**
 * NGUỒN CHÂN LÝ DUY NHẤT cho cấu hình website.
 *
 * Mọi key hợp lệ phải khai báo ở đây. Nhờ vậy:
 *  - Public API chỉ trả những key `public: true` (không rò rỉ key nhạy cảm).
 *  - Update chỉ chấp nhận key có trong catalog (chống rác/pollution).
 *  - Admin form biết chính xác có field nào, nhãn gì, mặc định ra sao.
 *  - Frontend luôn nhận đủ key (thiếu thì lấy `default`) → không bị undefined.
 */
export type SettingGroup =
  | 'company'
  | 'contact'
  | 'address'
  | 'map'
  | 'social'
  | 'seo';

export interface SettingDef {
  key: string;
  group: SettingGroup;
  label: string;
  default: string;
  /** true = được trả qua /api/public/settings. */
  public: boolean;
  /** Gợi ý cho admin UI dùng textarea thay vì input. */
  multiline?: boolean;
}

export const SETTINGS_CATALOG: readonly SettingDef[] = [
  // --- Công ty ---
  { key: 'company_name', group: 'company', label: 'Tên công ty', default: '', public: true },
  { key: 'tax_code', group: 'company', label: 'Mã số thuế', default: '', public: true },
  { key: 'logo', group: 'company', label: 'Logo', default: '', public: true },
  { key: 'favicon', group: 'company', label: 'Favicon', default: '', public: true },
  // public_id Cloudinary (không public) — để xóa ảnh cũ khi đổi logo/favicon.
  { key: 'logo_public_id', group: 'company', label: 'Logo public_id', default: '', public: false },
  { key: 'favicon_public_id', group: 'company', label: 'Favicon public_id', default: '', public: false },

  // --- Liên hệ ---
  { key: 'hotline', group: 'contact', label: 'Hotline', default: '', public: true },
  { key: 'email', group: 'contact', label: 'Email', default: '', public: true },
  { key: 'zalo', group: 'contact', label: 'Số Zalo', default: '', public: true },

  // --- Địa chỉ ---
  // Chọn theo cây hành chính (Tỉnh → Quận/Huyện → Phường/Xã) + nhập chi tiết.
  // FE ghép tất cả thành `address` (chuỗi đầy đủ) và lưu luôn để dùng/SEO.
  // 3 mã *_code (non-public) chỉ để admin load lại đúng lựa chọn khi sửa.
  { key: 'addr_detail', group: 'address', label: 'Số nhà, tên đường', default: '', public: true },
  { key: 'addr_ward', group: 'address', label: 'Phường / Xã', default: '', public: true },
  { key: 'addr_district', group: 'address', label: 'Quận / Huyện', default: '', public: true },
  { key: 'addr_province', group: 'address', label: 'Tỉnh / Thành phố', default: '', public: true },
  { key: 'address', group: 'address', label: 'Địa chỉ đầy đủ (tự gộp)', default: '', public: true, multiline: true },
  { key: 'addr_province_code', group: 'address', label: 'Mã Tỉnh/TP', default: '', public: false },
  { key: 'addr_district_code', group: 'address', label: 'Mã Quận/Huyện', default: '', public: false },
  { key: 'addr_ward_code', group: 'address', label: 'Mã Phường/Xã', default: '', public: false },

  // --- Bản đồ ---
  // Admin chỉ dán 1 link chia sẻ Google Maps (vd https://maps.app.goo.gl/...).
  // BE giải link (follow redirect) lấy tọa độ → tự sinh `map_embed` (link nhúng).
  // FE công khai render iframe từ `map_embed`.
  { key: 'map_link', group: 'map', label: 'Mã nhúng / link Google Maps', default: '', public: true },
  { key: 'map_embed', group: 'map', label: 'Link nhúng (tự sinh)', default: '', public: true },

  // --- Mạng xã hội ---
  { key: 'social_facebook', group: 'social', label: 'Facebook', default: '', public: true },
  { key: 'social_youtube', group: 'social', label: 'YouTube', default: '', public: true },
  { key: 'social_tiktok', group: 'social', label: 'TikTok', default: '', public: true },
  { key: 'social_zalo_oa', group: 'social', label: 'Zalo OA', default: '', public: true },

  // --- SEO mặc định (fallback khi trang không có meta riêng) ---
  { key: 'seo_default_title', group: 'seo', label: 'Tiêu đề SEO mặc định', default: '', public: true },
  { key: 'seo_default_description', group: 'seo', label: 'Mô tả SEO mặc định', default: '', public: true, multiline: true },
  { key: 'seo_default_og_image', group: 'seo', label: 'Ảnh chia sẻ MXH mặc định', default: '', public: true },
  { key: 'seo_default_og_image_public_id', group: 'seo', label: 'OG image public_id', default: '', public: false },
] as const;

/** Tra cứu nhanh theo key. */
export const SETTINGS_BY_KEY = new Map<string, SettingDef>(
  SETTINGS_CATALOG.map((def) => [def.key, def]),
);

export const PUBLIC_SETTING_KEYS = SETTINGS_CATALOG.filter(
  (d) => d.public,
).map((d) => d.key);
