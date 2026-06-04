/**
 * Baby Orbit — Full Backend (Orders + Admin + Store)
 *
 * Script Properties (Project Settings):
 *   SPREADSHEET_ID  = Google Sheet ID (URL-এর মাঝের অংশ) — Web App-এর জন্য অবশ্যই
 *   ADMIN_PASSWORD  = your-secret-password
 *   WHATSAPP_PHONE  = 8801812345678
 *   CALLMEBOT_KEY   = callmebot-api-key
 *
 * Run once: linkSpreadsheetFromActive() অথবা setupAllSheets()
 * Deploy: Web app → Anyone
 */

var SHEET_ORDERS = 'Orders';
var SHEET_PRODUCTS = 'Products';
var SHEET_CATEGORIES = 'Categories';
var SHEET_SETTINGS = 'Settings';
var SHEET_COUPONS = 'Coupons';
var IMAGE_FOLDER_NAME = 'BabyShopImages';

/**
 * Google Sheet ID — URL-এ /d/ এর পর যে কোড (শুধু Script Properties না থাকলে এটা ব্যবহার হয়)
 * উদাহরণ: https://docs.google.com/spreadsheets/d/1abc...xyz/edit → ID = 1abc...xyz
 */
var CONFIG_SPREADSHEET_ID = '';

var GRADIENTS = [
  'from-red-400 to-orange-500',
  'from-yellow-400 to-amber-500',
  'from-blue-400 to-indigo-500',
  'from-pink-400 to-rose-500',
  'from-green-400 to-teal-500',
  'from-purple-400 to-violet-500'
];

// ─── HTTP Handlers ───────────────────────────────────────────

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'store';
  try {
    if (action === 'store') return jsonResponse({ success: true, data: getStoreData() });
    if (action === 'orders') {
      requireToken(e.parameter.token);
      return jsonResponse({ success: true, orders: getOrders() });
    }
    return jsonResponse({ status: 'ok', service: 'Baby Orbit API' });
  } catch (err) {
    return jsonResponse({ success: false, error: err.message });
  }
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action || 'order';

    if (action === 'login') return handleLogin(data);
    if (action === 'order') return handleOrder(data);
    if (action === 'saveProduct') { requireToken(data.token); return handleSaveProduct(data); }
    if (action === 'deleteProduct') { requireToken(data.token); return handleDeleteProduct(data); }
    if (action === 'saveCategory') { requireToken(data.token); return handleSaveCategory(data); }
    if (action === 'deleteCategory') { requireToken(data.token); return handleDeleteCategory(data); }
    if (action === 'saveSettings') { requireToken(data.token); return handleSaveSettings(data); }
    if (action === 'uploadImage') { requireToken(data.token); return handleUploadImage(data); }
    if (action === 'seedDefaults') { requireToken(data.token); return seedDefaultData(); }
    if (action === 'updateOrderStatus') { requireToken(data.token); return handleUpdateOrderStatus(data); }
    if (action === 'saveCoupon') { requireToken(data.token); return handleSaveCoupon(data); }
    if (action === 'deleteCoupon') { requireToken(data.token); return handleDeleteCoupon(data); }

    // Legacy: plain order object without action field
    if (data.name && data.phone) return handleOrder(data);

    return jsonResponse({ success: false, error: 'Unknown action' });
  } catch (err) {
    return jsonResponse({ success: false, error: err.toString() });
  }
}

// ─── Setup ───────────────────────────────────────────────────

function setupAllSheets() {
  setupOrdersSheet();
  setupProductsSheet();
  setupCategoriesSheet();
  setupSettingsSheet();
  setupCouponsSheet();
}

function setupOrdersSheet() {
  var sheet = getOrCreateSheet(SHEET_ORDERS);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['তারিখ/সময়', 'পণ্য', 'পণ্য দাম (৳)', 'ডেলিভারি', 'ডেলিভারি চার্জ (৳)', 'মোট (৳)', 'নাম', 'মোবাইল', 'ঠিকানা', 'স্ট্যাটাস', 'productId', 'quantity', 'unitPrice', 'couponCode', 'discount', 'refundReason', 'refundAmount']);
    styleHeader(sheet, 17);
  } else {
    var orderHeaders = ['productId', 'quantity', 'unitPrice', 'couponCode', 'discount', 'refundReason', 'refundAmount'];
    for (var c = 0; c < orderHeaders.length; c++) {
      var col = 11 + c;
      if (String(sheet.getRange(1, col).getValue()).trim() === '') sheet.getRange(1, col).setValue(orderHeaders[c]);
    }
  }
}

