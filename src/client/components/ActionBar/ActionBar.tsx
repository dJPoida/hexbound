import { ComponentChildren,h } from 'preact';

import styles from './ActionBar.module.css';

interface ActionBarProps {
  children: ComponentChildren;
}

export function ActionBar({ children }: ActionBarProps) {
  return (
    <div className={styles.actionBar}>
      <div className={styles.actionBarContent}>
        {children}
      </div>
    </div>
  );
} 