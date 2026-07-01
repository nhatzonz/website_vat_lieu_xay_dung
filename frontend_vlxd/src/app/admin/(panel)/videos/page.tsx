'use client';

import { GripVertical, Pencil, Play, Plus, Trash2, Video as VideoIcon } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { VideoFormModal } from '@/components/admin/VideoFormModal';
import { Button } from '@/components/admin/ui/Button';
import { Switch } from '@/components/admin/ui/Field';
import { Modal } from '@/components/admin/ui/Modal';
import { Spinner } from '@/components/admin/ui/Spinner';
import { useToast } from '@/components/admin/ui/Toast';
import { adminApi, AdminApiError } from '@/lib/admin-api';
import { getStoredUser, isSuperAdmin } from '@/lib/auth-store';
import { getYoutubeId, youtubeThumb } from '@/lib/youtube';
import { videoPositionLabel, type Video } from '@/types/admin';
import styles from './videos.module.scss';

function sortItems(list: Video[]): Video[] {
  return [...list].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);
}

export default function VideosPage() {
  const toast = useToast();
  const canEdit = isSuperAdmin(getStoredUser());

  const [items, setItems] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Video | null>(null);

  const [deleting, setDeleting] = useState<Video | null>(null);
  const [removing, setRemoving] = useState(false);

  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [dragId, setDragId] = useState<number | null>(null);
  const [overId, setOverId] = useState<number | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    adminApi
      .get<Video[]>('/admin/videos')
      .then((data) => {
        setItems(sortItems(data));
        setLoadError(null);
      })
      .catch((err) => {
        setLoadError(
          err instanceof AdminApiError
            ? err.message
            : 'Không tải được danh sách video.',
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

  function openEdit(v: Video) {
    setEditing(v);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setRemoving(true);
    try {
      await adminApi.delete(`/admin/videos/${deleting.id}`);
      toast.success('Đã xóa video.');
      setDeleting(null);
      load();
    } catch (err) {
      toast.error(err instanceof AdminApiError ? err.message : 'Xóa thất bại.');
    } finally {
      setRemoving(false);
    }
  }

  async function toggleActive(v: Video) {
    setTogglingId(v.id);
    setItems((prev) =>
      prev.map((x) => (x.id === v.id ? { ...x, isActive: !x.isActive } : x)),
    );
    try {
      await adminApi.put(`/admin/videos/${v.id}`, { isActive: !v.isActive });
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

    const order = items.map((v) => v.id);
    const from = order.indexOf(sourceId);
    const to = order.indexOf(targetId);
    if (from === -1 || to === -1) return;
    order.splice(from, 1);
    order.splice(to, 0, sourceId);

    const plan = order.map((id, index) => ({ id, sortOrder: index }));
    const orderMap = new Map(plan.map((p) => [p.id, p.sortOrder]));
    setItems((prev) =>
      sortItems(
        prev.map((v) =>
          orderMap.has(v.id) ? { ...v, sortOrder: orderMap.get(v.id)! } : v,
        ),
      ),
    );

    setSavingOrder(true);
    try {
      await adminApi.patch('/admin/videos/reorder', { items: plan });
    } catch (err) {
      toast.error(
        err instanceof AdminApiError ? err.message : 'Lưu thứ tự thất bại.',
      );
      load();
    } finally {
      setSavingOrder(false);
    }
  }

  if (loading) return <Spinner label="Đang tải danh sách video..." />;
  if (loadError) return <div className={styles.error}>{loadError}</div>;

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <div className={styles.heading}>
          <VideoIcon size={20} />
          <span>Video Clips</span>
          <span className={styles.count}>{items.length}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {savingOrder && (
            <span className={styles.saving}>đang lưu thứ tự…</span>
          )}
          {canEdit && (
            <Button icon={<Plus size={16} />} onClick={openCreate}>
              Thêm video
            </Button>
          )}
        </div>
      </div>

      <p className={styles.note}>
        Video hiển thị theo vị trí đã chọn (trang chủ / cột bên / trang giới
        thiệu). Nhúng dạng YouTube, chỉ tải khi người xem bấm phát.
      </p>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <p>Chưa có video nào.</p>
          {canEdit && (
            <Button icon={<Plus size={16} />} onClick={openCreate}>
              Thêm video đầu tiên
            </Button>
          )}
        </div>
      ) : (
        <div className={styles.list}>
          {items.map((v) => {
            const ytId = getYoutubeId(v.youtubeUrl);
            return (
              <div
                key={v.id}
                className={[
                  styles.card,
                  overId === v.id ? styles.dropTarget : '',
                  dragId === v.id ? styles.dragging : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                draggable={canEdit}
                onDragStart={() => canEdit && setDragId(v.id)}
                onDragEnd={() => {
                  setDragId(null);
                  setOverId(null);
                }}
                onDragOver={(e) => {
                  if (!canEdit || dragId === null) return;
                  e.preventDefault();
                  setOverId(v.id);
                }}
                onDrop={(e) => {
                  if (!canEdit) return;
                  e.preventDefault();
                  onDropRow(v.id);
                }}
              >
                {canEdit && (
                  <GripVertical size={18} className={styles.grip} aria-hidden />
                )}

                <a
                  href={v.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.thumb}
                  title="Mở trên YouTube"
                >
                  {ytId ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={youtubeThumb(ytId)} alt={v.title ?? 'Video'} />
                  ) : (
                    <span className={styles.noThumb}>?</span>
                  )}
                  <span className={styles.playMini}>
                    <Play size={16} fill="currentColor" />
                  </span>
                </a>

                <div className={styles.info}>
                  <span className={styles.title}>
                    {v.title || <span className={styles.muted}>(Không tiêu đề)</span>}
                  </span>
                  <span className={styles.url}>{v.youtubeUrl}</span>
                  <span className={styles.tags}>
                    {v.position.map((p) => (
                      <span key={p} className={styles.tag}>
                        {videoPositionLabel(p)}
                      </span>
                    ))}
                  </span>
                </div>

                <div className={styles.meta}>
                  {canEdit ? (
                    <Switch
                      checked={v.isActive}
                      disabled={togglingId === v.id}
                      onChange={() => toggleActive(v)}
                    />
                  ) : (
                    <span className={styles.muted}>
                      {v.isActive ? 'Hiển thị' : 'Ẩn'}
                    </span>
                  )}
                </div>

                {canEdit && (
                  <div className={styles.actions}>
                    <button
                      className={styles.iconBtn}
                      onClick={() => openEdit(v)}
                      title="Sửa"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className={[styles.iconBtn, styles.danger].join(' ')}
                      onClick={() => setDeleting(v)}
                      title="Xóa"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <VideoFormModal
        open={formOpen}
        editing={editing}
        onClose={() => setFormOpen(false)}
        onSaved={load}
      />

      <Modal
        open={!!deleting}
        title="Xóa video"
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
          Xóa video <strong>{deleting?.title || 'này'}</strong>? Thao tác không
          thể hoàn tác.
        </p>
      </Modal>
    </div>
  );
}
