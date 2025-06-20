import { h } from 'preact';
import styles from './Checkbox.module.css';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const Checkbox = ({ label, checked, onChange, disabled = false }: CheckboxProps) => {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const containerClasses = [
    styles.checkboxContainer,
    disabled ? styles.disabled : '',
  ].join(' ').trim();

  const iconClass = checked ? 'hbi-check-square' : 'hbi-square';

  return (
    <div class={containerClasses} onClick={handleToggle} onKeyDown={(e) => e.key === 'Enter' && handleToggle()} tabIndex={disabled ? -1 : 0} role="checkbox" aria-checked={checked} aria-label={label}>
      <i class={`${iconClass} ${styles.icon}`} />
      <label class={styles.label}>{label}</label>
    </div>
  );
}; 