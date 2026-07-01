/**
 * Kênh liên hệ của một nhân viên hỗ trợ. Khớp cột `channel` (VARCHAR) của bảng
 * `support_contacts`. Thêm kênh mới chỉ cần khai báo ở đây — DTO validate &
 * FE select tự dùng theo.
 */
export const SUPPORT_CHANNELS = [
  'hotline', // Gọi điện qua số điện thoại
  'zalo', // Chat qua Zalo
] as const;

export type SupportChannel = (typeof SUPPORT_CHANNELS)[number];

export const DEFAULT_SUPPORT_CHANNEL: SupportChannel = 'hotline';
