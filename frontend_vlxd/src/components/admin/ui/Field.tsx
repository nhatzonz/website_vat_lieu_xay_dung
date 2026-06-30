'use client';

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import styles from './Field.module.scss';

interface LabelWrapProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
}

function FieldWrap({ label, hint, error, htmlFor, children }: LabelWrapProps) {
  return (
    <div className={styles.field}>
      {label && (
        <label className={styles.label} htmlFor={htmlFor}>
          {label}
        </label>
      )}
      {children}
      {hint && !error && <span className={styles.hint}>{hint}</span>}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
}

export function TextField({ label, hint, error, id, ...rest }: TextFieldProps) {
  return (
    <FieldWrap label={label} hint={hint} error={error} htmlFor={id}>
      <input
        id={id}
        className={[styles.input, error && styles.invalid].filter(Boolean).join(' ')}
        {...rest}
      />
    </FieldWrap>
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
}

export function TextArea({ label, hint, error, id, rows = 3, ...rest }: TextAreaProps) {
  return (
    <FieldWrap label={label} hint={hint} error={error} htmlFor={id}>
      <textarea
        id={id}
        rows={rows}
        className={[styles.input, styles.textarea, error && styles.invalid]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      />
    </FieldWrap>
  );
}

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}

export function SelectField({
  label,
  hint,
  error,
  id,
  children,
  ...rest
}: SelectFieldProps) {
  return (
    <FieldWrap label={label} hint={hint} error={error} htmlFor={id}>
      <select
        id={id}
        className={[styles.input, styles.select].filter(Boolean).join(' ')}
        {...rest}
      >
        {children}
      </select>
    </FieldWrap>
  );
}

interface SwitchProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: ReactNode;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <label className={[styles.switch, disabled && styles.switchDisabled].filter(Boolean).join(' ')}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className={styles.track} aria-hidden>
        <span className={styles.thumb} />
      </span>
      {label && <span className={styles.switchLabel}>{label}</span>}
    </label>
  );
}
