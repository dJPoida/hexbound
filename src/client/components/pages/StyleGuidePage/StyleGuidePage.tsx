
import { useState } from 'preact/hooks';
import { Button } from '../../Button/Button';
import { Checkbox } from '../../Checkbox/Checkbox';
import { Input } from '../../Input/Input';
import { Logo } from '../../Logo/Logo';
import { Heading } from '../../Typography/Heading';
import { Text } from '../../Typography/Text';
import styles from './StyleGuidePage.module.css';

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

const iconList = [
  'menu', 'home', 'save', 'trash', 'settings', 'sliders', 'exit', 'hexagon', 'heart', 'star',
  'alert-triangle', 'help-circle', 'info', 'error',
  'arrow-up', 'arrow-up-right', 'arrow-right', 'arrow-down-right', 'arrow-down', 'arrow-down-left', 'arrow-left', 'arrow-up-left',
  'chevron-up', 'chevron-right', 'chevron-down', 'chevron-left',
  'chevrons-up', 'chevrons-right', 'chevrons-down', 'chevrons-left',
  'check', 'cross', 'circle', 'check-circle', 'cross-circle',
  'square', 'check-square', 'cross-square', 'plus-square', 'minus-square',
  'search', 'zoom-in', 'zoom-out',
  'toggle-left', 'toggle-right',
  'more-vertical', 'more-horizontal',
  'frown', 'meh', 'smile',
  'user', 'user-check', 'user-cross', 'user-plus', 'user-minus', 'users',
  'lock', 'unlock',
  'loader', 'play',
  'wifi', 'wifi-off',
  'life-buoy', 'award',
  'bell', 'bell-off',
  'terminal', 'layers', 'map',
  'dollar-sign', 'edit', 'share', 'link', 'message',
  'eye', 'eye-off',
  'clock',
  'upload', 'download',
  'shuffle',
  'maximize', 'minimize',
  'move',
  'rotate-ccw', 'rotate-cw',
  'thumbs-up', 'thumbs-down',
  'sound-on', 'sound-off'
] as const;

