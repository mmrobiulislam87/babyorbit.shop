/**
 * Build-time config for Cloudflare (config.js is gitignored locally).
 * Cloudflare: Settings → Variables → GOOGLE_SCRIPT_URL, ADMIN_PASSWORD (encrypted)
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const outFile = path.join(root, 'js', 'config.js');
const defaultsFile = path.join(root, 'js', 'config.defaults.js');

const isCI = process.env.CI === 'true' || process.env.CF_PAGES === '1';

if (!isCI && fs.existsSync(outFile)) {
  console.log('generate-config: js/config.js exists — skip (local dev)');
  process.exit(0);
}

let defaults = {};
if (fs.existsSync(defaultsFile)) {
  defaults = require(defaultsFile);
}

const cfg = {
  shopName: process.env.SHOP_NAME || defaults.shopName || 'Baby Orbit',
  hotline: process.env.HOTLINE || defaults.hotline || '01812345678',
  hotlineTel: process.env.HOTLINE_TEL || defaults.hotlineTel || '8801812345678',
  googleScriptUrl: process.env.GOOGLE_SCRIPT_URL || defaults.googleScriptUrl || '',
  deliveryFees: defaults.deliveryFees || { dhaka: 60, outside: 120 },
  adminPassword: process.env.ADMIN_PASSWORD || defaults.adminPassword || ''
};

if (!cfg.googleScriptUrl) {
  console.error('ERROR: GOOGLE_SCRIPT_URL missing. Set Cloudflare env var or js/config.defaults.js');
  process.exit(1);
}

if (!cfg.adminPassword) {
  console.warn('WARN: ADMIN_PASSWORD not set — admin login may fail until you set it in Cloudflare.');
}

const body = `/** Auto-generated at build — edit js/config.defaults.js or Cloudflare env vars */\nconst SHOP_CONFIG = ${JSON.stringify(cfg, null, 2)};\n`;

fs.writeFileSync(outFile, body, 'utf8');
console.log('generate-config: wrote js/config.js');
