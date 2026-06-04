/**

 * Shared API — Google Sheets backend + localStorage fallback

 */

const STORE_CACHE_KEY = 'babyshop_store_v2';

const ADMIN_TOKEN_KEY = 'babyshop_admin_token';

const CACHE_TTL_MS = 3 * 60 * 1000;



function getApiUrl() {

  return (SHOP_CONFIG.googleScriptUrl || '').trim();

}



function hasBackend() {

  return !!getApiUrl();

}



async function apiGet(params) {

  const url = new URL(getApiUrl());

  Object.keys(params).forEach((k) => url.searchParams.set(k, params[k]));

  const res = await fetch(url.toString());

  if (!res.ok) throw new Error('API error ' + res.status);

  return res.json();

}



async function apiPost(payload) {

  const res = await fetch(getApiUrl(), {

    method: 'POST',

    headers: { 'Content-Type': 'text/plain;charset=utf-8' },

    body: JSON.stringify(payload)

  });

  if (!res.ok) throw new Error('API error ' + res.status);

  return res.json();

}



function getCachedStore() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_CACHE_KEY) || 'null');
    if (!raw || !raw.data) return null;
    if (Date.now() - raw.fetchedAt > CACHE_TTL_MS) return null;
    return raw.data;
  } catch {
    return null;
  }
}

function getLocalStoreData() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_CACHE_KEY) || 'null');
    return raw && raw.data ? raw.data : null;
  } catch {
    return null;
  }
}



function saveLocalStore(data) {

  localStorage.setItem(STORE_CACHE_KEY, JSON.stringify({ data, fetchedAt: Date.now() }));

}



function invalidateStoreCache() {

  // Local mode: localStorage IS the data source — never delete it, only

  // refresh its timestamp so the saved data stays fresh. Backend mode:

  // drop the cache so the next fetch pulls the latest from the server.

  if (!hasBackend()) {

    const data = getLocalStoreData();

    if (data) saveLocalStore(data);

    return;

  }

  localStorage.removeItem(STORE_CACHE_KEY);

}



function buildDefaultStore() {

  const categories = [

    { id: 'baby-car', slug: 'baby-car', title: 'বেবি গাড়ি', icon: '🏎️', gradient: 'from-red-400 to-orange-500', sortOrder: 1, active: true },

    { id: 'baby-toys', slug: 'baby-toys', title: 'বেবি টয়', icon: '🧸', gradient: 'from-yellow-400 to-amber-500', sortOrder: 2, active: true },

    { id: 'baby-books', slug: 'baby-books', title: 'বেবি বুক', icon: '📚', gradient: 'from-blue-400 to-indigo-500', sortOrder: 3, active: true }

  ];



  const products = [];

  if (typeof PRODUCTS !== 'undefined') {

    Object.keys(PRODUCTS).forEach((catId, ci) => {

      (PRODUCTS[catId] || []).forEach((p, pi) => {

        products.push({ ...p, categoryId: catId, active: true, sortOrder: ci * 10 + pi });

      });

    });

  }



  return {

    settings: {

      shopName: SHOP_CONFIG.shopName || 'Baby Orbit',

      hotline: SHOP_CONFIG.hotline || '',

      hotlineTel: SHOP_CONFIG.hotlineTel || '',

      deliveryFees: SHOP_CONFIG.deliveryFees || { dhaka: 60, outside: 120 },

      facebookPageId: '',

      facebookPixelId: '',

      whatsappBusiness: '',

      whatsappNotify: SHOP_CONFIG.hotlineTel || '',

      ogImage: '',

      logo: '',

      logoVersion: ''

    },

    categories,

    products,

    coupons: []

  };

}



async function fetchStore(forceRefresh) {

  if (hasBackend()) {

    if (!forceRefresh) {

      const fresh = getCachedStore();

      if (fresh) return fresh;

    }

    try {

      const result = await apiGet({ action: 'store' });

      if (result.success && result.data) {

        saveLocalStore(result.data);

        return result.data;

      }

    } catch (err) {

      console.warn('Backend fetch failed:', err);

      const stale = JSON.parse(localStorage.getItem(STORE_CACHE_KEY) || 'null');

      if (stale && stale.data) return stale.data;

    }

  }



  const cached = getCachedStore();

  if (cached) return cached;



  // Local mode: keep previously saved data even after the cache TTL expires.

  const local = getLocalStoreData();

  if (local) return local;



  const defaults = buildDefaultStore();

  saveLocalStore(defaults);

  return defaults;

}



