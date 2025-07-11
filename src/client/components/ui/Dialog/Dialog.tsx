import { ComponentChildren,h } from 'preact';

import { Button, ButtonVariant } from '../Button';
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
        <h2 className={styles.dialogTitle}>{title}</h2>
        {onClose && (
          <Button
            onClick={onClose}
            variant={ButtonVariant.ICON}
            ariaLabel="Close dialog"
          >
            &times;
          </Button>
        )}
      </div>
      <div className={styles.dialogContent}>{children}</div>
      {footer && <div className={styles.dialogFooter}>{footer}</div>}
    </div>
  );
} 