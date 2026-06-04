/**
 * Admin Panel Logic — Pro UI (theme, sidebar, dashboard charts, logo, memo)
 */

let store = null;
let allOrders = [];
let revenueChart = null;
let statusChart = null;
let orderSearch = '';
let orderFilter = 'all';
let productSearch = '';
let editingCouponId = '';

const ORDER_STATUSES = ['নতুন', 'কনফার্ম', 'ডেলিভারি', 'সম্পন্ন', 'বাতিল', 'ফেরত'];
const PAGE_TITLES = { dashboard: 'ড্যাশবোর্ড', products: 'পণ্য', categories: 'ক্যাটাগরি', orders: 'অর্ডার', settings: 'সেটিংস' };
const THEME_KEY = 'babyshop_admin_theme';

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  setTimeout(() => el.classList.add('hidden'), 2500);
}

function bnDigits(str) {
  const map = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(str == null ? '' : str).replace(/\d/g, (d) => map[d]);
}

function taka(n) {
  return '৳' + bnDigits(Number(n || 0).toLocaleString('en-US'));
}

// ─── Theme ───────────────────────────────────────────────────

function isDark() {
  return document.documentElement.classList.contains('dark');
}

function applyThemeButton() {
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = isDark() ? '☀️' : '🌙';
}

function toggleTheme() {
  const dark = document.documentElement.classList.toggle('dark');
  try { localStorage.setItem(THEME_KEY, dark ? 'dark' : 'light'); } catch (e) {}
  applyThemeButton();
  if (allOrders.length || store) renderCharts();
}

// ─── Sidebar ─────────────────────────────────────────────────

function openSidebar() {
  document.getElementById('sidebar').classList.remove('-translate-x-full');
  document.getElementById('sidebar-backdrop').classList.remove('hidden');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.add('-translate-x-full');
  document.getElementById('sidebar-backdrop').classList.add('hidden');
}

// ─── Tabs ────────────────────────────────────────────────────

function switchTab(tab) {
  document.querySelectorAll('.nav-link').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  document.querySelectorAll('.tab-panel').forEach((panel) => {
    panel.classList.toggle('hidden', panel.id !== 'tab-' + tab);
  });
  const title = document.getElementById('page-title');
  if (title) title.textContent = PAGE_TITLES[tab] || 'Admin';
  if (window.innerWidth < 768) closeSidebar();
  if (tab === 'orders') renderAllOrders();
}

// ─── Data loading ────────────────────────────────────────────

async function loadStore() {
  store = await fetchStore(true);
  document.getElementById('stat-products').textContent = bnDigits((store.products || []).length);
  document.getElementById('stat-categories').textContent = bnDigits((store.categories || []).length);
  renderProductsList();
  renderCategoriesList();
  renderCoupons();
  fillSettingsForm();
  renderLogoPreview();
}

async function loadOrdersData() {
  try {
    const orders = await adminFetchOrders();
    allOrders = (orders || []).map((o, i) => Object.assign({ _idx: i }, o));
  } catch {
    allOrders = [];
  }
  renderRecentOrders();
  renderAllOrders();
  renderDashboardStats();
  renderCharts();
}

function fillSettingsForm() {
  const s = store.settings || {};
  const form = document.getElementById('settings-form');
  form.shopName.value = s.shopName || '';
  form.hotline.value = s.hotline || '';
  form.hotlineTel.value = s.hotlineTel || '';
  form.deliveryDhaka.value = (s.deliveryFees && s.deliveryFees.dhaka) || 60;
  form.deliveryOutside.value = (s.deliveryFees && s.deliveryFees.outside) || 120;
  form.facebookPageId.value = s.facebookPageId || '';
  form.facebookPixelId.value = s.facebookPixelId || '';
  form.ogImage.value = s.ogImage || '';
  form.whatsappBusiness.value = s.whatsappBusiness || '';
  form.whatsappNotify.value = s.whatsappNotify || '';
  form.logo.value = s.logo || '';
}

function renderLogoPreview() {
  const s = (store && store.settings) || {};
  const url = s.logo || '';
  const img = document.getElementById('logo-preview');
  const ph = document.getElementById('logo-placeholder');
  if (url) {
    img.src = (typeof withCacheBust === 'function') ? withCacheBust(url, s.logoVersion) : url;
    img.classList.remove('hidden');
    ph.classList.add('hidden');
  } else {
    img.classList.add('hidden');
    ph.classList.remove('hidden');
  }
}

// ─── Dashboard stats & charts ────────────────────────────────

function orderDate(o) {
  const d = new Date(o.date || o.timestamp || o.dateTime || '');
  return isNaN(d.getTime()) ? null : d;
}

function isCancelled(o) {
  return (o.status || '') === 'বাতিল';
}

function isRefunded(o) {
  return (o.status || '') === 'ফেরত';
}

// বাতিল ও ফেরত — দুটোই নেট রেভিনিউ থেকে বাদ যায়
function isRevenueLost(o) {
  return isCancelled(o) || isRefunded(o);
}

