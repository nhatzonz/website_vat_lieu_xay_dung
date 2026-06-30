import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration, { AppConfig } from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => {
        const t = config.get('throttle', { infer: true });
        return [{ ttl: t.ttl * 1000, limit: t.limit }];
      },
    }),
    DatabaseModule,
    AuthModule,
    HealthModule,
    // Các module nghiệp vụ (products, categories, news, settings, upload...)
    // sẽ thêm vào đây khi có schema DB.
  ],
  providers: [
    // Secure-by-default: mọi route cần JWT trừ khi gắn @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Chống brute-force / spam toàn cục.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
