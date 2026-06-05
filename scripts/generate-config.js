/**
 * Build-time config for Cloudflare deploy.
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

const apiUrl = (process.env.API_URL || defaults.apiUrl || '').trim();
const googleScriptUrl = (process.env.GOOGLE_SCRIPT_URL || defaults.googleScriptUrl || '').trim();

const cfg = {
  shopName: process.env.SHOP_NAME || defaults.shopName || 'Baby Orbit',
  hotline: process.env.HOTLINE || defaults.hotline || '01812345678',
  hotlineTel: process.env.HOTLINE_TEL || defaults.hotlineTel || '8801812345678',
  apiUrl: apiUrl || (googleScriptUrl ? '' : '/api'),
  googleScriptUrl,
  backend: apiUrl ? 'd1' : (googleScriptUrl ? 'gas' : 'd1'),
  deliveryFees: defaults.deliveryFees || { dhaka: 60, outside: 120 },
  adminPassword: process.env.ADMIN_PASSWORD || defaults.adminPassword || ''
};

if (!cfg.apiUrl && !cfg.googleScriptUrl) {
  console.error('ERROR: apiUrl বা GOOGLE_SCRIPT_URL দরকার');
  process.exit(1);
}

if (!cfg.adminPassword) {
  console.warn('WARN: ADMIN_PASSWORD not set — set Cloudflare Worker secret ADMIN_PASSWORD');
}

const body = `/** Auto-generated at build */\nconst SHOP_CONFIG = ${JSON.stringify(cfg, null, 2)};\n`;

fs.writeFileSync(outFile, body, 'utf8');
console.log('generate-config: wrote js/config.js (backend: ' + cfg.backend + ')');
