# KẾ HOẠCH CODE CHI TIẾT (PLANCODE)
### Website VLXD mô phỏng ceiling.vn — NestJS + TypeORM + MySQL · Next.js 14 App Router

> Tài liệu này biến `plan.md` (kiến trúc) thành **lộ trình code thực thi từng phần**: làm cái gì trước, tạo file nào, endpoint nào, DTO/entity ra sao, và tiêu chí "xong" cho mỗi bước.
> Quy ước: ✅ = đã hoàn thiện · ⚠️ = làm một phần · ⬜ = chưa làm.

---

## 🧭 BẢNG TIẾN ĐỘ TỔNG QUAN (cập nhật 2026-07-01)

### Backend (NestJS)
| GÓI | Tên gói | Trạng thái |
|---|---|---|
| 1 | Auth (login admin, JWT) | ✅ Hoàn thiện |
| 2 | Settings (cấu hình site) | ✅ Hoàn thiện |
| 3 | Categories (cây danh mục) | ✅ Hoàn thiện |
| 4 | Attributes + Tags | ✅ Hoàn thiện |
| 5 | Products (lõi) | ✅ Hoàn thiện |
| 6 | Upload (Cloudinary) | ✅ Hoàn thiện |
| 7 | News / Bảng giá | ⬜ Chưa làm |
| 8 | Pages · Contacts · Support · Banners · Videos | ⚠️ Mới có Banners; thiếu Pages, Contacts, Support, Videos |
| 9 | SEO BE (Redirects · Sitemap-data · Stats) | ⬜ Chưa làm |

### Frontend công khai
| Mã | Trang | Trạng thái |
|---|---|---|
| FE-1 | Layout chung (Header/Footer/Sidebar) | ✅ Hoàn thiện |
| FE-2 | Trang chủ `/` | ⚠️ Gần xong — thiếu khối Tin tức/Video (chờ BE GÓI 7/8) |
| FE-3 | Sản phẩm (list + danh-muc + chi tiết) | ✅ Hoàn thiện |
| FE-4 | Tin tức + Bảng giá (4 trang) | ⬜ Chưa làm (chờ BE GÓI 7) |
| FE-5 | Giới thiệu · Trang tĩnh · Liên hệ | ⚠️ Mới có Giới thiệu; thiếu Trang tĩnh + Liên hệ |
| FE-6 | Tìm kiếm · Tag | ⬜ Chưa làm (tìm kiếm hiện gộp trong trang SP) |
| FE-7 | SEO kỹ thuật (nối API thật cho sitemap/robots/redirect) | ⬜ Chưa làm |

### Admin CMS
| Nhóm màn hình | Trạng thái |
|---|---|
| Login, Dashboard, Categories, Products, Attributes, Tags, Banners, Settings | ✅ Hoàn thiện |
| News/Bảng giá, Pages, Videos, Contacts, Support, Redirects | ⬜ Chưa làm |
| Thống kê Dashboard (số liệu thật từ `stats`) | ⬜ Chưa làm |

> **Bước tiếp theo đề xuất:** GÓI 7 (News/Bảng giá) — mở khóa FE-4 và hoàn thiện khối tin tức ở trang chủ. Hạ tầng editor (TipTap) + upload Cloudinary + sanitize đã sẵn sàng.

---

## 0. HIỆN TRẠNG (đã có sẵn)

**Backend `backend_vlxd/`**
- ✅ Cấu hình: `config/configuration.ts` (db, jwt, cloudinary, throttle, cors), `env.validation.ts`
- ✅ `DatabaseModule` (TypeORM + mysql2), `data-source.ts`
- ✅ Hạ tầng JWT: `JwtStrategy`, `JwtAuthGuard` (đăng ký `APP_GUARD` toàn cục — **mọi route cần JWT trừ khi gắn `@Public()`**)
- ✅ `ThrottlerGuard` toàn cục, `helmet`, swagger, `TransformInterceptor` (bọc `{success, data}`), `AllExceptionsFilter`
- ✅ DTO chung: `PaginationQueryDto`, `PaginatedResult`
- ✅ Decorator: `@Public()`, `@CurrentUser()`
- ✅ `database.sql` — 18 bảng + seed (settings, categories, attributes)
- ✅ **(Cập nhật)** Đã có các module: admins, auth, settings, categories, attributes, tags, products, upload, banners, health (xem bảng tiến độ ở đầu tài liệu).

