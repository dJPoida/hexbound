import { ComponentChildren,h } from 'preact';

import { StyleColor } from '../../../types/styleColor.type';
import { Button, ButtonVariant } from '../Button';
import { Icon } from '../Icon';
import { Heading } from '../Typography/Heading';
import styles from './Dialog.module.css';

interface DialogProps {
  title: string;
  children: ComponentChildren;
  onClose?: () => void;
  footer?: ComponentChildren;
}

export function Dialog({ title, children, onClose, footer }: DialogProps) {
  return (
    <div className={styles.dialog}>
      <div className={styles.dialogHeader}>
        <Heading level={2} variant="sectionHeader" class={styles.dialogTitle}>{title}</Heading>
        {onClose && (
          <Button
            onClick={onClose}
            variant={ButtonVariant.ICON}
            color={StyleColor.DEFAULT}
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