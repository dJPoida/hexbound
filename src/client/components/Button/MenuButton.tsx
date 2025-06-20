import { h } from 'preact';
import styles from './Button.module.css';

interface MenuButtonProps {
  onClick: () => void;
  ariaLabel?: string;
  variant?: 'primary' | 'secondary' | 'green' | 'red' | 'purple';
}

export const MenuButton = ({ onClick, ariaLabel = 'Open menu', variant = 'secondary' }: MenuButtonProps) => {
  const buttonClasses = `${styles.button} ${styles[variant]} ${styles.icon}`;
  return (
    <button class={buttonClasses} onClick={onClick} aria-label={ariaLabel} type="button">
      <span class="hbi-menu" aria-hidden="true"></span>
    </button>
  );
}; 