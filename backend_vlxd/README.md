# Backend VLXD (NestJS + TypeORM + MySQL)

API cho website vật liệu xây dựng. Chỉ trả JSON; Next.js gọi để render SEO.

## Chạy

```bash
cp .env.example .env   # điền DB + JWT_SECRET
npm install
npm run start:dev      # http://localhost:4000/api
```

- Health: `GET /api/health`
- Swagger (dev): `GET /api/docs`

## Cấu trúc

```
src/
├─ config/            # configuration.ts (typed env) + env.validation.ts (Joi)
├─ database/          # TypeORM: database.module.ts + data-source.ts (CLI migration)
├─ common/            # filters, interceptors, dto, decorators dùng chung
│  ├─ filters/        # AllExceptionsFilter — định dạng lỗi thống nhất
│  ├─ interceptors/   # TransformInterceptor — envelope { success, data }
│  ├─ dto/            # PaginationQueryDto, PaginatedResult
│  └─ decorators/     # @Public(), @CurrentUser()
├─ modules/
│  ├─ auth/           # JWT strategy + guard (login thêm khi có bảng admins)
│  └─ health/         # kiểm tra app + DB
├─ app.module.ts
└─ main.ts            # helmet, CORS, ValidationPipe, Swagger, prefix /api
```

## Nguyên tắc

- **Secure-by-default:** JwtAuthGuard là global guard — mọi route cần JWT trừ khi gắn `@Public()`.
- **synchronize: false** — đổi schema bằng migration, không tự đồng bộ.
- Thêm module nghiệp vụ: tạo thư mục trong `modules/`, khai báo `*.entity.ts`
  (tự nạp qua `autoLoadEntities`), rồi import module vào `app.module.ts`.

## Migration (sau khi có entity)

```bash
npm run migration:generate -- src/database/migrations/Init
npm run migration:run
```
