'use client';

import { GripVertical, Headphones, Pencil, Phone, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { SupportFormModal } from '@/components/admin/SupportFormModal';
import { Button } from '@/components/admin/ui/Button';
import { Switch } from '@/components/admin/ui/Field';
import { Modal } from '@/components/admin/ui/Modal';
import { Spinner } from '@/components/admin/ui/Spinner';
import { useToast } from '@/components/admin/ui/Toast';
import { adminApi, AdminApiError } from '@/lib/admin-api';
import { getStoredUser, isSuperAdmin } from '@/lib/auth-store';
import { supportChannelLabel, type SupportContact } from '@/types/admin';
import styles from './support.module.scss';

function sortItems(list: SupportContact[]): SupportContact[] {
  return [...list].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
}

export default function SupportPage() {
  const toast = useToast();
  const canEdit = isSuperAdmin(getStoredUser());

  const [items, setItems] = useState<SupportContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SupportContact | null>(null);

  const [deleting, setDeleting] = useState<SupportContact | null>(null);
  const [removing, setRemoving] = useState(false);

  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .get<SupportContact[]>('/admin/support')
      .then((data) => {
        setItems(sortItems(data));
        setLoadError(null);
      })
      .catch((err) => {
        setLoadError(
          err instanceof AdminApiError
            ? err.message
            : 'Không tải được danh sách hỗ trợ.',
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

  function openEdit(c: SupportContact) {
    setEditing(c);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setRemoving(true);
    try {
      await adminApi.delete(`/admin/support/${deleting.id}`);
      toast.success('Đã xóa mục hỗ trợ.');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : 'Xóa thất bại.');
    } finally {
      setRemoving(false);
    }
  }

  async function toggleActive(c: SupportContact) {
    setTogglingId(c.id);
    setItems((prev) =>
      prev.map((x) => (x.id === c.id ? { ...x, isActive: !x.isActive } : x)),
    );
    try {
      await adminApi.put(`/admin/support/${c.id}`, { isActive: !c.isActive });
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : 'Cập nhật thất bại.',
      );
      load();
    } finally {
      setTogglingId(null);
    }
  }

  // ---- Kéo–thả sắp xếp ----
  async function onDropRow(targetId: number) {
    const sourceId = dragId;
    setDragId(null);
    setOverId(null);
    if (sourceId === null || sourceId === targetId) return;

    const order = items.map((c) => c.id);
    const from = order.indexOf(sourceId);
    const to = order.indexOf(targetId);
    if (from === -1 || to === -1) return;
    order.splice(from, 1);
    order.splice(to, 0, sourceId);

    const plan = order.map((id, index) => ({ id, sortOrder: index }));
    const orderMap = new Map(plan.map((p) => [p.id, p.sortOrder]));
    setItems((prev) =>
      sortItems(
        prev.map((c) =>
          orderMap.has(c.id) ? { ...c, sortOrder: orderMap.get(c.id)! } : c,
        ),
      ),
    );

    setSavingOrder(true);
    try {
      await adminApi.patch('/admin/support/reorder', { items: plan });
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : 'Lưu thứ tự thất bại.',
      );
      load();
    } finally {
      setSavingOrder(false);
    }
  }

  if (loading) return <Spinner label="Đang tải danh sách hỗ trợ..." />;
  if (loadError) return <div className={styles.error}>{loadError}</div>;

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <div className={styles.heading}>
          <Headphones size={18} />
          <span>Hỗ trợ trực tuyến</span>
          <span className={styles.count}>{items.length}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {savingOrder && (
            <span className={styles.saving}>đang lưu thứ tự…</span>
          )}
          {canEdit && (
            <Button icon={<Plus size={16} />} onClick={openCreate}>
              Thêm mục hỗ trợ
            </Button>
          )}
        </div>
      </div>

      <p className={styles.note}>
        Danh sách này hiển thị ở cột bên (sidebar) trang công khai, dưới khối
        danh mục sản phẩm.
      </p>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <p>Chưa có mục hỗ trợ nào.</p>
          {canEdit && (
            <Button icon={<Plus size={16} />} onClick={openCreate}>
              Thêm mục đầu tiên
            </Button>
          )}
        </div>
      ) : (
        <div className={styles.list}>
          {items.map((c) => (
            <div
              key={c.id}
              className={[
                styles.card,
                overId === c.id ? styles.dropTarget : '',
                dragId === c.id ? styles.dragging : '',
              ]
                .filter(Boolean)
                .join(' ')}
              draggable={canEdit}
              onDragStart={() => canEdit && setDragId(c.id)}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              onDragOver={(e) => {
                if (!canEdit || dragId === null) return;
                e.preventDefault();
                setOverId(c.id);
              }}
              onDrop={(e) => {
                if (!canEdit) return;
                e.preventDefault();
                onDropRow(c.id);
              }}
            >
              {canEdit && (
                <GripVertical size={18} className={styles.grip} aria-hidden />
              )}

              <div className={styles.icon}>
                <Phone size={18} />
              </div>

              <div className={styles.info}>
                <span className={styles.name}>{c.name}</span>
                <span className={styles.contacts}>
                  {c.phone && <span>☎ {c.phone}</span>}
                  {c.zalo && <span>Zalo: {c.zalo}</span>}
                </span>
              </div>

              <div className={styles.channel}>{supportChannelLabel(c.channel)}</div>

              <div className={styles.meta}>
                {canEdit ? (
                  <Switch
                    checked={c.isActive}
                    disabled={togglingId === c.id}
                    onChange={() => toggleActive(c)}
                  />
                ) : (
                  <span className={styles.muted}>
                    {c.isActive ? 'Hiển thị' : 'Ẩn'}
                  </span>
                )}
              </div>

              {canEdit && (
                <div className={styles.actions}>
                  <button
                    className={styles.iconBtn}
                    onClick={() => openEdit(c)}
                    title="Sửa"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className={[styles.iconBtn, styles.danger].join(' ')}
                    onClick={() => setDeleting(c)}
                    title="Xóa"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <SupportFormModal
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />

      <Modal
        open={!!deleting}
        title="Xóa mục hỗ trợ"
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
          Xóa <strong>{deleting?.name || 'mục này'}</strong>? Thao tác không thể
          hoàn tác.
        </p>
      </Modal>
    </div>
  );
}