**Frontend `frontend_vlxd/`**
- ✅ Hạ tầng SEO: `app/sitemap.ts`, `app/robots.ts`, `components/JsonLd.tsx`, `lib/seo.ts`
- ✅ `lib/api.ts` (`apiGet` / `apiGetPaginated` — tự bóc envelope), `lib/env.ts`
- ✅ `app/layout.tsx`, `app/page.tsx`, `app/not-found.tsx`, `middleware.ts`, `types/index.ts`
- ✅ **(Cập nhật)** Đã có trang: Trang chủ, Giới thiệu, Sản phẩm (list + danh-muc + chi tiết) và toàn bộ khu admin lõi (xem bảng tiến độ ở đầu tài liệu).

**Nguyên tắc thực thi:** Backend đi trước theo phụ thuộc dữ liệu → Frontend ăn theo API thật (không mock). Mỗi module backend làm xong public GET là frontend có thể dựng trang tương ứng ngay.

---

## 1. QUY ƯỚC CODE (áp dụng mọi module)

### Backend — khuôn mẫu 1 module
Mỗi module nghiệp vụ gồm:
```
src/modules/<ten>/
  <ten>.entity.ts          # TypeORM entity, map đúng tên cột snake_case trong DB
  dto/create-<ten>.dto.ts  # class-validator
  dto/update-<ten>.dto.ts  # PartialType(Create...)
  dto/query-<ten>.dto.ts   # extends PaginationQueryDto (lọc/sắp xếp)
  <ten>.service.ts         # nghiệp vụ, inject Repository
  <ten>.controller.ts      # public GET (gắn @Public) + admin CRUD (mặc định cần JWT)
  <ten>.module.ts          # TypeOrmModule.forFeature([Entity]) + provider/controller
```
Quy tắc:
- Entity dùng `@Column({ name: 'snake_case' })` để khớp DB; bật `naming` hoặc map tay.
- **PK bigint:** dùng `@PrimaryColumn({ type:'bigint', unsigned:true, transformer: bigintTransformer }) @Generated('increment')` để vừa auto-increment vừa ép `string→number` (mysql2 trả bigint dạng string). Cột FK bigint cũng gắn `bigintTransformer`; cột DECIMAL dùng `decimalTransformer`. Xem `common/util/column-transformers.ts`.
- **Cột varchar NULLABLE bắt buộc khai báo `type: 'varchar'`** (vd `@Column({ type:'varchar', length:255, nullable:true })`). Nếu để kiểu `string | null` mà thiếu `type`, TypeORM suy ra `Object` → lỗi `DataTypeNotSupportedError` lúc khởi động.
- Public đọc: prefix `/<api>/public/...`, **bắt buộc `@Public()`**.
- Admin ghi: prefix `/<api>/admin/...`, mặc định đã chặn bởi `JwtAuthGuard` toàn cục.
- Mọi nội dung HTML từ editor (`content`, `test_result`) → **sanitize server-side** trước khi lưu (xem 1.1).
- Trả về qua `TransformInterceptor` nên service chỉ cần `return data` / `return PaginatedResult`.
- Đăng ký module mới vào `app.module.ts` → `imports`.

### Frontend — khuôn mẫu 1 trang
- Server Component mặc định; gọi `apiGet`/`apiGetPaginated`.
- Export `generateMetadata()` đọc field SEO từ DB (`meta_title`, `meta_description`, `og_image`, `canonical_url`) qua `lib/seo.ts`.
- Trang động: `generateStaticParams()` + `revalidate` (ISR).
- Chèn JSON-LD bằng `<JsonLd>`. Mỗi trang đúng 1 `<h1>`. Ảnh dùng `next/image` + loader Cloudinary.

