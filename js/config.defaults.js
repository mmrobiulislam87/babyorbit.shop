/**
 * Production defaults — Cloudflare D1 API on same domain (/api).
 * Secrets (Worker): ADMIN_PASSWORD, IMGBB_API_KEY, WHATSAPP_PHONE, CALLMEBOT_KEY
 */
module.exports = {
  shopName: 'Baby Orbit',
  hotline: '01812345678',
  hotlineTel: '8801812345678',
  apiUrl: '/api',
  googleScriptUrl: '',
  backend: 'd1',
  deliveryFees: { dhaka: 60, outside: 120 }
};