function setupProductsSheet() {
  var sheet = getOrCreateSheet(SHEET_PRODUCTS);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['id', 'categoryId', 'name', 'originalPrice', 'offerPrice', 'image', 'rating', 'active', 'sortOrder', 'description', 'variants', 'stock']);
    styleHeader(sheet, 12);
  } else {
    // Migrate older sheets: add new column headers if missing
    if (String(sheet.getRange(1, 10).getValue()).trim() === '') sheet.getRange(1, 10).setValue('description');
    if (String(sheet.getRange(1, 11).getValue()).trim() === '') sheet.getRange(1, 11).setValue('variants');
    if (String(sheet.getRange(1, 12).getValue()).trim() === '') sheet.getRange(1, 12).setValue('stock');
  }
}

function setupCategoriesSheet() {
  var sheet = getOrCreateSheet(SHEET_CATEGORIES);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['id', 'slug', 'title', 'icon', 'gradient', 'sortOrder', 'active']);
    styleHeader(sheet, 7);
  }
}

function setupSettingsSheet() {
  var sheet = getOrCreateSheet(SHEET_SETTINGS);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['key', 'value']);
    styleHeader(sheet, 2);
    var defaults = {
      shopName: 'Baby Orbit',
      hotline: '01812345678',
      hotlineTel: '8801812345678',
      deliveryDhaka: '60',
      deliveryOutside: '120',
      facebookPageId: '',
      facebookPixelId: '',
      whatsappBusiness: '',
      whatsappNotify: '',
      ogImage: '',
      logo: '',
      logoVersion: ''
    };
    for (var key in defaults) {
      sheet.appendRow([key, defaults[key]]);
    }
  }
}

function setupCouponsSheet() {
  var sheet = getOrCreateSheet(SHEET_COUPONS);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['id', 'code', 'type', 'value', 'note', 'active']);
    styleHeader(sheet, 6);
  }
}

function seedDefaultData() {
  setupAllSheets();
  var catSheet = getSheet(SHEET_CATEGORIES);
  if (catSheet.getLastRow() <= 1) {
    var cats = [
      ['baby-car', 'baby-car', 'বেবি গাড়ি', '🏎️', GRADIENTS[0], 1, 'yes'],
      ['baby-toys', 'baby-toys', 'বেবি টয়', '🧸', GRADIENTS[1], 2, 'yes'],
      ['baby-books', 'baby-books', 'বেবি বুক', '📚', GRADIENTS[2], 3, 'yes']
    ];
    cats.forEach(function(c) { catSheet.appendRow(c); });
  }

  var prodSheet = getSheet(SHEET_PRODUCTS);
  if (prodSheet.getLastRow() <= 1) {
    var prods = [
      ['car-1', 'baby-car', 'রিমোট কন্ট্রোল রেইসিং কার', 4800, 3650, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=450&fit=crop&q=80', 5, 'yes', 1],
      ['car-2', 'baby-car', 'লাক্সারি রাইড-অন ইলেকট্রিক কার', 14500, 9800, 'https://images.unsplash.com/photo-1563267750-8695-4fca5fb5277d?w=600&h=450&fit=crop&q=80', 5, 'yes', 2],
      ['toy-1', 'baby-toys', 'প্রিমিয়াম সফট টেডি বিয়ার', 1450, 990, 'https://images.unsplash.com/photo-1558060370-9796a16d3c8f?w=600&h=450&fit=crop&q=80', 5, 'yes', 1],
      ['book-1', 'baby-books', 'বাংলা বর্ণমালা বই', 550, 380, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=450&fit=crop&q=80', 5, 'yes', 1]
    ];
    prods.forEach(function(p) { prodSheet.appendRow(p); });
  }

  return jsonResponse({ success: true, message: 'Default data seeded' });
}

// ─── Auth ────────────────────────────────────────────────────

function handleLogin(data) {
  var password = getAdminPassword();
  if (data.password !== password) {
    return jsonResponse({ success: false, error: 'ভুল পাসওয়ার্ড' });
  }
  return jsonResponse({ success: true, token: makeToken(data.password) });
}

function getAdminPassword() {
  return PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD') || 'babyshop2024';
}

function makeToken(password) {
  var raw = password + '|babyshop|2024';
  return Utilities.base64Encode(raw);
}

function requireToken(token) {
  if (!token || token !== makeToken(getAdminPassword())) {
    throw new Error('Unauthorized — লগইন প্রয়োজন');
  }
}

// ─── Store Data (Public) ─────────────────────────────────────

function getStoreData() {
  setupAllSheets();
  return {
    settings: getSettings(),
    categories: getCategories(),
    products: getProducts(),
    coupons: getCoupons()
  };
}

function getSettings() {
  var sheet = getSheet(SHEET_SETTINGS);
  var data = sheet.getDataRange().getValues();
  var settings = {};
  for (var i = 1; i < data.length; i++) {
    settings[data[i][0]] = String(data[i][1]);
  }
  return {
    shopName: settings.shopName || 'Baby Orbit',
    hotline: settings.hotline || '',
    hotlineTel: settings.hotlineTel || '',
    deliveryFees: {
      dhaka: Number(settings.deliveryDhaka) || 60,
      outside: Number(settings.deliveryOutside) || 120
    },
    facebookPageId: settings.facebookPageId || '',
    facebookPixelId: settings.facebookPixelId || '',
    whatsappBusiness: settings.whatsappBusiness || '',
    whatsappNotify: settings.whatsappNotify || settings.hotlineTel || '',
    ogImage: normalizeDriveImageUrl(settings.ogImage || ''),
    logo: normalizeDriveImageUrl(settings.logo || ''),
    logoVersion: settings.logoVersion || ''
  };
}

function getCategories() {
  var sheet = getSheet(SHEET_CATEGORIES);
  var data = sheet.getDataRange().getValues();
  var cats = [];
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][6]).toLowerCase() !== 'yes') continue;
    cats.push({
      id: data[i][0], slug: data[i][1], title: data[i][2],
      icon: data[i][3], gradient: data[i][4] || GRADIENTS[0],
      sortOrder: Number(data[i][5]) || i
    });
  }
  cats.sort(function(a, b) { return a.sortOrder - b.sortOrder; });
  return cats;
}

