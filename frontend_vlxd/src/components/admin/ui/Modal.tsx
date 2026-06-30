'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import styles from './Modal.module.scss';

interface ModalProps {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** Khóa đóng (vd đang submit). */
  busy?: boolean;
  size?: 'md' | 'lg';
}

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  busy = false,
  size = 'md',
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, busy, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onMouseDown={() => !busy && onClose()}>
      <div
        className={[styles.modal, styles[size]].join(' ')}
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            disabled={busy}
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </div>
        <div className={styles.body}>{children}</div>
        {footer && <div className={styles.footer}>{footer}</div>}
      </div>
    </div>
  );
}
