'use client';

import { Check, ChevronDown, Search } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './SearchableSelect.module.scss';

export interface SelectOption {
  value: number;
  label: string;
}

interface Props {
  id?: string;
  label?: ReactNode;
  value: number | null;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  onChange: (value: number | null) => void;
}

/** Bỏ dấu tiếng Việt để tìm kiếm không phân biệt dấu. */
function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .toLowerCase();
}

/**
 * Dropdown có ô gõ tìm kiếm (combobox). Dùng cho PC/laptop/iPad — nơi gõ phím
 * thuận tiện. Mobile dùng <select> gốc (xem AddressFields).
 */
export function SearchableSelect({
  id,
  label,
  value,
  options,
  placeholder = '— Chọn —',
  disabled,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;
  const filtered = query.trim()
    ? options.filter((o) => norm(o.label).includes(norm(query)))
    : options;

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

  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      const t = setTimeout(() => inputRef.current?.focus(), 0);
      return () => clearTimeout(t);
    }
  }, [open]);

  function choose(o: SelectOption) {
    onChange(o.value);
    setOpen(false);
  }

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const o = filtered[active];
      if (o) choose(o);
    }
  }

  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={id}>
          {label}
        </label>
      )}
      <div className={styles.root} ref={rootRef}>
        <button
          type="button"
          id={id}
          className={[styles.trigger, !selected && styles.isPlaceholder]
            .filter(Boolean)
            .join(' ')}
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className={styles.triggerText}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown
            size={16}
            className={[styles.chev, open && styles.chevOpen]
              .filter(Boolean)
              .join(' ')}
          />
        </button>

        {open && (
          <div className={styles.panel}>
            <div className={styles.searchRow}>
              <Search size={15} className={styles.searchIcon} />
              <input
                ref={inputRef}
                className={styles.search}
                placeholder="Gõ để tìm..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                onKeyDown={onInputKey}
              />
            </div>
            <ul className={styles.list} role="listbox">
              {filtered.length === 0 && (
                <li className={styles.empty}>Không tìm thấy</li>
              )}
              {filtered.map((o, i) => (
                <li
                  key={o.value}
                  role="option"
                  aria-selected={o.value === value}
                  className={[
                    styles.option,
                    i === active && styles.optionActive,
                    o.value === value && styles.optionSelected,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(o)}
                >
                  <span className={styles.optionText}>{o.label}</span>
                  {o.value === value && <Check size={15} />}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
