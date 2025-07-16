import { ComponentChildren,h } from 'preact';

import { StyleColor } from '../../../types/ui';
import { Button, ButtonVariant } from '../Button';
import { Icon } from '../Icon';
import { Heading } from '../Typography/Heading';
import styles from './Dialog.module.css';

export enum DialogSize {
  STANDARD = 'standard',
  LARGE = 'large',
  FULLSCREEN = 'fullscreen'
}

interface DialogProps {
  title: string;
  children: ComponentChildren;
  onClose?: () => void;
  footer?: ComponentChildren;
  size?: DialogSize;
}

export function Dialog({ title, children, onClose, footer, size = DialogSize.STANDARD }: DialogProps) {
  const sizeClass = size === DialogSize.STANDARD ? styles.dialog : `${styles.dialog} ${styles[size]}`;
  
  return (
    <div className={sizeClass}>
      <div className={styles.dialogHeader}>
        <Heading level={2} variant="sectionHeader" class={styles.dialogTitle}>{title}</Heading>
        {onClose && (
          <Button
            onClick={onClose}
            variant={ButtonVariant.ICON}
            color={StyleColor.RED}
            ariaLabel="Close dialog"
          >
            <Icon name="cross" color={StyleColor.WHITE} />
          </Button>
        )}
      </div>
      <div className={styles.dialogContent}>{children}</div>
      {footer && <div className={styles.dialogFooter}>{footer}</div>}
    </div>
  );
} 