export const StyleGuidePage = () => {
  // State for checkbox examples
  const [checkboxStates, setCheckboxStates] = useState({
    default: false,
    checked: true,
    large: false,
    largeChecked: true,
    disabled: false,
    disabledChecked: true,
  });

  const updateCheckboxState = (key: keyof typeof checkboxStates) => (checked: boolean) => {
    setCheckboxStates((prev: typeof checkboxStates) => ({ ...prev, [key]: checked }));
  };

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
            <ColorSwatch name="Hex Amber" colorName="hex-amber" hex="#FEC859" role="Primary" variants={{ dark: '#D4A73C', light: '#FED67B', highlight: '#FFE4A3' }} />
            <ColorSwatch name="Slate Blue" colorName="slate-blue" hex="#5B6B7A" role="Secondary" variants={{ dark: '#465460', light: '#7a8a99', highlight: '#9caab8' }} />
          </div>
        </section>

        <section class={styles.subSection}>
          <Heading level={3} variant="subSectionHeader">Ancillary Colors</Heading>
          <Text color="subtle">Used for status indicators like success, error, or informational messages.</Text>
          <div class={styles.grid}>
            <ColorSwatch name="Moss Green" colorName="moss-green" hex="#87a06f" variants={{ dark: '#6e8558', light: '#a0b88b', highlight: '#bad0a8' }} />
            <ColorSwatch name="Clay Red" colorName="clay-red" hex="#d47a6a" variants={{ dark: '#b56254', light: '#e1988b', highlight: '#edb6ac' }} />
            <ColorSwatch name="Deep Purple" colorName="deep-purple" hex="#7e718c" variants={{ dark: '#645a70', light: '#988fa6', highlight: '#b3a9be' }} />
            <ColorSwatch name="Pastel Sky" colorName="pastel-sky" hex="#a9d7e8" variants={{ dark: '#8cb6c6', light: '#c2e2ee', highlight: '#dcf0f8' }} />
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
        <Heading level={2} variant="sectionHeader">Buttons</Heading>
        <Text color="subtle">
          Dynamic SVG-based gem buttons that scale horizontally without distortion.
        </Text>
        
        <section class={styles.subSection}>
          <Heading level={3} variant="subSectionHeader" color="subtle">Button Variants</Heading>
          <div class={styles.buttonRow}>
            <Button onClick={() => {}} variant="primary">Primary</Button>
            <Button onClick={() => {}} variant="secondary">Secondary</Button>
            <Button onClick={() => {}} variant="green">Green</Button>
            <Button onClick={() => {}} variant="red">Red</Button>
          </div>
          <div class={styles.buttonRow}>
            <Button onClick={() => {}} variant="purple">Purple</Button>
            <Button onClick={() => {}} variant="primary" disabled>Disabled</Button>
          </div>
          <div class={styles.buttonRow}>
            <Button onClick={() => {}} variant="icon" ariaLabel="Menu"><span class="hbi-menu"></span></Button>
            <Button onClick={() => {}} variant="link">Link Button</Button>
          </div>
        </section>

        <section class={styles.subSection}>
          <Heading level={3} variant="subSectionHeader" color="subtle">Dynamic Width Examples</Heading>
          <div class={styles.buttonGrid}>
            <Button onClick={() => {}} variant="primary">Short</Button>
            <Button onClick={() => {}} variant="secondary">Medium Length Text</Button>
            <Button onClick={() => {}} variant="green">Very Long Button Text Example</Button>
          </div>
        </section>
      </section>

      <section class={styles.section}>
        <Heading level={2} variant="sectionHeader">Inputs</Heading>
        <Text color="subtle">
          Text input components with parchment-like styling that matches the game&apos;s medieval theme.
        </Text>
        
        <section class={styles.subSection}>
          <Heading level={3} variant="subSectionHeader" color="subtle">Input States</Heading>
          <div class={styles.inputExamples}>
            <div class={styles.inputExample}>
              <Text variant="label">Default</Text>
              <Input placeholder="Enter your text here..." />
            </div>
            <div class={styles.inputExample}>
              <Text variant="label">With Value</Text>
              <Input value="Sample text content" readOnly />
            </div>
            <div class={styles.inputExample}>
              <Text variant="label">Large Variant</Text>
              <Input variant="large" placeholder="Large input field..." />
            </div>
          </div>
        </section>

        <section class={styles.subSection}>
          <Heading level={3} variant="subSectionHeader" color="subtle">Input Types</Heading>
          <div class={styles.inputExamples}>
            <div class={styles.inputExample}>
              <Text variant="label">Email</Text>
              <Input type="email" placeholder="your@email.com" />
            </div>
            <div class={styles.inputExample}>
              <Text variant="label">Password</Text>
              <Input type="password" placeholder="Password" />
            </div>
            <div class={styles.inputExample}>
              <Text variant="label">Number</Text>
              <Input type="number" placeholder="123" />
            </div>
          </div>
        </section>

        <section class={styles.subSection}>
          <Heading level={3} variant="subSectionHeader" color="subtle">Error & Disabled States</Heading>
          <div class={styles.inputExamples}>
            <div class={styles.inputExample}>
              <Text variant="label">Error State</Text>
              <Input hasError placeholder="This field has an error" />
            </div>
            <div class={styles.inputExample}>
              <Text variant="label">Disabled</Text>
              <Input disabled placeholder="Disabled input" />
            </div>
            <div class={styles.inputExample}>
              <Text variant="label">Read Only</Text>
              <Input readOnly value="This is read-only content" />
            </div>
          </div>
        </section>
      </section>

      <section class={styles.section}>
        <Heading level={2} variant="sectionHeader">Checkboxes</Heading>
        <Text color="subtle">
          Checkbox components with parchment-like styling that matches the game&apos;s medieval theme.
        </Text>
        
        <section class={styles.subSection}>
          <Heading level={3} variant="subSectionHeader" color="subtle">Checkbox States</Heading>
          <div class={styles.checkboxExamples}>
            <div class={styles.checkboxExample}>
              <Checkbox
                label="Unchecked Option"
                checked={checkboxStates.default}
                onChange={updateCheckboxState('default')}
              />
            </div>
            <div class={styles.checkboxExample}>
              <Checkbox
                label="Checked Option"
                checked={checkboxStates.checked}
                onChange={updateCheckboxState('checked')}
              />
            </div>
            <div class={styles.checkboxExample}>
              <Checkbox
                label="Large Unchecked"
                checked={checkboxStates.large}
                onChange={updateCheckboxState('large')}
                size="large"
              />
            </div>
            <div class={styles.checkboxExample}>
              <Checkbox
                label="Large Checked"
                checked={checkboxStates.largeChecked}
                onChange={updateCheckboxState('largeChecked')}
                size="large"
              />
            </div>
          </div>
        </section>

        <section class={styles.subSection}>
          <Heading level={3} variant="subSectionHeader" color="subtle">Disabled States</Heading>
          <div class={styles.checkboxExamples}>
            <div class={styles.checkboxExample}>
              <Checkbox
                label="Disabled Unchecked"
                checked={checkboxStates.disabled}
                onChange={updateCheckboxState('disabled')}
                disabled
              />
            </div>
            <div class={styles.checkboxExample}>
              <Checkbox
                label="Disabled Checked"
                checked={checkboxStates.disabledChecked}
                onChange={updateCheckboxState('disabledChecked')}
                disabled
              />
            </div>
          </div>
        </section>
      </section>

      <section class={styles.section}>
        <Heading level={2} variant="sectionHeader">Icons</Heading>
        <Text color="subtle">
          This is the Hexbound Icon font. Use it for UI elements by adding the class name to any element.
        </Text>
        
        <section class={styles.subSection}>
          <div class={styles.iconGrid}>
            {iconList.map(icon => (
              <div key={icon} class={styles.iconItem}>
                <div class={styles.iconDisplay}>
                  <span class={`hbi-${icon}`}></span>
                </div>
                <Text variant="caption" color="subtle" class={styles.iconCode}>
                  hbi-{icon}
                </Text>
              </div>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}; 