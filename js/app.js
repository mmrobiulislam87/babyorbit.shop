/**

 * Storefront — dynamic, responsive, all devices

 */



let STORE = null;

let CATEGORIES = [];

let PRODUCTS_LIST = [];

let PRODUCTS_MAP = {};

let selectedPrice = 0;

let selectedUnitPrice = 0;

let selectedQty = 1;

let selectedProductId = '';

let isSubmitting = false;

let lastOrder = null;

let PRODUCTS_BY_ID = {};

let searchTerm = '';

let activeFilter = 'all';

let qvProduct = null;

let qvVariants = [];

let qvSelectedVariant = null;

let selectedVariantId = '';

let appliedCoupon = null;

let appliedDiscount = 0;



function getDeliveryFees() {

  const fees = STORE && STORE.settings && STORE.settings.deliveryFees;

  return fees || SHOP_CONFIG.deliveryFees || { dhaka: 60, outside: 120 };

}



function formatPrice(amount) {

  return '৳' + Number(amount).toLocaleString('bn-BD');

}

function stockValue(p) {

  if (!p || p.stock === '' || p.stock == null || isNaN(Number(p.stock))) return Infinity;

  return Number(p.stock);

}

function isOutOfStock(p) {

  return stockValue(p) <= 0;

}

function normalizeCouponCode(code) {

  return String(code || '').trim().toUpperCase();

}

function getAvailableCoupons() {

  return (STORE && STORE.coupons ? STORE.coupons : []).filter((c) => c && c.active !== false);

}

function getCouponByCode(code) {

  const want = normalizeCouponCode(code);

  if (!want) return null;

  return getAvailableCoupons().find((c) => normalizeCouponCode(c.code) === want) || null;

}

function getCouponDiscount(subtotal, coupon) {

  subtotal = Number(subtotal) || 0;

  if (!coupon || subtotal <= 0) return 0;

  let discount = coupon.type === 'percent'

    ? Math.round((subtotal * (Number(coupon.value) || 0)) / 100)

    : Number(coupon.value) || 0;

  if (discount < 0) discount = 0;

  if (discount > subtotal) discount = subtotal;

  return discount;

}

function applyCouponFromInput(showFeedback) {

  const input = document.getElementById('coupon-code');

  const code = normalizeCouponCode(input && input.value);

  const note = document.getElementById('coupon-message');

  appliedCoupon = null;

  appliedDiscount = 0;

  if (!code) {

    if (note) note.className = 'hidden text-sm mt-2';

    updateOrderTotal();

    return false;

  }

  const coupon = getCouponByCode(code);

  if (!coupon) {

    if (note) {

      note.textContent = 'এই কুপন কোডটি বৈধ নয়';

      note.className = 'text-red-500 text-sm mt-2';

    }

    updateOrderTotal();

    return false;

  }

  appliedCoupon = coupon;

  appliedDiscount = getCouponDiscount(selectedUnitPrice * selectedQty, coupon);

  if (note) {

    const valueLabel = coupon.type === 'percent'

      ? toBengaliDigits(coupon.value) + '%'

      : formatPrice(coupon.value);

    note.textContent = 'কুপন অ্যাপ্লাই হয়েছে: ' + normalizeCouponCode(coupon.code) + ' (' + valueLabel + ')';

    note.className = 'text-green-600 text-sm mt-2';

  }

  updateOrderTotal();

  return true;

}

function clearCouponState(resetInput) {

  appliedCoupon = null;

  appliedDiscount = 0;

  const note = document.getElementById('coupon-message');

  if (note) note.className = 'hidden text-sm mt-2';

  if (resetInput) {

    const input = document.getElementById('coupon-code');

    if (input) input.value = '';

  }

}



function renderStars(count) {

  return '⭐'.repeat(count || 5);

}



function toBengaliDigits(str) {

  const map = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

  return String(str).replace(/\d/g, (d) => map[d]);

}



function getCategoryMeta(slugOrId) {

  return CATEGORIES.find((c) => c.slug === slugOrId || c.id === slugOrId);

}



// Facebook Pixel helper — safe no-op if pixel isn't configured.

function trackPixel(event, params) {

  if (window.fbq && STORE && STORE.settings && STORE.settings.facebookPixelId) {

    fbq('track', event, params || {});

  }

}



const BUYER_KEY = 'babyshop_buyer';



function saveBuyerInfo(info) {

  try { localStorage.setItem(BUYER_KEY, JSON.stringify(info)); } catch (e) {}

}



function prefillBuyerInfo() {

  let info;

  try { info = JSON.parse(localStorage.getItem(BUYER_KEY) || 'null'); } catch (e) { info = null; }

  if (!info) return;

  const name = document.getElementById('customer-name');

  const phone = document.getElementById('customer-phone');

  const address = document.getElementById('customer-address');

  if (name && !name.value) name.value = info.name || '';

  if (phone && !phone.value) phone.value = info.phone || '';

  if (address && !address.value) address.value = info.address || '';

}



// Cache bust: append a version param so updated logos bypass the browser image cache.

function withCacheBust(url, version) {

  if (!url || !version) return url || '';

  if (url.indexOf('data:') === 0) return url; // base64 (local mode) — no param

  return url + (url.indexOf('?') === -1 ? '?' : '&') + 'v=' + encodeURIComponent(version);

}



