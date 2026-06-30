import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Đánh dấu route bỏ qua JwtAuthGuard (các endpoint công khai cho web đọc).
 * Dùng: @Public() trên controller/handler.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
