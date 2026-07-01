import { apiGet } from './api';
import type { PublicSupport } from '@/types/catalog';

/** Danh sách hỗ trợ trực tuyến (đang bật) cho web. ISR + tag để revalidate. */
export function getSupportContacts(): Promise<PublicSupport[]> {
  return apiGet<PublicSupport[]>('/public/support', {
    revalidate: 300,
    tags: ['support'],
  });
}
