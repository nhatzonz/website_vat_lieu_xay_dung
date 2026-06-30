import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { AppConfig } from '../../config/configuration';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * Hạ tầng xác thực admin. JwtModule được export để module sau (vd AdminAuth
 * có bảng `admins`) inject JwtService ký token khi đăng nhập.
 *
 * Phần đăng nhập (controller/service kiểm tra mật khẩu bcrypt theo bảng
 * `admins`) sẽ thêm khi có schema DB.
 */
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const jwt = config.get('jwt', { infer: true });
        return {
          secret: jwt.secret,
          signOptions: { expiresIn: jwt.expiresIn },
        };
      },
    }),
  ],
  providers: [JwtStrategy],
  exports: [JwtModule, PassportModule],
})
export class AuthModule {}
