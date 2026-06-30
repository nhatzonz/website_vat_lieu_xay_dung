'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { CategoryFormModal } from '@/components/admin/CategoryFormModal';
import { Button } from '@/components/admin/ui/Button';
import { Modal } from '@/components/admin/ui/Modal';
import { Spinner } from '@/components/admin/ui/Spinner';
import { useToast } from '@/components/admin/ui/Toast';
import { adminApi, AdminApiError } from '@/lib/admin-api';
import { getStoredUser, isSuperAdmin } from '@/lib/auth-store';
import { flattenTree } from '@/lib/category-tree';
import type { Category } from '@/types/admin';
import styles from './categories.module.scss';

export default function CategoriesPage() {
  const toast = useToast();
  const canEdit = isSuperAdmin(getStoredUser());

  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);

  const [deleting, setDeleting] = useState<Category | null>(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .get<Category[]>('/admin/categories')
      .then((data) => {
        setItems(data);
        setLoadError(null);
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

  const rows = useMemo(() => flattenTree(items), [items]);

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
      toast.success('Đã xóa danh mục.');
      setDeleting(null);
      load();
    } catch (err) {
      // 409: còn danh mục con hoặc còn sản phẩm liên kết.
      toast.error(
        err instanceof AdminApiError ? err.message : 'Xóa danh mục thất bại.',
      );
    } finally {
      setRemoving(false);
    }
  }

  if (loading) return <Spinner label="Đang tải danh mục..." />;
  if (loadError) return <div className={styles.error}>{loadError}</div>;

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <p className={styles.count}>{items.length} danh mục</p>
        {canEdit && (
          <Button icon={<Plus size={16} />} onClick={openCreate}>
            Thêm danh mục
          </Button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className={styles.empty}>
          <p>Chưa có danh mục nào.</p>
          {canEdit && (
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
                <th>Tên danh mục</th>
                <th>Slug</th>
                <th className={styles.center}>Thứ tự</th>
                <th className={styles.center}>Trạng thái</th>
                {canEdit && <th className={styles.right}>Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ category, depth }) => (
                <tr key={category.id}>
                  <td>
                    <span
                      className={styles.name}
                      style={{ paddingLeft: depth * 20 }}
                    >
                      {depth > 0 && <span className={styles.tree}>└</span>}
                      {category.name}
                    </span>
                  </td>
                  <td className={styles.slug}>{category.slug}</td>
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
                    <td className={styles.right}>
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
              Xóa
            </Button>
          </>
        }
      >
        <p style={{ margin: 0 }}>
          Bạn chắc chắn muốn xóa danh mục <strong>{deleting?.name}</strong>?
          Danh mục còn danh mục con hoặc còn sản phẩm sẽ không thể xóa.
        </p>
      </Modal>
    </div>
  );
}
