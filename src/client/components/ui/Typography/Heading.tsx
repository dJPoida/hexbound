import { cva, type VariantProps } from 'class-variance-authority';
import { type ComponentChildren, createElement } from 'preact';

import styles from './Typography.module.css';

const headingStyles = cva(styles.heading, {
  variants: {
    variant: {
      pageTitle: styles.pageTitle,
      sectionHeader: styles.sectionHeader,
      subSectionHeader: styles.subSectionHeader,
    },
    color: {
      default: styles.defaultColor,
      subtle: styles.subtleColor,
      brand: styles.brandColor,
      success: styles.successColor,
      danger: styles.dangerColor,
    },
  },
  defaultVariants: {
    variant: 'sectionHeader',
    color: 'default',
  },
});

export type HeadingProps = VariantProps<typeof headingStyles> & {
  children: ComponentChildren;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  class?: string;
  style?: preact.JSX.CSSProperties;
};

export const Heading = ({
  level,
  children,
  variant,
  color,
  class: className,
  style,
  ...props
}: HeadingProps) => {
  const component = `h${level}`;
  const finalClassName = headingStyles({ variant, color, className });

  return createElement(component, { class: finalClassName, style, ...props }, children);
};