function getProducts() {
  var sheet = getSheet(SHEET_PRODUCTS);
  var data = sheet.getDataRange().getValues();
  var products = [];
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][7]).toLowerCase() !== 'yes') continue;
    var variants = [];
    if (data[i][10]) {
      try {
        variants = JSON.parse(String(data[i][10])) || [];
        variants = variants.map(function(v) {
          if (v && v.image) v.image = normalizeDriveImageUrl(v.image);
          return v;
        });
      } catch (e) { variants = []; }
    }
    products.push({
      id: data[i][0], categoryId: data[i][1], name: data[i][2],
      originalPrice: Number(data[i][3]), offerPrice: Number(data[i][4]),
      image: normalizeDriveImageUrl(data[i][5]), rating: Number(data[i][6]) || 5,
      sortOrder: Number(data[i][8]) || i,
      description: data[i][9] ? String(data[i][9]) : '',
      variants: variants,
      stock: data[i][11] === '' || data[i][11] == null ? '' : Number(data[i][11])
    });
  }
  products.sort(function(a, b) { return a.sortOrder - b.sortOrder; });
  return products;
}

function getCoupons() {
  var sheet = getSheet(SHEET_COUPONS);
  var data = sheet.getDataRange().getValues();
  var coupons = [];
  for (var i = 1; i < data.length; i++) {
    coupons.push({
      id: data[i][0],
      code: String(data[i][1] || '').toUpperCase(),
      type: String(data[i][2] || 'fixed'),
      value: Number(data[i][3]) || 0,
      note: String(data[i][4] || ''),
      active: String(data[i][5]).toLowerCase() !== 'no'
    });
  }
  return coupons;
}

function getProductsGrouped() {
  var products = getProducts();
  var grouped = {};
  products.forEach(function(p) {
    if (!grouped[p.categoryId]) grouped[p.categoryId] = [];
    grouped[p.categoryId].push(p);
  });
  return grouped;
}

// ─── Admin: Products ─────────────────────────────────────────

