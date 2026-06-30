/**
 * Các vị trí hiển thị banner. Khớp cột `position` (VARCHAR) của bảng `banners`.
 * Thêm vị trí mới chỉ cần khai báo ở đây — DTO validate & FE select tự dùng theo.
 */
export const BANNER_POSITIONS = [
  'home_slider', // Slider lớn đầu trang chủ
  'home_banner', // Dải banner phụ trên trang chủ
  'sidebar', // Cột bên (trang danh sách)
] as const;

export type BannerPosition = (typeof BANNER_POSITIONS)[number];

export const DEFAULT_BANNER_POSITION: BannerPosition = 'home_slider';
