'use client';

import { ExternalLink, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BannerFormModal } from '@/components/admin/BannerFormModal';
import { Button } from '@/components/admin/ui/Button';
import { Switch } from '@/components/admin/ui/Field';
import { Modal } from '@/components/admin/ui/Modal';
import { Spinner } from '@/components/admin/ui/Spinner';
import { useToast } from '@/components/admin/ui/Toast';
import { adminApi, AdminApiError } from '@/lib/admin-api';
import { getStoredUser, isSuperAdmin } from '@/lib/auth-store';
import {
  BANNER_POSITIONS,
  type Banner,
  type BannerPosition,
} from '@/types/admin';
import styles from './banners.module.scss';

function sortBanners(list: Banner[]): Banner[] {
  return [...list].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
}

export default function BannersPage() {
  const toast = useToast();
  const canEdit = isSuperAdmin(getStoredUser());

  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [tab, setTab] = useState<BannerPosition>('home_slider');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | null>(null);

  const [deleting, setDeleting] = useState<Banner | null>(null);
  const [removing, setRemoving] = useState(false);

  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .get<Banner[]>('/admin/banners')
      .then((data) => {
        setItems(data);
        setLoadError(null);
      })
      .catch((err) => {
        setLoadError(
          err instanceof AdminApiError ? err.message : 'Không tải được banner.',
        );
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const countByPosition = useMemo(() => {
    const map = new Map<string, number>();
    items.forEach((b) => map.set(b.position, (map.get(b.position) ?? 0) + 1));
    return map;
  }, [items]);

  const visible = useMemo(
    () => sortBanners(items.filter((b) => b.position === tab)),
    [items, tab],
  );

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(b: Banner) {
    setEditing(b);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setRemoving(true);
    try {
      await adminApi.delete(`/admin/banners/${deleting.id}`);
      toast.success('Đã xóa banner.');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : 'Xóa banner thất bại.',
      );
    } finally {
      setRemoving(false);
    }
  }

  async function toggleActive(b: Banner) {
    setTogglingId(b.id);
    // Cập nhật lạc quan.
    setItems((prev) =>
      prev.map((x) => (x.id === b.id ? { ...x, isActive: !x.isActive } : x)),
    );
    try {
      await adminApi.put(`/admin/banners/${b.id}`, { isActive: !b.isActive });
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : 'Cập nhật thất bại.',
      );
      load(); // hoàn tác bằng dữ liệu thật
    } finally {
      setTogglingId(null);
    }
  }

  // ---- Kéo–thả sắp xếp trong cùng vị trí ----
  async function onDropRow(targetId: number) {
    const sourceId = dragId;
    setDragId(null);
    setOverId(null);
    if (sourceId === null || sourceId === targetId) return;

    const order = visible.map((b) => b.id);
    const from = order.indexOf(sourceId);
    const to = order.indexOf(targetId);
    if (from === -1 || to === -1) return;
    order.splice(from, 1);
    order.splice(to, 0, sourceId);

    const plan = order.map((id, index) => ({ id, sortOrder: index }));
    // Cập nhật lạc quan.
    const orderMap = new Map(plan.map((p) => [p.id, p.sortOrder]));
    setItems((prev) =>
      prev.map((b) =>
        orderMap.has(b.id) ? { ...b, sortOrder: orderMap.get(b.id)! } : b,
      ),
    );

    setSavingOrder(true);
    try {
      await adminApi.patch('/admin/banners/reorder', { items: plan });
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : 'Lưu thứ tự thất bại.',
      );
      load();
    } finally {
      setSavingOrder(false);
    }
  }

  if (loading) return <Spinner label="Đang tải banner..." />;
  if (loadError) return <div className={styles.error}>{loadError}</div>;

  const canReorder = canEdit;

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <div className={styles.tabs}>
          {BANNER_POSITIONS.map((p) => (
            <button
              key={p.value}
              className={[styles.tab, tab === p.value ? styles.tabActive : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => setTab(p.value)}
            >
              {p.label}
              <span className={styles.tabCount}>
                {countByPosition.get(p.value) ?? 0}
              </span>
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {savingOrder && <span className={styles.saving}>đang lưu thứ tự…</span>}
          {canEdit && (
            <Button icon={<Plus size={16} />} onClick={openCreate}>
              Thêm banner
            </Button>
          )}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className={styles.empty}>
          <p>Chưa có banner nào ở vị trí này.</p>
          {canEdit && (
            <Button icon={<Plus size={16} />} onClick={openCreate}>
              Thêm banner đầu tiên
            </Button>
          )}
        </div>
      ) : (
        <div className={styles.list}>
          {visible.map((banner) => (
            <div
              key={banner.id}
              className={[
                styles.card,
                overId === banner.id ? styles.dropTarget : '',
                dragId === banner.id ? styles.dragging : '',
              ]
                .filter(Boolean)
                .join(' ')}
              draggable={canReorder}
              onDragStart={() => canReorder && setDragId(banner.id)}
              onDragEnd={() => {
                setDragId(null);
                setOverId(null);
              }}
              onDragOver={(e) => {
                if (!canReorder || dragId === null) return;
                e.preventDefault();
                setOverId(banner.id);
              }}
              onDrop={(e) => {
                if (!canReorder) return;
                e.preventDefault();
                onDropRow(banner.id);
              }}
            >
              {canReorder && (
                <GripVertical size={18} className={styles.grip} aria-hidden />
              )}

              <div className={styles.thumb}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={banner.image} alt={banner.title ?? 'Banner'} />
              </div>

              <div className={styles.info}>
                <span className={styles.title}>
                  {banner.title || <span className={styles.muted}>(Không tiêu đề)</span>}
                </span>
                {banner.linkUrl ? (
                  <span className={styles.link}>
                    <ExternalLink size={13} />
                    {banner.linkUrl}
                  </span>
                ) : (
                  <span className={[styles.link, styles.muted].join(' ')}>
                    Không có liên kết
                  </span>
                )}
              </div>

              <div className={styles.meta}>
                {canEdit ? (
                  <Switch
                    checked={banner.isActive}
                    disabled={togglingId === banner.id}
                    onChange={() => toggleActive(banner)}
                  />
                ) : (
                  <span className={styles.muted}>
                    {banner.isActive ? 'Hiển thị' : 'Ẩn'}
                  </span>
                )}
              </div>

              {canEdit && (
                <div className={styles.actions}>
                  <button
                    className={styles.iconBtn}
                    onClick={() => openEdit(banner)}
                    title="Sửa"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    className={[styles.iconBtn, styles.danger].join(' ')}
                    onClick={() => setDeleting(banner)}
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

      <BannerFormModal
        open={formOpen}
        editing={editing}
        defaultPosition={tab}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />

      <Modal
        open={!!deleting}
        title="Xóa banner"
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
          Xóa banner <strong>{deleting?.title || 'này'}</strong>? Banner sẽ bị
          xóa hẳn và không lấy lại được.
        </p>
      </Modal>
    </div>
  );
}