function applyLogo(settings) {

  const logo = withCacheBust(settings.logo || '', settings.logoVersion);

  const img = document.getElementById('site-logo');

  const fallback = document.getElementById('site-logo-fallback');

  if (!img) return;

  if (logo) {

    img.src = logo;

    img.alt = settings.shopName || SHOP_CONFIG.shopName || 'Logo';

    img.classList.remove('hidden');

    if (fallback) fallback.classList.add('hidden');

    document.querySelectorAll('link[rel="icon"], link[rel="apple-touch-icon"]').forEach((l) => l.setAttribute('href', logo));

  } else {

    img.classList.add('hidden');

    if (fallback) fallback.classList.remove('hidden');

  }

}



function applyMetaTags(settings) {

  const shopName = settings.shopName || SHOP_CONFIG.shopName || 'Baby Orbit';

  const desc = shopName + ' — ক্যাশ অন ডেলিভারিতে বেবি পণ্য অর্ডার করুন';

  const ogImage = settings.ogImage

    || withCacheBust(settings.logo || '', settings.logoVersion)

    || 'https://images.unsplash.com/photo-1515488042361-ee00e17a8abf?w=1200&h=630&fit=crop';



  document.title = shopName + ' — সরাসরি অর্ডার করুন';

  document.querySelector('meta[name="description"]').setAttribute('content', desc);



  const ogTitle = document.getElementById('og-title');

  const ogDesc = document.getElementById('og-desc');

  const ogImageEl = document.getElementById('og-image');

  const ogUrl = document.getElementById('og-url');

  if (ogTitle) ogTitle.setAttribute('content', document.title);

  if (ogDesc) ogDesc.setAttribute('content', desc);

  if (ogImageEl) ogImageEl.setAttribute('content', ogImage);

  if (ogUrl) ogUrl.setAttribute('content', window.location.href.split('?')[0]);

}



function applyShopConfig() {

  const settings = (STORE && STORE.settings) || {};

  const hotline = settings.hotline || SHOP_CONFIG.hotline || '';

  const tel = settings.hotlineTel || SHOP_CONFIG.hotlineTel || ('880' + hotline.replace(/^0/, ''));



  document.querySelectorAll('[data-hotline-link]').forEach((el) => {

    el.href = 'tel:' + tel;

  });

  document.querySelectorAll('[data-hotline-text]').forEach((el) => {

    el.textContent = toBengaliDigits(hotline);

  });



  const shopName = settings.shopName || SHOP_CONFIG.shopName;

  const logoTitle = document.querySelector('header h1');

  if (logoTitle && shopName) logoTitle.textContent = shopName;



  applyLogo(settings);

  applyMetaTags(settings);

  applyWhatsAppLinks(settings);

  applyFacebookLink(settings);

  applyFacebookPixel(settings);

}



function applyWhatsAppLinks(settings) {

  const wa = (settings.whatsappBusiness || '').replace(/\D/g, '');

  const headerBtn = document.getElementById('whatsapp-btn');

  const footerBtn = document.getElementById('footer-whatsapp');

  const footerGrid = document.querySelector('footer .grid');



  if (wa) {

    const link = 'https://wa.me/' + wa + '?text=' + encodeURIComponent('হ্যালো, আমি অর্ডার করতে চাই');

    [headerBtn, footerBtn].forEach((btn) => {

      if (!btn) return;

      btn.href = link;

      btn.classList.remove('hidden');

      if (btn.id === 'footer-whatsapp') btn.classList.add('flex');

    });

    if (footerGrid) footerGrid.className = 'grid grid-cols-4 gap-1 text-center';

  } else {

    [headerBtn, footerBtn].forEach((btn) => btn && btn.classList.add('hidden'));

    if (footerGrid) footerGrid.className = 'grid grid-cols-3 gap-1 text-center';

  }

}



function applyFacebookLink(settings) {

  const pageId = settings.facebookPageId || '';

  const btn = document.getElementById('facebook-btn');

  if (!btn) return;

  if (pageId) {

    btn.href = 'https://www.facebook.com/' + pageId;

    btn.classList.remove('hidden');

  } else {

    btn.classList.add('hidden');

  }

}



function applyFacebookPixel(settings) {

  const pixelId = settings.facebookPixelId;

  if (!pixelId || document.getElementById('fb-pixel')) return;

  const script = document.createElement('script');

  script.id = 'fb-pixel';

  script.textContent =

    "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?" +

    "n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;" +

    "n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;" +

    "t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script'," +

    "'https://connect.facebook.net/en_US/fbevents.js');" +

    "fbq('init','" + pixelId + "');fbq('track','PageView');";

  document.head.appendChild(script);

}



