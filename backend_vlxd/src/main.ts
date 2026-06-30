import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import type { AppConfig } from './config/configuration';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const config = app.get(ConfigService<AppConfig, true>);

  const apiPrefix = config.get('apiPrefix', { infer: true });
  const corsOrigins = config.get('corsOrigins', { infer: true });
  const port = config.get('port', { infer: true });
  const nodeEnv = config.get('nodeEnv', { infer: true });

  app.setGlobalPrefix(apiPrefix);

  // Bảo mật header HTTP.
  app.use(helmet());

  // Chỉ cho frontend đã khai báo gọi API.
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Validate + lọc field lạ cho mọi DTO.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  app.enableShutdownHooks();

  // Swagger chỉ bật ngoài production.
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('VLXD API')
      .setDescription('API cho website vật liệu xây dựng')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document);
  }

  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API chạy tại http://localhost:${port}/${apiPrefix}`);
}

void bootstrap();