### 1.0. MÔ HÌNH PHÂN QUYỀN (RBAC) — áp dụng mọi module admin
Chỉ 2 role: `super_admin` (toàn quyền) và `sales` (xem + đăng bài). Khách không đăng nhập.

| Khu vực | super_admin | sales | khách |
|---|---|---|---|
| `/api/public/*` | ✓ | ✓ | ✓ (`@Public()`, không token) |
| Đọc admin `GET /api/admin/*` | ✓ | ✓ | ✗ |
| Tin tức/Bảng giá: **tạo** | ✓ | ✓ | ✗ |
| Tin tức/Bảng giá: **sửa/xóa** | mọi bài | **chỉ bài của mình** (`author_id`) | ✗ |
| Sản phẩm, danh mục, attributes, tags, settings, banner, video, pages, redirects, contacts, support: **ghi** | ✓ | ✗ | ✗ |

**Cách code:**
- GET admin: chỉ cần JWT (không gắn `@Roles`) → mọi admin xem được.
- Ghi nói chung: `@Roles('super_admin')`.
- News tạo: `@Roles('super_admin','sales')`. News sửa/xóa: **kiểm tra chủ sở hữu trong service** (`role !== 'super_admin' && post.authorId !== user.id` → `ForbiddenException`) vì `RolesGuard` không tra được resource.
- ✅ Đã có: `@Roles()` ([roles.decorator.ts](backend_vlxd/src/common/decorators/roles.decorator.ts)) + `RolesGuard` toàn cục (sau JwtAuthGuard).

### 1.1. Việc nền cần làm TRƯỚC khi mở module đầu tiên
- ✅ Cài thêm BE: `bcryptjs sanitize-html cloudinary` (+ types, multer).
- ✅ `common/util/slugify.ts` — `slugify()` + `uniqueSlug()` (bỏ dấu tiếng Việt).
- ✅ `common/util/sanitize.ts` — `sanitizeContent()` whitelist (h1..h6, b/i/u, ul/ol/li, a, img, table, iframe YouTube).
- ✅ `common/util/column-transformers.ts` — `bigintTransformer`, `decimalTransformer`.
- ✅ Chạy `database.sql` (18 bảng đã có trong `ceiling_db`); seed admin: `npm run seed:admin` (mặc định `admin` / `Admin@123`).

---

## 2. LỘ TRÌNH CODE THEO GÓI (đúng thứ tự thực thi)

> Mỗi GÓI là một lần "làm xong & chạy được". Làm tuần tự từ trên xuống.

### GÓI 1 — Auth login (admins)  ✅ ĐÃ LÀM
**Mục tiêu:** đăng nhập admin, phát JWT để mở khóa các API admin sau này.
> **Trạng thái: ✅ HOÀN THIỆN** — có thêm `GET/PATCH /me`, đổi mật khẩu, RBAC super_admin/sales.
- ⬜ `modules/admins/admin.entity.ts` (bảng `admins`: username, password_hash, full_name, role, is_active, last_login_at).
- ⬜ `modules/auth/dto/login.dto.ts` (username, password).
- ⬜ `modules/auth/auth.service.ts` — `validate(username,password)` so bcrypt; `login()` ký JWT (payload: `sub=id, username, role`), cập nhật `last_login_at`.
- ⬜ `modules/auth/auth.controller.ts` — `POST /api/admin/auth/login` (`@Public`), `GET /api/admin/auth/me` (cần JWT, trả `@CurrentUser`).
- ⬜ Bổ sung `AuthModule`: import `TypeOrmModule.forFeature([Admin])`, thêm providers/controller.
- ⬜ Script seed admin (hoặc INSERT thủ công hash bcrypt).
- **Xong khi:** `POST /api/admin/auth/login` trả token; gọi `/me` bằng token thành công.