function handleSaveProduct(data) {
  setupAllSheets();
  var sheet = getSheet(SHEET_PRODUCTS);
  var p = data.product;
  if (!p.name || !p.categoryId) throw new Error('নাম ও ক্যাটাগরি প্রয়োজন');

  var id = p.id || ('prod-' + new Date().getTime());
  var variantsJson = '';
  try { variantsJson = p.variants && p.variants.length ? JSON.stringify(p.variants) : ''; } catch (e) { variantsJson = ''; }
  var stock = p.stock === '' || p.stock == null ? '' : Number(p.stock);
  var row = [id, p.categoryId, p.name, Number(p.originalPrice) || 0, Number(p.offerPrice) || 0,
    p.image || '', Number(p.rating) || 5, p.active !== false ? 'yes' : 'no', Number(p.sortOrder) || 99,
    p.description || '', variantsJson, stock];

  var rows = sheet.getDataRange().getValues();
  var found = -1;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) { found = i + 1; break; }
  }

  if (found > 0) {
    sheet.getRange(found, 1, 1, 12).setValues([row]);
  } else {
    sheet.appendRow(row);
  }

  return jsonResponse({ success: true, product: { id: id, categoryId: p.categoryId, name: p.name,
    originalPrice: row[3], offerPrice: row[4], image: row[5], rating: row[6], active: true, sortOrder: row[8],
    description: row[9], variants: p.variants || [], stock: row[11] } });
}

function handleDeleteProduct(data) {
  var sheet = getSheet(SHEET_PRODUCTS);
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      sheet.deleteRow(i + 1);
      return jsonResponse({ success: true });
    }
  }
  return jsonResponse({ success: false, error: 'Product not found' });
}

// ─── Admin: Categories ───────────────────────────────────────

function handleSaveCategory(data) {
  setupAllSheets();
  var sheet = getSheet(SHEET_CATEGORIES);
  var c = data.category;
  if (!c.title || !c.slug) throw new Error('নাম ও slug প্রয়োজন');

  var slug = c.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  var id = c.id || slug;
  var row = [id, slug, c.title, c.icon || '📦', c.gradient || GRADIENTS[0],
    Number(c.sortOrder) || 99, c.active !== false ? 'yes' : 'no'];

  var rows = sheet.getDataRange().getValues();
  var found = -1;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) { found = i + 1; break; }
  }

  if (found > 0) {
    sheet.getRange(found, 1, 1, 7).setValues([row]);
  } else {
    sheet.appendRow(row);
  }

  return jsonResponse({ success: true, category: { id: id, slug: slug, title: c.title,
    icon: row[3], gradient: row[4], sortOrder: row[5], active: true } });
}

function handleDeleteCategory(data) {
  var sheet = getSheet(SHEET_CATEGORIES);
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      sheet.deleteRow(i + 1);
      return jsonResponse({ success: true });
    }
  }
  return jsonResponse({ success: false, error: 'Category not found' });
}

// ─── Admin: Settings ─────────────────────────────────────────

function handleSaveSettings(data) {
  setupAllSheets();
  var sheet = getSheet(SHEET_SETTINGS);
  var s = data.settings;

  var rows = sheet.getDataRange().getValues();

  // Cache bust: bump logoVersion whenever the logo URL changes
  var prevLogo = '';
  var prevLogoVersion = '';
  for (var r = 1; r < rows.length; r++) {
    if (rows[r][0] === 'logo') prevLogo = String(rows[r][1]);
    if (rows[r][0] === 'logoVersion') prevLogoVersion = String(rows[r][1]);
  }
  var newLogo = s.logo || '';
  var logoVersion = prevLogoVersion;
  if (newLogo && newLogo !== prevLogo) logoVersion = String(new Date().getTime());
  if (!newLogo) logoVersion = '';

  var map = {
    shopName: s.shopName, hotline: s.hotline, hotlineTel: s.hotlineTel,
    deliveryDhaka: String(s.deliveryFees && s.deliveryFees.dhaka || 60),
    deliveryOutside: String(s.deliveryFees && s.deliveryFees.outside || 120),
    facebookPageId: s.facebookPageId || '', facebookPixelId: s.facebookPixelId || '',
    whatsappBusiness: s.whatsappBusiness || '', whatsappNotify: s.whatsappNotify || '',
    ogImage: s.ogImage || '',
    logo: newLogo, logoVersion: logoVersion
  };

  for (var key in map) {
    var updated = false;
    for (var i = 1; i < rows.length; i++) {
      if (rows[i][0] === key) {
        sheet.getRange(i + 1, 2).setValue(map[key]);
        updated = true;
        break;
      }
    }
    if (!updated) sheet.appendRow([key, map[key]]);
  }

  if (map.whatsappNotify) {
    PropertiesService.getScriptProperties().setProperty('WHATSAPP_PHONE', map.whatsappNotify);
  }
  if (s.callmebotKey) {
    PropertiesService.getScriptProperties().setProperty('CALLMEBOT_KEY', s.callmebotKey);
  }

  return jsonResponse({ success: true, settings: getSettings() });
}

