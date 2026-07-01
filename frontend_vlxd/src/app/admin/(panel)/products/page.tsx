'use client';

import { ImageOff, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/admin/ui/Button';
import { Modal } from '@/components/admin/ui/Modal';
import { Spinner } from '@/components/admin/ui/Spinner';
import { useToast } from '@/components/admin/ui/Toast';
import { adminApi, AdminApiError } from '@/lib/admin-api';
import { getStoredUser, isSuperAdmin } from '@/lib/auth-store';
import { flattenTree } from '@/lib/category-tree';
import type { Category, Paginated, ProductListItem } from '@/types/admin';
import styles from './products.module.scss';

const PAGE_SIZE = 20;

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
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  const [cats, setCats] = useState<Category[]>([]);
  const [deleting, setDeleting] = useState<ProductListItem | null>(null);
  const [removing, setRemoving] = useState(false);

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

  const catOptions = useMemo(
    () =>
      flattenTree(cats).map((r) => ({
        slug: r.category.slug,
        label: `${'— '.repeat(r.depth)}${r.category.name}`,
      })),
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
        <select
          className={styles.select}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">Tất cả danh mục</option>
          {catOptions.map((o) => (
            <option key={o.slug} value={o.slug}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          className={styles.select}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">Mọi trạng thái</option>
          <option value="active">Đang hiển thị</option>
          <option value="inactive">Đang ẩn</option>
        </select>
        <select
          className={styles.select}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Mới nhất</option>
          <option value="oldest">Cũ nhất</option>
          <option value="price_asc">Giá tăng dần</option>
          <option value="price_desc">Giá giảm dần</option>
          <option value="popular">Xem nhiều</option>
          <option value="name">Tên A–Z</option>
        </select>
      </div>

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
              {items.map((p) => (
                <tr
                  key={p.id}
                  className={canEdit ? styles.clickable : undefined}
                  onClick={() => canEdit && router.push(`/admin/products/${p.id}`)}
                >
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
