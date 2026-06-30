import { jsonLdScript } from '@/lib/seo';

/**
 * Nhúng structured data (schema.org) vào trang.
 * Dùng: <JsonLd data={{ '@context': 'https://schema.org', '@type': 'Product', ... }} />
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }}
    />
  );
}
