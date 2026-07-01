'use client';

import { GripVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { AttributeFormModal } from '@/components/admin/AttributeFormModal';
import { Button } from '@/components/admin/ui/Button';
import { Switch } from '@/components/admin/ui/Field';
import { Modal } from '@/components/admin/ui/Modal';
import { Spinner } from '@/components/admin/ui/Spinner';
import { useToast } from '@/components/admin/ui/Toast';
import { adminApi, AdminApiError } from '@/lib/admin-api';
import { getStoredUser, isSuperAdmin } from '@/lib/auth-store';
import type { Attribute } from '@/types/admin';
import styles from './attributes.module.scss';

function sortAttrs(list: Attribute[]): Attribute[] {
  return [...list].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'vi'),
  );
}

export default function AttributesPage() {
  const toast = useToast();
  const canEdit = isSuperAdmin(getStoredUser());

  const [items, setItems] = useState<Attribute[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Attribute | null>(null);

  const [deleting, setDeleting] = useState<Attribute | null>(null);
  const [removing, setRemoving] = useState(false);

  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .get<Attribute[]>('/admin/attributes')
      .then((data) => {
        setItems(sortAttrs(data));
        setLoadError(null);
      })
      .catch((err) => {
        setLoadError(
          err instanceof AdminApiError ? err.message : 'Không tải được thuộc tính.',
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(a: Attribute) {
    setEditing(a);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setRemoving(true);
    try {
      await adminApi.delete(`/admin/attributes/${deleting.id}`);
      toast.success('Đã xóa thuộc tính.');
      setDeleting(null);
      load();
    } catch (err) {
      // 409: đang được dùng ở sản phẩm.
      toast.error(
        err instanceof AdminApiError ? err.message : 'Xóa thuộc tính thất bại.',
      );
    } finally {
      setRemoving(false);
    }
  }

  async function toggleActive(a: Attribute) {
    setTogglingId(a.id);
    setItems((prev) =>
      prev.map((x) => (x.id === a.id ? { ...x, isActive: !x.isActive } : x)),
    );
    try {
      await adminApi.put(`/admin/attributes/${a.id}`, { isActive: !a.isActive });
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : 'Cập nhật thất bại.',
      );
      load();
    } finally {
      setTogglingId(null);
    }
  }

  async function onDropRow(targetId: number) {
    const sourceId = dragId;
    setDragId(null);
    setOverId(null);
    if (sourceId === null || sourceId === targetId) return;

    const order = items.map((a) => a.id);
    const from = order.indexOf(sourceId);
    const to = order.indexOf(targetId);
    if (from === -1 || to === -1) return;
    order.splice(from, 1);
    order.splice(to, 0, sourceId);

    const plan = order.map((id, index) => ({ id, sortOrder: index }));
    const orderMap = new Map(plan.map((p) => [p.id, p.sortOrder]));
    setItems((prev) =>
      sortAttrs(
        prev.map((a) =>
          orderMap.has(a.id) ? { ...a, sortOrder: orderMap.get(a.id)! } : a,
        ),
      ),
    );

    setSavingOrder(true);
    try {
      await adminApi.patch('/admin/attributes/reorder', { items: plan });
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : 'Lưu thứ tự thất bại.',
      );
      load();
    } finally {
      setSavingOrder(false);
    }
  }

  if (loading) return <Spinner label="Đang tải thuộc tính..." />;
  if (loadError) return <div className={styles.error}>{loadError}</div>;

  const canReorder = canEdit;

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <p className={styles.count}>
          {items.length} thuộc tính
          {savingOrder && <span className={styles.saving}> · đang lưu thứ tự…</span>}
        </p>
        {canEdit && (
          <Button icon={<Plus size={16} />} onClick={openCreate}>
            Thêm thuộc tính
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <p>Chưa có thuộc tính nào.</p>
          {canEdit && (
            <Button icon={<Plus size={16} />} onClick={openCreate}>
              Tạo thuộc tính đầu tiên
            </Button>
          )}
        </div>
      ) : (
        <div className={styles.tableCard}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tên thuộc tính</th>
                <th>Đơn vị</th>
                <th className={styles.center}>Thứ tự</th>
                <th className={styles.center}>Sử dụng</th>
                {canEdit && <th className={styles.right}>Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {items.map((attr) => (
                <tr
                  key={attr.id}
                  className={[
                    canEdit ? styles.clickable : '',
                    overId === attr.id ? styles.dropTarget : '',
                    dragId === attr.id ? styles.dragging : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => canEdit && openEdit(attr)}
                  draggable={canReorder}
                  onDragStart={() => canReorder && setDragId(attr.id)}
                  onDragEnd={() => {
                    setDragId(null);
                    setOverId(null);
                  }}
                  onDragOver={(e) => {
                    if (!canReorder || dragId === null) return;
                    e.preventDefault();
                    setOverId(attr.id);
                  }}
                  onDrop={(e) => {
                    if (!canReorder) return;
                    e.preventDefault();
                    onDropRow(attr.id);
                  }}
                >
                  <td>
                    <span className={styles.name}>
                      {canReorder && (
                        <GripVertical size={15} className={styles.grip} aria-hidden />
                      )}
                      {attr.name}
                    </span>
                  </td>
                  <td className={styles.unit}>{attr.unit || '—'}</td>
                  <td className={styles.center}>{attr.sortOrder}</td>
                  <td
                    className={styles.center}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {canEdit ? (
                      <Switch
                        checked={attr.isActive}
                        disabled={togglingId === attr.id}
                        onChange={() => toggleActive(attr)}
                      />
                    ) : attr.isActive ? (
                      'Có'
                    ) : (
                      'Không'
                    )}
                  </td>
                  {canEdit && (
                    <td
                      className={styles.right}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className={styles.actions}>
                        <button
                          className={styles.iconBtn}
                          onClick={() => openEdit(attr)}
                          title="Sửa"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          className={[styles.iconBtn, styles.danger].join(' ')}
                          onClick={() => setDeleting(attr)}
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

      <AttributeFormModal
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />

      <Modal
        open={!!deleting}
        title="Xóa thuộc tính"
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
          Xóa thuộc tính <strong>{deleting?.name}</strong>? Thuộc tính đang được
          dùng ở sản phẩm sẽ không xóa được.
        </p>
      </Modal>
    </div>
  );
}
