/**
 * Minimal Worker — static files served from [assets] in wrangler.toml.
 * index.html, admin/, js/, css/ deploy with the Worker.
 */
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  }
};
