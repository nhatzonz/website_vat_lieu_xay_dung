'use client';

import { Info, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { TagFormModal } from '@/components/admin/TagFormModal';
import { Button } from '@/components/admin/ui/Button';
import { Modal } from '@/components/admin/ui/Modal';
import { Spinner } from '@/components/admin/ui/Spinner';
import { useToast } from '@/components/admin/ui/Toast';
import { adminApi, AdminApiError } from '@/lib/admin-api';
import { getStoredUser, isSuperAdmin } from '@/lib/auth-store';
import type { Tag } from '@/types/admin';
import styles from './tags.module.scss';

export default function TagsPage() {
  const toast = useToast();
  const canEdit = isSuperAdmin(getStoredUser());

  const [items, setItems] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);

  const [deleting, setDeleting] = useState<Tag | null>(null);
  const [removing, setRemoving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .get<Tag[]>('/admin/tags')
      .then((data) => {
        setItems(data);
        setLoadError(null);
      })
      .catch((err) => {
        setLoadError(
          err instanceof AdminApiError ? err.message : 'Không tải được thẻ.',
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (t) =>
        t.name.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q),
    );
  }, [items, search]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(t: Tag) {
    setEditing(t);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setRemoving(true);
    try {
      await adminApi.delete(`/admin/tags/${deleting.id}`);
      toast.success('Đã xóa thẻ.');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : 'Xóa thẻ thất bại.',
      );
    } finally {
      setRemoving(false);
    }
  }

  if (loading) return <Spinner label="Đang tải thẻ..." />;
  if (loadError) return <div className={styles.error}>{loadError}</div>;

  return (
    <div className={styles.wrap}>
      <div className={styles.hint}>
        <Info size={16} />
        <span>
          <strong>Thẻ</strong> là nhãn giúp lọc chéo sản phẩm ở nhiều danh mục
          (vd: <em>Bán chạy, Khuyến mãi, Hàng nhập khẩu</em>). Một sản phẩm gắn
          được nhiều thẻ. Tạo thẻ ở đây, sau đó chọn thẻ khi thêm/sửa sản phẩm.
          Xóa thẻ chỉ gỡ nhãn, không ảnh hưởng sản phẩm.
        </span>
      </div>

      <div className={styles.bar}>
        <p className={styles.count}>{items.length} thẻ</p>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className={styles.searchBox}>
            <Search size={16} />
            <input
              type="search"
              placeholder="Tìm thẻ…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {canEdit && (
            <Button icon={<Plus size={16} />} onClick={openCreate}>
              Thêm thẻ
            </Button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <p>{search ? 'Không tìm thấy thẻ phù hợp.' : 'Chưa có thẻ nào.'}</p>
          {canEdit && !search && (
            <Button icon={<Plus size={16} />} onClick={openCreate}>
              Tạo thẻ đầu tiên
            </Button>
          )}
        </div>
      ) : (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tên thẻ</th>
                <th>Slug</th>
                <th className={styles.center}>Sản phẩm</th>
                {canEdit && <th className={styles.right}>Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((tag) => (
                <tr
                  key={tag.id}
                  className={canEdit ? styles.clickable : undefined}
                  onClick={() => canEdit && openEdit(tag)}
                >
                  <td className={styles.name}>{tag.name}</td>
                  <td className={styles.slug}>{tag.slug}</td>
                  <td className={styles.center}>
                    <span className={styles.pill}>{tag.productCount ?? 0}</span>
                  </td>
                  {canEdit && (
                    <td
                      className={styles.right}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className={styles.actions}>
                        <button
                          className={styles.iconBtn}
                          onClick={() => openEdit(tag)}
                          title="Sửa"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className={[styles.iconBtn, styles.danger].join(' ')}
                          onClick={() => setDeleting(tag)}
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

      <TagFormModal
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />

      <Modal
        open={!!deleting}
        title="Xóa thẻ"
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
          Xóa thẻ <strong>{deleting?.name}</strong>? Thẻ sẽ được gỡ khỏi các sản
          phẩm đang gắn (không ảnh hưởng sản phẩm).
        </p>
      </Modal>
    </div>
  );
}
