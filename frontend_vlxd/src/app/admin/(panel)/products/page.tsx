'use client';

import { GripVertical, ImageOff, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/admin/ui/Button';
import { FilterSelect } from '@/components/admin/ui/FilterSelect';
import { Modal } from '@/components/admin/ui/Modal';
import { Spinner } from '@/components/admin/ui/Spinner';
import { useToast } from '@/components/admin/ui/Toast';
import { adminApi, AdminApiError } from '@/lib/admin-api';
import { getStoredUser, isSuperAdmin } from '@/lib/auth-store';
import { flattenTree } from '@/lib/category-tree';
import type { Category, Paginated, ProductListItem } from '@/types/admin';
import styles from './products.module.scss';

const PAGE_SIZE = 30;

const STATUS_OPTIONS = [
  { value: '', label: 'Mọi trạng thái' },
  { value: 'active', label: 'Đang hiển thị' },
  { value: 'inactive', label: 'Đang ẩn' },
];

const SORT_OPTIONS = [
  { value: 'manual', label: 'Thứ tự (kéo thả)' },
  { value: 'newest', label: 'Mới nhất' },
  { value: 'oldest', label: 'Cũ nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'popular', label: 'Xem nhiều' },
  { value: 'name', label: 'Tên A–Z' },
];

function formatPrice(p: ProductListItem): string {
  if (p.priceType === 'contact' || p.price === null) return 'Liên hệ';
  return `${p.price.toLocaleString('vi-VN')} ${p.priceUnit}`;
}

export default function ProductsPage() {
  const toast = useToast();
  const router = useRouter();
  const canEdit = isSuperAdmin(getStoredUser());

  const [data, setData] = useState<Paginated<ProductListItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('manual');
  const [page, setPage] = useState(1);

  const [cats, setCats] = useState<Category[]>([]);
  const [deleting, setDeleting] = useState<ProductListItem | null>(null);
  const [removing, setRemoving] = useState(false);

  // Bản sao cục bộ để kéo thả (cập nhật lạc quan trước khi lưu server).
  const [rows, setRows] = useState<ProductListItem[]>([]);
  const dragFrom = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  // Kéo thả chỉ bật khi xem theo "Thứ tự" và không lọc/tìm (thứ tự thuần).
  const dragEnabled =
    canEdit && sort === 'manual' && !debouncedQ.trim() && !category && !status;

  // Nạp danh mục cho bộ lọc (1 lần).
  useEffect(() => {
    adminApi.get<Category[]>('/admin/categories').then(setCats).catch(() => {});
  }, []);

  // Debounce ô tìm kiếm.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, category, status, sort]);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      sort,
    });
    if (debouncedQ.trim()) params.set('q', debouncedQ.trim());
    if (category) params.set('category', category);
    if (status) params.set('active', status === 'active' ? '1' : '0');

    adminApi
      .getPaged<ProductListItem>(`/admin/products?${params.toString()}`)
      .then((res) => {
        setData(res);
        setLoadError(null);
      })
      .catch((err) => {
        setLoadError(
          err instanceof AdminApiError ? err.message : 'Không tải được sản phẩm.',
        );
      })
      .finally(() => setLoading(false));
  }, [page, sort, debouncedQ, category, status]);

  useEffect(() => {
    load();
  }, [load]);

  // Đồng bộ bản cục bộ mỗi khi dữ liệu server thay đổi.
  useEffect(() => {
    setRows(data?.data ?? []);
  }, [data]);

  function onDragStart(i: number) {
    dragFrom.current = i;
  }

  function onDragOver(i: number, e: React.DragEvent) {
    if (!dragEnabled || dragFrom.current === null) return;
    e.preventDefault();
    setDragOver(i);
    const from = dragFrom.current;
    if (from === i) return;
    // Di chuyển hàng ngay trong lúc kéo để phản hồi mượt.
    setRows((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(i, 0, moved);
      return next;
    });
    dragFrom.current = i;
  }

  async function onDrop() {
    dragFrom.current = null;
    setDragOver(null);

    // Đánh lại chỉ số theo vị trí hiển thị mới (0,1,2,… kèm offset trang).
    // Chỉ gửi những item có sortOrder thực sự thay đổi → ít ghi DB.
    const base = (page - 1) * PAGE_SIZE;
    const items = rows
      .map((r, idx) => ({ id: r.id, sortOrder: base + idx, old: r.sortOrder }))
      .filter((x) => x.sortOrder !== x.old)
      .map(({ id, sortOrder }) => ({ id, sortOrder }));
    if (items.length === 0) return;

    try {
      await adminApi.patch('/admin/products/reorder', { items });
      // Nạp lại để backend áp quy tắc "nổi bật lên đầu".
      load();
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : 'Lưu thứ tự thất bại.',
      );
      load(); // khôi phục thứ tự cũ
    }
  }

  const catOptions = useMemo(
    () => [
      { value: '', label: 'Tất cả danh mục' },
      ...flattenTree(cats).map((r) => ({
        value: r.category.slug,
        label: `${'— '.repeat(r.depth)}${r.category.name}`,
      })),
    ],
    [cats],
  );

  async function confirmDelete() {
    if (!deleting) return;
    setRemoving(true);
    try {
      await adminApi.delete(`/admin/products/${deleting.id}`);
      toast.success('Đã xóa sản phẩm.');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : 'Xóa sản phẩm thất bại.',
      );
    } finally {
      setRemoving(false);
    }
  }

  const items = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <p className={styles.count}>{meta ? `${meta.total} sản phẩm` : ' '}</p>
        {canEdit && (
          <Button
            icon={<Plus size={16} />}
            onClick={() => router.push('/admin/products/new')}
          >
            Thêm sản phẩm
          </Button>
        )}
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input
            type="search"
            placeholder="Tìm theo tên hoặc SKU…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <FilterSelect
          value={category}
          options={catOptions}
          onChange={setCategory}
          ariaLabel="Lọc theo danh mục"
        />
        <FilterSelect
          value={status}
          options={STATUS_OPTIONS}
          onChange={setStatus}
          ariaLabel="Lọc theo trạng thái"
        />
        <FilterSelect
          value={sort}
          options={SORT_OPTIONS}
          onChange={setSort}
          ariaLabel="Sắp xếp"
        />
      </div>

      {canEdit && sort === 'manual' && (
        <p className={styles.hint}>
          {dragEnabled
            ? 'Kéo biểu tượng ⠿ ở cột “Thứ tự” để sắp xếp lại. Sản phẩm nổi bật luôn ưu tiên lên đầu.'
            : 'Bỏ tìm kiếm và bộ lọc để bật kéo thả sắp xếp.'}
        </p>
      )}

      {loading ? (
        <Spinner label="Đang tải sản phẩm..." />
      ) : loadError ? (
        <div className={styles.error}>{loadError}</div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>
          <p>Không có sản phẩm phù hợp.</p>
          {canEdit && (
            <Button
              icon={<Plus size={16} />}
              onClick={() => router.push('/admin/products/new')}
            >
              Thêm sản phẩm
            </Button>
          )}
        </div>
      ) : (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                {canEdit && <th className={styles.center}>Thứ tự</th>}
                <th>Ảnh</th>
                <th>Tên sản phẩm</th>
                <th>Danh mục</th>
                <th className={styles.right}>Giá</th>
                <th className={styles.center}>Nhãn</th>
                <th className={styles.center}>Xem</th>
                <th className={styles.center}>Trạng thái</th>
                {canEdit && <th className={styles.right}>Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => (
                <tr
                  key={p.id}
                  className={[
                    canEdit ? styles.clickable : '',
                    dragOver === i ? styles.dragOver : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => canEdit && router.push(`/admin/products/${p.id}`)}
                  onDragOver={(e) => onDragOver(i, e)}
                  onDrop={(e) => e.preventDefault()}
                >
                  {canEdit && (
                    <td
                      className={styles.center}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className={styles.orderCell}>
                        <button
                          type="button"
                          className={styles.dragHandle}
                          draggable={dragEnabled}
                          onDragStart={() => onDragStart(i)}
                          onDragEnd={onDrop}
                          title={
                            dragEnabled
                              ? 'Kéo để đổi thứ tự'
                              : 'Chọn sắp xếp “Thứ tự” và bỏ lọc để kéo thả'
                          }
                          disabled={!dragEnabled}
                        >
                          <GripVertical size={16} />
                        </button>
                        <span className={styles.orderNum}>{p.sortOrder}</span>
                      </div>
                    </td>
                  )}
                  <td>
                    {p.thumbnail ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img className={styles.thumb} src={p.thumbnail} alt={p.name} />
                    ) : (
                      <span className={styles.thumbEmpty}>
                        <ImageOff size={18} />
                      </span>
                    )}
                  </td>
                  <td>
                    <div className={styles.pname}>{p.name}</div>
                    {p.sku && <div className={styles.psku}>{p.sku}</div>}
                  </td>
                  <td className={styles.cat}>{p.category?.name ?? '—'}</td>
                  <td className={styles.right}>
                    <span
                      className={[
                        styles.price,
                        p.priceType === 'contact' ? styles.contact : '',
                      ].join(' ')}
                    >
                      {formatPrice(p)}
                    </span>
                  </td>
                  <td className={styles.center}>
                    <span className={styles.flags}>
                      {p.isNew && (
                        <span className={[styles.flag, styles.flagNew].join(' ')}>
                          Mới
                        </span>
                      )}
                      {p.isFeatured && (
                        <span className={[styles.flag, styles.flagHot].join(' ')}>
                          Nổi bật
                        </span>
                      )}
                    </span>
                  </td>
                  <td className={styles.center}>{p.views}</td>
                  <td className={styles.center}>
                    <span
                      className={[
                        styles.badge,
                        p.isActive ? styles.on : styles.off,
                      ].join(' ')}
                    >
                      {p.isActive ? 'Hiển thị' : 'Ẩn'}
                    </span>
                  </td>
                  {canEdit && (
                    <td
                      className={styles.right}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className={styles.actions}>
                        <button
                          className={styles.iconBtn}
                          onClick={() => router.push(`/admin/products/${p.id}`)}
                          title="Sửa"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className={[styles.iconBtn, styles.danger].join(' ')}
                          onClick={() => setDeleting(p)}
                          title="Xóa"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className={styles.pager}>
          <button
            className={styles.pageBtn}
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            ‹
          </button>
          <span>
            Trang {meta.page}/{meta.totalPages}
          </span>
          <button
            className={styles.pageBtn}
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            ›
          </button>
        </div>
      )}

      <Modal
        open={!!deleting}
        title="Xóa sản phẩm"
        onClose={() => !removing && setDeleting(null)}
        busy={removing}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleting(null)}
              disabled={removing}
            >
              Hủy
            </Button>
            <Button variant="danger" loading={removing} onClick={confirmDelete}>
              Xóa
            </Button>
          </>
        }
      >
        <p style={{ margin: 0 }}>
          Xóa sản phẩm <strong>{deleting?.name}</strong>? Ảnh liên quan cũng sẽ
          bị xóa. Hành động không thể hoàn tác.
        </p>
      </Modal>
    </div>
  );
}
