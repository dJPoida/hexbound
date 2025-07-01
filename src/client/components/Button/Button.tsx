import styles from './Button.module.css';

interface ButtonProps {
  onClick: (event: MouseEvent) => void;
  children: preact.ComponentChildren;
  variant?: 'primary' | 'secondary' | 'green' | 'red' | 'purple';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const Button = ({
  onClick,
  children,
  variant = 'primary',
  disabled = false,
  className = '',
  type = 'button',
}: ButtonProps) => {
  const buttonClasses = [
    styles.button, 
    styles[variant],
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