'use client';

import { ChevronsRight, Play } from 'lucide-react';
import { useState } from 'react';
import { getYoutubeId, youtubeEmbed, youtubeThumb } from '@/lib/youtube';
import type { PublicVideo } from '@/types/catalog';
import styles from './VideoBox.module.scss';

interface Item {
  key: number;
  id: string;
  title: string;
}

/**
 * Khối "Video Clips" ở sidebar: header navy + dải chevron, danh sách video
 * YouTube dạng facade (hiện thumbnail, bấm mới nạp iframe → nhẹ & nhanh).
 */
export function VideoBox({ videos }: { videos: PublicVideo[] }) {
  // Chỉ giữ video có link YouTube hợp lệ.
  const items: Item[] = videos
    .map((v) => {
      const id = getYoutubeId(v.youtubeUrl);
      return id ? { key: v.id, id, title: v.title ?? 'Video' } : null;
    })
    .filter((x): x is Item => x !== null);

  const [playing, setPlaying] = useState<number | null>(null);

  if (items.length === 0) return null;

  return (
    <aside className={styles.box}>
      <div className={styles.head}>
        <span className={styles.ribbon} aria-hidden>
          <ChevronsRight size={20} strokeWidth={2.5} />
        </span>
        Video Clips
      </div>

      <div className={styles.body}>
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
                  <Play size={22} fill="currentColor" />
                </span>
                {item.title && <span className={styles.caption}>{item.title}</span>}
              </button>
            )}
          </div>
        ))}
      </div>
    </aside>
  );
}
