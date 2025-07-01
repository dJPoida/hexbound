import { Button } from '../../components/Button/Button';
import { Logo } from '../../components/Logo/Logo';
import { Heading } from '../../components/Typography/Heading';
import { Text } from '../../components/Typography/Text';
import styles from './StyleGuide.module.css';

const ColorSwatch = ({ name, colorName }: { name: string; colorName: string }) => (
  <div class={styles.colorSwatch}>
    <div class={styles.colorBox} data-color-name={colorName} />
    <div class={styles.colorInfo}>
      <Text font="bold">{name}</Text>
      <Text variant="caption" color="subtle" as="span">var(--color-{colorName})</Text>
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
        <div class={styles.grid}>
          <ColorSwatch name="Canvas White" colorName="canvas-white" />
          <ColorSwatch name="Charcoal" colorName="charcoal" />
          <ColorSwatch name="Stone Grey" colorName="stone-grey" />
          <ColorSwatch name="Hex Amber" colorName="hex-amber" />
          <ColorSwatch name="Glow Yellow" colorName="glow-yellow" />
          <ColorSwatch name="Pastel Sky" colorName="pastel-sky" />
          <ColorSwatch name="Moss Green" colorName="moss-green" />
          <ColorSwatch name="Clay Red" colorName="clay-red" />
          <ColorSwatch name="Deep Purple" colorName="deep-purple" />
        </div>
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
        <Heading level={2} variant="sectionHeader">Buttons</Heading>
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
        <Heading level={2} variant="sectionHeader">Icons</Heading>
        <Text>This is the Hexbound Icon font. Use it for UI elements.</Text>
      </section>
    </div>
  );
}; 