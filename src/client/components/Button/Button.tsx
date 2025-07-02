import { useRef, useEffect, useState } from 'preact/hooks';
import styles from './Button.module.css';

interface ButtonProps {
  onClick: (event: MouseEvent) => void;
  children: preact.ComponentChildren;
  variant?: 'primary' | 'secondary' | 'green' | 'red' | 'purple';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  minWidth?: number;
  padding?: number;
}

export const Button = ({
  onClick,
  children,
  variant = 'primary',
  disabled = false,
  className = '',
  type = 'button',
  minWidth = 100,
  padding = 25,
}: ButtonProps) => {
  const textRef = useRef<HTMLSpanElement>(null);
  const [buttonWidth, setButtonWidth] = useState(minWidth);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (textRef.current) {
      const textWidth = textRef.current.getBoundingClientRect().width;
      const calculatedWidth = Math.max(minWidth, textWidth + padding * 2);
      setButtonWidth(calculatedWidth);
      setIsReady(true);
    }
  }, [children, minWidth, padding]);

  const buttonClasses = [
    styles.button,
    styles[variant],
    disabled ? styles.disabled : '',
    !isReady ? styles.measuring : '',
    className
  ].filter(Boolean).join(' ');

  const svgHeight = 50;

  return (
    <button 
      class={buttonClasses} 
      onClick={onClick} 
      disabled={disabled} 
      type={type}
      style={{ 
        '--button-width': `${buttonWidth}px`,
        '--button-height': `${svgHeight}px`
      }}
    >
      <svg 
        viewBox={`0 0 ${buttonWidth} ${svgHeight}`} 
        className={styles.buttonSvg}
        width={buttonWidth}
        height={svgHeight}
      >
        {/* Background fill - stretches with button width */}
        <path 
          d={`m 6,0 h ${buttonWidth - 12} l 6,6 v 38 l -6,6 H 6.234375 L 0,44 V 6 Z`}
          className={styles.background} 
        />

        {/* Left edge - fixed position (from actual artwork) */}
        <path 
          d="M 4,42 V 8 L 0,6 v 38 z" 
          className={styles.leftEdge} 
        />

        {/* Right edge - dynamic position (from actual artwork) */}
        <path 
          d={`m ${buttonWidth - 4},8 4,-2 v 38 l -4,-2 z`} 
          className={styles.rightEdge} 
        />
      </svg>
      
      <span ref={textRef} className={styles.buttonText}>
        {children}
      </span>
    </button>
  );
}; 