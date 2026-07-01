import { apiGet } from './api';
import type { PublicVideo } from '@/types/catalog';

/** Video active theo vị trí cho web. ISR + tag để revalidate khi cần. */
export function getVideos(position: string): Promise<PublicVideo[]> {
  return apiGet<PublicVideo[]>(
    `/public/videos?position=${encodeURIComponent(position)}`,
    { revalidate: 300, tags: ['videos'] },
  );
}
