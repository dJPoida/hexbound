import styles from './Typography.module.css';
import { cva, type VariantProps } from 'class-variance-authority';
import { JSX } from 'preact/jsx-runtime';

const textStyles = cva(styles.text, {
  variants: {
    variant: {
      body: styles.body,
      caption: styles.caption,
      label: styles.label,
    },
    color: {
      default: styles.defaultColor,
      subtle: styles.subtleColor,
    },
    font: {
      normal: styles.fontNormal,
      bold: styles.fontBold,
    },
  },
  defaultVariants: {
    variant: 'body',
    color: 'default',
    font: 'normal',
  },
});

type CvaProps = VariantProps<typeof textStyles>;

export type TextProps = CvaProps & {
  children: preact.ComponentChildren;
  as?: 'p' | 'span' | 'div' | 'label';
  class?: string;
  style?: preact.JSX.CSSProperties;
};

export const Text = ({
  as: Component = 'p',
  children,
  variant,
  color,
  font,
  class: className,
  style,
  ...props
}: TextProps) => {
  return (
    <Component class={textStyles({ variant, color, font, className })} style={style} {...props}>
      {children}
    </Component>
  );
}; 