function productsByCategory(products, categories) {

  const grouped = {};

  categories.forEach((c) => { grouped[c.id] = []; });

  (products || []).filter((p) => p.active !== false).forEach((p) => {

    if (!grouped[p.categoryId]) grouped[p.categoryId] = [];

    grouped[p.categoryId].push(p);

  });

  Object.keys(grouped).forEach((k) => {

    grouped[k].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

  });

  return grouped;

}



function getAdminToken() {

  return sessionStorage.getItem(ADMIN_TOKEN_KEY) || '';

}



function setAdminToken(token) {

  sessionStorage.setItem(ADMIN_TOKEN_KEY, token);

}



function clearAdminToken() {

  sessionStorage.removeItem(ADMIN_TOKEN_KEY);

}



async function adminLogin(password) {

  if (hasBackend()) {

    const result = await apiPost({ action: 'login', password });

    if (!result.success) throw new Error(result.error || 'Login failed');

    setAdminToken(result.token);

    return result;

  }

  const expected = SHOP_CONFIG.adminPassword || 'babyshop2024';

  if (password !== expected) throw new Error('ভুল পাসওয়ার্ড');

  setAdminToken('local-admin');

  return { success: true };

}



async function adminSaveProduct(product) {

  let result;

  if (hasBackend()) {

    result = await apiPost({ action: 'saveProduct', token: getAdminToken(), product });

  } else {

    const store = getLocalStoreData() || buildDefaultStore();

    const idx = store.products.findIndex((p) => p.id === product.id);

    const item = { ...product, active: product.active !== false };

    if (idx >= 0) store.products[idx] = item;

    else {

      item.id = item.id || 'prod-' + Date.now();

      store.products.push(item);

    }

    saveLocalStore(store);

    result = { success: true, product: item };

  }

  invalidateStoreCache();

  return result;

}



async function adminDeleteProduct(id) {

  if (hasBackend()) await apiPost({ action: 'deleteProduct', token: getAdminToken(), id });

  else {

    const raw = JSON.parse(localStorage.getItem(STORE_CACHE_KEY) || 'null');

    if (raw && raw.data) {

      raw.data.products = raw.data.products.filter((p) => p.id !== id);

      saveLocalStore(raw.data);

    }

  }

  invalidateStoreCache();

  return { success: true };

}



async function adminSaveCategory(category) {

  if (hasBackend()) await apiPost({ action: 'saveCategory', token: getAdminToken(), category });

  else {

    const store = getLocalStoreData() || buildDefaultStore();

    const idx = store.categories.findIndex((c) => c.id === category.id);

    const item = { ...category, active: category.active !== false };

    if (idx >= 0) store.categories[idx] = item;

    else {

      item.id = item.id || category.slug;

      store.categories.push(item);

    }

    store.categories.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    saveLocalStore(store);

  }

  invalidateStoreCache();

  return { success: true };

}



async function adminDeleteCategory(id) {

  if (hasBackend()) await apiPost({ action: 'deleteCategory', token: getAdminToken(), id });

  else {

    const raw = JSON.parse(localStorage.getItem(STORE_CACHE_KEY) || 'null');

    if (raw && raw.data) {

      raw.data.categories = raw.data.categories.filter((c) => c.id !== id);

      raw.data.products = raw.data.products.filter((p) => p.categoryId !== id);

      saveLocalStore(raw.data);

    }

  }

  invalidateStoreCache();

  return { success: true };

}



async function adminSaveSettings(settings) {

  if (hasBackend()) await apiPost({ action: 'saveSettings', token: getAdminToken(), settings });

  else {

    const store = getLocalStoreData() || buildDefaultStore();

    const prevLogo = (store.settings && store.settings.logo) || '';

    const next = { ...store.settings, ...settings };

    // Cache bust: bump logoVersion whenever the logo URL changes (local mode)

    if (next.logo && next.logo !== prevLogo) next.logoVersion = String(Date.now());

    if (!next.logo) next.logoVersion = '';

    store.settings = next;

    saveLocalStore(store);

  }

  invalidateStoreCache();

  return { success: true };

}

async function adminSaveCoupon(coupon) {

  if (hasBackend()) return apiPost({ action: 'saveCoupon', token: getAdminToken(), coupon });

  const store = getLocalStoreData() || buildDefaultStore();
  store.coupons = store.coupons || [];
  const idx = store.coupons.findIndex((c) => c.id === coupon.id);
  const item = { ...coupon, id: coupon.id || ('coupon-' + Date.now()), code: String(coupon.code || '').toUpperCase(), active: coupon.active !== false };
  if (idx >= 0) store.coupons[idx] = item;
  else store.coupons.push(item);
  saveLocalStore(store);
  invalidateStoreCache();
  return { success: true, coupon: item };

}

