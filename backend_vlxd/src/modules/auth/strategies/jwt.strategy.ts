import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { AppConfig } from '../../../config/configuration';
import type { JwtPayload } from '../../../common/decorators/current-user.decorator';

/**
 * Xác thực Bearer token cho khu admin.
 * Payload trả về sẽ được Passport gắn vào request.user.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService<AppConfig, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('jwt', { infer: true }).secret,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    // TODO: khi có bảng `admins`, có thể tra DB để chắc tài khoản còn hiệu lực.
    return { sub: payload.sub, username: payload.username, role: payload.role };
  }
}
