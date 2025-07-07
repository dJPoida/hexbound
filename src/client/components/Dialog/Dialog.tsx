import { ComponentChildren,h } from 'preact';

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
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close dialog"
          >
            &times;
          </button>
        )}
      </div>
      <div className={styles.dialogContent}>{children}</div>
      {footer && <div className={styles.dialogFooter}>{footer}</div>}
    </div>
  );
} 