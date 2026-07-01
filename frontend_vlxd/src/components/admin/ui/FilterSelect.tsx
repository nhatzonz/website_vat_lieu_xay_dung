'use client';

import { Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import styles from './FilterSelect.module.scss';

export interface FilterOption {
  value: string;
  label: string;
}

interface Props {
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  className?: string;
}

/**
 * Dropdown chọn 1 giá trị (chuỗi) có menu tùy biến — thay cho <select> gốc để
 * phần menu bung ra cũng đồng bộ giao diện. Dùng cho các bộ lọc admin.
 */
export function FilterSelect({
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value) ?? options[0] ?? null;

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function choose(v: string) {
    onChange(v);
    setOpen(false);
  }

  return (
    <div
      className={[styles.root, className].filter(Boolean).join(' ')}
      ref={rootRef}
    >
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className={styles.triggerText}>{selected?.label ?? '—'}</span>
        <ChevronDown
          size={16}
          className={[styles.chev, open && styles.chevOpen]
            .filter(Boolean)
            .join(' ')}
        />
      </button>

      {open && (
        <ul className={styles.panel} role="listbox">
          {options.map((o) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              className={[styles.option, o.value === value && styles.optionSelected]
                .filter(Boolean)
                .join(' ')}
              onClick={() => choose(o.value)}
            >
              <span className={styles.optionText}>{o.label}</span>
              {o.value === value && <Check size={15} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
