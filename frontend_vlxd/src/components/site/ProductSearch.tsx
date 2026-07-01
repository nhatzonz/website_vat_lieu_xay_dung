'use client';

import { Loader2, Search, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import styles from './ProductSearch.module.scss';

/** Chờ ngừng gõ bao lâu thì tự tìm (ms). */
const DEBOUNCE_MS = 400;

/**
 * Ô tìm kiếm sản phẩm — tối ưu cho App Router:
 * - Tự tìm sau khi ngừng gõ {DEBOUNCE_MS}ms (không cần Enter); Enter thì tìm ngay.
 * - Dùng router.replace (không nhồi lịch sử mỗi ký tự) + useTransition (hiện
 *   trạng thái đang tìm, không chặn UI).
 * - Gọi API tìm trên TOÀN BỘ dữ liệu (BE lọc theo tên/mã rồi mới phân trang),
 *   không giới hạn ở trang hiện tại. Giữ danh mục/sort, về trang 1.
 */
export function ProductSearch({ current }: { current: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(current);
  const [isPending, startTransition] = useTransition();
  const composing = useRef(false); // đang gõ tiếng Việt (IME) thì chưa tìm
  const inputRef = useRef<HTMLInputElement>(null);

  // Đồng bộ ô với URL khi điều hướng ngoài (vd bấm danh mục) — chỉ khi KHÔNG
  // đang focus để không ghi đè lúc người dùng gõ.
  useEffect(() => {
    if (document.activeElement !== inputRef.current) setValue(current);
  }, [current]);

  function navigate(q: string) {
    const sp = new URLSearchParams(searchParams.toString());
    const t = q.trim();
    if (t) sp.set('q', t);
    else sp.delete('q');
    sp.delete('page'); // tìm mới → về trang 1
    const qs = sp.toString();
    startTransition(() => {
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    });
  }

  // Tự tìm khi ngừng gõ; bỏ qua nếu không đổi so với URL hoặc đang gõ IME.
  useEffect(() => {
    if (composing.current) return;
    if (value.trim() === current.trim()) return;
    const t = setTimeout(() => navigate(value), DEBOUNCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <form
      className={styles.box}
      onSubmit={(e) => {
        e.preventDefault();
        navigate(value); // Enter → tìm ngay
      }}
      role="search"
    >
      <input
        ref={inputRef}
        type="search"
        placeholder="Tìm theo tên hoặc mã sản phẩm…"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onCompositionStart={() => (composing.current = true)}
        onCompositionEnd={(e) => {
          composing.current = false;
          setValue(e.currentTarget.value);
        }}
        aria-label="Tìm kiếm sản phẩm"
      />
      {value && (
        <button
          type="button"
          className={styles.clear}
          onClick={() => {
            setValue('');
            navigate('');
          }}
          aria-label="Xóa tìm kiếm"
        >
          <X size={15} />
        </button>
      )}
      <button
        type="submit"
        className={styles.searchBtn}
        aria-label="Tìm kiếm"
        title="Tìm kiếm"
      >
        {isPending ? (
          <Loader2 size={18} className={styles.spin} />
        ) : (
          <Search size={18} />
        )}
      </button>
    </form>
  );
}
