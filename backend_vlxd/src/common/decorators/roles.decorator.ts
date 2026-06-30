import { SetMetadata } from '@nestjs/common';
import type { AdminRole } from '../../modules/admins/admin.entity';

export const ROLES_KEY = 'roles';

/**
 * Giới hạn route theo vai trò admin. Vd: @Roles('super_admin').
 * Không gắn = mọi admin đã đăng nhập đều vào được.
 */
export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);
