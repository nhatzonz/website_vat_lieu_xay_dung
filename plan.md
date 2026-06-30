# KẾ HOẠCH XÂY DỰNG WEBSITE CHUẨN SEO
### Mô phỏng ceiling.vn — Next.js (Frontend) · NestJS (Backend) · MySQL

> Tài liệu này mô tả chi tiết kiến trúc, từng trang, cách lấy dữ liệu từ database (18 bảng đã thiết kế trong `ceiling_clone_schema.sql`), và chiến lược SEO ngay từ đầu để tránh phải làm lại về sau.

---

## 1. TỔNG QUAN CÔNG NGHỆ

| Lớp | Công nghệ | Vai trò |
|-----|-----------|---------|
| Frontend | **Next.js 14+ (App Router)** | Hiển thị, SEO (SSG/ISR/SSR), routing |
| Backend | **NestJS** | REST API, xác thực admin, xử lý nghiệp vụ |
| Database | **MySQL 8** | Lưu trữ (18 bảng đã có) |
| ORM | **Prisma** hoặc **TypeORM** | Truy vấn DB từ NestJS |
| Trình soạn thảo | **TinyMCE / CKEditor 5** | Nhập nội dung HTML cho admin |
| Lưu ảnh | **Cloudinary** | Lưu, tối ưu & phân phối ảnh qua CDN (sản phẩm, tin tức, banner) |
| Triển khai | VPS + Nginx (reverse proxy) | Hai service: Next.js (3000) + NestJS (4000) |

**Nguyên tắc phân tách:** NestJS chỉ trả JSON qua API. Next.js gọi API ở phía server (server components) để render HTML sẵn, giúp SEO tốt. Admin có thể là một khu riêng (Next.js route `/admin` hoặc app tách biệt) gọi cùng API NestJS.

---

## 2. KIẾN TRÚC TỔNG THỂ

```
[Trình duyệt / Googlebot]
        │  (HTML đã render sẵn)
        ▼
[Next.js]  ──server fetch──►  [NestJS API]  ──►  [MySQL]
   │                              │
   ├─ SSG/ISR: trang ít đổi       ├─ /api/public/*  (đọc, cho web)
   ├─ SSR: trang động             └─ /api/admin/*   (CRUD, cần JWT)
   └─ /admin: CMS quản trị
```

**Chiến lược render theo trang (quyết định SEO + tốc độ):**

- **SSG (build sẵn):** trang tĩnh ít đổi — Giới thiệu, Chính sách.
- **ISR (build lại định kỳ):** Trang chủ, danh sách sản phẩm, chi tiết sản phẩm, tin tức. Đặt `revalidate` 60–300 giây để vừa nhanh vừa cập nhật.
- **SSR (render mỗi request):** trang Tìm kiếm, kết quả lọc theo tag.
- **CSR (client):** khu admin `/admin` (không cần SEO).

---

## 3. CHIẾN LƯỢC SEO XUYÊN SUỐT (làm ngay từ đầu)

Đây là phần "chuẩn SEO" — áp dụng cho mọi trang, không để làm sau:

1. **Metadata động mỗi trang:** dùng `generateMetadata()` của Next.js, đọc `meta_title`, `meta_description`, `meta_keywords`, `og_image`, `canonical_url` từ DB.
2. **Open Graph + Twitter Card:** sinh thẻ `og:title/description/image`, `twitter:card` từ cột `og_image`.
3. **Structured Data (JSON-LD):** nhúng schema.org theo loại trang — `Product` (kèm giá), `Article` (tin tức), `BreadcrumbList`, `Organization` (trang chủ/liên hệ), `ItemList` (trang danh sách).
4. **URL thân thiện:** dùng cột `slug`, dạng `/san-pham/[slug]`, `/tin-tuc/[slug]`. Không dùng `?id=`.
5. **Canonical & Redirect:** mỗi trang có `<link rel="canonical">`. Middleware Next.js tra bảng `redirects` để 301 đường dẫn cũ → mới, tránh 404.
6. **sitemap.xml động:** sinh từ DB (sản phẩm, danh mục, tin tức, trang tĩnh đang `is_active`). Dùng `app/sitemap.ts`.
7. **robots.txt:** cho phép index, trỏ tới sitemap; chặn `/admin`, `/api`.
8. **Heading đúng cấp:** mỗi trang đúng 1 thẻ `<h1>`.
9. **Ảnh tối ưu:** ảnh lưu trên **Cloudinary**, tự động chuyển WebP/AVIF, nén và resize responsive qua URL transformation. Frontend dùng `next/image` với loader Cloudinary (hoặc trỏ trực tiếp URL Cloudinary); thẻ `alt` lấy từ `product_images.alt_text`.
10. **Hiệu năng (Core Web Vitals):** ưu tiên SSG/ISR, ảnh tối ưu qua Cloudinary CDN, hạn chế JS client. Mục tiêu LCP < 2.5s.
11. **Mobile-first & HTTPS:** responsive toàn bộ, bắt buộc SSL.
12. **Breadcrumb hiển thị + JSON-LD** trên mọi trang con.