### GÓI 2 — Settings (cấu hình site)  ✅ ĐÃ LÀM
**Mục tiêu:** cung cấp dữ liệu Header/Footer/Liên hệ cho toàn site. Nhỏ, không phụ thuộc.
> **Trạng thái: ✅ HOÀN THIỆN** — 28 keys, gom nhóm company/contact/address/map/social/seo; tích hợp upload logo/favicon.
- ⬜ `modules/settings/setting.entity.ts` (PK `setting_key`, value, group).
- ⬜ `settings.service.ts` — `getPublicMap()` trả object `{ company_name, hotline, email, logo, social_*, addr_*, map_* }`; `updateMany(items)` (admin).
- ⬜ `settings.controller.ts` — `GET /api/public/settings` (`@Public`), `PUT /api/admin/settings` (JWT).
- **Xong khi:** FE lấy được settings để dựng layout.

### GÓI 3 — Categories (cây danh mục)  ✅ ĐÃ LÀM
**Mục tiêu:** tiền đề cho sản phẩm + menu.
> **Trạng thái: ✅ HOÀN THIỆN** — CRUD, cây cha-con, soft-delete + restore, reorder drag-drop, bulk operations.
- ⬜ `category.entity.ts` (self-relation `parent_id`, slug unique, SEO fields).
- ⬜ DTO create/update/query; auto-slug nếu trống.
- ⬜ Service: `tree()` (build cây cha–con), `findBySlug()`, CRUD.
- ⬜ Controller: `GET /api/public/categories` (cây), `GET /api/public/categories/:slug`, admin CRUD `/api/admin/categories`.
- **Xong khi:** trả về cây 1–n cấp đúng `sort_order`, lọc `is_active`.

### GÓI 4 — Attributes + Tags (phụ trợ cho sản phẩm)  ✅ ĐÃ LÀM
> **Trạng thái: ✅ HOÀN THIỆN** — CRUD + reorder cho cả hai; FE admin có màn quản lý riêng.
- ✅ `attributes/` — CRUD đơn giản (`GET public`, admin CRUD). Dùng khi nhập thông số SP.
- ✅ `tags/` — CRUD + `GET /api/public/tags`. Quan hệ n–n với product qua `product_tags`.
- **Xong khi:** có sẵn danh mục thuộc tính & tag để gán cho sản phẩm ở GÓI 5.

### GÓI 5 — Products (LÕI — nặng nhất)  ✅ ĐÃ LÀM
**Mục tiêu:** liệt kê + chi tiết sản phẩm, là trái tim của site.
> **Trạng thái: ✅ HOÀN THIỆN** — 4 entity (product/image/attr-value/test-media) + tags, list/detail/view, CRUD admin transaction, reorder, soft-delete, lọc/sort đầy đủ.
- ⬜ Entities: `product.entity.ts`, `product-image.entity.ts`, `product-attribute-value.entity.ts`, `product-test-media.entity.ts` (+ quan hệ tới category, tags).
- ⬜ DTO: `query-product.dto.ts` (lọc `category`, `tag`, `is_featured`, `is_new`, `page`, sort), `create/update` (kèm mảng images, attributeValues, testMedia, tagIds).
- ⬜ Service:
  - `findPublicList(query)` → `PaginatedResult` (lọc category slug/tag, chỉ `is_active`).
  - `findBySlug(slug)` → join images + attributes(+attribute) + testMedia + tags + related (cùng category).
  - `incrementViews(id)` (update không chặn).
  - `featured()`, `newest()` cho trang chủ.
  - CRUD admin: transaction lưu product + images + attrValues + tags; sanitize `content`/`test_result`.
- ⬜ Controller:
  - `GET /api/public/products` (list, `@Public`)
  - `GET /api/public/products/:slug` (`@Public`)
  - `POST /api/public/products/:id/view` (`@Public`, tăng views)
  - admin CRUD `/api/admin/products`
- **Xong khi:** list + detail trả đủ ảnh/thông số/related; tăng view chạy.

