import { h } from 'preact';
import styles from './Button.module.css';

interface ButtonProps {
  onClick: () => void;
  children: preact.ComponentChildren;
  variant?: 'primary' | 'secondary' | 'green' | 'red' | 'purple';
  disabled?: boolean;
}

export const Button = ({
  onClick,
  children,
  variant = 'primary',
  disabled = false,
}: ButtonProps) => {
  const buttonClasses = `${styles.button} ${styles[variant]}`;

  return (
    <button class={buttonClasses} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}; 