// ─── Admin: Coupons ──────────────────────────────────────────

function handleSaveCoupon(data) {
  setupCouponsSheet();
  var sheet = getSheet(SHEET_COUPONS);
  var c = data.coupon || {};
  if (!c.code) throw new Error('কুপন কোড প্রয়োজন');

  var id = c.id || ('coupon-' + new Date().getTime());
  var row = [id, String(c.code).toUpperCase(), c.type === 'percent' ? 'percent' : 'fixed', Number(c.value) || 0, c.note || '', c.active !== false ? 'yes' : 'no'];
  var rows = sheet.getDataRange().getValues();
  var found = -1;
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) { found = i + 1; break; }
  }

  if (found > 0) sheet.getRange(found, 1, 1, 6).setValues([row]);
  else sheet.appendRow(row);

  return jsonResponse({ success: true, coupon: { id: row[0], code: row[1], type: row[2], value: row[3], note: row[4], active: row[5] === 'yes' } });
}

function handleDeleteCoupon(data) {
  var sheet = getSheet(SHEET_COUPONS);
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] === data.id) {
      sheet.deleteRow(i + 1);
      return jsonResponse({ success: true });
    }
  }
  return jsonResponse({ success: false, error: 'Coupon not found' });
}

// ─── Admin: Image Upload ─────────────────────────────────────

function handleUploadImage(data) {
  if (!data.base64 || !data.filename) throw new Error('Image data missing');

  try {
    var folder = getOrCreateImageFolder();
    var mime = data.mimeType || 'image/jpeg';
    var blob = Utilities.newBlob(Utilities.base64Decode(data.base64), mime, data.filename);
    var file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    var id = file.getId();
    // thumbnail/lh3 work in <img> on external sites; uc?export=view often breaks
    var url = 'https://drive.google.com/thumbnail?id=' + id + '&sz=w1200';
    return jsonResponse({ success: true, url: url, fileId: id });
  } catch (e) {
    var msg = String(e.message || e);
    if (msg.indexOf('authorization') !== -1 || msg.indexOf('Authorization') !== -1) {
      throw new Error('Google Drive অনুমতি দরকার — Apps Script-এ authorizeDriveForUploads() একবার Run করুন');
    }
    throw e;
  }
}

/** Apps Script Editor → Run once → Allow Drive access (image upload) */
function authorizeDriveForUploads() {
  var f = getOrCreateImageFolder();
  Logger.log('Drive folder OK: ' + f.getName());
}

function getOrCreateImageFolder() {
  var folders = DriveApp.getFoldersByName(IMAGE_FOLDER_NAME);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(IMAGE_FOLDER_NAME);
}

/** Fix old Drive links so images show on babyorbit.shop */
function normalizeDriveImageUrl(url) {
  if (!url) return '';
  var s = String(url);
  var m = s.match(/(?:[?&]id=|\/d\/)([a-zA-Z0-9_-]+)/);
  if (!m || s.indexOf('drive.google') === -1 && s.indexOf('googleusercontent') === -1) return s;
  return 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w1200';
}

// ─── Orders ──────────────────────────────────────────────────

function handleOrder(data) {
  setupAllSheets();
  var sheet = getSheet(SHEET_ORDERS);
  var productId = data.productId || '';
  var quantity = Number(data.quantity) || 1;
  if (quantity < 1) quantity = 1;
  var unitPrice = Number(data.unitPrice) || 0;
  var productPrice = Number(data.productPrice);
  if (!productPrice) productPrice = unitPrice * quantity;
  var deliveryFee = Number(data.deliveryFee) || 0;
  var coupon = getCouponByCode(data.couponCode || '');
  var discount = calculateCouponDiscount(coupon, productPrice);
  var total = Math.max(0, productPrice - discount) + deliveryFee;

  if (productId) {
    ensureProductStock(productId, quantity);
    changeProductStock(productId, -quantity);
  }

  sheet.appendRow([new Date(), data.product || '', productPrice, data.delivery || '',
    deliveryFee, total, data.name || '', data.phone || '', data.address || '', 'নতুন',
    productId, quantity, unitPrice, coupon ? coupon.code : '', discount, '', '']);

  sendWhatsApp(buildWhatsAppMessage(data, productPrice, deliveryFee, total, discount, coupon ? coupon.code : ''));
  return jsonResponse({ success: true, message: 'Order saved', discount: discount, total: total });
}