### GÓI 6 — Upload (Cloudinary)  ✅ ĐÃ LÀM
**Mục tiêu:** admin upload ảnh; nén server-side; trả `secure_url` + metadata cho editor & DB.
- ✅ `modules/upload/cloudinary.provider.ts` — config SDK từ `config.cloudinary` (secure).
- ✅ `image-presets.ts` — preset theo loại (`logo/favicon/banner/product/content/generic`):
  folder, maxWidth/Height, fit, format (webp/png), quality. Trần 8MB, whitelist MIME
  (JPEG/PNG/WebP/GIF/AVIF — **chặn SVG** chống XSS), chặn decompression bomb (~50MP).
- ✅ `upload.service.ts` — validate → **sharp** (auto-rotate EXIF, resize không phóng to,
  đổi định dạng + nén, loại metadata) → `upload_stream` Cloudinary; trả `{url, publicId,
  width, height, format, bytes}`. `destroy(publicId)` xóa kèm `invalidate`.
- ✅ `upload.controller.ts` — `POST /api/admin/upload?kind=` (multipart, JWT mọi admin,
  `@Throttle` 30/phút, `fileFilter` MIME), `DELETE /api/admin/upload?publicId=` (super_admin).
- ✅ Tích hợp Settings: logo/favicon lưu `*_public_id`; đổi/lưu → **tự xóa ảnh cũ** trên
  Cloudinary. FE `ImageUploadField` dọn **ảnh tạm** (upload nhưng chưa Lưu) khi thay/gỡ.
- **Xong khi:** upload 1 ảnh trả URL Cloudinary dùng trong `next/image`; đổi ảnh xóa ảnh cũ.

### GÓI 7 — News / Bảng giá (dùng chung bảng `news`)  ⬜ CHƯA LÀM  ⬅️ NÊN LÀM TIẾP THEO
> **Trạng thái: ⬜ CHƯA LÀM** — chưa có module `news` ở backend, chưa có 4 trang FE (tin-tuc, bang-gia + chi tiết), chưa có màn admin News/Bảng giá. Hạ tầng cần (TipTap editor, upload Cloudinary, sanitize) đã sẵn sàng.
- ⬜ `news.entity.ts` (post_type enum, author FK→admin, published_at, SEO).
- ⬜ Service: `list(type, page)`, `findBySlug`, `incrementViews`, related cùng `post_type`. Sanitize `content`.
- ⬜ Controller: `GET /api/public/news?type=news|price_list`, `GET /api/public/news/:slug`, admin CRUD.
- **Xong khi:** một endpoint phục vụ cả Tin tức (`type=news`) và Bảng giá (`type=price_list`).

### GÓI 8 — Pages tĩnh + Contacts + Support + Banners + Videos  ⚠️ LÀM MỘT PHẦN
> **Trạng thái: ⚠️ MỚI XONG BANNERS.** Còn thiếu: Pages, Contacts, Support, Videos (cả BE + FE + admin).
Các module nhỏ, làm gộp:
- ⬜ `pages/` — `GET /api/public/pages/:slug`, admin CRUD (Giới thiệu, Chính sách…).  **CHƯA LÀM**
- ⬜ `contacts/` — `POST /api/public/contacts` (`@Public`, **rate-limit chặt + honeypot**, lưu IP), admin list/update status.  **CHƯA LÀM**
- ⬜ `support/` — `GET /api/public/support` (hỗ trợ trực tuyến), admin CRUD.  **CHƯA LÀM**
- ✅ `banners/` — `GET /api/public/banners?position=home_slider`, admin CRUD.  **ĐÃ LÀM** (kèm reorder, soft-delete)
- ⬜ `videos/` — `GET /api/public/videos?position=home` (xử lý cột SET), admin CRUD.  **CHƯA LÀM**
- **Xong khi:** trang chủ & liên hệ có đủ dữ liệu phụ.

