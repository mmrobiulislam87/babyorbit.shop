/**
 * Copy only static site files to dist/ (no node_modules) for wrangler [assets].
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');

const copyDirs = ['admin', 'css', 'js'];
// _redirects is Pages-only; Workers use workers-site.js for routing
const copyFiles = ['index.html', 'robots.txt', 'sitemap.xml', 'favicon.svg'];

if (fs.existsSync(dist)) {
  fs.rmSync(dist, { recursive: true, force: true });
}
fs.mkdirSync(dist, { recursive: true });

for (const dir of copyDirs) {
  const src = path.join(root, dir);
  if (!fs.existsSync(src)) {
    console.error(`copy-dist: missing ${dir}/`);
    process.exit(1);
  }
  fs.cpSync(src, path.join(dist, dir), { recursive: true });
}

for (const file of copyFiles) {
  const src = path.join(root, file);
  if (!fs.existsSync(src)) continue;
  fs.cpSync(src, path.join(dist, file));
}

console.log('copy-dist: wrote dist/ (static site only)');
