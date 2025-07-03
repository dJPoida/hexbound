import { ComponentChildren } from 'preact';
import { JSX } from 'preact/jsx-runtime';
import styles from './Input.module.css';

interface InputProps {
  /** The input value (controlled) */
  value?: string;
  /** Default value for uncontrolled inputs */
  defaultValue?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Input type */
  type?: 'text' | 'email' | 'password' | 'number' | 'search' | 'tel' | 'url';
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Whether the input is read-only */
  readOnly?: boolean;
  /** Whether the input is required */
  required?: boolean;
  /** Error state styling */
  hasError?: boolean;
  /** Input variant for different styling */
  variant?: 'default' | 'large';
  /** Additional CSS classes */
  className?: string;
  /** Accessible label for screen readers */
  ariaLabel?: string;
  /** ID for the input element */
  id?: string;
  /** Name attribute for form submission */
  name?: string;
  /** Autocomplete attribute */
  autoComplete?: string;
  /** Maximum length of input */
  maxLength?: number;
  /** Minimum length of input */
  minLength?: number;
  /** Pattern for input validation */
  pattern?: string;
  /** Change event handler */
  onChange?: (event: JSX.TargetedEvent<HTMLInputElement>) => void;
  /** Focus event handler */
  onFocus?: (event: JSX.TargetedEvent<HTMLInputElement>) => void;
  /** Blur event handler */
  onBlur?: (event: JSX.TargetedEvent<HTMLInputElement>) => void;
  /** Input event handler */
  onInput?: (event: JSX.TargetedEvent<HTMLInputElement>) => void;
  /** Key down event handler */
  onKeyDown?: (event: JSX.TargetedEvent<HTMLInputElement>) => void;
  /** Key up event handler */
  onKeyUp?: (event: JSX.TargetedEvent<HTMLInputElement>) => void;
}

export const Input = ({
  value,
  defaultValue,
  placeholder,
  type = 'text',
  disabled = false,
  readOnly = false,
  required = false,
  hasError = false,
  variant = 'default',
  className = '',
  ariaLabel,
  id,
  name,
  autoComplete,
  maxLength,
  minLength,
  pattern,
  onChange,
  onFocus,
  onBlur,
  onInput,
  onKeyDown,
  onKeyUp,
}: InputProps) => {
  const classes = [
    styles.input,
    styles[variant],
    hasError && styles.error,
    disabled && styles.disabled,
    readOnly && styles.readOnly,
    className
  ].filter(Boolean).join(' ');

  return (
    <input
      class={classes}
      value={value}
      defaultValue={defaultValue}
      placeholder={placeholder}
      type={type}
      disabled={disabled}
      readOnly={readOnly}
      required={required}
      aria-label={ariaLabel}
      id={id}
      name={name}
      autoComplete={autoComplete}
      maxLength={maxLength}
      minLength={minLength}
      pattern={pattern}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      onInput={onInput}
      onKeyDown={onKeyDown}
      onKeyUp={onKeyUp}
    />
  );
}; 