function renderCategoryNav() {

  const nav = document.getElementById('category-nav');

  if (!nav || !CATEGORIES.length) {

    if (nav) nav.innerHTML = '<p class="text-gray-400 col-span-full">ক্যাটাগরি লোড হচ্ছে...</p>';

    return;

  }



  const cols = Math.min(CATEGORIES.length, window.innerWidth >= 1024 ? 6 : window.innerWidth >= 640 ? 4 : 3);

  nav.className = 'category-nav grid gap-3 md:gap-4 mb-2';

  nav.style.gridTemplateColumns = 'repeat(' + cols + ', minmax(0, 1fr))';



  nav.innerHTML = CATEGORIES.map((cat) => `

    <button type="button" data-scroll="${escapeHtml(cat.slug)}" class="category-btn flex flex-col items-center gap-2 group">

      <div class="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br ${escapeHtml(cat.gradient || 'from-pink-400 to-purple-500')} flex items-center justify-center text-2xl sm:text-3xl md:text-4xl shadow-lg">${escapeHtml(cat.icon || '📦')}</div>

      <span class="text-xs sm:text-sm font-bold text-gray-800 leading-tight text-center">${escapeHtml(cat.title)}</span>

    </button>

  `).join('');

}



function renderCategorySections() {

  const container = document.getElementById('category-sections');

  if (!container) return;



  container.innerHTML = CATEGORIES.map((cat) => `

    <section id="${escapeHtml(cat.slug)}" class="category-section scroll-mt-24" data-category-id="${escapeHtml(cat.id)}">

      <div class="flex items-center gap-3 mb-5 md:mb-6">

        <span class="text-3xl md:text-4xl">${escapeHtml(cat.icon || '📦')}</span>

        <h2 class="text-xl md:text-2xl lg:text-3xl font-extrabold text-gray-900">${escapeHtml(cat.title)}</h2>

      </div>

      <div class="products-grid" id="products-${escapeHtml(cat.id)}"></div>

    </section>

  `).join('');

}



function createProductCard(product) {

  const card = document.createElement('article');

  const soldOut = isOutOfStock(product);

  card.className = 'product-card bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-100 h-full flex flex-col';

  card.innerHTML = `

    <div class="relative cursor-pointer" data-quickview="${escapeHtml(product.id)}">

      <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" loading="lazy"

        class="w-full h-44 sm:h-48 md:h-52 object-cover bg-gray-100"

        onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22><rect fill=%22%23fce7f3%22 width=%22100%25%22 height=%22100%25%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2248%22>👶</text></svg>'">

      <span class="absolute top-3 left-3 ${soldOut ? 'bg-gray-900' : 'bg-red-500'} text-white text-xs font-bold px-3 py-1 rounded-full">${soldOut ? 'স্টক শেষ' : 'অফার!'}</span>

      <span class="absolute bottom-2 right-2 bg-black/55 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">🔍 বিস্তারিত</span>

    </div>

    <div class="p-4 md:p-5 flex flex-col flex-1">

      <h3 class="text-base md:text-lg font-bold text-gray-900 leading-snug cursor-pointer hover:text-pink-600" data-quickview="${escapeHtml(product.id)}">${escapeHtml(product.name)}</h3>

      <p class="text-yellow-500 text-sm mt-1">${renderStars(product.rating)} <span class="text-gray-400">(৫.০)</span></p>

      <div class="flex items-baseline gap-2 mt-2 mb-3 flex-wrap">

        ${(product.variants && product.variants.length)

          ? `<span class="text-red-500 text-xl md:text-2xl font-extrabold">${formatPrice(Math.min.apply(null, product.variants.map((v) => v.price)))}</span>

             <span class="text-gray-400 text-xs">থেকে</span>

             <span class="text-[10px] font-bold bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full">কালার/সাইজ</span>`

          : `<span class="text-gray-400 line-through text-sm">${formatPrice(product.originalPrice)}</span>

             <span class="text-red-500 text-xl md:text-2xl font-extrabold">${formatPrice(product.offerPrice)}</span>`}

      </div>

      <button type="button" data-quickview="${escapeHtml(product.id)}"

        class="mb-2 w-full py-2 border-2 border-pink-200 text-pink-600 text-sm font-bold rounded-xl active:scale-[0.97] transition-transform">

        🔍 বিস্তারিত দেখুন

      </button>

      <button type="button"

        class="order-btn mt-auto w-full py-3 md:py-4 ${soldOut ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'} text-sm md:text-base font-extrabold rounded-2xl active:scale-[0.97] transition-transform"

        data-product-id="${escapeHtml(product.id)}"

        data-product-name="${escapeHtml(product.name)}"

        data-product-price="${product.offerPrice}" ${soldOut ? 'disabled' : ''}>

        ${soldOut ? '⛔ স্টক শেষ' : '🛒 সরাসরি অর্ডার করুন (COD)'}

      </button>

    </div>

  `;

  return card;

}



function matchesSearch(p) {

  if (!searchTerm) return true;

  const hay = ((p.name || '') + ' ' + (p.description || '')).toLowerCase();

  return hay.indexOf(searchTerm) !== -1;

}



function renderAllProducts() {

  let totalVisible = 0;



  CATEGORIES.forEach((cat) => {

    const section = document.getElementById(cat.slug);

    const container = document.getElementById('products-' + cat.id);

    if (!container) return;



    const inFilter = (activeFilter === 'all' || activeFilter === cat.id);

    const items = (PRODUCTS_MAP[cat.id] || []).filter(matchesSearch);



    container.innerHTML = '';

    const show = inFilter && items.length > 0;

    if (section) section.classList.toggle('hidden', !show);



    if (show) {

      items.forEach((p) => container.appendChild(createProductCard(p)));

      totalVisible += items.length;

    }

  });



  const noResults = document.getElementById('no-results');

  if (noResults) noResults.classList.toggle('hidden', totalVisible > 0);

}