---

## 4. KẾ HOẠCH CHI TIẾT TỪNG TRANG (FRONTEND)

> Mỗi trang mô tả: mục đích · route · cách render · dữ liệu (bảng/API) · thành phần · SEO riêng.

### 4.1. Trang chủ — `/`
- **Mục đích:** giới thiệu tổng quan, dẫn vào sản phẩm/tin tức.
- **Render:** ISR (`revalidate: 120`).
- **Dữ liệu:**
  - Slider: `banners` (lọc `position='home_slider'`, `is_active=1`, sắp theo `sort_order`).
  - Sản phẩm nổi bật: `products` (`is_featured=1`).
  - Sản phẩm mới: `products` (`is_new=1`).
  - Danh mục: `categories` (cấp gốc).
  - Tin tức mới: `news` (`post_type='news'`, mới nhất).
  - Video: `videos` (`FIND_IN_SET('home', position)`).
  - Thông tin cty/footer: `settings`.
- **Thành phần:** Header (logo từ `settings.logo`, menu), HeroSlider, ProductGrid, NewsList, VideoBlock, Footer.
- **SEO:** JSON-LD `Organization` + `WebSite` (kèm SearchAction). Title/description từ trang `pages` slug `home` hoặc cấu hình mặc định.

### 4.2. Giới thiệu — `/gioi-thieu`
- **Mục đích:** trang nội dung công ty.
- **Render:** SSG (build lại khi sửa).
- **Dữ liệu:** `pages` (slug `gioi-thieu`) — render HTML cột `content`. Video giới thiệu: `videos` (`FIND_IN_SET('about', position)`).
- **SEO:** meta từ chính bản ghi `pages`. JSON-LD `AboutPage`/`Organization`.

### 4.3. Danh sách sản phẩm theo danh mục — `/san-pham` và `/danh-muc/[slug]`
- **Mục đích:** liệt kê sản phẩm theo nhóm.
- **Render:** ISR.
- **Dữ liệu:**
  - Danh mục hiện tại + danh mục con: `categories` (theo `slug`, `parent_id`).
  - Sản phẩm: `products` (lọc theo `category_id`, `is_active=1`), phân trang.
  - Bộ lọc tag: `tags` + `product_tags`.
- **Thành phần:** Breadcrumb, Sidebar (cây danh mục + bộ lọc tag), ProductCard (ảnh `thumbnail`, tên, giá hoặc "Liên hệ" khi `price_type='contact'`), Pagination.
- **SEO:** meta từ `categories`. JSON-LD `BreadcrumbList` + `ItemList`. Phân trang dùng `rel=next/prev` hoặc canonical hợp lý.

### 4.4. Chi tiết sản phẩm — `/san-pham/[slug]`
- **Mục đích:** trang bán/giới thiệu một sản phẩm.
- **Render:** ISR + `generateStaticParams` cho sản phẩm phổ biến.
- **Dữ liệu:**
  - Thông tin chính: `products` (theo `slug`).
  - Thư viện ảnh: `product_images`.
  - Thông số: JOIN `product_attribute_values` + `attributes` (sắp theo `attributes.sort_order`).
  - Tab Kết quả thử nghiệm: `products.test_result` (HTML) + `product_test_media` (nhiều ảnh/video YouTube).
  - Tag: `product_tags` + `tags`.
  - Sản phẩm liên quan: cùng `category_id`.
  - **Tăng lượt xem:** gọi API riêng cập nhật `products.views` (không chặn render).
