/**
 * Cấu hình xử lý ảnh theo từng mục đích sử dụng (GÓI 6).
 * Thêm loại mới chỉ cần khai báo 1 preset — controller/service tự áp dụng.
 */
export type ImageKind =
  | 'logo'
  | 'favicon'
  | 'og'
  | 'banner'
  | 'category'
  | 'product'
  | 'content'
  | 'generic';

export interface ImagePreset {
  /** Thư mục trên Cloudinary. */
  folder: string;
  /** Bề rộng tối đa (px) — không phóng to ảnh nhỏ hơn. */
  maxWidth: number;
  /** Bề cao tối đa (px). Bỏ trống = theo tỉ lệ. */
  maxHeight?: number;
  /** 'inside' giữ tỉ lệ trong khung; 'cover' cắt đầy khung (cho favicon vuông). */
  fit: 'inside' | 'cover';
  /** Định dạng xuất: webp (nhẹ, có alpha), png (favicon), jpeg (ảnh chia sẻ MXH). */
  format: 'webp' | 'png' | 'jpeg';
  /** Chất lượng nén 1–100. */
  quality: number;
}

export const IMAGE_PRESETS: Record<ImageKind, ImagePreset> = {
  logo: { folder: 'vlxd/branding', maxWidth: 600, fit: 'inside', format: 'webp', quality: 85 },
  favicon: { folder: 'vlxd/branding', maxWidth: 64, maxHeight: 64, fit: 'cover', format: 'png', quality: 90 },
  // Ảnh chia sẻ MXH (og:image): chuẩn 1200×630, JPEG để MXH render ổn định.
  og: { folder: 'vlxd/seo', maxWidth: 1200, maxHeight: 630, fit: 'cover', format: 'jpeg', quality: 85 },
  banner: { folder: 'vlxd/banners', maxWidth: 1920, fit: 'inside', format: 'webp', quality: 80 },
  category: { folder: 'vlxd/categories', maxWidth: 800, fit: 'inside', format: 'webp', quality: 82 },
  product: { folder: 'vlxd/products', maxWidth: 1200, fit: 'inside', format: 'webp', quality: 82 },
  content: { folder: 'vlxd/content', maxWidth: 1600, fit: 'inside', format: 'webp', quality: 80 },
  generic: { folder: 'vlxd/uploads', maxWidth: 1600, fit: 'inside', format: 'webp', quality: 80 },
};

export const IMAGE_KINDS = Object.keys(IMAGE_PRESETS) as ImageKind[];

/** Trần dung lượng tệp đầu vào. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8MB

/**
 * Định dạng ảnh được phép. CỐ TÌNH loại SVG: SVG có thể nhúng script (XSS)
 * và sharp không rasterize an toàn cho mọi trường hợp.
 */
export const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
];

/** Chặn ảnh có tổng pixel quá lớn (decompression bomb). */
export const MAX_INPUT_PIXELS = 50_000_000; // ~50MP
