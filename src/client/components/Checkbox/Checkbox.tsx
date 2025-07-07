import { JSX } from 'preact/jsx-runtime';

import styles from './Checkbox.module.css';

interface CheckboxProps {
  /** The label text for the checkbox */
  label: string;
  /** Whether the checkbox is checked */
  checked: boolean;
  /** Callback when checkbox state changes */
  onChange: (checked: boolean) => void;
  /** Whether the checkbox is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** ID for the checkbox element */
  id?: string;
  /** Name attribute for form submission */
  name?: string;
  /** Value attribute for form submission */
  value?: string;
  /** Whether the checkbox is required */
  required?: boolean;
  /** Accessible label for screen readers (overrides label prop) */
  ariaLabel?: string;
  /** Additional aria-describedby for accessibility */
  ariaDescribedBy?: string;
  /** Size variant */
  size?: 'default' | 'large';
}

export const Checkbox = ({ 
  label, 
  checked, 
  onChange, 
  disabled = false,
  className = '',
  id,
  name,
  value,
  required = false,
  ariaLabel,
  ariaDescribedBy,
  size = 'default'
}: CheckboxProps) => {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: JSX.TargetedKeyboardEvent<HTMLDivElement>) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      handleToggle();
    }
  };

  const containerClasses = [
    styles.checkboxContainer,
    styles[size],
    disabled && styles.disabled,
    checked && styles.checked,
    className
  ].filter(Boolean).join(' ');

  const iconClass = checked ? 'hbi-check-square' : 'hbi-square';

  return (
    <div 
      class={containerClasses}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel || label}
      aria-describedby={ariaDescribedBy}
      aria-required={required}
      data-testid={id}
    >
      <span class={`${iconClass} ${styles.icon}`} aria-hidden="true" />
      <label class={styles.label} htmlFor={id}>
        {label}
      </label>
      {/* Hidden native checkbox for form compatibility */}
      <input
        type="checkbox"
        id={id}
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        required={required}
        onChange={() => {}} // Controlled by parent div
        class={styles.hiddenInput}
        tabIndex={-1}
      />
    </div>
  );
}; 