- **Thành phần:** Breadcrumb, Gallery, khối thông tin (mã SP, giá, đơn vị), nút "Yêu cầu báo giá" (thay nút Đặt hàng vì đã bỏ giỏ hàng), hệ tab (Mô tả `content` / Hình ảnh / Kết quả thử nghiệm), RelatedProducts.
- **SEO:** **quan trọng nhất** — JSON-LD `Product` gồm `name`, `image`, `sku`, `offers` (price/priceCurrency = VND, hoặc `availability` khi liên hệ). Meta + `og_image` từ chính sản phẩm. Canonical.

### 4.5. Bảng giá — `/bang-gia` và `/bang-gia/[slug]`
- **Mục đích:** danh sách + chi tiết các bài báo giá.
- **Render:** ISR.
- **Dữ liệu:** **dùng chung bảng `news` với `post_type='price_list'`.** Danh sách lấy các bản ghi loại này; chi tiết render HTML `content` (chứa bảng giá, ảnh).
- **Thành phần:** danh sách kiểu card (ảnh, tiêu đề, tác giả Admin, ngày đăng, tóm tắt) — y hệt tin tức.
- **SEO:** JSON-LD `Article`/`ItemList`. Meta từ bản ghi.

### 4.6. Tin tức — `/tin-tuc`
- **Render:** ISR.
- **Dữ liệu:** `news` (`post_type='news'`, `is_active=1`), phân trang, sắp theo `published_at`.
- **Thành phần:** NewsCard (thumbnail, title, summary, ngày), Pagination.
- **SEO:** JSON-LD `Blog`/`ItemList`. Meta mặc định cho mục tin.

### 4.7. Chi tiết tin tức — `/tin-tuc/[slug]`
- **Render:** ISR + `generateStaticParams`.
- **Dữ liệu:** `news` (theo `slug`), tăng `views`, bài liên quan (cùng loại, mới nhất → khối "Các bài viết khác").
- **Thành phần:** Breadcrumb, tiêu đề `<h1>`, meta (tác giả, ngày), thân bài render HTML `content`, RelatedNews.
- **SEO:** JSON-LD `Article` (`headline`, `image`=`og_image`/`thumbnail`, `datePublished`=`published_at`, `author`). Canonical.

### 4.8. Liên hệ — `/lien-he`
- **Render:** SSR (vì có form) hoặc SSG + form client.
- **Dữ liệu:**
  - Hiển thị: `settings` (địa chỉ chi tiết `addr_*`, hotline, email, social, bản đồ `map_embed`/`map_lat`/`map_lng`).
  - Hỗ trợ trực tuyến: `support_contacts`.
  - Gửi form: POST tới API → ghi vào bảng `contacts`.
- **Thành phần:** thông tin công ty, bản đồ Google Maps (iframe từ `map_embed`), ContactForm (tên, email, sđt, nội dung) có chống spam (captcha/honeypot).
- **SEO:** JSON-LD `Organization` + `ContactPage` (địa chỉ, điện thoại).

### 4.9. Tìm kiếm — `/tim-kiem?q=...`
- **Render:** SSR.
- **Dữ liệu:** truy vấn `products` (và có thể `news`) theo từ khóa trên `name`/`content` (FULLTEXT index hoặc LIKE). Không cần bảng riêng.
- **SEO:** đặt `noindex` cho trang kết quả tìm kiếm (tránh trùng lặp).

### 4.10. Lọc theo tag — `/tag/[slug]`
- **Render:** SSR/ISR.
- **Dữ liệu:** JOIN `tags` → `product_tags` → `products`.
- **SEO:** meta theo tag; cân nhắc canonical về danh mục gốc nếu nội dung trùng.

### 4.11. Trang tĩnh khác — `/[slug]` (Chính sách bảo mật, thanh toán, tuyển dụng...)
- **Render:** SSG.
- **Dữ liệu:** `pages` theo `slug`.
- **SEO:** meta từ bản ghi `pages`.