function renderFilterChips() {

  const wrap = document.getElementById('filter-chips');

  if (!wrap) return;

  const chip = (id, label) =>

    `<button type="button" data-filter="${escapeHtml(id)}"

       class="filter-chip whitespace-nowrap px-4 py-2 rounded-full text-sm font-bold border-2 transition-colors ${id === activeFilter ? 'bg-pink-500 text-white border-pink-500' : 'bg-white text-gray-600 border-gray-200'}">

       ${label}</button>`;

  wrap.innerHTML = chip('all', '🛍️ সব') +

    CATEGORIES.map((c) => chip(c.id, (c.icon || '') + ' ' + escapeHtml(c.title))).join('');

}



function setFilter(filterId) {

  exitSingleCategoryMode();

  activeFilter = filterId;

  renderFilterChips();

  renderAllProducts();

}



function applyQvPrice(offer, original) {

  offer = Number(offer) || 0;

  original = Number(original) || 0;

  document.getElementById('qv-price').textContent = formatPrice(offer);

  const origEl = document.getElementById('qv-original');

  const discountEl = document.getElementById('qv-discount');

  const saveEl = document.getElementById('qv-save');

  const savings = original - offer;

  if (savings > 0 && original > 0) {

    const pct = Math.round((savings / original) * 100);

    origEl.textContent = formatPrice(original);

    origEl.classList.remove('hidden');

    discountEl.textContent = '−' + toBengaliDigits(pct) + '% ছাড়';

    discountEl.classList.remove('hidden');

    saveEl.textContent = '🎉 আপনি বাঁচাচ্ছেন ' + formatPrice(savings) + ' (' + toBengaliDigits(pct) + '%)';

    saveEl.classList.remove('hidden');

  } else {

    origEl.classList.add('hidden');

    discountEl.classList.add('hidden');

    saveEl.classList.add('hidden');

  }

}

function applyStockUi(product) {

  const stockEl = document.getElementById('qv-stock');

  const btn = document.getElementById('qv-order');

  const stock = stockValue(product);

  const soldOut = stock <= 0;

  if (stockEl) {

    if (soldOut) {

      stockEl.textContent = '⛔ এই পণ্যটি বর্তমানে স্টক শেষ';

      stockEl.className = 'text-red-500 text-sm font-bold mt-2';

    } else if (Number.isFinite(stock)) {

      stockEl.textContent = '📦 স্টকে আছে: ' + toBengaliDigits(stock) + ' টি';

      stockEl.className = 'text-emerald-600 text-sm font-bold mt-2';

    } else {

      stockEl.textContent = '';

      stockEl.className = 'hidden';

    }

  }

  if (btn) {

    btn.disabled = soldOut;

    btn.textContent = soldOut ? '⛔ স্টক শেষ' : '🛒 এখনই অর্ডার করুন';

    btn.classList.toggle('opacity-60', soldOut);

    btn.classList.toggle('cursor-not-allowed', soldOut);

  }

}



function variantLabel(v) {

  return [v.color, v.size].filter(Boolean).join(' · ');

}



function composedProductName(product, v) {

  const label = variantLabel(v);

  return label ? product.name + ' (' + label + ')' : product.name;

}



function qvSelectVariant(index) {

  const v = qvVariants[index];

  if (!v) return;

  qvSelectedVariant = v;

  selectedVariantId = v.id || '';

  applyQvPrice(v.price, v.originalPrice || qvProduct.originalPrice);

  const img = document.getElementById('qv-image');

  if (img) img.src = v.image || qvProduct.image || '';

  const orderBtn = document.getElementById('qv-order');

  orderBtn.dataset.productId = qvProduct.id;

  orderBtn.dataset.productName = composedProductName(qvProduct, v);

  orderBtn.dataset.productPrice = v.price;

  orderBtn.dataset.variantId = v.id || '';

  applyStockUi(qvProduct);

  document.querySelectorAll('#quickview-modal .qv-chip').forEach((c) => {

    const on = Number(c.dataset.vindex) === index;

    c.classList.toggle('border-pink-500', on);

    c.classList.toggle('bg-pink-50', on);

    c.classList.toggle('text-pink-700', on);

    c.classList.toggle('border-gray-200', !on);

    c.classList.toggle('text-gray-700', !on);

  });

}



