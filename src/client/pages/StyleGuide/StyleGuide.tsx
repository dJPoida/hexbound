import { h } from 'preact';
import { Button } from '../../components/Button/Button';
import { Logo } from '../../components/Logo/Logo';
import styles from './StyleGuide.module.css';

const ColorSwatch = ({ name, hex }: { name: string; hex: string }) => (
  <div class={styles.colorSwatch}>
    <div class={styles.colorBox} style={{ backgroundColor: hex }} />
    <div class={styles.colorInfo}>
      <strong>{name}</strong>
      <span>{hex}</span>
    </div>
  </div>
);

export const StyleGuide = () => {
  return (
    <div class={styles.container}>
      <h1>Style Guide</h1>
      <p>This page is a visual inventory of all UI components and design tokens.</p>

      <section class={styles.section}>
        <h2>Color Palette</h2>
        <div class={styles.grid}>
          <ColorSwatch name="Canvas White" hex="#FEFAEF" />
          <ColorSwatch name="Charcoal" hex="#2d2d2d" />
          <ColorSwatch name="Stone Grey" hex="#7a7a7a" />
          <ColorSwatch name="Hex Amber" hex="#f48550" />
          <ColorSwatch name="Glow Yellow" hex="#ffef9f" />
          <ColorSwatch name="Pastel Sky" hex="#a9d7e8" />
          <ColorSwatch name="Moss Green" hex="#87a06f" />
          <ColorSwatch name="Clay Red" hex="#d47a6a" />
          <ColorSwatch name="Deep Purple" hex="#5d4f6b" />
        </div>
      </section>

      <section class={styles.section}>
        <h2>Typography</h2>
        <div class={styles.typographySample}>
          <h1>Heading 1</h1>
          <p>This is body text. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
          <span class={styles.caption}>This is a caption.</span>
        </div>
      </section>

      <section class={styles.section}>
        <h2>Buttons</h2>
        <div class={styles.grid}>
          <Button onClick={() => {}} variant="primary">Primary</Button>
          <Button onClick={() => {}} variant="secondary">Secondary</Button>
          <Button onClick={() => {}} variant="green">Green</Button>
          <Button onClick={() => {}} variant="red">Red</Button>
          <Button onClick={() => {}} variant="purple">Purple</Button>
          <Button onClick={() => {}} variant="primary" disabled>Disabled</Button>
        </div>
      </section>

      <section class={styles.section}>
        <h2>Logo</h2>
        <div class={styles.grid}>
          <Logo size="small" />
          <Logo size="medium" />
          <Logo size="large" />
        </div>
      </section>
    </div>
  );
}; 