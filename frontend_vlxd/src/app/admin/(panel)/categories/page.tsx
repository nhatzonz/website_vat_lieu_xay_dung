'use client';

import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CategoryFormModal } from '@/components/admin/CategoryFormModal';
import { Button } from '@/components/admin/ui/Button';
import { Modal } from '@/components/admin/ui/Modal';
import { Spinner } from '@/components/admin/ui/Spinner';
import { useToast } from '@/components/admin/ui/Toast';
import { adminApi, AdminApiError } from '@/lib/admin-api';
import { getStoredUser, isSuperAdmin } from '@/lib/auth-store';
import { computeReorder, flattenTree } from '@/lib/category-tree';
import type { BulkCategoryAction, Category, ReorderItem } from '@/types/admin';
import styles from './categories.module.scss';

type StatusFilter = 'all' | 'active' | 'inactive';
const PAGE_SIZE = 50;

export default function CategoriesPage() {
  const toast = useToast();
  const canEdit = isSuperAdmin(getStoredUser());

  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const [deleting, setDeleting] = useState<Category | null>(null);
  const [removing, setRemoving] = useState(false);

  const [dragId, setDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const [trashOpen, setTrashOpen] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .get<Category[]>('/admin/categories')
      .then((data) => {
        setItems(data);
        setLoadError(null);
        setSelected(new Set());
      })
      .catch((err) => {
        setLoadError(
          err instanceof AdminApiError ? err.message : 'Không tải được danh mục.',
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtering = search.trim() !== '' || status !== 'all';

  // Cây đầy đủ (cho phép kéo–thả). Khi đang lọc/tìm: danh sách phẳng đã lọc.
  const treeRows = useMemo(() => flattenTree(items), [items]);

  const filteredRows = useMemo(() => {
    if (!filtering) return treeRows;
    const q = search.trim().toLowerCase();
    return treeRows.filter(({ category: c }) => {
      const matchText =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q);
      const matchStatus =
        status === 'all' ||
        (status === 'active' ? c.isActive : !c.isActive);
      return matchText && matchStatus;
    });
  }, [treeRows, filtering, search, status]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pageSafe = Math.min(page, totalPages);
  const pagedRows = filtering
    ? filteredRows.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE)
    : filteredRows;

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const visibleIds = pagedRows.map((r) => r.category.id);
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.has(id));

  function toggleSelect(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        visibleIds.forEach((id) => next.delete(id));
      } else {
        visibleIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(c: Category) {
    setEditing(c);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setRemoving(true);
    try {
      await adminApi.delete(`/admin/categories/${deleting.id}`);
      toast.success('Đã chuyển danh mục vào thùng rác.');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : 'Xóa danh mục thất bại.',
      );
    } finally {
      setRemoving(false);
    }
  }

  async function runBulk(action: BulkCategoryAction) {
    const ids = [...selected];
    if (ids.length === 0) return;
    setBulkBusy(true);
    try {
      await adminApi.patch('/admin/categories/bulk', { ids, action });
      toast.success(
        action === 'delete'
          ? `Đã chuyển ${ids.length} danh mục vào thùng rác.`
          : `Đã cập nhật ${ids.length} danh mục.`,
      );
      load();
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : 'Thao tác thất bại.',
      );
    } finally {
      setBulkBusy(false);
    }
  }

  // ---- Kéo–thả sắp xếp (chỉ giữa các mục cùng cha, khi không lọc) ----
  const canReorder = canEdit && !filtering;

  async function onDropRow(targetId: number) {
    const sourceId = dragId;
    setDragId(null);
    setOverId(null);
    if (sourceId === null || sourceId === targetId) return;

    const plan = computeReorder(items, sourceId, targetId);
    if (!plan) {
      toast.error('Chỉ kéo–thả sắp xếp trong cùng một cấp danh mục.');
      return;
    }

    // Cập nhật lạc quan để UI mượt, lưu nền; lỗi thì tải lại.
    applyReorder(plan);
    setSavingOrder(true);
    try {
      await adminApi.patch('/admin/categories/reorder', { items: plan });
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : 'Lưu thứ tự thất bại.',
      );
      load();
    } finally {
      setSavingOrder(false);
    }
  }

  function applyReorder(plan: ReorderItem[]) {
    const order = new Map(plan.map((p) => [p.id, p.sortOrder]));
    setItems((prev) =>
      prev.map((c) =>
        order.has(c.id) ? { ...c, sortOrder: order.get(c.id)! } : c,
      ),
    );
  }

  if (loading) return <Spinner label="Đang tải danh mục..." />;
  if (loadError) return <div className={styles.error}>{loadError}</div>;

  const selectedCount = selected.size;

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <p className={styles.count}>
          {items.length} danh mục
          {savingOrder && <span className={styles.saving}> · đang lưu thứ tự…</span>}
        </p>
        <div className={styles.barActions}>
          {canEdit && (
            <Button
              variant="secondary"
              icon={<Trash2 size={16} />}
              onClick={() => setTrashOpen(true)}
            >
              Thùng rác
            </Button>
          )}
          {canEdit && (
            <Button icon={<Plus size={16} />} onClick={openCreate}>
              Thêm danh mục
            </Button>
          )}
        </div>
      </div>

      {/* Thanh tìm kiếm + lọc */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input
            type="search"
            placeholder="Tìm theo tên hoặc slug…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className={styles.statusSelect}
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Đang hiển thị</option>
          <option value="inactive">Đang ẩn</option>
        </select>
      </div>

      {/* Thanh thao tác hàng loạt */}
      {canEdit && selectedCount > 0 && (
        <div className={styles.bulkBar}>
          <span>Đã chọn {selectedCount}</span>
          <div className={styles.bulkActions}>
            <Button
              size="sm"
              variant="secondary"
              icon={<Eye size={15} />}
              loading={bulkBusy}
              onClick={() => runBulk('activate')}
            >
              Hiển thị
            </Button>
            <Button
              size="sm"
              variant="secondary"
              icon={<EyeOff size={15} />}
              loading={bulkBusy}
              onClick={() => runBulk('deactivate')}
            >
              Ẩn
            </Button>
            <Button
              size="sm"
              variant="danger"
              icon={<Trash2 size={15} />}
              loading={bulkBusy}
              onClick={() => runBulk('delete')}
            >
              Xóa
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelected(new Set())}
            >
              Bỏ chọn
            </Button>
          </div>
        </div>
      )}

      {pagedRows.length === 0 ? (
        <div className={styles.empty}>
          <p>{filtering ? 'Không tìm thấy danh mục phù hợp.' : 'Chưa có danh mục nào.'}</p>
          {canEdit && !filtering && (
            <Button icon={<Plus size={16} />} onClick={openCreate}>
              Tạo danh mục đầu tiên
            </Button>
          )}
        </div>
      ) : (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                {canEdit && (
                  <th className={styles.checkCol}>
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      aria-label="Chọn tất cả"
                    />
                  </th>
                )}
                <th>Tên danh mục</th>
                <th>Slug</th>
                <th className={styles.center}>Sản phẩm</th>
                <th className={styles.center}>Thứ tự</th>
                <th className={styles.center}>Trạng thái</th>
                {canEdit && <th className={styles.right}>Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {pagedRows.map(({ category, depth }) => (
                <tr
                  key={category.id}
                  className={[
                    canEdit ? styles.clickable : '',
                    overId === category.id ? styles.dropTarget : '',
                    dragId === category.id ? styles.dragging : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => canEdit && openEdit(category)}
                  draggable={canReorder}
                  onDragStart={() => canReorder && setDragId(category.id)}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverId(null);
                  }}
                  onDragOver={(e) => {
                    if (!canReorder || dragId === null) return;
                    e.preventDefault();
                    setOverId(category.id);
                  }}
                  onDrop={(e) => {
                    if (!canReorder) return;
                    e.preventDefault();
                    onDropRow(category.id);
                  }}
                >
                  {canEdit && (
                    <td
                      className={styles.checkCol}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(category.id)}
                        onChange={() => toggleSelect(category.id)}
                        aria-label={`Chọn ${category.name}`}
                      />
                    </td>
                  )}
                  <td>
                    <span
                      className={styles.name}
                      style={{ paddingLeft: depth * 20 }}
                    >
                      {canReorder && (
                        <GripVertical
                          size={15}
                          className={styles.grip}
                          aria-hidden
                        />
                      )}
                      {depth > 0 && <span className={styles.tree}>└</span>}
                      {category.name}
                    </span>
                  </td>
                  <td className={styles.slug}>{category.slug}</td>
                  <td className={styles.center}>{category.productCount ?? 0}</td>
                  <td className={styles.center}>{category.sortOrder}</td>
                  <td className={styles.center}>
                    <span
                      className={[
                        styles.badge,
                        category.isActive ? styles.on : styles.off,
                      ].join(' ')}
                    >
                      {category.isActive ? 'Hiển thị' : 'Ẩn'}
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
                          onClick={() => openEdit(category)}
                          title="Sửa"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className={[styles.iconBtn, styles.danger].join(' ')}
                          onClick={() => setDeleting(category)}
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

      {/* Phân trang (chỉ khi đang lọc/tìm → danh sách phẳng) */}
      {filtering && totalPages > 1 && (
        <div className={styles.pager}>
          <button
            className={styles.pageBtn}
            disabled={pageSafe <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={16} />
          </button>
          <span>
            Trang {pageSafe}/{totalPages}
          </span>
          <button
            className={styles.pageBtn}
            disabled={pageSafe >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      <CategoryFormModal
        open={formOpen}
        editing={editing}
        all={items}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />

      <Modal
        open={!!deleting}
        title="Xóa danh mục"
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
              Đưa vào thùng rác
            </Button>
          </>
        }
      >
        <p style={{ margin: 0 }}>
          Chuyển danh mục <strong>{deleting?.name}</strong> vào thùng rác? Bạn có
          thể khôi phục lại sau. Danh mục còn danh mục con sẽ không thể xóa.
        </p>
      </Modal>

      {trashOpen && (
        <TrashModal
          onClose={() => setTrashOpen(false)}
          onChanged={load}
        />
      )}
    </div>
  );
}

/** Thùng rác: liệt kê danh mục đã xóa mềm, cho khôi phục hoặc xóa vĩnh viễn. */
function TrashModal({
  onClose,
  onChanged,
}: {
  onClose: () => void;
  onChanged: () => void;
}) {
  const toast = useToast();
  const [items, setItems] = useState<Category[] | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [purging, setPurging] = useState<Category | null>(null);

  const load = useCallback(() => {
    adminApi
      .get<Category[]>('/admin/categories/trash')
      .then(setItems)
      .catch((err) => {
        toast.error(
          err instanceof AdminApiError ? err.message : 'Không tải được thùng rác.',
        );
        setItems([]);
      });
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  async function restore(c: Category) {
    setBusyId(c.id);
    try {
      await adminApi.patch(`/admin/categories/${c.id}/restore`);
      toast.success('Đã khôi phục danh mục.');
      load();
      onChanged();
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : 'Khôi phục thất bại.',
      );
    } finally {
      setBusyId(null);
    }
  }

  async function purge() {
    if (!purging) return;
    setBusyId(purging.id);
    try {
      await adminApi.delete(`/admin/categories/${purging.id}/force`);
      toast.success('Đã xóa vĩnh viễn.');
      setPurging(null);
      load();
      onChanged();
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : 'Xóa vĩnh viễn thất bại.',
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Modal open title="Thùng rác danh mục" size="lg" onClose={onClose}>
      {items === null ? (
        <Spinner label="Đang tải…" />
      ) : items.length === 0 ? (
        <p style={{ margin: 0, color: 'var(--text-muted, #6b7280)' }}>
          Thùng rác trống.
        </p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Tên danh mục</th>
              <th>Slug</th>
              <th className={styles.right}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td className={styles.slug}>{c.slug}</td>
                <td className={styles.right}>
                  <div className={styles.actions}>
                    <Button
                      size="sm"
                      variant="secondary"
                      icon={<RotateCcw size={15} />}
                      loading={busyId === c.id}
                      onClick={() => restore(c)}
                    >
                      Khôi phục
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      icon={<Trash2 size={15} />}
                      disabled={busyId === c.id}
                      onClick={() => setPurging(c)}
                    >
                      Xóa vĩnh viễn
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal
        open={!!purging}
        title="Xóa vĩnh viễn"
        onClose={() => busyId === null && setPurging(null)}
        busy={busyId !== null}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setPurging(null)}
              disabled={busyId !== null}
            >
              Hủy
            </Button>
            <Button
              variant="danger"
              loading={busyId === purging?.id}
              onClick={purge}
            >
              Xóa vĩnh viễn
            </Button>
          </>
        }
      >
        <p style={{ margin: 0 }}>
          Xóa vĩnh viễn <strong>{purging?.name}</strong>? Hành động này không thể
          hoàn tác. Danh mục còn sản phẩm hoặc danh mục con sẽ không thể xóa.
        </p>
      </Modal>
    </Modal>
  );
}