function openQuickView(id) {

  const p = PRODUCTS_BY_ID[id];

  if (!p) return;

  qvProduct = p;

  qvVariants = (p.variants || []).filter((v) => v && v.price);

  qvSelectedVariant = null;

  selectedVariantId = '';



  document.getElementById('qv-image').src = p.image || '';

  document.getElementById('qv-image').alt = p.name || '';

  document.getElementById('qv-name').textContent = p.name || '';

  document.getElementById('qv-rating').innerHTML = renderStars(p.rating) + ' <span class="text-gray-400">(৫.০)</span>';

  document.getElementById('qv-desc').textContent = p.description || 'এই পণ্যটি অর্ডার করতে নিচের বাটনে ক্লিক করুন। ক্যাশ অন ডেলিভারিতে — পণ্য হাতে পেয়ে টাকা দিন। পছন্দ না হলে সহজ রিটার্ন সুবিধা।';

  applyStockUi(p);



  // Reset variant UI

  ['qv-color-wrap', 'qv-size-wrap', 'qv-variant-wrap'].forEach((w) => document.getElementById(w).classList.add('hidden'));

  ['qv-colors', 'qv-sizes', 'qv-variants'].forEach((c) => { document.getElementById(c).innerHTML = ''; });



  const orderBtn = document.getElementById('qv-order');



  if (qvVariants.length) {

    const anyColor = qvVariants.some((v) => v.color);

    const anySize = qvVariants.some((v) => v.size);

    const mode = (anyColor && !anySize) ? 'color' : (anySize && !anyColor) ? 'size' : 'variant';

    const containerId = mode === 'color' ? 'qv-colors' : mode === 'size' ? 'qv-sizes' : 'qv-variants';

    const wrapId = mode === 'color' ? 'qv-color-wrap' : mode === 'size' ? 'qv-size-wrap' : 'qv-variant-wrap';



    document.getElementById(containerId).innerHTML = qvVariants.map((v, i) => {

      const label = mode === 'color' ? v.color : mode === 'size' ? v.size : (variantLabel(v) || ('অপশন ' + toBengaliDigits(i + 1)));

      const thumb = v.image

        ? `<img src="${escapeHtml(v.image)}" class="w-6 h-6 rounded object-cover" onerror="this.style.display='none'">`

        : '';

      return `<button type="button" data-vindex="${i}"

        class="qv-chip inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 border-gray-200 text-gray-700 text-sm font-bold active:scale-95 transition-transform">

        ${thumb}<span>${escapeHtml(label)}</span> <span class="text-red-500">${formatPrice(v.price)}</span></button>`;

    }).join('');

    document.getElementById(wrapId).classList.remove('hidden');

    qvSelectVariant(0);

  } else {

    applyQvPrice(p.offerPrice, p.originalPrice);

    orderBtn.dataset.productId = p.id;

    orderBtn.dataset.productName = p.name;

    orderBtn.dataset.productPrice = p.offerPrice;

    orderBtn.dataset.variantId = '';

    applyStockUi(p);

  }



  const m = document.getElementById('quickview-modal');

  m.classList.remove('hidden');

  m.classList.add('flex');



  trackPixel('ViewContent', { content_name: p.name, content_ids: [p.id], content_type: 'product', value: p.offerPrice, currency: 'BDT' });

}



function closeQuickView() {

  const m = document.getElementById('quickview-modal');

  m.classList.add('hidden');

  m.classList.remove('flex');

}



function scrollToElement(id) {

  const el = document.getElementById(id);

  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });

}



function updateOrderTotal() {

  selectedPrice = selectedUnitPrice * selectedQty;

  document.getElementById('product-price-input').value = selectedPrice;



  const delivery = document.querySelector('input[name="delivery"]:checked');

  const fees = getDeliveryFees();

  const deliveryFee = delivery ? (fees[delivery.value] || 0) : 0;

  if (appliedCoupon) appliedDiscount = getCouponDiscount(selectedPrice, appliedCoupon);

  const total = Math.max(0, selectedPrice - appliedDiscount) + deliveryFee;



  const box = document.getElementById('order-total-box');

  if (!selectedPrice || !delivery) {

    box.classList.add('hidden');

    return;

  }



  box.classList.remove('hidden');

  const qtyLabel = selectedQty > 1 ? ' (' + toBengaliDigits(selectedQty) + ' টি)' : '';

  document.getElementById('total-product').textContent = formatPrice(selectedPrice) + qtyLabel;

  const discountRow = document.getElementById('coupon-discount-row');

  if (discountRow) discountRow.classList.toggle('hidden', !appliedDiscount);

  const discountEl = document.getElementById('total-discount');

  if (discountEl) discountEl.textContent = '−' + formatPrice(appliedDiscount || 0);

  document.getElementById('total-delivery').textContent = formatPrice(deliveryFee);

  document.getElementById('total-grand').textContent = formatPrice(total);

}



function updateStickyBar() {

  const bar = document.getElementById('sticky-order-bar');

  if (!bar) return;

  if (!selectedUnitPrice) { bar.classList.add('hidden'); return; }

  document.getElementById('sticky-name').textContent =

    document.getElementById('product-name-input').value;

  document.getElementById('sticky-price').textContent =

    formatPrice(selectedUnitPrice * selectedQty) + (selectedQty > 1 ? ' · ' + toBengaliDigits(selectedQty) + ' টি' : '');

  bar.classList.remove('hidden');

}



function setQty(qty) {

  selectedQty = Math.max(1, qty || 1);

  const input = document.getElementById('qty-input');

  if (input) input.value = toBengaliDigits(selectedQty);

  document.getElementById('selected-product-price').textContent =

    formatPrice(selectedUnitPrice) + (selectedQty > 1 ? ' × ' + toBengaliDigits(selectedQty) : '');

  updateOrderTotal();

  updateStickyBar();

}



