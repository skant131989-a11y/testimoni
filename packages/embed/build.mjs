import { readFileSync, writeFileSync, mkdirSync, cpSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, 'src');
const distDir = join(__dirname, 'dist');
const publicDir = join(__dirname, '..', '..', 'public', 'embed');

mkdirSync(distDir, { recursive: true });
mkdirSync(publicDir, { recursive: true });

// Build widget.js — styles.js MUST come before index.js because index.js's IIFE
// references FW_STYLES immediately on load.
const widgetFiles = ['styles.js', 'layouts/grid.js', 'layouts/masonry.js', 'layouts/carousel.js', 'index.js'];
let widgetBundle = '';

for (const file of widgetFiles) {
  const content = readFileSync(join(srcDir, file), 'utf-8');
  widgetBundle += content + '\n';
}

const widgetWrapped = `(function(){${widgetBundle}})();`;
writeFileSync(join(distDir, 'widget.js'), widgetWrapped);
cpSync(join(distDir, 'widget.js'), join(publicDir, 'widget.js'));
console.log('Built widget.js:', (widgetWrapped.length / 1024).toFixed(1), 'KB');

// Build collect.js
const collectFiles = ['collect-styles.js', 'collect.js'];
let collectBundle = '';

for (const file of collectFiles) {
  const content = readFileSync(join(srcDir, file), 'utf-8');
  collectBundle += content + '\n';
}

const collectWrapped = `(function(){${collectBundle}})();`;
writeFileSync(join(distDir, 'collect.js'), collectWrapped);
cpSync(join(distDir, 'collect.js'), join(publicDir, 'collect.js'));
console.log('Built collect.js:', (collectWrapped.length / 1024).toFixed(1), 'KB');
