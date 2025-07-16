import { useState } from 'preact/hooks';

import { StyleColor } from '../../../types/ui';
import { Button, IconPosition } from '../../ui/Button';
import { Checkbox, CheckboxSize } from '../../ui/Checkbox';
import { Icon, ICON_NAMES, IconName, IconSize } from '../../ui/Icon';
import { Input, InputType, InputVariant } from '../../ui/Input';
import { Logo } from '../../ui/Logo/Logo';
import { Heading } from '../../ui/Typography/Heading';
import { Text } from '../../ui/Typography/Text';
import styles from './StyleGuideView.module.css';

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

export const StyleGuideView = () => {
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

  // Icon size constants for examples
  // Note: IconSize enum enforces strict typing - using string literals like size="lg" will cause TypeScript errors
  const iconSizes = {
    xs: IconSize.XS,
    sm: IconSize.SM,
    md: IconSize.MD,
    lg: IconSize.LG,
    xl: IconSize.XL,
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
            <ColorSwatch name="Hex Amber" colorName="hex-amber" hex="#f5b83d" role="Primary" variants={{ dark: '#d19a2f', light: '#f8c659', highlight: '#fbd47b' }} />
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
            <Text variant="inline">This is inline text (no margin, for UI elements).</Text>
            <Text variant="label">This is a label.</Text>
            <Text variant="caption" color="subtle">This is a caption (or subtext).</Text>
          </div>
        </section>
      </section>

      <section class={styles.section}>
        <Heading level={2} variant="sectionHeader">Buttons</Heading>
        <Text color="subtle">
          Dynamic SVG-based gem buttons that scale horizontally without distortion.
        </Text>
        
        <section class={styles.subSection}>
          <Heading level={3} variant="subSectionHeader" color="subtle">Button Colors</Heading>
          <Text color="subtle">
            Actual color system: Amber (hex-amber), Default (slate-blue), Green (moss-green), 
            Red (clay-red), Purple (deep-purple), Grey (stone-grey), White (canvas-white), 
            Blue (pastel-sky), Yellow (glow-yellow).
          </Text>
          <div class={styles.buttonRow}>
            <Button onClick={() => {}} color={StyleColor.AMBER}>Amber</Button>
            <Button onClick={() => {}} color={StyleColor.DEFAULT}>Default</Button>
            <Button onClick={() => {}} color={StyleColor.GREEN}>Green</Button>
            <Button onClick={() => {}} color={StyleColor.RED}>Red</Button>
          </div>
          <div class={styles.buttonRow}>
            <Button onClick={() => {}} color={StyleColor.PURPLE}>Purple</Button>
            <Button onClick={() => {}} color={StyleColor.GREY}>Grey</Button>
            <Button onClick={() => {}} color={StyleColor.WHITE}>White</Button>
            <Button onClick={() => {}} color={StyleColor.BLUE}>Blue</Button>
          </div>
          <div class={styles.buttonRow}>
            <Button onClick={() => {}} color={StyleColor.YELLOW}>Yellow</Button>
            <Button onClick={() => {}} color={StyleColor.AMBER} disabled>Disabled</Button>
          </div>
          <div class={styles.buttonRow}>
            <Button onClick={() => {}} color={StyleColor.DEFAULT} icon="menu" ariaLabel="Menu" />
          </div>
        </section>

        <section class={styles.subSection}>
          <Heading level={3} variant="subSectionHeader" color="subtle">Icon Integration (New)</Heading>
          <Text color="subtle">
            Buttons can now include icons with configurable positioning using the icon and iconPosition props.
          </Text>
          <div class={styles.buttonRow}>
            <Button onClick={() => {}} color={StyleColor.AMBER} icon="save">Save Game</Button>
            <Button onClick={() => {}} color={StyleColor.GREEN} icon="check" iconPosition={IconPosition.RIGHT}>Confirm</Button>
            <Button onClick={() => {}} color={StyleColor.RED} icon="trash">Delete</Button>
            <Button onClick={() => {}} color={StyleColor.BLUE} icon="settings">Settings</Button>
          </div>
          <div class={styles.buttonRow}>
            <Button onClick={() => {}} color={StyleColor.DEFAULT} icon="arrow-left">Back</Button>
            <Button onClick={() => {}} color={StyleColor.DEFAULT} icon="arrow-right" iconPosition={IconPosition.RIGHT}>Next</Button>
            <Button onClick={() => {}} color={StyleColor.PURPLE} icon="star">Favorite</Button>
            <Button onClick={() => {}} color={StyleColor.YELLOW} icon="heart">Like</Button>
          </div>
          <div class={styles.buttonRow}>
            <Button onClick={() => {}} color={StyleColor.DEFAULT} icon="menu" ariaLabel="Menu" />
            <Button onClick={() => {}} color={StyleColor.AMBER} icon="home" ariaLabel="Home" />
            <Button onClick={() => {}} color={StyleColor.GREEN} icon="check" ariaLabel="Confirm" />
            <Button onClick={() => {}} color={StyleColor.RED} icon="trash" ariaLabel="Delete" />
          </div>
        </section>

        <section class={styles.subSection}>
          <Heading level={3} variant="subSectionHeader" color="subtle">Dynamic Width Examples</Heading>
          <div class={styles.buttonGrid}>
            <Button onClick={() => {}} color={StyleColor.AMBER}>Short</Button>
            <Button onClick={() => {}} color={StyleColor.DEFAULT}>Medium Length Text</Button>
            <Button onClick={() => {}} color={StyleColor.GREEN}>Very Long Button Text Example</Button>
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
              <Input variant={InputVariant.LARGE} placeholder="Large input field..." />
            </div>
          </div>
        </section>

        <section class={styles.subSection}>
          <Heading level={3} variant="subSectionHeader" color="subtle">Input Types</Heading>
          <div class={styles.inputExamples}>
            <div class={styles.inputExample}>
              <Text variant="label">Email</Text>
              <Input type={InputType.EMAIL} placeholder="your@email.com" />
            </div>
            <div class={styles.inputExample}>
              <Text variant="label">Password</Text>
              <Input type={InputType.PASSWORD} placeholder="Password" />
            </div>
            <div class={styles.inputExample}>
              <Text variant="label">Number</Text>
              <Input type={InputType.NUMBER} placeholder="123" />
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
                size={CheckboxSize.LARGE}
              />
            </div>
            <div class={styles.checkboxExample}>
              <Checkbox
                label="Large Checked"
                checked={checkboxStates.largeChecked}
                onChange={updateCheckboxState('largeChecked')}
                size={CheckboxSize.LARGE}
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
          Available icons for UI elements. Icons scale with text using em units for perfect integration.
        </Text>
        
        <section class={styles.subSection}>
          <Heading level={3} variant="subSectionHeader" color="subtle">Icon Sizes with Text</Heading>
          <Text color="subtle">Icons scale relative to their text context:</Text>
          <div class={styles.iconSizeExamples}>
            <Text>Extra Small <Icon name="heart" size={iconSizes.xs} color={StyleColor.RED} /> (0.5em)</Text>
            <Text>Small <Icon name="star" size={iconSizes.sm} color={StyleColor.AMBER} /> (0.75em)</Text>
            <Text>Medium <Icon name="settings" size={iconSizes.md} color={StyleColor.DEFAULT} /> (1em - default)</Text>
            <Text font="bold">Large <Icon name="award" size={iconSizes.lg} color={StyleColor.GREEN} /> (2em)</Text>
            <Heading level={3} variant="subSectionHeader">Extra Large <Icon name="hexagon" size={iconSizes.xl} color={StyleColor.AMBER} /> (3em)</Heading>
          </div>
        </section>

        <section class={styles.subSection}>
          <Heading level={3} variant="subSectionHeader" color="subtle">Available Icons</Heading>
          <div class={styles.iconGrid}>
            {ICON_NAMES.map((icon: IconName) => (
              <div key={icon} class={styles.iconItem}>
                <div class={styles.iconDisplay}>
                  <Icon name={icon} size={iconSizes.lg} />
                </div>
                <Text variant="caption" color="subtle" class={styles.iconCode}>
                  {icon.charAt(0).toUpperCase() + icon.slice(1).replace(/-/g, ' ')}
                </Text>
              </div>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}; 