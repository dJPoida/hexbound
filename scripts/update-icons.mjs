import fs from 'fs/promises';
import path from 'path';

const designDir = 'design/assets/hexbound-icons';
const publicDir = 'src/client/public/fonts/HexboundIcons';
const cssFile = 'src/client/HexboundIcons.css';
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

    // 3. Add cache-busting query string
    const version = Date.now();
    const updatedCssContent = cssContent.replace(
      /url\('fonts\/hexbound-icon\.woff(.*?)\)/g,
      `url('/fonts/HexboundIcons/hexbound-icon.woff?v=${version}')`
    );

    // 4. Write updated CSS
    await fs.writeFile(cssFile, updatedCssContent);
    console.log(`Updated ${cssFile} with new font version.`);
    console.log('Icon update complete!');

  } catch (error) {
    console.error('Error updating icons:', error);
    process.exit(1);
  }
}

updateIcons(); 