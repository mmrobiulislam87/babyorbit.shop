/**
 * Production defaults (committed). Secrets: set ADMIN_PASSWORD in Cloudflare → Variables (Encrypt).
 * Override URL here if Apps Script redeploys to a new URL.
 */
module.exports = {
  shopName: 'Baby Orbit',
  hotline: '01812345678',
  hotlineTel: '8801812345678',
  googleScriptUrl:
    'https://script.google.com/macros/s/AKfycbxDD0vUtm2MJTcrzX002pJCr9-XAF_7u5esJp85MkwranvswkHGLTB2ycVmbF6cYhfemw/exec',
  deliveryFees: { dhaka: 60, outside: 120 }
};
