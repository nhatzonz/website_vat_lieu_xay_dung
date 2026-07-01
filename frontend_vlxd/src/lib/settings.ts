import { apiGet } from './api';

/** Cấu hình site công khai dạng { key: value } (logo, hotline, email, địa chỉ…). */
export type PublicSettings = Record<string, string>;

/**
 * Lấy cấu hình site cho các server component (Header/Footer/…).
 * Lỗi API không được làm sập trang → trả object rỗng.
 */
export async function getPublicSettings(): Promise<PublicSettings> {
  try {
    return await apiGet<PublicSettings>('/public/settings', {
      revalidate: 300,
      tags: ['settings'],
    });
  } catch {
    return {};
  }
}

/** Gộp địa chỉ đầy đủ từ các phần (ưu tiên `address` nếu đã có sẵn). */
export function fullAddress(s: PublicSettings): string {
  if (s.address) return s.address;
  return [s.addr_detail, s.addr_ward, s.addr_district, s.addr_province]
    .filter(Boolean)
    .join(', ');
}
