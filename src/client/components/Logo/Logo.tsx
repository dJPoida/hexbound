import { h } from 'preact';
import styles from './Logo.module.css';

// The logo is expected to be in the public/images directory
const logoPath = '/images/hexbound-logo.png';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
}

export const Logo = ({ size = 'medium' }: LogoProps) => {
  return (
    <img
      src={logoPath}
      alt="Hexbound Logo"
      class={`${styles.logo} ${styles[size]}`}
    />
  );
}; 