/**
 * Vị trí hiển thị video. Khớp cột `position` kiểu SET('home','sidebar','about')
 * của bảng `videos` — một video có thể thuộc NHIỀU vị trí cùng lúc.
 */
export const VIDEO_POSITIONS = ['home', 'sidebar', 'about'] as const;

export type VideoPosition = (typeof VIDEO_POSITIONS)[number];

export const DEFAULT_VIDEO_POSITION: VideoPosition = 'home';
