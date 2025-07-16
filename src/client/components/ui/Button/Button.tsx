import { useEffect, useRef, useState } from 'preact/hooks';

import { StyleColor } from '../../../types/ui';
import { Icon, IconName } from '../Icon';
import styles from './Button.module.css';

// Button-specific enums - exported for use by consumers
export enum ButtonType {
  BUTTON = 'button',
  SUBMIT = 'submit',
  RESET = 'reset',
}

export enum IconPosition {
  LEFT = 'left',
  RIGHT = 'right',
}

export interface ButtonProps {
  onClick: (event: MouseEvent) => void;
  children?: preact.ComponentChildren;
  color?: StyleColor;
  disabled?: boolean;
  className?: string;
  type?: ButtonType;
  minWidth?: number;
  padding?: number;
  fullWidth?: boolean;
  ariaLabel?: string;
  // Icon props
  icon?: IconName;
  iconPosition?: IconPosition;
}

export const Button = ({
  onClick,
  children,
  color = StyleColor.DEFAULT,
  disabled = false,
  className = '',
  type = ButtonType.BUTTON,
  minWidth = 100,
  padding = 25,
  fullWidth = false,
  ariaLabel,
  icon,
  iconPosition = IconPosition.LEFT,
}: ButtonProps) => {
  const textRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [svgWidth, setSvgWidth] = useState(minWidth);
  const [isReady, setIsReady] = useState(false);

  // Determine if this should be an icon-only button
  const isIconOnly = icon && !children;

  // Validate that we have either children or icon
  if (!children && !icon) {
    console.warn('Button component requires either children or icon prop');
  }

  useEffect(() => {
    if (isIconOnly) {
      // Icon buttons are always square
      setSvgWidth(50);
      setIsReady(true);
    } else if (textRef.current) {
      const textWidth = textRef.current.getBoundingClientRect().width;
      const calculatedWidth = Math.max(minWidth, textWidth + padding * 2);
      setSvgWidth(calculatedWidth);
      setIsReady(true);
    }
  }, [children, minWidth, padding, isIconOnly]);

  // For fullWidth buttons, track actual rendered size
  useEffect(() => {
    if (fullWidth && buttonRef.current && isReady) {
      const resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (entry) {
          setSvgWidth(entry.contentRect.width);
        }
      });
      
      resizeObserver.observe(buttonRef.current);
      
      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [fullWidth, isReady]);

  const buttonClasses = [
    styles.button,
    styles[isIconOnly ? 'icon' : 'standard'],
    styles[color],
    disabled ? styles.disabled : '',
    !isReady ? styles.measuring : '',
    fullWidth ? styles.fullWidth : '',
    className
  ].filter(Boolean).join(' ');

  const svgHeight = 50;

  // Render icon component if provided
  const renderIcon = () => {
    if (!icon) return null;
    
    // Determine icon color based on button color to match text color
    const iconColor = (color === StyleColor.WHITE || color === StyleColor.YELLOW) 
      ? StyleColor.GREY 
      : StyleColor.WHITE;
    
    return (
      <Icon 
        name={icon} 
        color={iconColor} 
        className={styles.buttonIcon}
      />
    );
  };

  // Render content with icon positioning
  const renderContent = () => {
    if (isIconOnly) {
      return renderIcon();
    }

    if (icon) {
      const iconElement = renderIcon();
      const textElement = (
        <span ref={textRef} className={styles.buttonText}>
          {children}
        </span>
      );

      if (iconPosition === IconPosition.RIGHT) {
        return [textElement, iconElement];
      } else {
        return [iconElement, textElement];
      }
    }

    return (
      <span ref={textRef} className={styles.buttonText}>
        {children}
      </span>
    );
  };

  return (
    <button 
      ref={buttonRef}
      class={buttonClasses} 
      onClick={onClick} 
      disabled={disabled} 
      type={type}
      aria-label={ariaLabel}
      style={{ 
        '--button-width': `${svgWidth}px`,
        '--button-height': `${svgHeight}px`
      }}
    >
      {(
        <svg 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
          className={styles.buttonSvg}
          width={fullWidth ? '100%' : svgWidth}
          height={svgHeight}
          preserveAspectRatio={fullWidth ? 'none' : 'xMidYMid meet'}
        >
          {/* Background fill - stretches with button width */}
          <path 
            d={`m 6,0 h ${svgWidth - 12} l 6,6 v 38 l -6,6 H 6.234375 L 0,44 V 6 Z`}
            className={styles.background} 
          />

          {/* Left edge - fixed position (from actual artwork) */}
          <path 
            d="M 4,42 V 8 L 0,6 v 38 z" 
            className={styles.leftEdge} 
          />

          {/* Right edge - dynamic position (from actual artwork) */}
          <path 
            d={`m ${svgWidth - 4},8 4,-2 v 38 l -4,-2 z`} 
            className={styles.rightEdge} 
          />

          {/* Top edge - stretches with button width (from actual artwork) */}
          <path 
            d={`M 8,4 6,0 h ${svgWidth - 12} l -2,4 z`} 
            className={styles.topEdge} 
          />

          {/* Bottom edge - stretches with button width (from actual artwork) */}
          <path 
            d={`M ${svgWidth - 8},46 H 8 L 6.234375,50 H ${svgWidth - 6} Z`} 
            className={styles.bottomEdge} 
          />

          {/* Accent layer - reflective effect, stretches like background (from actual artwork) */}
          <path 
            d={`M 6.334961,-0.167969 6,0 5.665039,0.167969 5.720699,0.279297 0.279293,5.720703 0.167965,5.665043 0,6 -0.167969,6.334961 3.625,8.231445 v 33.537109 l -3.792969,1.896485 0.335938,0.669922 0.118164,-0.05957 5.506836,5.299806 -0.12793,0.256835 0.669922,0.335939 1.896484,-3.79297 H ${svgWidth - 8.23145} l 1.89649,3.79297 0.66992,-0.335939 -0.0557,-0.111328 5.44141,-5.441406 0.11133,0.05566 0.33594,-0.669922 -3.79297,-1.896485 V 8.231445 L ${svgWidth + 0.16794},6.334961 ${svgWidth - 0.168},5.665039 ${svgWidth - 0.27933},5.720699 ${svgWidth - 5.72074},0.279293 ${svgWidth - 5.66504},0.167965 ${svgWidth - 6.33496},-0.167973 ${svgWidth - 8.23145},3.624996 H 8.231445 Z M 8.155273,4.375 H ${svgWidth - 8.15528} L ${svgWidth - 4.375},8.155273 V 41.844727 L ${svgWidth - 8.15528},45.625 H 8.155273 L 4.375,41.844727 V 8.15625 Z`} 
            className={styles.accents} 
          />

          {/* Outline - charcoal stroke for grounding effect */}
          <path 
            d={`m 6,0 h ${svgWidth - 12} l 6,6 v 38 l -6,6 H 6 L 0,44 V 6 Z`}
            className={styles.outline} 
          />
        </svg>
      )}
      
      {renderContent()}
    </button>
  );
}; 