function selectProduct(name, price, id, variantId) {

  const product = PRODUCTS_BY_ID[id];

  if (product && isOutOfStock(product)) {

    alert('দুঃখিত, এই পণ্যটি বর্তমানে স্টক শেষ।');

    return;

  }

  selectedUnitPrice = price;

  selectedQty = 1;

  selectedProductId = id || '';

  selectedVariantId = variantId || '';

  clearCouponState(true);

  document.getElementById('product-name-input').value = name;

  document.getElementById('selected-product-name').textContent = name;

  document.getElementById('selected-product-box').classList.remove('hidden');

  document.getElementById('no-product-warning').classList.add('hidden');

  setQty(1);

  setTimeout(() => scrollToElement('order-form-section'), 150);



  trackPixel('InitiateCheckout', { content_name: name, content_ids: id ? [id] : undefined, value: price, currency: 'BDT' });

}



function updateDeliveryChecks() {

  document.querySelectorAll('.delivery-option').forEach((option) => {

    const input = option.querySelector('input[type="radio"]');

    const checkIcon = option.querySelector('.check-icon');

    if (input && checkIcon) checkIcon.classList.toggle('hidden', !input.checked);

  });

  updateOrderTotal();

}



function updateDeliveryLabels() {

  const fees = getDeliveryFees();

  const dhakaLabel = document.querySelector('[data-delivery-fee="dhaka"]');

  const outsideLabel = document.querySelector('[data-delivery-fee="outside"]');

  if (dhakaLabel) dhakaLabel.textContent = 'ডেলিভারি ৳' + fees.dhaka;

  if (outsideLabel) outsideLabel.textContent = 'ডেলিভারি ৳' + fees.outside;

}



function setSubmitLoading(loading) {

  const btn = document.getElementById('submit-order-btn');

  if (!btn) return;

  btn.disabled = loading;

  btn.textContent = loading ? '⏳ অর্ডার পাঠানো হচ্ছে...' : '✅ অর্ডার নিশ্চিত করুন';

}



function detectCategoryFromUrl() {

  const queryCat = new URLSearchParams(window.location.search).get('category');

  if (queryCat) return queryCat;



  const path = window.location.pathname.replace(/^\/|\/$/g, '').toLowerCase();

  if (!path || path === 'index.html' || path.startsWith('admin') || path.startsWith('js')) return null;



  const match = CATEGORIES.find((c) => c.slug === path || c.id === path);

  return match ? match.slug : null;

}



function applySingleCategoryMode(categorySlug) {

  const cat = getCategoryMeta(categorySlug);

  if (!cat) return;



  document.body.classList.add('single-category-mode', 'hide-category-nav');

  document.querySelectorAll('.category-section').forEach((section) => {

    if (section.id !== cat.slug) section.classList.add('hidden-cat');

  });



  document.getElementById('single-category-icon').textContent = cat.icon || '📦';

  document.getElementById('single-category-title').textContent = cat.title;

  document.getElementById('single-category-banner').classList.remove('hidden');

  document.title = cat.title + ' — ' + ((STORE && STORE.settings.shopName) || SHOP_CONFIG.shopName);

  setTimeout(() => scrollToElement(cat.slug), 300);

}



function exitSingleCategoryMode() {

  if (!document.body.classList.contains('single-category-mode')) return;

  document.body.classList.remove('single-category-mode', 'hide-category-nav');

  document.querySelectorAll('.category-section.hidden-cat').forEach((s) => s.classList.remove('hidden-cat'));

  const banner = document.getElementById('single-category-banner');

  if (banner) banner.classList.add('hidden');

}