function getOrders() {
  setupOrdersSheet();
  var sheet = getSheet(SHEET_ORDERS);
  var data = sheet.getDataRange().getValues();
  var orders = [];
  for (var i = data.length - 1; i >= 1 && orders.length < 50; i--) {
    orders.push({
      rowIndex: i + 1,
      date: data[i][0], product: data[i][1], productPrice: data[i][2],
      delivery: data[i][3], deliveryFee: data[i][4], total: data[i][5],
      name: data[i][6], phone: data[i][7], address: data[i][8], status: data[i][9],
      productId: data[i][10], quantity: Number(data[i][11]) || 1, unitPrice: Number(data[i][12]) || 0,
      couponCode: data[i][13] || '', discount: Number(data[i][14]) || 0,
      refundReason: data[i][15] || '', refundAmount: Number(data[i][16]) || 0
    });
  }
  return orders;
}

function handleUpdateOrderStatus(data) {
  setupAllSheets();
  var sheet = getSheet(SHEET_ORDERS);
  var row = Number(data.rowIndex);
  var status = data.status || 'নিশ্চিত';
  if (row < 2) throw new Error('Invalid row');
  var prevStatus = String(sheet.getRange(row, 10).getValue() || '');
  var productId = String(sheet.getRange(row, 11).getValue() || '');
  var quantity = Number(sheet.getRange(row, 12).getValue()) || 1;

  if (productId && orderConsumesStock(prevStatus) && !orderConsumesStock(status)) {
    changeProductStock(productId, quantity);
  } else if (productId && !orderConsumesStock(prevStatus) && orderConsumesStock(status)) {
    ensureProductStock(productId, quantity);
    changeProductStock(productId, -quantity);
  }

  sheet.getRange(row, 10).setValue(status);
  if (typeof data.refundReason !== 'undefined') sheet.getRange(row, 16).setValue(data.refundReason || '');
  if (typeof data.refundAmount !== 'undefined') sheet.getRange(row, 17).setValue(Number(data.refundAmount) || 0);
  return jsonResponse({ success: true });
}

function buildWhatsAppMessage(data, productPrice, deliveryFee, total, discount, couponCode) {
  var settings = getSettings();
  var qty = Number(data.quantity) || 1;
  var lines = [
    '🛒 *নতুন অর্ডার — ' + settings.shopName + '*', '',
    '📦 পণ্য: ' + (data.product || '-') + (qty > 1 ? ' (×' + qty + ')' : ''),
    '💰 দাম: ৳' + productPrice,
    (discount > 0 ? '🏷️ কুপন: ' + (couponCode || '-') + ' (-৳' + discount + ')' : null),
    '🚚 ' + (data.delivery || '-') + ' (৳' + deliveryFee + ')',
    '💵 *মোট: ৳' + total + '*', '',
    '👤 ' + (data.name || '-'),
    '📱 ' + (data.phone || '-'),
    '🏠 ' + (data.address || '-'), '',
    '⏰ ' + Utilities.formatDate(new Date(), 'Asia/Dhaka', 'dd/MM/yyyy hh:mm a')
  ];
  return lines.filter(Boolean).join('\n');
}

function sendWhatsApp(message) {
  var props = PropertiesService.getScriptProperties();
  var phone = props.getProperty('WHATSAPP_PHONE');
  var apiKey = props.getProperty('CALLMEBOT_KEY');
  if (!phone || !apiKey) return;

  var url = 'https://api.callmebot.com/whatsapp.php?phone=' + encodeURIComponent(phone)
    + '&apikey=' + encodeURIComponent(apiKey) + '&text=' + encodeURIComponent(message);
  try { UrlFetchApp.fetch(url, { muteHttpExceptions: true }); } catch (e) { Logger.log(e); }
}

// ─── Helpers ─────────────────────────────────────────────────

