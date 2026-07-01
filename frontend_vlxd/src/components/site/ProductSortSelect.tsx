'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { FilterSelect } from '@/components/admin/ui/FilterSelect';

const OPTIONS = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'popular', label: 'Xem nhiều' },
  { value: 'name', label: 'Tên A–Z' },
];

/** Dropdown sắp xếp — đổi giá trị thì cập nhật URL (?sort=) và về trang 1. */
export function ProductSortSelect({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onChange(value: string) {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('sort', value);
    sp.delete('page');
    router.push(`${pathname}?${sp.toString()}`, { scroll: false });
  }

  return (
    <FilterSelect
      value={current}
      options={OPTIONS}
      onChange={onChange}
      ariaLabel="Sắp xếp"
    />
  );
}
