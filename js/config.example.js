/**
 * config.example.js → কপি করে config.js বানান
 */
const SHOP_CONFIG = {
  shopName: 'Baby Orbit',
  hotline: '01812345678',
  hotlineTel: '8801812345678',
  /** Cloudflare D1 API (same site) — সুপারিশ */
  apiUrl: '/api',
  /** পুরনো Google Apps Script — খালি রাখুন D1 ব্যবহার করলে */
  googleScriptUrl: '',
  deliveryFees: { dhaka: 60, outside: 120 },
  adminPassword: 'your-strong-password-here'
};
