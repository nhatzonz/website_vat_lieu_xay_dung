import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

/**
 * robots.txt động: cho index, chặn /admin và /api, trỏ tới sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api'],
    },
    sitemap: `${env.siteUrl}/sitemap.xml`,
    host: env.siteUrl,
  };
}
