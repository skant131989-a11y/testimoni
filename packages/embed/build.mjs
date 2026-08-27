import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const srcDir = join(__dirname, 'src');
const distDir = join(__dirname, 'dist');

mkdirSync(distDir, { recursive: true });

const files = ['index.js', 'styles.js', 'layouts/grid.js', 'layouts/masonry.js', 'layouts/carousel.js'];
let bundle = '';

for (const file of files) {
  const content = readFileSync(join(srcDir, file), 'utf-8');
  bundle += content + '\n';
}

const wrapped = `(function(){${bundle}})();`;
writeFileSync(join(distDir, 'widget.js'), wrapped);
console.log('Built widget.js:', (wrapped.length / 1024).toFixed(1), 'KB');