function bindEvents() {

  const categoryNav = document.getElementById('category-nav');

  if (categoryNav) {

    categoryNav.addEventListener('click', (e) => {

      const btn = e.target.closest('[data-scroll]');

      if (!btn) return;

      // Make sure the target section is visible before scrolling

      exitSingleCategoryMode();

      const input = document.getElementById('product-search');

      if (searchTerm) { searchTerm = ''; if (input) input.value = ''; }

      if (activeFilter !== 'all') setFilter('all'); else renderAllProducts();

      setTimeout(() => scrollToElement(btn.dataset.scroll), 50);

    });

  }



  document.getElementById('products-main').addEventListener('click', (e) => {

    const qv = e.target.closest('[data-quickview]');

    if (qv) { openQuickView(qv.dataset.quickview); return; }

    const btn = e.target.closest('.order-btn');

    if (!btn) return;

    const prod = PRODUCTS_BY_ID[btn.dataset.productId];

    if (prod && prod.variants && prod.variants.length) { openQuickView(prod.id); return; }

    selectProduct(btn.dataset.productName, parseInt(btn.dataset.productPrice, 10), btn.dataset.productId, btn.dataset.variantId || '');

    document.getElementById('customer-name').focus({ preventScroll: true });

  });



  // Search

  const searchInput = document.getElementById('product-search');

  if (searchInput) {

    searchInput.addEventListener('input', (e) => {

      searchTerm = (e.target.value || '').trim().toLowerCase();

      if (searchTerm) exitSingleCategoryMode();

      renderAllProducts();

    });

  }



  // Category filter chips

  const chips = document.getElementById('filter-chips');

  if (chips) {

    chips.addEventListener('click', (e) => {

      const btn = e.target.closest('[data-filter]');

      if (btn) setFilter(btn.dataset.filter);

    });

  }



  const clearBtn = document.getElementById('clear-search');

  if (clearBtn) {

    clearBtn.addEventListener('click', () => {

      searchTerm = '';

      if (searchInput) searchInput.value = '';

      setFilter('all');

    });

  }



  // Quick View modal

  const qvModal = document.getElementById('quickview-modal');

  document.getElementById('qv-close').addEventListener('click', closeQuickView);

  qvModal.addEventListener('click', (e) => {

    if (e.target === qvModal) { closeQuickView(); return; }

    const chip = e.target.closest('.qv-chip');

    if (chip) qvSelectVariant(Number(chip.dataset.vindex));

  });

  document.getElementById('qv-order').addEventListener('click', (e) => {

    const b = e.currentTarget;

    closeQuickView();

    selectProduct(b.dataset.productName, parseInt(b.dataset.productPrice, 10), b.dataset.productId, b.dataset.variantId || '');

  });



  // Quantity stepper

  document.getElementById('qty-minus').addEventListener('click', () => setQty(selectedQty - 1));

  document.getElementById('qty-plus').addEventListener('click', () => setQty(selectedQty + 1));

  const couponApply = document.getElementById('coupon-apply');

  if (couponApply) couponApply.addEventListener('click', () => applyCouponFromInput(true));

  const couponClear = document.getElementById('coupon-clear');

  if (couponClear) couponClear.addEventListener('click', () => { clearCouponState(true); updateOrderTotal(); });

  const couponInput = document.getElementById('coupon-code');

  if (couponInput) {

    couponInput.addEventListener('keydown', (e) => {

      if (e.key === 'Enter') {

        e.preventDefault();

        applyCouponFromInput(true);

      }

    });

  }



  // Hero CTA → jump straight to products

  const heroCta = document.getElementById('hero-cta');

  if (heroCta) {

    heroCta.addEventListener('click', () => scrollToElement('category-sections'));

  }



  // Sticky order bar

  document.getElementById('sticky-order-btn').addEventListener('click', () => {

    scrollToElement('order-form-section');

    document.getElementById('customer-name').focus({ preventScroll: true });

  });



  // Hide the sticky bar while the order form is on screen (avoid covering submit)

  const formSection = document.getElementById('order-form-section');

  if (formSection && 'IntersectionObserver' in window) {

    const obs = new IntersectionObserver((entries) => {

      const bar = document.getElementById('sticky-order-bar');

      if (!bar) return;

      entries.forEach((en) => {

        if (selectedUnitPrice && !en.isIntersecting) bar.classList.remove('hidden');

        else bar.classList.add('hidden');

      });

    }, { threshold: 0.15 });

    obs.observe(formSection);

  }



  document.querySelectorAll('input[name="delivery"]').forEach((radio) => {

    radio.addEventListener('change', updateDeliveryChecks);

  });



  document.getElementById('customer-phone').addEventListener('blur', (e) => {

    const err = document.getElementById('phone-error');

    if (!isValidBdPhone(e.target.value)) {

      err.classList.remove('hidden');

    } else {

      err.classList.add('hidden');

    }

  });



  document.getElementById('order-form').addEventListener('submit', async (e) => {

    e.preventDefault();

    if (isSubmitting) return;



    const product = document.getElementById('product-name-input').value.trim();

    const productPrice = parseInt(document.getElementById('product-price-input').value, 10) || 0;



    if (!product || !productPrice) {

      document.getElementById('no-product-warning').classList.remove('hidden');

      scrollToElement('order-form-section');

      alert('অর্ডার করতে আগে উপর থেকে একটি পণ্য সিলেক্ট করুন।');

      return;

    }



    const form = e.target;

    const formData = new FormData(form);

    const phone = formData.get('phone');



    if (!isValidBdPhone(phone)) {

      document.getElementById('phone-error').classList.remove('hidden');

      document.getElementById('customer-phone').focus();

      return;

    }



    const delivery = formData.get('delivery');

    if (!delivery) {

      alert('ডেলিভারি এরিয়া সিলেক্ট করুন।');

      return;

    }



    isSubmitting = true;

    setSubmitLoading(true);



    const fees = getDeliveryFees();

    const deliveryFee = fees[delivery] || 0;



    const quantity = selectedQty || 1;

    const unitPrice = selectedUnitPrice || (quantity ? productPrice / quantity : productPrice);

    const discount = appliedCoupon ? getCouponDiscount(productPrice, appliedCoupon) : 0;



    const order = {

      product,

      productPrice,

      unitPrice,

      quantity,

      productId: selectedProductId || '',

      variantId: selectedVariantId || '',

      name: formData.get('name'),

      phone: normalizeBdPhone(phone),

      address: formData.get('address'),

      delivery: delivery === 'dhaka' ? 'ঢাকার ভিতরে' : 'ঢাকার বাইরে',

      deliveryFee,

      couponCode: appliedCoupon ? normalizeCouponCode(appliedCoupon.code) : '',

      discount,

      total: Math.max(0, productPrice - discount) + deliveryFee,

      timestamp: new Date().toISOString()

    };



    try {

      const result = await submitOrder(order);

      if (result && typeof result.discount !== 'undefined') order.discount = Number(result.discount) || 0;

      if (result && typeof result.total !== 'undefined') order.total = Number(result.total) || order.total;

      lastOrder = order;

      const purchasedId = selectedProductId || order.product;

      const purchasedProduct = PRODUCTS_BY_ID[selectedProductId];

      if (purchasedProduct && purchasedProduct.stock !== '' && purchasedProduct.stock != null && !isNaN(Number(purchasedProduct.stock))) {

        purchasedProduct.stock = Math.max(0, Number(purchasedProduct.stock) - order.quantity);

        renderAllProducts();

      }

      saveBuyerInfo({ name: order.name, phone: order.phone, address: order.address });

      form.reset();

      selectedPrice = 0;

      selectedUnitPrice = 0;

      selectedQty = 1;

      selectedProductId = '';

      selectedVariantId = '';

      clearCouponState(true);

      const stickyBar = document.getElementById('sticky-order-bar');

      if (stickyBar) stickyBar.classList.add('hidden');

      document.getElementById('selected-product-box').classList.add('hidden');

      document.getElementById('no-product-warning').classList.remove('hidden');

      document.getElementById('order-total-box').classList.add('hidden');

      document.getElementById('phone-error').classList.add('hidden');

      updateDeliveryChecks();



      const summary = document.getElementById('success-summary');

      if (summary) {

        summary.innerHTML =

          '<div class="bg-gray-50 rounded-2xl p-4 text-left text-sm space-y-1 mb-5">' +

          '<div class="flex justify-between gap-3"><span class="text-gray-500">পণ্য</span><span class="font-bold text-right">' + escapeHtml(order.product) + '</span></div>' +

          (order.quantity > 1 ? '<div class="flex justify-between"><span class="text-gray-500">পরিমাণ</span><span class="font-bold">' + toBengaliDigits(order.quantity) + ' টি</span></div>' : '') +

          (order.discount > 0 ? '<div class="flex justify-between"><span class="text-gray-500">কুপন ছাড়</span><span class="font-bold text-emerald-600">−' + formatPrice(order.discount) + '</span></div>' : '') +

          '<div class="flex justify-between"><span class="text-gray-500">ডেলিভারি</span><span class="font-bold">' + escapeHtml(order.delivery) + '</span></div>' +

          '<div class="flex justify-between border-t pt-1 mt-1"><span class="text-gray-500">মোট (COD)</span><span class="font-extrabold text-green-600">' + formatPrice(order.total) + '</span></div>' +

          '</div>';

      }



      document.getElementById('success-modal').classList.remove('hidden');

      document.getElementById('success-modal').classList.add('show');



      trackPixel('Purchase', { value: order.total, currency: 'BDT', contents: [{ id: purchasedId, quantity: order.quantity }] });

    } catch (err) {

      console.error(err);

      alert((err && err.message) ? err.message : 'অর্ডার পাঠাতে সমস্যা হয়েছে। আবার চেষ্টা করুন অথবা হটলাইনে কল করুন।');

    } finally {

      setSubmitLoading(false);

      setTimeout(() => { isSubmitting = false; }, 2000);

    }

  });



  document.getElementById('close-modal-btn').addEventListener('click', () => {

    const modal = document.getElementById('success-modal');

    modal.classList.add('hidden');

    modal.classList.remove('show');

  });



  // ESC closes open modals

  document.addEventListener('keydown', (e) => {

    if (e.key !== 'Escape') return;

    closeQuickView();

    const sm = document.getElementById('success-modal');

    if (sm) { sm.classList.add('hidden'); sm.classList.remove('show'); }

  });



  const memoBtn = document.getElementById('memo-print-btn');

  if (memoBtn) {

    memoBtn.addEventListener('click', () => {

      if (lastOrder && typeof openMemoModal === 'function') {

        openMemoModal(lastOrder, (STORE && STORE.settings) || {});

      }

    });

  }



  document.getElementById('success-modal').addEventListener('click', (e) => {

    if (e.target.id === 'success-modal') {

      e.target.classList.add('hidden');

      e.target.classList.remove('show');

    }

  });



  window.addEventListener('resize', () => {

    if (CATEGORIES.length) renderCategoryNav();

  });

}