function dayKey(d) {
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

function baseProductName(name) {
  // "টেডি (নীল · M)" → "টেডি"  — ভ্যারিয়েন্ট অংশ বাদ দিয়ে গ্রুপিং
  return String(name || '').replace(/\s*[(（].*$/, '').trim() || String(name || '');
}

function renderDashboardStats() {
  const now = new Date();
  const todayKey = dayKey(now);
  const curMonth = now.getMonth();
  const curYear = now.getFullYear();
  let todayCount = 0;
  let todayRevenue = 0;
  let monthRevenue = 0;
  let pending = 0;
  let monthRefund = 0;
  const sales = {};

  allOrders.forEach((o) => {
    const lost = isRevenueLost(o);
    const amount = Number(o.total || o.productPrice || 0);
    const d = orderDate(o);

    if (d && dayKey(d) === todayKey) {
      todayCount++;
      if (!lost) todayRevenue += amount;
    }
    if (d && d.getMonth() === curMonth && d.getFullYear() === curYear && !lost) {
      monthRevenue += amount;
    }
    if (d && d.getMonth() === curMonth && d.getFullYear() === curYear && isRefunded(o)) {
      monthRefund += Number(o.refundAmount || o.total || 0);
    }
    const s = o.status || 'নতুন';
    if (s === 'নতুন' || s === 'কনফার্ম') pending++;
    if (!lost && o.product) {
      const key = baseProductName(o.product);
      sales[key] = (sales[key] || 0) + (Number(o.quantity) || 1);
    }
  });

  document.getElementById('stat-today-orders').textContent = bnDigits(todayCount);
  document.getElementById('stat-today-revenue').textContent = taka(todayRevenue);
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('stat-month-revenue', taka(monthRevenue));
  set('stat-total-orders', bnDigits(allOrders.length));
  set('stat-pending', bnDigits(pending));
  set('stat-month-refund', taka(monthRefund));

  renderTopProducts(sales);
}

function renderTopProducts(sales) {
  const box = document.getElementById('top-products');
  if (!box) return;
  const top = Object.keys(sales).map((k) => ({ name: k, qty: sales[k] }))
    .sort((a, b) => b.qty - a.qty).slice(0, 5);
  if (!top.length) {
    box.innerHTML = '<p class="text-gray-400">এখনো কোনো বিক্রি নেই</p>';
    return;
  }
  const max = top[0].qty || 1;
  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
  box.innerHTML = top.map((t, i) => `
    <div class="flex items-center gap-3">
      <span class="text-lg shrink-0">${medals[i]}</span>
      <div class="flex-1 min-w-0">
        <div class="flex justify-between gap-2">
          <span class="font-semibold truncate">${escapeHtml(t.name)}</span>
          <span class="text-gray-500 shrink-0">${bnDigits(t.qty)} টি</span>
        </div>
        <div class="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full mt-1 overflow-hidden">
          <div class="h-full bg-pink-500 rounded-full" style="width:${Math.round((t.qty / max) * 100)}%"></div>
        </div>
      </div>
    </div>
  `).join('');
}

function buildRevenueSeries() {
  const labels = [];
  const keys = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    keys.push(dayKey(d));
    labels.push(bnDigits(d.getDate() + '/' + (d.getMonth() + 1)));
  }
  const totals = keys.map(() => 0);
  allOrders.forEach((o) => {
    if (isRevenueLost(o)) return;
    const d = orderDate(o);
    if (!d) return;
    const idx = keys.indexOf(dayKey(d));
    if (idx >= 0) totals[idx] += Number(o.total || o.productPrice || 0);
  });
  return { labels, totals };
}

function buildStatusCounts() {
  const counts = {};
  ORDER_STATUSES.forEach((s) => { counts[s] = 0; });
  allOrders.forEach((o) => {
    const s = o.status || 'নতুন';
    counts[s] = (counts[s] || 0) + 1;
  });
  return counts;
}

function renderCharts() {
  if (typeof Chart === 'undefined') return;
  const gridColor = isDark() ? 'rgba(148,163,184,0.15)' : 'rgba(148,163,184,0.25)';
  const tickColor = isDark() ? '#9ca3af' : '#6b7280';

  const rev = buildRevenueSeries();
  const revCanvas = document.getElementById('revenue-chart');
  if (revCanvas) {
    if (revenueChart) revenueChart.destroy();
    revenueChart = new Chart(revCanvas, {
      type: 'bar',
      data: {
        labels: rev.labels,
        datasets: [{
          label: 'রেভিনিউ (৳)',
          data: rev.totals,
          backgroundColor: 'rgba(236,72,153,0.7)',
          borderRadius: 8,
          maxBarThickness: 38
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: tickColor } },
          y: { grid: { color: gridColor }, ticks: { color: tickColor }, beginAtZero: true }
        }
      }
    });
  }

  const counts = buildStatusCounts();
  const statusCanvas = document.getElementById('status-chart');
  if (statusCanvas) {
    if (statusChart) statusChart.destroy();
    const colors = ['#facc15', '#3b82f6', '#a855f7', '#22c55e', '#ef4444', '#f97316'];
    statusChart = new Chart(statusCanvas, {
      type: 'doughnut',
      data: {
        labels: ORDER_STATUSES,
        datasets: [{ data: ORDER_STATUSES.map((s) => counts[s] || 0), backgroundColor: colors, borderWidth: 0 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '62%',
        plugins: { legend: { position: 'bottom', labels: { color: tickColor, boxWidth: 12, padding: 10, font: { size: 11 } } } }
      }
    });
  }
}

// ─── Orders rendering ────────────────────────────────────────

function renderRecentOrders() {
  const container = document.getElementById('recent-orders');
  if (!allOrders.length) {
    container.innerHTML = '<p class="text-gray-400">কোনো অর্ডার নেই</p>';
    return;
  }
  container.innerHTML = allOrders.slice(0, 5).map(renderOrderCard).join('');
}

function getFilteredOrders() {
  const q = orderSearch.trim().toLowerCase();
  return allOrders.filter((o) => {
    if (orderFilter !== 'all' && (o.status || 'নতুন') !== orderFilter) return false;
    if (!q) return true;
    return [o.name, o.phone, o.product, o.address].some((v) => String(v || '').toLowerCase().includes(q));
  });
}

function renderOrderFilterChips() {
  const box = document.getElementById('order-filter');
  if (!box) return;
  const counts = {};
  allOrders.forEach((o) => { const s = o.status || 'নতুন'; counts[s] = (counts[s] || 0) + 1; });
  const chip = (id, label, n) => {
    const active = orderFilter === id;
    return `<button data-order-filter="${id}" class="px-3 py-1.5 rounded-full text-xs font-bold border-2 ${active ? 'bg-pink-500 text-white border-pink-500' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'}">${escapeHtml(label)} ${bnDigits(n)}</button>`;
  };
  let html = chip('all', 'সব', allOrders.length);
  html += ORDER_STATUSES.map((s) => chip(s, s, counts[s] || 0)).join('');
  box.innerHTML = html;
}

function renderAllOrders() {
  const container = document.getElementById('orders-list');
  if (!container) return;
  renderOrderFilterChips();
  if (!allOrders.length) {
    container.innerHTML = '<p class="text-gray-400 text-center py-8">কোনো অর্ডার নেই</p>';
    return;
  }
  const list = getFilteredOrders();
  if (!list.length) {
    container.innerHTML = '<p class="text-gray-400 text-center py-8">এই ফিল্টারে কোনো অর্ডার নেই</p>';
    return;
  }
  container.innerHTML = list.map(renderOrderCard).join('');
}

function statusColor(status) {
  const map = {
    'নতুন': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300',
    'কনফার্ম': 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
    'ডেলিভারি': 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300',
    'সম্পন্ন': 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300',
    'বাতিল': 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
    'ফেরত': 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300'
  };
  return map[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200';
}

function telDigits(phone) {
  return String(phone || '').replace(/[^0-9]/g, '');
}

function waDigits(phone) {
  let p = telDigits(phone);
  if (p.length === 11 && p[0] === '0') p = '88' + p;       // 01... → 8801...
  else if (p.length === 10) p = '880' + p;                 // 1... → 8801...
  return p;
}

function renderOrderCard(o) {
  const status = o.status || 'নতুন';
  const statusBtns = ORDER_STATUSES.map((s) =>
    `<button data-order-row="${o.rowIndex || ''}" data-order-status="${s}" class="text-xs px-2 py-1 rounded-lg ${s === status ? 'ring-2 ring-pink-400 font-bold' : 'bg-gray-100 dark:bg-gray-700'}">${escapeHtml(s)}</button>`
  ).join('');

  const phone = o.phone || '';
  const refundInfo = status === 'ফেরত'
    ? `<div class="mt-2 text-xs rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 p-3">
        <p class="font-bold text-orange-700 dark:text-orange-300">↩️ ফেরত তথ্য</p>
        ${o.refundReason ? `<p class="mt-1 text-gray-600 dark:text-gray-300">${escapeHtml(o.refundReason)}</p>` : ''}
        <p class="mt-1 font-semibold text-orange-700 dark:text-orange-300">রিফান্ড: ${taka(o.refundAmount || o.total || 0)}</p>
      </div>`
    : '';
  const contact = phone ? `
    <a href="tel:${telDigits(phone)}" class="text-xs px-3 py-1.5 rounded-lg bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300 font-bold">📞 কল</a>
    <a href="https://wa.me/${waDigits(phone)}" target="_blank" rel="noopener" class="text-xs px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">💬 WhatsApp</a>` : '';

  return `
    <div class="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
      <div class="flex flex-wrap justify-between gap-2 mb-2">
        <span class="font-bold">${escapeHtml(o.product || '')}${Number(o.quantity) > 1 ? ' <span class="text-gray-400 font-normal">×' + bnDigits(o.quantity) + '</span>' : ''}</span>
        <span class="font-extrabold text-green-600 dark:text-green-400">${taka(o.total || o.productPrice || 0)}</span>
      </div>
      <p class="text-sm text-gray-600 dark:text-gray-300">${escapeHtml(o.name || '')} · ${bnDigits(phone)}</p>
      <p class="text-xs text-gray-400 mt-1 truncate">${escapeHtml(o.address || '')}</p>
      <div class="flex items-center flex-wrap gap-2 mt-2">
        <span class="text-xs px-2 py-1 rounded-full ${statusColor(status)}">${escapeHtml(status)}</span>
        <span class="text-xs text-gray-400">${escapeHtml(o.delivery || '')}</span>
        <button data-refund-idx="${o._idx}" class="text-xs px-3 py-1.5 rounded-lg bg-orange-100 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 font-bold">↩️ ফেরত</button>
        ${contact}
        <button data-memo-idx="${o._idx}" class="ml-auto text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-white font-bold">🧾 মেমো</button>
      </div>
      ${refundInfo}
      ${o.rowIndex ? `<div class="flex flex-wrap gap-1 mt-3">${statusBtns}</div>` : ''}
    </div>
  `;
}

function exportOrdersCsv() {
  const list = getFilteredOrders();
  if (!list.length) { showToast('এক্সপোর্ট করার মতো অর্ডার নেই'); return; }
  const headers = ['তারিখ', 'পণ্য', 'পরিমাণ', 'একক দাম', 'পণ্য দাম', 'ডেলিভারি', 'ডেলিভারি চার্জ', 'মোট', 'নাম', 'মোবাইল', 'ঠিকানা', 'স্ট্যাটাস'];
  const esc = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
  const rows = list.map((o) => {
    const d = orderDate(o);
    return [
      d ? d.toLocaleString('en-GB') : (o.date || o.timestamp || ''),
      o.product || '', o.quantity || 1, o.unitPrice || '', o.productPrice || '',
      o.delivery || '', o.deliveryFee || '', o.total || o.productPrice || '',
      o.name || '', o.phone || '', o.address || '', o.status || 'নতুন'
    ].map(esc).join(',');
  });
  const csv = '\uFEFF' + headers.map(esc).join(',') + '\n' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'orders-' + dayKey(new Date()) + '.csv';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  showToast('CSV ডাউনলোড হচ্ছে ✅');
}

function printTodayPacking() {
  const todayKey = dayKey(new Date());
  const list = allOrders.filter((o) => {
    const d = orderDate(o);
    return d && dayKey(d) === todayKey && !isCancelled(o) && !isRefunded(o);
  });
  if (!list.length) { showToast('আজকের জন্য প্যাকিং অর্ডার নেই'); return; }
  if (typeof printPackingList === 'function') printPackingList(list, store && store.settings);
}

// ─── Products / Categories rendering ─────────────────────────

function renderProductsList() {
  const container = document.getElementById('products-list');
  const all = store.products || [];
  if (!all.length) {
    container.innerHTML = '<p class="text-gray-400 text-center py-8">কোনো পণ্য নেই — যোগ করুন</p>';
    return;
  }
  const q = productSearch.trim().toLowerCase();
  const products = q
    ? all.filter((p) => [p.name, p.id].some((v) => String(v || '').toLowerCase().includes(q)))
    : all;
  if (!products.length) {
    container.innerHTML = '<p class="text-gray-400 text-center py-8">এই নামে কোনো পণ্য নেই</p>';
    return;
  }
  container.innerHTML = products.map((p) => {
    const cat = (store.categories || []).find((c) => c.id === p.categoryId);
    const tracked = p.stock !== '' && p.stock != null && !isNaN(Number(p.stock));
    const soldOut = tracked && Number(p.stock) <= 0;
    return `
      <div class="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-3 sm:items-center">
        <img src="${escapeHtml(p.image)}" class="w-full sm:w-16 h-40 sm:h-16 rounded-xl object-cover bg-gray-100 dark:bg-gray-800" onerror="this.style.display='none'">
        <div class="flex-1 min-w-0">
          <p class="font-bold">${escapeHtml(p.name)}</p>
          <p class="text-sm text-gray-500 dark:text-gray-400">${escapeHtml(cat ? cat.title : p.categoryId)} · ${taka(p.offerPrice)}</p>
          ${tracked ? `<p class="text-xs mt-1 ${soldOut ? 'text-red-500 font-bold' : 'text-emerald-600 font-semibold'}">${soldOut ? '⛔ স্টক শেষ' : '📦 স্টক: ' + bnDigits(p.stock)}</p>` : '<p class="text-xs mt-1 text-gray-400">📦 স্টক: আনলিমিটেড</p>'}
        </div>
        <div class="flex gap-2 shrink-0">
          <button data-copy-link="${escapeHtml(p.id)}" title="অ্যাড ডিপ-লিংক কপি" class="px-3 py-2 bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-lg text-sm font-bold">🔗 লিংক</button>
          <button data-edit-product="${escapeHtml(p.id)}" class="px-3 py-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 rounded-lg text-sm font-bold">এডিট</button>
          <button data-delete-product="${escapeHtml(p.id)}" class="px-3 py-2 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-300 rounded-lg text-sm font-bold">মুছুন</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderCoupons() {
  const list = document.getElementById('coupons-list');
  if (!list) return;
  const coupons = (store && store.coupons) || [];
  if (!coupons.length) {
    list.innerHTML = '<p class="text-gray-400">এখনো কোনো কুপন নেই</p>';
    return;
  }
  list.innerHTML = coupons.map((c) => `
    <div class="bg-gray-50 dark:bg-gray-800/70 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
      <div class="flex flex-col sm:flex-row sm:items-center gap-2">
        <div class="flex-1 min-w-0">
          <p class="font-bold">${escapeHtml(c.code)} <span class="text-xs px-2 py-0.5 rounded-full ${c.active !== false ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'}">${c.active !== false ? 'Active' : 'Paused'}</span></p>
          <p class="text-sm text-gray-500 dark:text-gray-400">${c.type === 'percent' ? bnDigits(c.value) + '% ছাড়' : taka(c.value) + ' ছাড়'}${c.note ? ' · ' + escapeHtml(c.note) : ''}</p>
        </div>
        <div class="flex gap-2">
          <button data-edit-coupon="${escapeHtml(c.id)}" class="px-3 py-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 rounded-lg text-sm font-bold">এডিট</button>
          <button data-delete-coupon="${escapeHtml(c.id)}" class="px-3 py-2 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-300 rounded-lg text-sm font-bold">মুছুন</button>
        </div>
      </div>
    </div>
  `).join('');
}

function copyProductLink(id) {
  const link = window.location.origin + '/?product=' + encodeURIComponent(id);
  const done = () => showToast('লিংক কপি হয়েছে ✅ — Facebook অ্যাডে পেস্ট করুন');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(link).then(done).catch(() => prompt('কপি করুন:', link));
  } else {
    prompt('কপি করুন:', link);
  }
}

function renderCategoriesList() {
  const container = document.getElementById('categories-list');
  const cats = store.categories || [];
  const baseUrl = window.location.origin;
  container.innerHTML = cats.map((c) => `
    <div class="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800">
      <div class="flex flex-col sm:flex-row sm:items-center gap-3">
        <span class="text-3xl">${escapeHtml(c.icon || '📦')}</span>
        <div class="flex-1 min-w-0">
          <p class="font-bold">${escapeHtml(c.title)}</p>
          <p class="text-xs text-blue-600 dark:text-blue-400 break-all">${escapeHtml(baseUrl + '/' + c.slug)}</p>
        </div>
        <div class="flex gap-2">
          <button data-edit-category="${escapeHtml(c.id)}" class="px-3 py-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 rounded-lg text-sm font-bold">এডিট</button>
          <button data-delete-category="${escapeHtml(c.id)}" class="px-3 py-2 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-300 rounded-lg text-sm font-bold">মুছুন</button>
        </div>
      </div>
    </div>
  `).join('');
}

function variantRowHtml(v) {
  v = v || {};
  const vid = v.id || ('v' + Date.now() + Math.floor(Math.random() * 1000));
  const inputCls = 'px-2 py-2 text-sm border-2 border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg outline-none focus:border-pink-500';
  const hasImg = !!v.image;
  return `
    <div class="variant-row bg-white dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-xl p-2" data-vid="${escapeHtml(vid)}">
      <div class="flex gap-2 items-start">
        <label class="w-14 h-14 shrink-0 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-500 flex items-center justify-center overflow-hidden cursor-pointer bg-gray-50 dark:bg-gray-800" title="এই ভ্যারিয়েন্টের ছবি আপলোড">
          <img class="v-thumb w-full h-full object-cover ${hasImg ? '' : 'hidden'}" src="${escapeHtml(v.image || '')}">
          <span class="v-thumb-ph text-xl ${hasImg ? 'hidden' : ''}">📷</span>
          <input type="file" accept="image/*" class="v-file hidden">
        </label>
        <div class="flex-1 grid grid-cols-2 gap-1.5">
          <input class="v-color ${inputCls}" placeholder="কালার (যেমন লাল)" value="${escapeHtml(v.color || '')}">
          <input class="v-size ${inputCls}" placeholder="সাইজ (যেমন M)" value="${escapeHtml(v.size || '')}">
          <input class="v-price ${inputCls}" type="number" placeholder="দাম ৳" value="${v.price != null ? v.price : ''}">
          <input class="v-original ${inputCls}" type="number" placeholder="আসল দাম ৳" value="${v.originalPrice != null ? v.originalPrice : ''}">
        </div>
        <button type="button" class="v-remove w-8 h-8 shrink-0 text-red-500 font-bold rounded-lg active:bg-red-50 dark:active:bg-red-500/10">✕</button>
      </div>
      <input type="hidden" class="v-image" value="${escapeHtml(v.image || '')}">
    </div>
  `;
}

function addVariantRow(v) {
  const list = document.getElementById('variants-list');
  list.insertAdjacentHTML('beforeend', variantRowHtml(v));
}

function renderVariants(variants) {
  const list = document.getElementById('variants-list');
  list.innerHTML = '';
  (variants || []).forEach((v) => addVariantRow(v));
}

function collectVariants() {
  const rows = document.querySelectorAll('#variants-list .variant-row');
  const out = [];
  rows.forEach((row) => {
    const color = row.querySelector('.v-color').value.trim();
    const size = row.querySelector('.v-size').value.trim();
    const price = Number(row.querySelector('.v-price').value);
    const originalPrice = Number(row.querySelector('.v-original').value);
    const image = row.querySelector('.v-image').value.trim();
    if (!color && !size && !price) return; // skip empty row
    if (!price) return; // a variant must have a price
    const v = { id: row.dataset.vid, price: price };
    if (color) v.color = color;
    if (size) v.size = size;
    if (originalPrice) v.originalPrice = originalPrice;
    if (image) v.image = image;
    out.push(v);
  });
  return out;
}

function openProductModal(product) {
  const form = document.getElementById('product-form');
  form.categoryId.innerHTML = (store.categories || []).map((c) =>
    `<option value="${escapeHtml(c.id)}">${escapeHtml(c.title)}</option>`
  ).join('');
  form.id.value = product ? product.id : '';
  form.name.value = product ? product.name : '';
  form.categoryId.value = product ? product.categoryId : (store.categories[0] && store.categories[0].id) || '';
  form.originalPrice.value = product ? product.originalPrice : '';
  form.offerPrice.value = product ? product.offerPrice : '';
  form.stock.value = product && product.stock !== '' && product.stock != null ? product.stock : '';
  form.image.value = product ? product.image : '';
  form.description.value = product ? (product.description || '') : '';
  renderVariants(product ? product.variants : []);

  const preview = document.getElementById('product-image-preview');
  if (product && product.image) {
    preview.src = product.image;
    preview.classList.remove('hidden');
  } else {
    preview.classList.add('hidden');
  }
  document.getElementById('product-modal-title').textContent = product ? 'পণ্য এডিট' : 'নতুন পণ্য';
  document.getElementById('product-modal').classList.remove('hidden');
}

function openCategoryModal(category) {
  const form = document.getElementById('category-form');
  form.id.value = category ? category.id : '';
  form.title.value = category ? category.title : '';
  form.slug.value = category ? category.slug : '';
  form.icon.value = category ? category.icon : '📦';
  form.sortOrder.value = category ? category.sortOrder : (store.categories.length + 1);
  form.gradient.value = category ? category.gradient : 'from-red-400 to-orange-500';
  document.getElementById('category-modal').classList.remove('hidden');
}

function resetCouponForm() {
  editingCouponId = '';
  const form = document.getElementById('coupon-form');
  if (!form) return;
  form.reset();
  form.querySelector('[name="id"]').value = '';
  form.querySelector('[name="type"]').value = 'fixed';
  form.querySelector('[name="active"]').checked = true;
}

function openCouponEditor(coupon) {
  const form = document.getElementById('coupon-form');
  if (!form || !coupon) return;
  editingCouponId = coupon.id || '';
  form.querySelector('[name="id"]').value = coupon.id || '';
  form.querySelector('[name="code"]').value = coupon.code || '';
  form.querySelector('[name="type"]').value = coupon.type || 'fixed';
  form.querySelector('[name="value"]').value = coupon.value != null ? coupon.value : '';
  form.querySelector('[name="note"]').value = coupon.note || '';
  form.querySelector('[name="active"]').checked = coupon.active !== false;
}

function openRefundModal(order) {
  const form = document.getElementById('refund-form');
  if (!form || !order) return;
  form.rowIndex.value = order.rowIndex || '';
  form.refundReason.value = order.refundReason || '';
  form.refundAmount.value = order.refundAmount != null && order.refundAmount !== 0 ? order.refundAmount : (order.total || '');
  document.getElementById('refund-modal').classList.remove('hidden');
}

// ─── Security: idle auto-logout ──────────────────────────────
const IDLE_LIMIT_MS = 30 * 60 * 1000; // ৩০ মিনিট নিষ্ক্রিয় থাকলে লগআউট
let idleTimer = null;
let idleBound = false;

function resetIdleTimer() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    clearAdminToken();
    alert('নিরাপত্তার জন্য ৩০ মিনিট নিষ্ক্রিয় থাকায় স্বয়ংক্রিয়ভাবে লগআউট হয়েছে।');
    location.reload();
  }, IDLE_LIMIT_MS);
}

function startIdleWatch() {
  resetIdleTimer();
  if (idleBound) return;
  idleBound = true;
  ['click', 'keydown', 'mousemove', 'touchstart', 'scroll'].forEach((ev) =>
    document.addEventListener(ev, resetIdleTimer, { passive: true }));
}

function showAdminApp() {
  document.getElementById('login-screen').classList.add('hidden');
  const app = document.getElementById('admin-app');
  app.classList.remove('hidden');
  app.classList.add('flex');
  document.getElementById('backend-status').textContent = hasBackend()
    ? '☁️ Google Sheets সংযুক্ত'
    : '💾 লোকাল মোড';
  applyThemeButton();
  startIdleWatch();
}

// ─── Events ──────────────────────────────────────────────────

function bindEvents() {
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('login-error');
    errEl.classList.add('hidden');
    try {
      await adminLogin(document.getElementById('login-password').value);
      showAdminApp();
      await loadStore();
      await loadOrdersData();
    } catch (err) {
      errEl.textContent = err.message;
      errEl.classList.remove('hidden');
    }
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    clearAdminToken();
    location.reload();
  });

  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
  document.getElementById('menu-btn').addEventListener('click', openSidebar);
  document.getElementById('sidebar-backdrop').addEventListener('click', closeSidebar);
  document.getElementById('refresh-btn').addEventListener('click', async () => {
    showToast('রিফ্রেশ হচ্ছে...');
    await loadStore();
    await loadOrdersData();
    showToast('আপডেট হয়েছে ✅');
  });

  document.querySelectorAll('.nav-link').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  document.getElementById('add-product-btn').addEventListener('click', () => openProductModal(null));
  document.getElementById('add-category-btn').addEventListener('click', () => openCategoryModal(null));

  document.getElementById('add-variant-btn').addEventListener('click', () => addVariantRow({}));
  document.getElementById('variants-list').addEventListener('click', (e) => {
    const rm = e.target.closest('.v-remove');
    if (rm) rm.closest('.variant-row').remove();
  });
  document.getElementById('variants-list').addEventListener('change', async (e) => {
    const fileInput = e.target.closest('.v-file');
    if (!fileInput) return;
    const file = fileInput.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('ছবি ৫MB-এর কম হতে হবে'); return; }
    const row = fileInput.closest('.variant-row');
    showToast('ভ্যারিয়েন্ট ছবি আপলোড হচ্ছে...');
    try {
      const result = await adminUploadImage(file);
      row.querySelector('.v-image').value = result.url;
      const thumb = row.querySelector('.v-thumb');
      thumb.src = result.url;
      thumb.classList.remove('hidden');
      row.querySelector('.v-thumb-ph').classList.add('hidden');
      showToast('ছবি যুক্ত হয়েছে ✅');
    } catch (err) {
      alert('ছবি আপলোড ব্যর্থ: ' + err.message);
    }
  });

  document.getElementById('close-product-modal').addEventListener('click', () => {
    document.getElementById('product-modal').classList.add('hidden');
  });
  document.getElementById('close-category-modal').addEventListener('click', () => {
    document.getElementById('category-modal').classList.add('hidden');
  });
  document.getElementById('close-refund-modal').addEventListener('click', () => {
    document.getElementById('refund-modal').classList.add('hidden');
  });

  document.getElementById('product-image-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!hasBackend()) {
      alert('googleScriptUrl সেট নেই — js/config.js বা Cloudflare GOOGLE_SCRIPT_URL চেক করুন');
      return;
    }
    if (!getAdminToken()) {
      alert('আগে Admin লগইন করুন (পাসওয়ার্ড বদলালে আবার লগইন)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { alert('ছবি ৫MB-এর কম হতে হবে'); return; }
    showToast('ছবি আপলোড হচ্ছে...');
    try {
      const result = await adminUploadImage(file);
      document.getElementById('product-image-url').value = result.url;
      const preview = document.getElementById('product-image-preview');
      preview.src = result.url;
      preview.classList.remove('hidden');
      showToast('ছবি আপলোড হয়েছে — এখন **সেভ** চাপুন ✅');
    } catch (err) {
      const msg = err.message || String(err);
      if (/unauthorized|লগইন/i.test(msg)) clearAdminToken();
      alert('ছবি আপলোড ব্যর্থ: ' + msg);
    }
  });

  // Logo upload
  document.getElementById('logo-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!hasBackend() || !getAdminToken()) {
      alert('লগইন করুন এবং API URL সেট আছে কিনা দেখুন');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { alert('লোগো ৫MB-এর কম হতে হবে'); return; }
    showToast('লোগো আপলোড হচ্ছে...');
    try {
      const result = await adminUploadImage(file);
      document.getElementById('logo-url').value = result.url;
      const img = document.getElementById('logo-preview');
      img.src = result.url;
      img.classList.remove('hidden');
      document.getElementById('logo-placeholder').classList.add('hidden');
      showToast('লোগো আপলোড হয়েছে — সেটিংসে **সেভ** চাপুন ✅');
    } catch (err) {
      alert('লোগো আপলোড ব্যর্থ: ' + err.message);
    }
  });
  document.getElementById('logo-remove').addEventListener('click', () => {
    document.getElementById('logo-url').value = '';
    document.getElementById('logo-preview').classList.add('hidden');
    document.getElementById('logo-placeholder').classList.remove('hidden');
  });

  document.getElementById('product-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await adminSaveProduct({
        id: fd.get('id') || undefined,
        categoryId: fd.get('categoryId'),
        name: fd.get('name'),
        originalPrice: Number(fd.get('originalPrice')),
        offerPrice: Number(fd.get('offerPrice')),
        stock: fd.get('stock') === '' ? '' : Number(fd.get('stock')),
        image: fd.get('image'),
        description: fd.get('description') || '',
        variants: collectVariants(),
        rating: 5,
        active: true
      });
      document.getElementById('product-modal').classList.add('hidden');
      await loadStore();
      showToast('পণ্য সেভ হয়েছে ✅');
    } catch (err) {
      showToast('সেভ ব্যর্থ: ' + (err.message || err));
    }
  });

  document.getElementById('category-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await adminSaveCategory({
        id: fd.get('id') || undefined,
        slug: fd.get('slug').toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        title: fd.get('title'),
        icon: fd.get('icon') || '📦',
        gradient: fd.get('gradient'),
        sortOrder: Number(fd.get('sortOrder')) || 1,
        active: true
      });
      document.getElementById('category-modal').classList.add('hidden');
      await loadStore();
      showToast('ক্যাটাগরি সেভ হয়েছে ✅');
    } catch (err) {
      showToast('সেভ ব্যর্থ: ' + (err.message || err));
    }
  });

  document.getElementById('settings-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const settings = {
      shopName: fd.get('shopName'),
      hotline: fd.get('hotline'),
      hotlineTel: fd.get('hotlineTel'),
      deliveryFees: { dhaka: Number(fd.get('deliveryDhaka')), outside: Number(fd.get('deliveryOutside')) },
      facebookPageId: fd.get('facebookPageId'),
      facebookPixelId: fd.get('facebookPixelId'),
      ogImage: fd.get('ogImage'),
      whatsappBusiness: fd.get('whatsappBusiness'),
      whatsappNotify: fd.get('whatsappNotify'),
      logo: fd.get('logo')
    };
    const callmebotKey = fd.get('callmebotKey');
    if (callmebotKey) settings.callmebotKey = callmebotKey;
    try {
      await adminSaveSettings(settings);
      await loadStore();
      showToast('সেটিংস সেভ হয়েছে ✅ (সাইটে আপডেট হবে)');
    } catch (err) {
      showToast('সেভ ব্যর্থ: ' + (err.message || err));
    }
  });

  const couponForm = document.getElementById('coupon-form');
  if (couponForm) {
    couponForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await adminSaveCoupon({
          id: fd.get('id') || undefined,
          code: fd.get('code'),
          type: fd.get('type'),
          value: Number(fd.get('value')),
          note: fd.get('note') || '',
          active: fd.get('active') === 'on'
        });
        resetCouponForm();
        await loadStore();
        showToast('কুপন সেভ হয়েছে ✅');
      } catch (err) {
        showToast('কুপন সেভ ব্যর্থ: ' + (err.message || err));
      }
    });
  }
  const couponReset = document.getElementById('coupon-reset');
  if (couponReset) couponReset.addEventListener('click', resetCouponForm);
  const couponsList = document.getElementById('coupons-list');
  if (couponsList) {
    couponsList.addEventListener('click', async (e) => {
      const editId = e.target.dataset.editCoupon;
      const delId = e.target.dataset.deleteCoupon;
      if (editId) {
        const coupon = (store.coupons || []).find((c) => c.id === editId);
        if (coupon) openCouponEditor(coupon);
      }
      if (delId && confirm('এই কুপন মুছে ফেলবেন?')) {
        await adminDeleteCoupon(delId);
        resetCouponForm();
        await loadStore();
        showToast('কুপন মুছে ফেলা হয়েছে');
      }
    });
  }

  document.getElementById('seed-btn').addEventListener('click', async () => {
    if (!confirm('ডিফল্ট পণ্য ও ক্যাটাগরি লোড করবেন?')) return;
    await adminSeedDefaults();
    await loadStore();
    showToast('ডিফল্ট ডেটা লোড হয়েছে ✅');
  });

  document.getElementById('products-list').addEventListener('click', async (e) => {
    const copyBtn = e.target.closest('[data-copy-link]');
    if (copyBtn) { copyProductLink(copyBtn.dataset.copyLink); return; }
    const editId = e.target.dataset.editProduct;
    const delId = e.target.dataset.deleteProduct;
    if (editId) {
      const p = store.products.find((x) => x.id === editId);
      if (p) openProductModal(p);
    }
    if (delId) {
      const prod = store.products.find((x) => x.id === delId);
      if (confirm('"' + (prod ? prod.name : 'এই পণ্য') + '" মুছে ফেলবেন? এটি ফিরিয়ে আনা যাবে না।')) {
        await adminDeleteProduct(delId);
        await loadStore();
        showToast('পণ্য মুছে ফেলা হয়েছে');
      }
    }
  });

  // Product search
  const prodSearch = document.getElementById('product-search');
  if (prodSearch) {
    prodSearch.addEventListener('input', (e) => {
      productSearch = e.target.value || '';
      renderProductsList();
    });
  }

  // Orders: search, filter chips, export, packing list
  const ordSearch = document.getElementById('order-search');
  if (ordSearch) {
    ordSearch.addEventListener('input', (e) => {
      orderSearch = e.target.value || '';
      renderAllOrders();
    });
  }
  const ordFilter = document.getElementById('order-filter');
  if (ordFilter) {
    ordFilter.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-order-filter]');
      if (!btn) return;
      orderFilter = btn.dataset.orderFilter;
      renderAllOrders();
    });
  }
  const exportBtn = document.getElementById('export-orders-btn');
  if (exportBtn) exportBtn.addEventListener('click', exportOrdersCsv);
  const printTodayBtn = document.getElementById('print-today-btn');
  if (printTodayBtn) printTodayBtn.addEventListener('click', printTodayPacking);

  document.getElementById('categories-list').addEventListener('click', async (e) => {
    const editId = e.target.dataset.editCategory;
    const delId = e.target.dataset.deleteCategory;
    if (editId) {
      const c = store.categories.find((x) => x.id === editId);
      if (c) openCategoryModal(c);
    }
    if (delId) {
      const c = store.categories.find((x) => x.id === delId);
      if (confirm('"' + (c ? c.title : 'এই ক্যাটাগরি') + '" মুছে ফেলবেন? এর সব পণ্যও চলে যেতে পারে।')) {
        await adminDeleteCategory(delId);
        await loadStore();
        showToast('ক্যাটাগরি মুছে ফেলা হয়েছে');
      }
    }
  });

  // Orders + recent orders: status update & memo
  ['orders-list', 'recent-orders'].forEach((id) => {
    document.getElementById(id).addEventListener('click', async (e) => {
      const memoBtn = e.target.closest('[data-memo-idx]');
      if (memoBtn) {
        const order = allOrders[Number(memoBtn.dataset.memoIdx)];
        if (order && typeof openMemoModal === 'function') openMemoModal(order, store && store.settings);
        return;
      }
      const refundBtn = e.target.closest('[data-refund-idx]');
      if (refundBtn) {
        const order = allOrders[Number(refundBtn.dataset.refundIdx)];
        if (order) openRefundModal(order);
        return;
      }
      const row = e.target.dataset.orderRow;
      const status = e.target.dataset.orderStatus;
      if (!row || !status) return;
      if (status === 'ফেরত') {
        const order = allOrders.find((o) => Number(o.rowIndex) === Number(row));
        if (order) openRefundModal(order);
        return;
      }
      await adminUpdateOrderStatus(Number(row), status);
      showToast('স্ট্যাটাস আপডেট: ' + status);
      await loadStore();
      await loadOrdersData();
    });
  });

  const refundForm = document.getElementById('refund-form');
  if (refundForm) {
    refundForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await adminUpdateOrderStatus(Number(fd.get('rowIndex')), 'ফেরত', {
          refundReason: fd.get('refundReason') || '',
          refundAmount: Number(fd.get('refundAmount')) || 0
        });
        document.getElementById('refund-modal').classList.add('hidden');
        showToast('রিফান্ড তথ্য সেভ হয়েছে ✅');
        await loadStore();
        await loadOrdersData();
      } catch (err) {
        showToast('রিফান্ড সেভ ব্যর্থ: ' + (err.message || err));
      }
    });
  }
}

async function initAdmin() {
  bindEvents();
  resetCouponForm();
  applyThemeButton();
  if (getAdminToken()) {
    try {
      showAdminApp();
      await loadStore();
      await loadOrdersData();
    } catch {
      clearAdminToken();
    }
  }
}

document.addEventListener('DOMContentLoaded', initAdmin);