### 4.12. Trang 404 & lỗi
- **404 tùy biến:** middleware kiểm tra `redirects` trước; nếu không có thì hiện 404 thân thiện (gợi ý sản phẩm/tin nổi bật).

---

## 5. KHU QUẢN TRỊ (ADMIN CMS) — `/admin`

Không cần SEO (đặt `noindex`, chặn trong robots). Đăng nhập bằng JWT, dữ liệu vào bảng `admins`.

| Màn hình | Bảng tác động | Chức năng |
|----------|---------------|-----------|
| Đăng nhập | `admins` | JWT, băm mật khẩu (bcrypt/argon2) |
| Dashboard | tổng hợp | thống kê nhanh (sản phẩm, liên hệ mới, lượt truy cập từ `visitor_stats`) |
| Danh mục | `categories` | CRUD cây cha–con, SEO |
| Sản phẩm | `products` + `product_images` + `product_attribute_values` + `product_test_media` + `product_tags` | CRUD, upload nhiều ảnh, gán thuộc tính, tab thử nghiệm, gán tag |
| Thuộc tính | `attributes` | tạo thuộc tính dùng chung 1 lần |
| Tag | `tags` | quản lý thẻ lọc |
| Tin tức / Bảng giá | `news` (lọc `post_type`) | CRUD, trình soạn thảo WYSIWYG |
| Trang tĩnh | `pages` | CRUD nội dung |
| Banner | `banners` | upload, chọn vị trí |
| Video | `videos` | thêm link, chọn vị trí (home/sidebar/about) |
| Liên hệ | `contacts` | xem/đánh dấu trạng thái |
| Hỗ trợ trực tuyến | `support_contacts` | quản lý nhân viên/hotline |
| Cấu hình | `settings` | logo, địa chỉ, map, social |
| Redirect SEO | `redirects` | tạo chuyển hướng 301 |

**Trình soạn thảo:** cấu hình cho phép chèn header, in đậm, danh sách, **bảng**, **link**, **ảnh** (ảnh chèn được upload lên **Cloudinary**, editor nhận về `secure_url` rồi chèn thẻ `<img>`). Bắt buộc **sanitize HTML** server-side (HTMLPurifier/sanitize-html) chống XSS.

---

## 6. THIẾT KẾ API (NESTJS)

Chia 2 nhóm: `public` (đọc, cho Next.js) và `admin` (CRUD, cần JWT).

**Cấu trúc module gợi ý** (mỗi module = controller + service + entity/dto):

```
auth/            → đăng nhập admin, JWT guard
categories/      → GET danh mục (public), CRUD (admin)
products/        → GET list/detail, search, +views; CRUD
attributes/      → thuộc tính dùng chung
tags/            → tag + lọc sản phẩm
news/            → tin tức & bảng giá (lọc post_type)
pages/           → trang tĩnh
banners/         → slider
videos/          → video theo vị trí
contacts/        → nhận form (public POST), quản lý (admin)
support/         → support_contacts
settings/        → cấu hình site
redirects/       → quản lý 301
stats/           → ghi & đọc visitor_stats
sitemap/         → trả dữ liệu cho sitemap (hoặc Next tự query)
upload/          → upload ảnh lên Cloudinary (admin), trả về secure_url cho editor & DB
```

> **Lưu trữ ảnh (Cloudinary):** NestJS dùng SDK `cloudinary` để upload (ký chữ ký phía server bằng `api_secret`, không lộ ra client). DB **chỉ lưu đường dẫn/URL ảnh** (`secure_url` hoặc `public_id`) trong các cột như `products.thumbnail`, `product_images.image_path`, `news.thumbnail`, `banners.image`, `settings.logo` — bản thân file ảnh nằm trên Cloudinary, không lưu trong MySQL. Khi hiển thị, ghép thêm tham số transformation vào URL để lấy đúng kích thước/định dạng cần.

**Ví dụ endpoint public:**
- `GET /api/public/products?category=tran-nhom&page=1`
- `GET /api/public/products/:slug`
- `GET /api/public/news?type=news&page=1`
- `GET /api/public/settings`
- `POST /api/public/contacts`

