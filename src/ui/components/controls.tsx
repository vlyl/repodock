import { useEffect, useId, useState } from 'react';
import type { ReactNode } from 'react';

export interface IconButtonProps {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  variant?: 'default' | 'danger';
  className?: string;
}

/** A square, icon-only button with an accessible label and tooltip. */
export function IconButton({
  icon,
  label,
  onClick,
  active = false,
  disabled = false,
  variant = 'default',
  className,
}: IconButtonProps): ReactNode {
  const classes = ['rd-icon-btn'];
  if (active) classes.push('is-active');
  if (variant === 'danger') classes.push('is-danger');
  if (className) classes.push(className);
  return (
    <button
      type="button"
      className={classes.join(' ')}
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  id?: string;
  disabled?: boolean;
}

/** An accessible on/off switch. */
export function Toggle({ checked, onChange, label, id, disabled = false }: ToggleProps): ReactNode {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      className="rd-toggle"
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span className="rd-toggle__track" aria-hidden="true">
        <span className="rd-toggle__thumb" />
      </span>
    </button>
  );
}

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

export interface SegmentedControlProps<T extends string> {
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  iconsOnly?: boolean;
}

/**
 * A radio-group segmented control. Built on real radio inputs so arrow-key
 * navigation and screen-reader semantics come for free.
 */
export function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  iconsOnly = false,
}: SegmentedControlProps<T>): ReactNode {
  const name = useId();
  return (
    <div role="radiogroup" aria-label={ariaLabel} className="rd-segmented">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <label
            key={option.value}
            className={`rd-segmented__item${selected ? ' is-selected' : ''}`}
            title={iconsOnly ? option.label : undefined}
          >
            <input
              type="radio"
              name={name}
              checked={selected}
              onChange={() => onChange(option.value)}
              aria-label={iconsOnly ? option.label : undefined}
            />
            {option.icon}
            {!iconsOnly && <span>{option.label}</span>}
          </label>
        );
      })}
    </div>
  );
}

export interface SelectFieldProps<T extends string> {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  id?: string;
  ariaLabel?: string;
}

/** A styled native select. */
export function SelectField<T extends string>({
  value,
  options,
  onChange,
  id,
  ariaLabel,
}: SelectFieldProps<T>): ReactNode {
  return (
    <select
      id={id}
      className="rd-select"
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value as T)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export interface NumberFieldProps {
  value: number;
  min: number;
  max: number;
  onCommit: (value: number) => void;
  id?: string;
  ariaLabel?: string;
}

/** A bounded integer input that clamps and commits on blur or Enter. */
export function NumberField({
  value,
  min,
  max,
  onCommit,
  id,
  ariaLabel,
}: NumberFieldProps): ReactNode {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const commit = (): void => {
    const parsed = Number(draft);
    if (Number.isFinite(parsed)) {
      const clamped = Math.min(max, Math.max(min, Math.round(parsed)));
      onCommit(clamped);
      setDraft(String(clamped));
    } else {
      setDraft(String(value));
    }
  };

  return (
    <input
      type="number"
      id={id}
      aria-label={ariaLabel}
      className="rd-number"
      min={min}
      max={max}
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Enter') event.currentTarget.blur();
      }}
    />
  );
}

export interface FieldProps {
  label: string;
  description?: string;
  control: ReactNode;
  htmlFor?: string;
}

/** A labeled settings row with an optional description and a trailing control. */
export function Field({ label, description, control, htmlFor }: FieldProps): ReactNode {
  const generatedId = useId();
  const id = htmlFor ?? generatedId;
  return (
    <div className="rd-field">
      <div className="rd-field__text">
        <label className="rd-field__label" htmlFor={id}>
          {label}
        </label>
        {description !== undefined && <p className="rd-field__desc">{description}</p>}
      </div>
      <div className="rd-field__control">{control}</div>
    </div>
  );
}
