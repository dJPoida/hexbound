import { h } from 'preact';
import styles from './Icon.module.css';
import { IconSize } from '../../types/iconSize.type';
import type { IconName } from '../../types/iconName.type';

export interface IconProps {
  name: IconName;
  size?: IconSize;
  color?: 'default' | 'subtle' | 'light' | 'brand' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const Icon = ({ name, size = IconSize.MD, color = 'default', className }: IconProps) => {
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