**Bảo mật bắt buộc:**
- Dùng **prepared statements / ORM** → chống SQL injection.
- **Sanitize HTML** mọi nội dung từ editor.
- **Rate limit** API gửi liên hệ.
- JWT cho toàn bộ `/api/admin/*`.
- Không bao giờ lưu mật khẩu plaintext (bảng `admins.password_hash`).

---

## 7. ÁNH XẠ TRANG ↔ BẢNG (TÓM TẮT)

| Trang | Bảng chính sử dụng |
|-------|--------------------|
| Trang chủ | banners, products, categories, news, videos, settings |
| Giới thiệu | pages, videos |
| Danh sách SP | categories, products, tags, product_tags |
| Chi tiết SP | products, product_images, attributes, product_attribute_values, product_test_media, tags |
| Bảng giá | news (post_type=price_list) |
| Tin tức | news (post_type=news) |
| Liên hệ | settings, support_contacts, contacts |
| Tìm kiếm | products, news |
| Tag | tags, product_tags, products |
| Trang tĩnh | pages |
| Toàn site (SEO) | redirects, settings |

---

## 8. LỘ TRÌNH TRIỂN KHAI (PHÂN GIAI ĐOẠN)

**Giai đoạn 0 — Chuẩn bị**
- Chạy `ceiling_clone_schema.sql` tạo DB.
- Khởi tạo repo: `apps/web` (Next.js) + `apps/api` (NestJS).
- Cấu hình ORM kết nối MySQL, biến môi trường (kèm `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).

**Giai đoạn 1 — Backend nền**
- Module `auth` (JWT) + `settings` + `upload` (tích hợp Cloudinary SDK).
- Module `products`, `categories`, `attributes` (CRUD + public GET).
- Sanitize HTML, validation DTO.

**Giai đoạn 2 — Frontend công khai**
- Layout chung (Header/Footer từ `settings`), `next/image`.
- Trang chủ, danh sách & chi tiết sản phẩm (ISR).
- `generateMetadata`, JSON-LD `Product`, breadcrumb.

**Giai đoạn 3 — Nội dung**
- Module + trang: tin tức, bảng giá, trang tĩnh, liên hệ (form → `contacts`).
- Video, banner, hỗ trợ trực tuyến.

**Giai đoạn 4 — SEO kỹ thuật**
- `sitemap.ts`, `robots.txt`.
- Middleware đọc `redirects` (301).
- og:image, canonical toàn site, kiểm tra structured data.

**Giai đoạn 5 — Admin CMS**
- Toàn bộ màn hình quản trị + trình soạn thảo WYSIWYG.

**Giai đoạn 6 — Tối ưu & lên sóng**
- Đo Core Web Vitals; tối ưu ảnh qua Cloudinary transformation (WebP/AVIF, resize, `f_auto,q_auto`), cache.
- Nginx + SSL, tách 2 service, ISR cache.
- Khai báo Google Search Console, nộp sitemap.

---

## 9. CHECKLIST SEO TRƯỚC KHI LÊN SÓNG

- [ ] Mỗi trang có `<title>` + `meta description` riêng, không trùng.
- [ ] Mỗi trang đúng 1 `<h1>`.
- [ ] og:image hiển thị đúng khi chia sẻ Facebook/Zalo.
- [ ] JSON-LD hợp lệ (test bằng Rich Results Test).
- [ ] sitemap.xml truy cập được, đã nộp Search Console.
- [ ] robots.txt chặn `/admin`, `/api`.
- [ ] URL toàn slug, không lộ `?id=`.
- [ ] Ảnh có `alt`, phục vụ qua Cloudinary (`f_auto,q_auto`, WebP/AVIF), dùng `next/image`.
- [ ] HTTPS, redirect non-www ↔ www thống nhất.
- [ ] 301 cũ→mới hoạt động, không còn 404 quan trọng.
- [ ] LCP < 2.5s, CLS < 0.1 trên mobile.
- [ ] Breadcrumb hiển thị + có JSON-LD.

---

> **Lưu ý:** Database (18 bảng) đã chuẩn bị sẵn dữ liệu cho mọi trang ở trên. Phần "chuẩn SEO" thực thi ở tầng Next.js (metadata, JSON-LD, sitemap) — database chỉ cung cấp dữ liệu, code mới là nơi xuất ra đúng chuẩn.