import styles from './OldButton.module.css';

interface OldButtonProps {
  onClick: (event: MouseEvent) => void;
  children: preact.ComponentChildren;
  variant?: 'primary' | 'secondary' | 'green' | 'red' | 'purple' | 'icon' | 'link';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
}

export const OldButton = ({
  onClick,
  children,
  variant = 'primary',
  disabled = false,
  className = '',
  type = 'button',
  fullWidth = false,
}: OldButtonProps) => {
  const buttonClasses = [
    styles.button, 
    styles[variant],
    fullWidth ? styles.fullWidth : '',
    className
  ].join(' ').trim();

  return (
    <button 
      class={buttonClasses} 
      onClick={onClick} 
      disabled={disabled} 
      type={type}
    >
      {children}
    </button>
  );
}; 