### GÓI 9 — SEO kỹ thuật backend  ⬜ CHƯA LÀM
> **Trạng thái: ⬜ CHƯA LÀM** — chưa có module redirects/sitemap/stats. FE có file placeholder `sitemap.ts`/`robots.ts` nhưng chưa nối API thật.
- ⬜ `redirects/` — `GET /api/public/redirects?from=/path` (FE middleware tra trước khi 404), admin CRUD.
- ⬜ `sitemap/` — `GET /api/public/sitemap-data` trả danh sách slug (products/categories/news/pages `is_active`) cho `app/sitemap.ts`.
- ⬜ `stats/` — `POST /api/public/stats/hit` (ghi visitor_stats), `GET /api/admin/stats` cho dashboard.
- **Xong khi:** sitemap & redirect lấy dữ liệu thật từ DB.

> **Mốc backend hoàn chỉnh:** sau GÓI 9, mọi public GET phục vụ frontend đã sẵn sàng.

---

## 3. LỘ TRÌNH FRONTEND (song song sau khi BE có API)

> Có thể bắt đầu khi GÓI 2–5 của BE xong. Mỗi mục: route · render · API · SEO.

### FE-1 — Layout chung (cần BE GÓI 2,3)  ✅ ĐÃ LÀM
- ✅ `lib/api` đã có → thêm `types/index.ts`: `Category, Product, News, Setting, Banner...`.
- ✅ `components/layout/Header.tsx` (logo + menu từ categories), `Footer.tsx` (settings), `Breadcrumb.tsx`.
- ✅ Cập nhật `app/layout.tsx` dùng Header/Footer từ settings.

### FE-2 — Trang chủ `/` (ISR 120s) (cần BE 2,3,5,8)  ⚠️ GẦN XONG
> **Trạng thái: ⚠️** — có HeroSlider, ProductGrid, Categories. **Thiếu NewsList + VideoBlock** (chờ BE GÓI 7/8).
- ✅ `app/page.tsx`: HeroSlider (banners) · ProductGrid (featured/new) · Categories · ⬜ NewsList · ⬜ VideoBlock.
- ✅ JSON-LD `Organization` + `WebSite`.

### FE-3 — Sản phẩm (cần BE 3,5)  ✅ ĐÃ LÀM
- ✅ `app/san-pham/page.tsx` + `app/danh-muc/[slug]/page.tsx` — list, sidebar cây danh mục + lọc tag, pagination. JSON-LD `ItemList` + `BreadcrumbList`.
- ✅ `app/san-pham/[slug]/page.tsx` — Gallery, thông số, tabs (Mô tả/Hình ảnh/Kết quả thử nghiệm), related, nút "Yêu cầu báo giá". `generateStaticParams` + ISR. **JSON-LD `Product`**. Gọi `POST view`.

### FE-4 — Tin tức & Bảng giá (cần BE 7)  ⬜ CHƯA LÀM
- ⬜ `app/tin-tuc/`, `app/tin-tuc/[slug]/`, `app/bang-gia/`, `app/bang-gia/[slug]/`. JSON-LD `Article`/`ItemList`.

### FE-5 — Nội dung & liên hệ (cần BE 8)  ⚠️ LÀM MỘT PHẦN
> **Trạng thái: ⚠️** — mới có Giới thiệu. Thiếu trang tĩnh `/[slug]` và Liên hệ (chờ BE Pages/Contacts).
- ✅ `app/gioi-thieu/`, ⬜ `app/[slug]/` (trang tĩnh), ⬜ `app/lien-he/` (form → `contacts`, honeypot/captcha, map). JSON-LD `ContactPage`/`Organization`.

### FE-6 — Tìm kiếm & tag (cần BE 5)  ⬜ CHƯA LÀM
> **Trạng thái: ⬜** — tìm kiếm hiện đang gộp trong trang danh sách sản phẩm; chưa có trang `/tim-kiem` và `/tag/[slug]` riêng.
- ⬜ `app/tim-kiem/` (SSR, `noindex`), `app/tag/[slug]/`.

### FE-7 — SEO kỹ thuật (cần BE 9)  ⬜ CHƯA LÀM
- ⬜ Nối `app/sitemap.ts` & `app/robots.ts` vào API thật; `middleware.ts` tra `redirects` (301); kiểm `og:image`, canonical, Rich Results.

---

