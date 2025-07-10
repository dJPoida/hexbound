import { h } from 'preact';

import { StyleColor } from '../../../types/styleColor.type';
import styles from './Icon.module.css';

// Icon-specific types and constants - exported for use by consumers
export const ICON_NAMES = [
  'menu', 'home', 'save', 'trash', 'settings', 'sliders', 'exit', 'hexagon', 'heart', 'star',
  'alert-triangle', 'help-circle', 'info', 'error',
  'arrow-up', 'arrow-up-right', 'arrow-right', 'arrow-down-right', 'arrow-down', 'arrow-down-left', 'arrow-left', 'arrow-up-left',
  'chevron-up', 'chevron-right', 'chevron-down', 'chevron-left',
  'chevrons-up', 'chevrons-right', 'chevrons-down', 'chevrons-left',
  'check', 'cross', 'circle', 'check-circle', 'cross-circle',
  'square', 'check-square', 'cross-square', 'plus-square', 'minus-square',
  'search', 'zoom-in', 'zoom-out',
  'toggle-left', 'toggle-right',
  'more-vertical', 'more-horizontal',
  'frown', 'meh', 'smile',
  'user', 'user-check', 'user-cross', 'user-plus', 'user-minus', 'users',
  'lock', 'unlock',
  'loader', 'play',
  'wifi', 'wifi-off',
  'life-buoy', 'award',
  'bell', 'bell-off',
  'terminal', 'layers', 'map',
  'dollar-sign', 'edit', 'share', 'link', 'message',
  'eye', 'eye-off',
  'clock',
  'upload', 'download',
  'shuffle',
  'maximize', 'minimize',
  'move',
  'rotate-ccw', 'rotate-cw',
  'thumbs-up', 'thumbs-down',
  'sound-on', 'sound-off'
] as const;

export type IconName = typeof ICON_NAMES[number];

export enum IconSize {
  XS = 'xs',
  SM = 'sm',
  MD = 'md',
  LG = 'lg',
  XL = 'xl'
}

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