async function init() {

  const main = document.getElementById('products-main');

  if (main) main.style.opacity = '0.5';



  STORE = await fetchStore();

  CATEGORIES = (STORE.categories || []).filter((c) => c.active !== false);

  PRODUCTS_LIST = STORE.products || [];

  PRODUCTS_MAP = productsByCategory(PRODUCTS_LIST, CATEGORIES);

  PRODUCTS_BY_ID = {};

  PRODUCTS_LIST.forEach((p) => { PRODUCTS_BY_ID[p.id] = p; });



  renderCategoryNav();

  renderCategorySections();

  renderFilterChips();

  applyShopConfig();

  updateDeliveryLabels();

  renderAllProducts();

  bindEvents();

  updateDeliveryChecks();



  if (main) main.style.opacity = '1';



  const category = detectCategoryFromUrl();

  if (category) applySingleCategoryMode(category);



  prefillBuyerInfo();



  // Ad deep-link: ?product=ID → auto-select & jump to order (fastest path from boost)

  const productParam = new URLSearchParams(window.location.search).get('product');

  if (productParam && PRODUCTS_BY_ID[productParam]) {

    const p = PRODUCTS_BY_ID[productParam];

    setTimeout(() => selectProduct(p.name, p.offerPrice, p.id, ''), 300);

  }



  if (window.location.hash) {

    const hashCat = window.location.hash.replace('#', '');

    if (getCategoryMeta(hashCat)) setTimeout(() => scrollToElement(hashCat), 400);

  }

}



document.addEventListener('DOMContentLoaded', init);


