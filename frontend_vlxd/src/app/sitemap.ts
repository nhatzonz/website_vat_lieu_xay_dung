import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

/**
 * sitemap.xml động. Hiện chỉ có các route tĩnh.
 * Khi có API: fetch danh sách sản phẩm / danh mục / tin tức (is_active)
 * rồi map thêm vào mảng, mỗi mục { url, lastModified, changeFrequency, priority }.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: env.siteUrl, changeFrequency: 'daily', priority: 1 },
    {
      url: `${env.siteUrl}/gioi-thieu`,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${env.siteUrl}/lien-he`,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];

  // TODO: ghép thêm sản phẩm/danh mục/tin tức từ API.
  return staticRoutes;
}
