import styles from './Logo.module.css';

export function Logo() {
  return (
    <div className={styles.logoContainer}>
      <img src='/images/hexbound-logo.png' alt='Hexbound Logo' className={styles.logo} />
    </div>
  );
}
