# Frontend VLXD (Next.js App Router + TypeScript + Tailwind)

Hiển thị + SEO. Server components fetch API NestJS để render HTML sẵn (SSG/ISR/SSR).

## Chạy

```bash
cp .env.example .env.local   # trỏ API_BASE_URL + NEXT_PUBLIC_SITE_URL
npm install
npm run dev                  # http://localhost:3000
```

## Cấu trúc

```
src/
├─ app/
│  ├─ layout.tsx        # layout gốc, metadataBase, title template
│  ├─ page.tsx          # trang chủ (ISR revalidate 120)
│  ├─ not-found.tsx     # 404 thân thiện
│  ├─ robots.ts         # robots.txt động (chặn /admin, /api)
│  ├─ sitemap.ts        # sitemap.xml động
│  └─ globals.css       # Tailwind
├─ components/
│  └─ JsonLd.tsx        # nhúng structured data schema.org
├─ lib/
│  ├─ env.ts            # đọc env tập trung
│  ├─ api.ts            # apiGet / apiGetPaginated (bóc envelope, hỗ trợ ISR)
│  └─ seo.ts            # buildMetadata(), absoluteUrl(), jsonLdScript()
├─ types/               # kiểu dùng chung
└─ middleware.ts        # skeleton cho 301 redirects
```

## Nguyên tắc SEO (đã cài sẵn nền)

- Mỗi trang: `export async function generateMetadata()` dùng `buildMetadata()` từ `lib/seo`.
- Render: ISR (`export const revalidate = N`) cho trang sản phẩm/tin tức; SSR
  (`cache: 'no-store'`) cho tìm kiếm; SSG cho trang tĩnh.
- Ảnh: `next/image` trỏ Cloudinary (đã whitelist hostname trong `next.config.mjs`).
- JSON-LD: `<JsonLd data={...} />` cho Product / Article / BreadcrumbList...

## Gọi API

```ts
import { apiGet } from '@/lib/api';
const products = await apiGet<Product[]>('/public/products', { revalidate: 120 });
```