async function adminDeleteCoupon(id) {

  if (hasBackend()) return apiPost({ action: 'deleteCoupon', token: getAdminToken(), id });

  const store = getLocalStoreData() || buildDefaultStore();
  store.coupons = (store.coupons || []).filter((c) => c.id !== id);
  saveLocalStore(store);
  invalidateStoreCache();
  return { success: true };

}



async function adminUploadImage(file) {

  const base64 = await fileToBase64(file);

  if (hasBackend()) {

    return apiPost({ action: 'uploadImage', token: getAdminToken(), filename: file.name, mimeType: file.type, base64 });

  }

  return { success: true, url: 'data:' + file.type + ';base64,' + base64 };

}



async function adminFetchOrders() {

  if (!hasBackend()) {

    return JSON.parse(localStorage.getItem('babyshop_orders') || '[]').reverse().slice(0, 50);

  }

  const result = await apiGet({ action: 'orders', token: getAdminToken() });

  return result.orders || [];

}



async function adminUpdateOrderStatus(rowIndex, status) {

  if (hasBackend()) {

    const extra = arguments[2] || {};

    return apiPost({ action: 'updateOrderStatus', token: getAdminToken(), rowIndex, status, ...extra });

  }

  const extra = arguments[2] || {};
  const orders = JSON.parse(localStorage.getItem('babyshop_orders') || '[]');
  const idx = orders.findIndex((o) => Number(o.rowIndex) === Number(rowIndex));
  if (idx >= 0) {
    const prev = orders[idx].status || 'নতুন';
    orders[idx].status = status;
    if (Object.prototype.hasOwnProperty.call(extra, 'refundReason')) orders[idx].refundReason = extra.refundReason || '';
    if (Object.prototype.hasOwnProperty.call(extra, 'refundAmount')) orders[idx].refundAmount = Number(extra.refundAmount) || 0;

    const consumes = (s) => !['বাতিল', 'ফেরত'].includes(String(s || 'নতুন'));
    const store = getLocalStoreData() || buildDefaultStore();
    const p = (store.products || []).find((x) => x.id === orders[idx].productId);
    if (p && p.stock !== '' && p.stock != null && !isNaN(Number(p.stock))) {
      if (consumes(prev) && !consumes(status)) p.stock = Math.max(0, Number(p.stock) + (Number(orders[idx].quantity) || 1));
      else if (!consumes(prev) && consumes(status)) {
        const qty = Number(orders[idx].quantity) || 1;
        if (Number(p.stock) < qty) throw new Error('স্টকে পর্যাপ্ত পণ্য নেই');
        p.stock = Math.max(0, Number(p.stock) - qty);
      }
      saveLocalStore(store);
    }
    localStorage.setItem('babyshop_orders', JSON.stringify(orders));
  }
  return { success: true };

}



async function adminSeedDefaults() {

  if (hasBackend()) await apiPost({ action: 'seedDefaults', token: getAdminToken() });

  else saveLocalStore(buildDefaultStore());

  invalidateStoreCache();

  return { success: true };

}



function fileToBase64(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload = () => resolve(reader.result.split(',')[1]);

    reader.onerror = reject;

    reader.readAsDataURL(file);

  });

}



async function submitOrder(order) {

  if (hasBackend()) return apiPost({ action: 'order', ...order });

  const store = getLocalStoreData() || buildDefaultStore();
  const product = (store.products || []).find((p) => p.id === order.productId);
  const qty = Number(order.quantity) || 1;
  if (product && product.stock !== '' && product.stock != null && !isNaN(Number(product.stock))) {
    if (Number(product.stock) < qty) throw new Error('স্টকে পর্যাপ্ত পণ্য নেই');
    product.stock = Math.max(0, Number(product.stock) - qty);
    saveLocalStore(store);
  }

  const code = String(order.couponCode || '').trim().toUpperCase();
  const coupon = (store.coupons || []).find((c) => c.active !== false && String(c.code || '').toUpperCase() === code);
  const subtotal = Number(order.productPrice) || 0;
  let discount = 0;
  if (coupon) {
    discount = coupon.type === 'percent'
      ? Math.round((subtotal * (Number(coupon.value) || 0)) / 100)
      : Number(coupon.value) || 0;
    if (discount > subtotal) discount = subtotal;
  }
  order.discount = discount;
  order.total = Math.max(0, subtotal - discount) + (Number(order.deliveryFee) || 0);
  order.status = order.status || 'নতুন';

  const orders = JSON.parse(localStorage.getItem('babyshop_orders') || '[]');

  order.rowIndex = orders.length + 2;
  orders.push(order);

  localStorage.setItem('babyshop_orders', JSON.stringify(orders));

  return { success: true, mode: 'local' };

}


