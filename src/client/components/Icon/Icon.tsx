import { h } from 'preact';
import styles from './Icon.module.css';

export interface IconProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'default' | 'subtle' | 'light' | 'brand' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const Icon = ({ name, size = 'md', color = 'default', className }: IconProps) => {
  const iconClasses = [
    'hbi',
    `hbi-${name}`,
    styles.icon,
    styles[`size-${size}`],
    styles[`color-${color}`],
    className
  ].filter(Boolean).join(' ');

  return <i class={iconClasses} />;
}; 