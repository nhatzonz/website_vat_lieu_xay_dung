import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AppConfig } from '../../../config/configuration';
import type {
  AuthenticatedUser,
  JwtPayload,
} from '../../../common/decorators/current-user.decorator';
import { AdminsService } from '../../admins/admins.service';

/**
 * Xác thực Bearer token cho khu admin. Sau khi token hợp lệ, tra DB để chắc
 * tài khoản còn tồn tại & đang hoạt động (token của admin bị khóa/xóa bị từ
 * chối ngay, không chờ hết hạn). Kết quả gắn vào request.user.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService<AppConfig, true>,
    private readonly adminsService: AdminsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('jwt', { infer: true }).secret,
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const admin = await this.adminsService.findById(payload.sub);
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Tài khoản không còn hiệu lực');
    }
    return {
      id: admin.id,
      username: admin.username,
      role: admin.role,
      fullName: admin.fullName,
    };
  }
}
