import type { Category } from '@/types/admin';

export interface FlatCategoryRow {
  category: Category;
  depth: number;
}

function sortCats(list: Category[]): Category[] {
  return [...list].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'vi'),
  );
}

/**
 * Dàn phẳng cây danh mục theo thứ tự hiển thị (cha trước, con thụt vào),
 * dùng `sortOrder` rồi tới tên. Node có parentId trỏ tới mục không tồn tại
 * được coi như gốc để không bị mất khỏi bảng.
 */
export function flattenTree(all: Category[]): FlatCategoryRow[] {
  const childrenOf = new Map<number | null, Category[]>();
  const ids = new Set(all.map((c) => c.id));

  for (const c of all) {
    const key = c.parentId !== null && ids.has(c.parentId) ? c.parentId : null;
    const arr = childrenOf.get(key) ?? [];
    arr.push(c);
    childrenOf.set(key, arr);
  }

  const rows: FlatCategoryRow[] = [];
  const walk = (parentId: number | null, depth: number) => {
    for (const c of sortCats(childrenOf.get(parentId) ?? [])) {
      rows.push({ category: c, depth });
      walk(c.id, depth + 1);
    }
  };
  walk(null, 0);
  return rows;
}

/** Tập id của node + toàn bộ hậu duệ (chặn chọn làm cha → tạo chu trình). */
export function descendantIds(all: Category[], rootId: number): Set<number> {
  const childrenOf = new Map<number, Category[]>();
  for (const c of all) {
    if (c.parentId === null) continue;
    const arr = childrenOf.get(c.parentId) ?? [];
    arr.push(c);
    childrenOf.set(c.parentId, arr);
  }
  const result = new Set<number>([rootId]);
  const stack = [rootId];
  while (stack.length) {
    const id = stack.pop()!;
    for (const child of childrenOf.get(id) ?? []) {
      if (!result.has(child.id)) {
        result.add(child.id);
        stack.push(child.id);
      }
    }
  }
  return result;
}