function getSpreadsheet() {
  var props = PropertiesService.getScriptProperties();
  var id = (props.getProperty('SPREADSHEET_ID') || '').trim();
  if (!id) id = String(CONFIG_SPREADSHEET_ID || '').trim();
  if (id) {
    try {
      return SpreadsheetApp.openById(id);
    } catch (e) {
      throw new Error('SPREADSHEET_ID ভুল — Sheet URL থেকে ID ঠিক করে Script Properties-এ দিন');
    }
  }
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (active) return active;
  throw new Error(
    'Google Sheet লিংক নেই। Sheet খুলে Extensions → Apps Script → linkSpreadsheetFromActive() Run করুন, ' +
    'অথবা Script Properties-এ SPREADSHEET_ID সেট করুন'
  );
}

/**
 * সবচেয়ে সহজ — Sheet ID Code.gs-এ বসিয়ে এই ফাংশন Run করুন
 * ১) CONFIG_SPREADSHEET_ID = "আপনার_ID" লিখুন → Save (Ctrl+S)
 * ২) connectMySheet → Run → Allow
 */
function connectMySheet() {
  var id = String(CONFIG_SPREADSHEET_ID || '').trim();
  if (!id) {
    throw new Error('Code.gs-এ CONFIG_SPREADSHEET_ID = "Sheet_ID" লিখুন (ফাইলের উপরে IMAGE_FOLDER_NAME-এর নিচে)');
  }
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', id);
  setupAllSheets();
  Logger.log('সফল — Sheet যুক্ত হয়েছে। এখন Deploy → New version করুন।');
}

/**
 * Sheet খোলা থাকলে — Extensions → Apps Script থেকে Run
 */
function linkSpreadsheetFromActive() {
  var active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) {
    throw new Error('প্রথমে Google Sheet খুলুন, তারপর Sheet → Extensions → Apps Script থেকে Run করুন');
  }
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', active.getId());
  setupAllSheets();
  Logger.log('SPREADSHEET_ID সেভ হয়েছে: ' + active.getId());
  Logger.log('Sheet URL: ' + active.getUrl());
}

function getOrCreateSheet(name) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

function getSheet(name) {
  var sheet = getSpreadsheet().getSheetByName(name);
  if (!sheet) {
    setupAllSheets();
    sheet = getSpreadsheet().getSheetByName(name);
  }
  if (!sheet) throw new Error('Sheet "' + name + '" পাওয়া যায়নি — setupAllSheets() Run করুন');
  return sheet;
}

function getProductRowById(productId) {
  if (!productId) return null;
  var sheet = getSheet(SHEET_PRODUCTS);
  var rows = sheet.getDataRange().getValues();
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(productId)) return { rowIndex: i + 1, values: rows[i] };
  }
  return null;
}

function ensureProductStock(productId, qty) {
  var found = getProductRowById(productId);
  if (!found) return;
  var current = found.values[11];
  if (current === '' || current == null) return; // blank = unlimited
  var stock = Number(current) || 0;
  if (stock < qty) throw new Error('স্টকে পর্যাপ্ত পণ্য নেই');
}

function changeProductStock(productId, delta) {
  var found = getProductRowById(productId);
  if (!found) return;
  var current = found.values[11];
  if (current === '' || current == null) return; // blank = unlimited
  var stock = Number(current) || 0;
  stock = stock + Number(delta || 0);
  if (stock < 0) stock = 0;
  getSheet(SHEET_PRODUCTS).getRange(found.rowIndex, 12).setValue(stock);
}

function orderConsumesStock(status) {
  status = String(status || 'নতুন');
  return status !== 'বাতিল' && status !== 'ফেরত';
}

function getCouponByCode(code) {
  var want = String(code || '').trim().toUpperCase();
  if (!want) return null;
  var list = getCoupons();
  for (var i = 0; i < list.length; i++) {
    if (list[i].active !== false && list[i].code === want) return list[i];
  }
  return null;
}

function calculateCouponDiscount(coupon, subtotal) {
  subtotal = Number(subtotal) || 0;
  if (!coupon || subtotal <= 0) return 0;
  var discount = coupon.type === 'percent'
    ? Math.round((subtotal * (Number(coupon.value) || 0)) / 100)
    : Number(coupon.value) || 0;
  if (discount < 0) discount = 0;
  if (discount > subtotal) discount = subtotal;
  return discount;
}

function styleHeader(sheet, cols) {
  sheet.getRange(1, 1, 1, cols).setFontWeight('bold').setBackground('#fce7f3');
  sheet.setFrozenRows(1);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
