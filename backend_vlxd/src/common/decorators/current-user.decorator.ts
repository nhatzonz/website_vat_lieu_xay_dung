import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AdminRole } from '../../modules/admins/admin.entity';

/** Payload nhúng trong JWT (phần được ký vào token). */
export interface JwtPayload {
  sub: number;
  username: string;
  role: AdminRole;
}

/**
 * Thông tin admin đã xác thực, do JwtStrategy gắn vào request.user sau khi
 * tra DB xác nhận tài khoản còn hiệu lực.
 */
export interface AuthenticatedUser {
  id: number;
  username: string;
  role: AdminRole;
  fullName: string;
}

/**
 * Lấy admin hiện tại trong handler:
 *   handler(@CurrentUser() user: AuthenticatedUser)
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
