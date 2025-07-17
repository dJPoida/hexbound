import fs from 'fs/promises';
import path from 'path';

const designDir = 'design/assets/hexbound-icons';
const publicDir = 'src/client/public/fonts/HexboundIcons';
const cssFile = 'src/client/HexboundIcons.css';
const iconComponentFile = 'src/client/components/ui/Icon/Icon.tsx';
const fontFile = 'hexbound-icon.woff';

async function updateIcons() {
  try {
    console.log('Starting icon update...');

    // Ensure target directories exist
    await fs.mkdir(publicDir, { recursive: true });

    // 1. Copy font file
    const sourceFontPath = path.join(designDir, 'fonts', fontFile);
    const destFontPath = path.join(publicDir, fontFile);
    await fs.copyFile(sourceFontPath, destFontPath);
    console.log(`Copied ${fontFile} to ${publicDir}`);

    // 2. Read original CSS
    const originalCssPath = path.join(designDir, 'style.css');
    const cssContent = await fs.readFile(originalCssPath, 'utf-8');

    // 3. Extract icon names from CSS
    const iconNameRegex = /\.hbi-([^:]+):before/g;
    const iconNames = [];
    let match;

    while ((match = iconNameRegex.exec(cssContent)) !== null) {
      iconNames.push(match[1]);
    }

    console.log(`Found ${iconNames.length} icons in CSS file`);

    // 4. Add cache-busting query string
    const version = Date.now();
    const updatedCssContent = cssContent.replace(
      /url\('fonts\/hexbound-icon\.woff(.*?)\)/g,
      `url('/fonts/HexboundIcons/hexbound-icon.woff?v=${version}')`
    );

    // 5. Write updated CSS
    await fs.writeFile(cssFile, updatedCssContent);
    console.log(`Updated ${cssFile} with new font version.`);

    // 6. Update Icon.tsx with new icon names
    await updateIconComponent(iconNames);
    console.log(`Updated ${iconComponentFile} with ${iconNames.length} icon names.`);

    console.log('Icon update complete!');
  } catch (error) {
    console.error('Error updating icons:', error);
    process.exit(1);
  }
}

async function updateIconComponent(iconNames) {
  try {
    // Read the current Icon.tsx file
    const iconComponentContent = await fs.readFile(iconComponentFile, 'utf-8');

    // Create the new ICON_NAMES array
    const iconNamesArray = `export const ICON_NAMES = [\n  '${iconNames.join("',\n  '")}',\n] as const;`;

    // Replace the existing ICON_NAMES array
    const updatedContent = iconComponentContent.replace(
      /export const ICON_NAMES = \[[\s\S]*?\] as const;/,
      iconNamesArray
    );

    // Write the updated file
    await fs.writeFile(iconComponentFile, updatedContent);
  } catch (error) {
    console.error('Error updating Icon component:', error);
    throw error;
  }
}

updateIcons();
