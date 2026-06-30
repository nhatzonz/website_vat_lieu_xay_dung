'use client';

import { Loader2 } from 'lucide-react';
import styles from './Spinner.module.scss';

export function Spinner({ label }: { label?: string }) {
  return (
    <div className={styles.wrap}>
      <Loader2 className={styles.spin} size={28} />
      {label && <span>{label}</span>}
    </div>
  );
}
