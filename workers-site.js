/**
 * Baby Orbit Worker — static site + D1 API at /api
 */
import { handleApi } from './worker-api.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api' || url.pathname === '/api/') {
      return handleApi(request, env);
    }

    if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
      return env.ASSETS.fetch(new Request(new URL('/admin/index.html', url), request));
    }

    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status !== 404) {
      return assetResponse;
    }

    if (!looksLikeStaticFile(url.pathname)) {
      return env.ASSETS.fetch(new Request(new URL('/index.html', url), request));
    }

    return assetResponse;
  }
};

function looksLikeStaticFile(path) {
  const last = path.split('/').pop() || '';
  return last.includes('.');
}
