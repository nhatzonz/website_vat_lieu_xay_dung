'use client';

import { Play } from 'lucide-react';
import { useState } from 'react';
import { getYoutubeId, youtubeEmbed, youtubeThumb } from '@/lib/youtube';
import type { PublicVideo } from '@/types/catalog';
import styles from './VideoGrid.module.scss';

interface Item {
  key: number;
  id: string;
  title: string;
}

/**
 * Lưới video YouTube (facade: hiện thumbnail, bấm mới nạp iframe). Dùng cho
 * thân trang chủ & trang giới thiệu. `limit` giữ khối gọn, không chiếm quá nhiều
 * diện tích.
 */
export function VideoGrid({
  videos,
  limit = 3,
}: {
  videos: PublicVideo[];
  limit?: number;
}) {
  const items: Item[] = videos
    .map((v) => {
      const id = getYoutubeId(v.youtubeUrl);
      return id ? { key: v.id, id, title: v.title ?? 'Video' } : null;
    })
    .filter((x): x is Item => x !== null)
    .slice(0, limit);

  const [playing, setPlaying] = useState<number | null>(null);

  if (items.length === 0) return null;

  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <div key={item.key} className={styles.player}>
          {playing === item.key ? (
            <iframe
              className={styles.frame}
              src={youtubeEmbed(item.id, true)}
              title={item.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <button
              type="button"
              className={styles.facade}
              onClick={() => setPlaying(item.key)}
              aria-label={`Phát video: ${item.title}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={youtubeThumb(item.id)} alt={item.title} loading="lazy" />
              <span className={styles.play}>
                <Play size={20} fill="currentColor" />
              </span>
              {item.title && <span className={styles.caption}>{item.title}</span>}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
