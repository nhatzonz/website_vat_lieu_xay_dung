import type { Metadata } from 'next';
import { env } from './env';

/**
 * Helper SEO dùng chung cho generateMetadata() ở mọi trang.
 * Đọc meta_title / meta_description / og_image / canonical từ DB rồi đổ vào đây.
 */
export interface SeoInput {
  title: string;
  description?: string;
  keywords?: string | string[];
  /** Đường dẫn tương đối, vd: /san-pham/tran-nhom (sẽ ghép với SITE_URL). */
  path?: string;
  /** URL ảnh OG tuyệt đối (Cloudinary). */
  image?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
}

export function absoluteUrl(path = ''): string {
  if (!path) return env.siteUrl;
  return `${env.siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

export function buildMetadata(input: SeoInput): Metadata {
  const url = absoluteUrl(input.path);
  const images = input.image ? [{ url: input.image }] : undefined;

  return {
    title: input.title,
    description: input.description,
    keywords: input.keywords,
    alternates: { canonical: url },
    robots: input.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      type: input.type ?? 'website',
      images,
    },
    twitter: {
      card: input.image ? 'summary_large_image' : 'summary',
      title: input.title,
      description: input.description,
      images: input.image ? [input.image] : undefined,
    },
  };
}

/**
 * Render một khối JSON-LD an toàn để nhúng vào trang (Product, Article,
 * BreadcrumbList, Organization...). Dùng trong component <JsonLd data={...} />.
 */
export function jsonLdScript(data: Record<string, unknown>): string {
  // Chặn </script> phá vỡ thẻ.
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