## 4. ADMIN CMS (sau khi public site chạy)  ⚠️ LÀM MỘT PHẦN
> **Trạng thái tổng: ⚠️** — khung admin + các màn lõi đã xong; còn thiếu News/Bảng giá, Pages, Videos, Contacts, Support, Redirects và thống kê Dashboard số liệu thật.
- ✅ Khu `/admin` (CSR, `noindex`): login → JWT lưu localStorage; client gọi `/api/admin/*` kèm Bearer.
- Màn hình:
  - ✅ ĐÃ LÀM: Dashboard (khung + profile), Categories, Products (upload nhiều ảnh + attr + tag + tab thử nghiệm), Attributes, Tags, Banners, Settings.
  - ⬜ CHƯA LÀM: News/Bảng giá (WYSIWYG), Pages, Videos, Contacts, Support, Redirects; thống kê Dashboard (số liệu thật từ `stats`).
- ✅ Editor WYSIWYG (TipTap) chèn ảnh qua `/api/admin/upload`; **sanitize lại server-side** — đã có sẵn, tái sử dụng cho News.

---

## 5. CHECKLIST "DEFINITION OF DONE" CHO MỖI MODULE BE
- [ ] Entity khớp đúng tên cột & quan hệ FK trong `database.sql`.
- [ ] DTO có `class-validator`; query phân trang chuẩn `PaginationQueryDto`.
- [ ] Public GET gắn `@Public()`; admin route được JWT bảo vệ.
- [ ] HTML từ editor được sanitize trước khi lưu.
- [ ] Slug tự sinh & unique; xử lý trùng.
- [ ] Trả `PaginatedResult` cho list; envelope `{success,data}` tự áp qua interceptor.
- [ ] Test nhanh bằng Swagger `/api/docs` hoặc curl.

---

## 6. THỨ TỰ TÓM TẮT (1 dòng)
**BE:** 1 Auth → 2 Settings → 3 Categories → 4 Attributes/Tags → 5 Products → 6 Upload → 7 News → 8 Pages/Contacts/Support/Banners/Videos → 9 SEO(redirects/sitemap/stats)
**FE:** Layout → Trang chủ → Sản phẩm → Tin tức/Bảng giá → Nội dung/Liên hệ → Tìm kiếm/Tag → SEO kỹ thuật
**Cuối:** Admin CMS → Tối ưu & deploy (Nginx, SSL, Search Console).

---

## 7. PHONG CÁCH THIẾT KẾ (DESIGN SPEC)

> **Định hướng:** Clone bố cục trang công khai theo **ceiling.vn**, nhưng đổi tông màu chủ đạo
> sang **`#F6B47C` (cam đào) + `#fff`** (bản gốc dùng navy). Triển khai **khu Admin trước**,
> trang công khai làm sau (FE-1…FE-7). Kỹ thuật style: **CSS Modules `.module.scss`** (mỗi
> component 1 file scss, tránh đụng classname), icon nhẹ bằng **`lucide-react`**, font sans-serif.

### 7.1. Bảng màu (design tokens) — đặt trong `styles/theme.scss`
| Token | Giá trị | Dùng cho |
|---|---|---|
| `$primary` | `#F6B47C` | màu nhận diện: nút chính, link active, viền nhấn, icon |
| `$primary-dark` | `#E89B5C` (≈ tối hơn ~10%) | hover/nhấn nút, top bar đậm |
| `$primary-light` | `#FCD9B8` / `#FFF1E6` | nền nhạt, badge, hover row, highlight |
| `$bg` | `#FFFFFF` | nền chính |
| `$bg-soft` | `#FAFAFA` / `#F7F7F8` | nền khối phụ, sidebar admin |
| `$text` | `#222` | chữ chính |
| `$text-muted` | `#6B7280` | chữ phụ, mô tả, placeholder |
| `$border` | `#E5E7EB` | đường kẻ, viền input/card |
| `$success/$danger/$warning` | `#16A34A`/`#DC2626`/`#F59E0B` | trạng thái, toast, nút xóa |
- Quy ước: dùng **biến SCSS** (không hardcode hex rải rác). Bo góc `8–10px`, đổ bóng nhẹ
  `0 1px 3px rgba(0,0,0,.08)`. Khoảng cách theo bậc `4 / 8 / 12 / 16 / 24px`.

