import { apiGet } from './api';
import type { PublicCategory } from '@/types/catalog';

/** Cây danh mục công khai (chỉ mục đang hiển thị). ISR + tag để revalidate. */
export function getCategoryTree(): Promise<PublicCategory[]> {
  return apiGet<PublicCategory[]>('/public/categories', {
    revalidate: 300,
    tags: ['categories'],
  });
}

export interface CategoryLocation {
  node: PublicCategory;
  /** Tổ tiên từ gốc → cha trực tiếp (không gồm chính node). */
  ancestors: PublicCategory[];
}

/**
 * Tìm danh mục theo slug trong cây, kèm đường dẫn tổ tiên (cho breadcrumb).
 * Trả null nếu không có (slug sai hoặc danh mục đang ẩn → không nằm trong cây).
 */
export function findCategoryBySlug(
  tree: PublicCategory[],
  slug: string,
): CategoryLocation | null {
  const walk = (
    nodes: PublicCategory[],
    trail: PublicCategory[],
  ): CategoryLocation | null => {
    for (const node of nodes) {
      if (node.slug === slug) return { node, ancestors: trail };
      const found = node.children?.length
        ? walk(node.children, [...trail, node])
        : null;
      if (found) return found;
    }
    return null;
  };
  return walk(tree, []);
}
