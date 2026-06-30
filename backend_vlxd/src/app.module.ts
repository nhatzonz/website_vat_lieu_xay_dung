import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import configuration, { AppConfig } from './config/configuration';
import { envValidationSchema } from './config/env.validation';
import { RolesGuard } from './common/guards/roles.guard';
import { DatabaseModule } from './database/database.module';
import { AdminsModule } from './modules/admins/admins.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { HealthModule } from './modules/health/health.module';
import { SettingsModule } from './modules/settings/settings.module';
import { UploadModule } from './modules/upload/upload.module';

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
    AdminsModule,
    AuthModule,
    HealthModule,
    SettingsModule,
    CategoriesModule,
    UploadModule,
    // Các module nghiệp vụ tiếp theo (products, news...) thêm vào đây.
  ],
  providers: [
    // Secure-by-default: mọi route cần JWT trừ khi gắn @Public().
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    // Phân quyền theo @Roles(...) — chạy sau JwtAuthGuard.
    { provide: APP_GUARD, useClass: RolesGuard },
    // Chống brute-force / spam toàn cục.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
