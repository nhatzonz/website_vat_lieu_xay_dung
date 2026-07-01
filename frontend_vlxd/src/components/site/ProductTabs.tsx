'use client';

import { useState } from 'react';
import type { PublicProductImage, PublicProductTestMedia } from '@/types/catalog';
import styles from './ProductTabs.module.scss';

function youtubeId(url: string): string | null {
  const m = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/,
  );
  return m ? m[1] : null;
}

type TabKey = 'desc' | 'images' | 'test';

export function ProductTabs({
  content,
  testResult,
  testMedia,
  images,
}: {
  content: string | null;
  testResult: string | null;
  testMedia: PublicProductTestMedia[];
  images: PublicProductImage[];
}) {
  const hasImages = images.length > 0;
  const hasTest = Boolean(testResult) || testMedia.length > 0;
  const [tab, setTab] = useState<TabKey>('desc');

  const tabs: { key: TabKey; label: string; show: boolean }[] = [
    { key: 'desc', label: 'Mô tả', show: true },
    { key: 'images', label: 'Hình ảnh', show: hasImages },
    // Luôn hiện tab; nếu chưa có nội dung, click vào panel để trống.
    { key: 'test', label: 'Kết quả thử nghiệm', show: true },
  ];

  return (
    <div className={styles.wrap}>
      <div className={styles.tabs} role="tablist">
        {tabs
          .filter((t) => t.show)
          .map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              className={[styles.tab, tab === t.key ? styles.active : ''].join(' ')}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
      </div>

      <div className={styles.panel}>
        {tab === 'desc' &&
          (content ? (
            <div
              className={styles.prose}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <p className={styles.muted}>Chưa có mô tả chi tiết.</p>
          ))}

        {tab === 'images' && (
          <div className={styles.imageGrid}>
            {images.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={img.id}
                src={img.imagePath}
                alt={img.altText || 'Ảnh sản phẩm'}
                loading="lazy"
              />
            ))}
          </div>
        )}

        {tab === 'test' && hasTest && (
          <div className={styles.prose}>
            {testResult && (
              // eslint-disable-next-line react/no-danger
              <div dangerouslySetInnerHTML={{ __html: testResult }} />
            )}
            {testMedia.length > 0 && (
              <div className={styles.media}>
                {testMedia.map((m) => {
                  if (m.mediaType === 'youtube') {
                    const id = youtubeId(m.mediaValue);
                    if (!id) return null;
                    return (
                      <figure key={m.id} className={styles.mediaItem}>
                        <div className={styles.videoBox}>
                          <iframe
                            src={`https://www.youtube-nocookie.com/embed/${id}`}
                            title={m.caption || 'Video'}
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                        {m.caption && <figcaption>{m.caption}</figcaption>}
                      </figure>
                    );
                  }
                  return (
                    <figure key={m.id} className={styles.mediaItem}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.mediaValue} alt={m.caption || 'Ảnh thử nghiệm'} loading="lazy" />
                      {m.caption && <figcaption>{m.caption}</figcaption>}
                    </figure>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
