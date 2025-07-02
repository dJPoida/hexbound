import { useRef, useEffect, useState } from 'preact/hooks';
import styles from './Button.module.css';

interface ButtonProps {
  onClick: (event: MouseEvent) => void;
  children: preact.ComponentChildren;
  variant?: 'primary' | 'secondary' | 'green' | 'red' | 'purple' | 'icon' | 'link';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  minWidth?: number;
  padding?: number;
  fullWidth?: boolean;
  ariaLabel?: string;
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
  fullWidth = false,
  ariaLabel,
}: ButtonProps) => {
  const textRef = useRef<HTMLSpanElement>(null);
  const [buttonWidth, setButtonWidth] = useState(minWidth);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (textRef.current) {
      if (variant === 'icon') {
        // Icon buttons are always square
        setButtonWidth(50);
        setIsReady(true);
      } else if (variant === 'link') {
        // Link buttons don't use SVG, just set ready
        setIsReady(true);
      } else {
        const textWidth = textRef.current.getBoundingClientRect().width;
        const calculatedWidth = Math.max(minWidth, textWidth + padding * 2);
        setButtonWidth(calculatedWidth);
        setIsReady(true);
      }
    }
  }, [children, minWidth, padding, variant]);

  const buttonClasses = [
    styles.button,
    styles[variant],
    disabled ? styles.disabled : '',
    !isReady ? styles.measuring : '',
    fullWidth ? styles.fullWidth : '',
    className
  ].filter(Boolean).join(' ');

  const svgHeight = 50;

  return (
    <button 
      class={buttonClasses} 
      onClick={onClick} 
      disabled={disabled} 
      type={type}
      aria-label={ariaLabel}
      style={{ 
        '--button-width': `${buttonWidth}px`,
        '--button-height': `${svgHeight}px`
      }}
    >
      {variant !== 'link' && (
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

          {/* Top edge - stretches with button width (from actual artwork) */}
          <path 
            d={`M 8,4 6,0 h ${buttonWidth - 12} l -2,4 z`} 
            className={styles.topEdge} 
          />

          {/* Bottom edge - stretches with button width (from actual artwork) */}
          <path 
            d={`M ${buttonWidth - 8},46 H 8 L 6.234375,50 H ${buttonWidth - 6} Z`} 
            className={styles.bottomEdge} 
          />

          {/* Accent layer - reflective effect, stretches like background (from actual artwork) */}
          <path 
            d={`M 6.334961,-0.167969 6,0 5.665039,0.167969 5.720699,0.279297 0.279293,5.720703 0.167965,5.665043 0,6 -0.167969,6.334961 3.625,8.231445 v 33.537109 l -3.792969,1.896485 0.335938,0.669922 0.118164,-0.05957 5.506836,5.299806 -0.12793,0.256835 0.669922,0.335939 1.896484,-3.79297 H ${buttonWidth - 8.23145} l 1.89649,3.79297 0.66992,-0.335939 -0.0557,-0.111328 5.44141,-5.441406 0.11133,0.05566 0.33594,-0.669922 -3.79297,-1.896485 V 8.231445 L ${buttonWidth + 0.16794},6.334961 ${buttonWidth - 0.168},5.665039 ${buttonWidth - 0.27933},5.720699 ${buttonWidth - 5.72074},0.279293 ${buttonWidth - 5.66504},0.167965 ${buttonWidth - 6.33496},-0.167973 ${buttonWidth - 8.23145},3.624996 H 8.231445 Z M 8.155273,4.375 H ${buttonWidth - 8.15528} L ${buttonWidth - 4.375},8.155273 V 41.844727 L ${buttonWidth - 8.15528},45.625 H 8.155273 L 4.375,41.844727 V 8.15625 Z`} 
            className={styles.accents} 
          />

          {/* Outline - charcoal stroke for grounding effect */}
          <path 
            d={`m 6,0 h ${buttonWidth - 12} l 6,6 v 38 l -6,6 H 6 L 0,44 V 6 Z`}
            className={styles.outline} 
          />
        </svg>
      )}
      
      <span ref={textRef} className={styles.buttonText}>
        {children}
      </span>
    </button>
  );
}; 