### 7.2. Trang CÔNG KHAI — clone bố cục ceiling.vn (làm sau, ghi để tham chiếu)
Thứ tự dọc trang chủ:
1. **Top bar** (mảnh, nền `$primary-dark`, chữ trắng): icon ☎ Hotline + ✉ Email, căn giữa/phải.
2. **Header** (nền trắng, dính khi cuộn): **logo trái** + **menu ngang phải** (Trang chủ ·
   Giới thiệu · Sản phẩm · Bảng giá · Tin tức · Liên hệ) + nút **Giỏ hàng** (badge số lượng).
   Mục active gạch chân / đổi màu `$primary`.
3. **Hero slider** full-width, ảnh lớn, mũi tên trái/phải + dots (lib `embla` hoặc `swiper`).
4. **Khối Sản phẩm**: cột trái **"DANH MỤC SẢN PHẨM"** (header khối nền `$primary`, list cây
   danh mục từ API) + cột phải lưới **"SẢN PHẨM MỚI"** (card).
5. **News/Tin tức mới** dạng lưới ngang; **Video block** nếu có.
6. **Footer** nhiều cột: thông tin công ty (từ settings), liên kết nhanh, chính sách,
   bản đồ/thống kê truy cập. Dải copyright dưới cùng.
7. **Nút nổi** góc trái dưới: gọi điện + Zalo (tròn, màu thương hiệu, rung nhẹ).

**Product card:** ảnh tỉ lệ ~4:3 bo góc, tên SP (2 dòng, hover đổi `$primary`), giá hoặc
"Giá: Liên hệ", hover nhấc nhẹ + đổ bóng. **Section heading:** chữ in hoa, có gạch/▸ màu `$primary`.

### 7.3. Khu ADMIN/CMS — LÀM TRƯỚC (tone cam đào, sạch, gọn)
- **Bố cục:** Sidebar trái cố định (nền `$bg-soft`, item active nền `$primary-light` + viền
  trái `$primary`) gồm: Dashboard, Danh mục, Cấu hình, (mở rộng sau: Sản phẩm, Tin tức…).
  **Topbar** trắng: tên trang + tên admin + nút Đăng xuất.
- **Trang Login:** thẻ giữa màn nền `$bg-soft`, logo + ô Username/Password + nút đăng nhập
  nền `$primary`. Hiện lỗi 401 thân thiện, chống spam (BE đã giới hạn 5 lần/phút).
- **Settings:** form gom theo nhóm (company/contact/address/map/social/seo) — mỗi nhóm 1 card,
  field `multiline` dùng textarea; nút "Lưu" gọi `PUT` hàng loạt `{items:[{key,value}]}`.
- **Categories:** bảng/cây danh mục (thụt theo `parentId`, theo `sortOrder`); thêm/sửa qua
  modal (name, slug auto, parent, ảnh, sort, active, SEO…), xóa có xác nhận; bắt lỗi 409
  (còn con/sản phẩm). Role `sales` chỉ xem → ẩn/disable nút ghi (BE chặn ghi = super_admin).
- **Chung:** component dùng lại Button/Input/Select/Modal/Toast/Table (mỗi cái 1 `.module.scss`),
  trạng thái loading/empty/error rõ ràng, khu admin gắn `noindex`.

### 7.4. Hạ tầng FE cần thêm (khi bắt đầu code)
- Thêm dependency: **`sass`** (cho `.module.scss`), **`lucide-react`** (icon).
- `lib/admin-api.ts`: fetch client gắn `Authorization: Bearer`, tự bóc `{success,data}`,
  gặp 401 → xóa token + về `/admin/login`.
- `lib/auth-store.ts`: lưu/đọc accessToken + admin (localStorage), helper `isSuperAdmin`.
- Route group `app/(admin)/admin/*` — CSR, layout bảo vệ đăng nhập.
