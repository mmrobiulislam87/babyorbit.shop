/**
 * Static assets + SPA routing (replaces Pages _redirects on Workers).
 */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === '/admin' || path.startsWith('/admin/')) {
      return env.ASSETS.fetch(new Request(new URL('/admin/index.html', url), request));
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) {
      return assetResponse;
    }

    // Category slugs, ?product= deep links, etc. → storefront
    if (!looksLikeStaticFile(path)) {
      return env.ASSETS.fetch(new Request(new URL('/index.html', url), request));
    }

    return assetResponse;
  }
};

function looksLikeStaticFile(path) {
  const last = path.split('/').pop() || '';
  return last.includes('.');
}
