import { h } from 'preact';

import type { IconName } from '../../types/iconName.type';
import { IconSize } from '../../types/iconSize.type';
import { StyleColor } from '../../types/styleColor.type';
import styles from './Icon.module.css';

export interface IconProps {
  name: IconName;
  size?: IconSize;
  color?: StyleColor;
  className?: string;
}

export const Icon = ({ name, size = IconSize.MD, color = StyleColor.DEFAULT, className }: IconProps) => {
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