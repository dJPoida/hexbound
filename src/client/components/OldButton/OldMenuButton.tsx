import { h } from 'preact';
import styles from './OldButton.module.css';

interface OldMenuButtonProps {
  onClick: () => void;
  ariaLabel?: string;
  variant?: 'primary' | 'secondary' | 'green' | 'red' | 'purple' | 'icon' | 'link';
}

export const OldMenuButton = ({ onClick, ariaLabel = 'Open menu', variant = 'secondary' }: OldMenuButtonProps) => {
  const buttonClasses = `${styles.button} ${styles[variant]} ${styles.icon}`;
  return (
    <button class={buttonClasses} onClick={onClick} aria-label={ariaLabel} type="button">
      <span class="hbi-menu" aria-hidden="true"></span>
    </button>
  );
}; 