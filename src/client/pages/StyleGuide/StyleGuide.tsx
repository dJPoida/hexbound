import { OldButton } from '../../components/OldButton/OldButton';
import { Logo } from '../../components/Logo/Logo';
import { Heading } from '../../components/Typography/Heading';
import { Text } from '../../components/Typography/Text';
import styles from './StyleGuide.module.css';

const ColorSwatch = ({ name, colorName, hex, role, variants }: { name: string; colorName: string; hex: string; role?: string; variants: { dark: string; light: string; highlight: string; }}) => (
  <div class={styles.colorSwatch}>
    <div class={styles.colorBox}>
      <div class={styles.mainColor} style={{ backgroundColor: `var(--color-${colorName})` }}></div>
      <div class={styles.variantContainer}>
        <div class={styles.variantBox} style={{ backgroundColor: `var(--color-${colorName}-dark)` }}></div>
        <div class={styles.variantBox} style={{ backgroundColor: `var(--color-${colorName}-light)` }}></div>
        <div class={styles.variantBox} style={{ backgroundColor: `var(--color-${colorName}-highlight)` }}></div>
      </div>
    </div>
    <div class={styles.colorInfo}>
      <Text font="bold">{name}</Text>
      {role && <Text variant="label">{role}</Text>}
      <Text variant="caption" color="subtle" as="span" class={styles.hexValue}>{hex}</Text>
      <Text variant="caption" color="subtle" as="span" class={styles.hexValue}>({variants.dark}, {variants.light}, {variants.highlight})</Text>
    </div>
  </div>
);

export const StyleGuide = () => {
  return (
    <div class={styles.container}>
      <Logo />
      <Heading level={1} variant="pageTitle">Style Guide</Heading>
      <Text color="subtle">
        This page is a visual inventory of all UI components and design tokens.
      </Text>

      <section class={styles.section}>
        <Heading level={2} variant="sectionHeader">Color Palette</Heading>
        
        <section class={styles.subSection}>
          <Heading level={3} variant="subSectionHeader">General Colors</Heading>
          <Text color="subtle">Used for backgrounds, text, and basic UI elements.</Text>
          <div class={styles.grid}>
            <ColorSwatch name="Canvas White" colorName="canvas-white" hex="#fefaeF" variants={{ dark: '#d5d1c9', light: '#ffffff', highlight: '#ffffff' }} />
            <ColorSwatch name="Charcoal" colorName="charcoal" hex="#2d2d2d" variants={{ dark: '#1e1e1e', light: '#4c4c4c', highlight: '#6b6b6b' }} />
            <ColorSwatch name="Stone Grey" colorName="stone-grey" hex="#7a7a7a" variants={{ dark: '#5c5c5c', light: '#999999', highlight: '#b8b8b8' }} />
            <ColorSwatch name="Glow Yellow" colorName="glow-yellow" hex="#ffef9f" variants={{ dark: '#dccb86', light: '#fff5bc', highlight: '#fffbe0' }} />
          </div>
        </section>

        <section class={styles.subSection}>
          <Heading level={3} variant="subSectionHeader">Accent & Feature Colors</Heading>
          <Text color="subtle">Used to highlight important actions and features.</Text>
          <div class={styles.grid}>
            <ColorSwatch name="Hex Amber" colorName="hex-amber" hex="#f48550" role="Primary" variants={{ dark: '#d46c3b', light: '#f7a075', highlight: '#f9bba0' }} />
            <ColorSwatch name="Pastel Sky" colorName="pastel-sky" hex="#a9d7e8" role="Secondary" variants={{ dark: '#8cb6c6', light: '#c2e2ee', highlight: '#dcf0f8' }} />
          </div>
        </section>

        <section class={styles.subSection}>
          <Heading level={3} variant="subSectionHeader">Ancillary Colors</Heading>
          <Text color="subtle">Used for status indicators like success, error, or informational messages.</Text>
          <div class={styles.grid}>
            <ColorSwatch name="Moss Green" colorName="moss-green" hex="#87a06f" variants={{ dark: '#6e8558', light: '#a0b88b', highlight: '#bad0a8' }} />
            <ColorSwatch name="Clay Red" colorName="clay-red" hex="#d47a6a" variants={{ dark: '#b56254', light: '#e1988b', highlight: '#edb6ac' }} />
            <ColorSwatch name="Deep Purple" colorName="deep-purple" hex="#7e718c" variants={{ dark: '#645a70', light: '#988fa6', highlight: '#b3a9be' }} />
            <ColorSwatch name="Slate Blue" colorName="slate-blue" hex="#5B6B7A" variants={{ dark: '#465460', light: '#7a8a99', highlight: '#9caab8' }} />
          </div>
        </section>
      </section>

      <section class={styles.section}>
        <Heading level={2} variant="sectionHeader">Typography</Heading>
        <Text color="subtle">
          Here are the reusable typography components. Use <code>{'<Heading>'}</code> for all titles and 
          <code>{'<Text>'}</code> for all other copy.
        </Text>

        <section class={styles.subSection}>
          <div class={styles.typographySample}>
            <Heading level={1} variant="pageTitle">Page Title</Heading>
            <Heading level={2} variant="sectionHeader">Section Header</Heading>
            <Heading level={3} variant="subSectionHeader" color="subtle">Sub-Section Header</Heading>
          </div>
        </section>

        <section class={styles.subSection}>
          <div class={styles.typographySample}>
            <Text>This is default body text.</Text>
            <Text font="bold">This is bold body text.</Text>
            <Text variant="label">This is a label.</Text>
            <Text variant="caption" color="subtle">This is a caption (or subtext).</Text>
          </div>
        </section>

        <section class={styles.subSection}>
          <Heading level={3} variant="subSectionHeader" color="subtle">Future Components (TODO)</Heading>
          <Text color="subtle">
            Placeholders for components we may need later.
          </Text>
          {/* TODO: Implement Quote and other typography components */}
        </section>

      </section>

      <section class={styles.section}>
        <Heading level={2} variant="sectionHeader">Old Buttons</Heading>
        <div class={styles.grid}>
          <OldButton onClick={() => {}} variant="primary">Primary</OldButton>
          <OldButton onClick={() => {}} variant="secondary">Secondary</OldButton>
          <OldButton onClick={() => {}} variant="green">Green</OldButton>
          <OldButton onClick={() => {}} variant="red">Red</OldButton>
          <OldButton onClick={() => {}} variant="purple">Purple</OldButton>
          <OldButton onClick={() => {}} variant="primary" disabled>Disabled</OldButton>
        </div>
      </section>

      <section class={styles.section}>
        <Heading level={2} variant="sectionHeader">Icons</Heading>
        <Text>This is the Hexbound Icon font. Use it for UI elements.</Text>
      </section>
    </div>
  );
}; 