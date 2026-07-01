'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { getYoutubeId, youtubeThumb } from '@/lib/youtube';
import { adminApi, AdminApiError } from '@/lib/admin-api';
import {
  VIDEO_POSITIONS,
  type Video,
  type VideoInput,
  type VideoPosition,
} from '@/types/admin';
import { Button } from './ui/Button';
import { Switch, TextField } from './ui/Field';
import { Modal } from './ui/Modal';
import { useToast } from './ui/Toast';
import styles from './VideoFormModal.module.scss';

interface Props {
  open: boolean;
  /** null = tạo mới. */
  editing: Video | null;
  onClose: () => void;
  onSaved: () => void;
}

interface FormState {
  title: string;
  youtubeUrl: string;
  position: VideoPosition[];
  sortOrder: string;
  isActive: boolean;
}

function emptyState(): FormState {
  return {
    title: '',
    youtubeUrl: '',
    position: ['home'],
    sortOrder: '0',
    isActive: true,
  };
}

function fromVideo(v: Video): FormState {
  return {
    title: v.title ?? '',
    youtubeUrl: v.youtubeUrl,
    position: (v.position as VideoPosition[]).length
      ? (v.position as VideoPosition[])
      : ['home'],
    sortOrder: String(v.sortOrder),
    isActive: v.isActive,
  };
}

export function VideoFormModal({ open, editing, onClose, onSaved }: Props) {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(emptyState());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(editing ? fromVideo(editing) : emptyState());
    setError(null);
  }, [open, editing]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function togglePosition(value: VideoPosition, on: boolean) {
    setForm((prev) => {
      const next = new Set(prev.position);
      if (on) next.add(value);
      else next.delete(value);
      return { ...prev, position: [...next] };
    });
  }

  // Xem trước thumbnail theo link đang nhập.
  const previewId = useMemo(
    () => getYoutubeId(form.youtubeUrl),
    [form.youtubeUrl],
  );

  function close() {
    if (saving) return;
    onClose();
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!previewId) {
      setError('Link YouTube không hợp lệ. Dán link dạng youtube.com/watch?v=… hoặc youtu.be/…');
      return;
    }
    if (form.position.length === 0) {
      setError('Chọn ít nhất một vị trí hiển thị.');
      return;
    }
    const payload: VideoInput = {
      title: form.title.trim() || undefined,
      youtubeUrl: form.youtubeUrl.trim(),
      position: form.position,
      sortOrder: Number(form.sortOrder) || 0,
      isActive: form.isActive,
    };

    setSaving(true);
    try {
      if (editing) {
        await adminApi.put(`/admin/videos/${editing.id}`, payload);
        toast.success('Đã cập nhật video.');
      } else {
        await adminApi.post('/admin/videos', payload);
        toast.success('Đã thêm video.');
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof AdminApiError ? err.message : 'Lưu video thất bại.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      size="lg"
      title={editing ? 'Sửa video' : 'Thêm video'}
      onClose={close}
      busy={saving}
      footer={
        <>
          <Button variant="secondary" onClick={close} disabled={saving}>
            Hủy
          </Button>
          <Button type="submit" form="video-form" loading={saving}>
            {editing ? 'Lưu' : 'Thêm'}
          </Button>
        </>
      }
    >
      <form id="video-form" onSubmit={submit} className={styles.form}>
        {error && <div className={styles.alert}>{error}</div>}

        <TextField
          id="video-url"
          label="Link YouTube *"
          placeholder="https://www.youtube.com/watch?v=… hoặc https://youtu.be/…"
          hint="Hỗ trợ link watch, youtu.be, embed, shorts."
          value={form.youtubeUrl}
          onChange={(e) => set('youtubeUrl', e.target.value)}
        />

        {previewId && (
          <div className={styles.videoPreview}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={youtubeThumb(previewId)} alt="Xem trước video" />
          </div>
        )}

        <TextField
          id="video-title"
          label="Tiêu đề"
          hint="Tùy chọn — hiển thị dưới video & làm alt ảnh."
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
        />

        <div>
          <span className={styles.groupLabel}>Vị trí hiển thị *</span>
          <div className={styles.switchRow}>
            {VIDEO_POSITIONS.map((p) => (
              <Switch
                key={p.value}
                checked={form.position.includes(p.value)}
                onChange={(on) => togglePosition(p.value, on)}
                label={p.label}
              />
            ))}
          </div>
        </div>

        <div className={styles.row}>
          <TextField
            id="video-sort"
            label="Thứ tự sắp xếp"
            type="number"
            value={form.sortOrder}
            onChange={(e) => set('sortOrder', e.target.value)}
          />
          <div className={styles.switchCenter}>
            <Switch
              checked={form.isActive}
              onChange={(v) => set('isActive', v)}
              label="Hiển thị video"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
