import { h } from 'preact';
import styles from './Button.module.css';

interface MenuButtonProps {
  onClick: () => void;
  ariaLabel?: string;
  variant?: 'primary' | 'secondary' | 'green' | 'red' | 'purple';
}

export const MenuButton = ({ onClick, ariaLabel = 'Open menu', variant = 'secondary' }: MenuButtonProps) => {
  const buttonClasses = `${styles.button} ${styles[variant]}`;
  return (
    <button class={buttonClasses} onClick={onClick} aria-label={ariaLabel} type="button">
      <svg fill="currentColor" viewBox="0 0 32 32" width="24" height="24" aria-hidden="true">
        <path d="M4 8h24v2h-24zM4 15h24v2h-24zM4 22h24v2h-24z"></path>
      </svg>
    </button>
  );
}; 