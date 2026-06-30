import { apiGet } from './api';
import type { PublicBanner } from '@/types/catalog';

/** Banner active theo vị trí cho web. ISR + tag để revalidate khi cần. */
export function getBanners(position: string): Promise<PublicBanner[]> {
  return apiGet<PublicBanner[]>(
    `/public/banners?position=${encodeURIComponent(position)}`,
    { revalidate: 300, tags: ['banners'] },
  );
}
