import { h } from 'preact';
import styles from './Button.module.css';

interface ButtonProps {
  onClick: () => void;
  children: preact.ComponentChildren;
  variant?: 'primary' | 'secondary' | 'green' | 'red' | 'purple';
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export const Button = ({
  onClick,
  children,
  variant = 'primary',
  disabled = false,
  fullWidth = false,
  className = '',
}: ButtonProps) => {
  const buttonClasses = [
    styles.button, 
    styles[variant],
    fullWidth ? styles.fullWidth : '',
    className
  ].join(' ').trim();

  return (
    <button class={buttonClasses} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}; 