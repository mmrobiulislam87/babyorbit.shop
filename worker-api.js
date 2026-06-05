/**
 * Baby Orbit API — Cloudflare D1 (+ optional ImgBB for images)
 * Same action names as legacy Google Apps Script for frontend compatibility.
 */

const GRADIENTS = [
  'from-red-400 to-orange-500',
  'from-yellow-400 to-amber-500',
  'from-blue-400 to-indigo-500',
  'from-pink-400 to-rose-500',
  'from-green-400 to-teal-500',
  'from-purple-400 to-violet-500'
];

export async function handleApi(request, env) {
  try {
    if (request.method === 'GET') {
      const url = new URL(request.url);
      const action = url.searchParams.get('action') || 'store';
      if (action === 'store') return json({ success: true, data: await getStoreData(env) });
      if (action === 'orders') {
        requireToken(url.searchParams.get('token'), env);
        return json({ success: true, orders: await getOrders(env) });
      }
      return json({ status: 'ok', service: 'Baby Orbit D1 API' });
    }

    if (request.method === 'POST') {
      const data = await request.json();
      const action = data.action || 'order';

      if (action === 'login') return json(await handleLogin(data, env));
      if (action === 'order') return json(await handleOrder(data, env));
      if (action === 'saveProduct') { requireToken(data.token, env); return json(await saveProduct(data.product, env)); }
      if (action === 'deleteProduct') { requireToken(data.token, env); await deleteProduct(data.id, env); return json({ success: true }); }
      if (action === 'saveCategory') { requireToken(data.token, env); return json(await saveCategory(data.category, env)); }
      if (action === 'deleteCategory') { requireToken(data.token, env); await deleteCategory(data.id, env); return json({ success: true }); }
      if (action === 'saveSettings') { requireToken(data.token, env); return json(await saveSettings(data.settings, env)); }
      if (action === 'uploadImage') { requireToken(data.token, env); return json(await uploadImage(data, env)); }
      if (action === 'seedDefaults') { requireToken(data.token, env); return json(await seedDefaults(env)); }
      if (action === 'updateOrderStatus') { requireToken(data.token, env); await updateOrderStatus(data, env); return json({ success: true }); }
      if (action === 'saveCoupon') { requireToken(data.token, env); return json(await saveCoupon(data.coupon, env)); }
      if (action === 'deleteCoupon') { requireToken(data.token, env); await deleteCoupon(data.id, env); return json({ success: true }); }

      if (data.name && data.phone) return json(await handleOrder(data, env));
      return json({ success: false, error: 'Unknown action' });
    }

    return json({ success: false, error: 'Method not allowed' }, 405);
  } catch (err) {
    return json({ success: false, error: String(err.message || err) }, 400);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

function adminPassword(env) {
  return (env.ADMIN_PASSWORD || 'babyshop2024').trim();
}

function makeToken(password) {
  return btoa(password + '|babyshop|2024');
}

function requireToken(token, env) {
  if (!token || token !== makeToken(adminPassword(env))) {
    throw new Error('Unauthorized — লগইন প্রয়োজন');
  }
}

async function handleLogin(data, env) {
  if (data.password !== adminPassword(env)) {
    return { success: false, error: 'ভুল পাসওয়ার্ড' };
  }
  return { success: true, token: makeToken(data.password) };
}

async function getSettingsMap(env) {
  const { results } = await env.DB.prepare('SELECT key, value FROM settings').all();
  const map = {};
  for (const row of results || []) map[row.key] = row.value;
  return map;
}

async function getSettings(env) {
  const s = await getSettingsMap(env);
  return {
    shopName: s.shopName || 'Baby Orbit',
    hotline: s.hotline || '',
    hotlineTel: s.hotlineTel || '',
    deliveryFees: {
      dhaka: Number(s.deliveryDhaka) || 60,
      outside: Number(s.deliveryOutside) || 120
    },
    facebookPageId: s.facebookPageId || '',
    facebookPixelId: s.facebookPixelId || '',
    whatsappBusiness: s.whatsappBusiness || '',
    whatsappNotify: s.whatsappNotify || s.hotlineTel || '',
    ogImage: s.ogImage || '',
    logo: s.logo || '',
    logoVersion: s.logoVersion || ''
  };
}

async function getCategories(env) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM categories WHERE active = 1 ORDER BY sort_order ASC'
  ).all();
  return (results || []).map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    icon: r.icon || '📦',
    gradient: r.gradient || GRADIENTS[0],
    sortOrder: r.sort_order,
    active: true
  }));
}

async function getProducts(env) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM products WHERE active = 1 ORDER BY sort_order ASC'
  ).all();
  return (results || []).map(rowToProduct);
}

function rowToProduct(r) {
  let variants = [];
  if (r.variants) {
    try { variants = JSON.parse(r.variants) || []; } catch { variants = []; }
  }
  const stock = r.stock === '' || r.stock == null ? '' : Number(r.stock);
  return {
    id: r.id,
    categoryId: r.category_id,
    name: r.name,
    originalPrice: Number(r.original_price) || 0,
    offerPrice: Number(r.offer_price) || 0,
    image: r.image || '',
    rating: Number(r.rating) || 5,
    sortOrder: r.sort_order,
    description: r.description || '',
    variants,
    stock: isNaN(stock) ? '' : stock,
    active: true
  };
}

async function getCoupons(env) {
  const { results } = await env.DB.prepare('SELECT * FROM coupons').all();
  return (results || []).map((r) => ({
    id: r.id,
    code: String(r.code || '').toUpperCase(),
    type: r.type || 'fixed',
    value: Number(r.value) || 0,
    note: r.note || '',
    active: r.active !== 0
  }));
}

async function getStoreData(env) {
  return {
    settings: await getSettings(env),
    categories: await getCategories(env),
    products: await getProducts(env),
    coupons: (await getCoupons(env)).filter((c) => c.active !== false)
  };
}

async function setSetting(key, value, env) {
  await env.DB.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).bind(key, String(value ?? '')).run();
}

async function saveSettings(settings, env) {
  const s = settings || {};
  const prev = await getSettingsMap(env);
  const keys = {
    shopName: s.shopName,
    hotline: s.hotline,
    hotlineTel: s.hotlineTel,
    deliveryDhaka: s.deliveryFees?.dhaka ?? s.deliveryDhaka,
    deliveryOutside: s.deliveryFees?.outside ?? s.deliveryOutside,
    facebookPageId: s.facebookPageId,
    facebookPixelId: s.facebookPixelId,
    whatsappBusiness: s.whatsappBusiness,
    whatsappNotify: s.whatsappNotify,
    ogImage: s.ogImage,
    logo: s.logo
  };
  for (const [k, v] of Object.entries(keys)) {
    if (v !== undefined) await setSetting(k, v, env);
  }
  const newLogo = s.logo || '';
  if (newLogo && newLogo !== (prev.logo || '')) {
    await setSetting('logoVersion', String(Date.now()), env);
  } else if (!newLogo) {
    await setSetting('logoVersion', '', env);
  }
  return { success: true, settings: await getSettings(env) };
}

async function saveProduct(p, env) {
  if (!p?.name || !p?.categoryId) throw new Error('নাম ও ক্যাটাগরি প্রয়োজন');
  const id = p.id || 'prod-' + Date.now();
  const variants = p.variants?.length ? JSON.stringify(p.variants) : '';
  const stock = p.stock === '' || p.stock == null ? '' : String(Number(p.stock));
  await env.DB.prepare(
    `INSERT INTO products (id, category_id, name, original_price, offer_price, image, rating, active, sort_order, description, variants, stock)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       category_id=excluded.category_id, name=excluded.name, original_price=excluded.original_price,
       offer_price=excluded.offer_price, image=excluded.image, rating=excluded.rating,
       sort_order=excluded.sort_order, description=excluded.description, variants=excluded.variants, stock=excluded.stock`
  ).bind(
    id, p.categoryId, p.name, Number(p.originalPrice) || 0, Number(p.offerPrice) || 0,
    p.image || '', Number(p.rating) || 5, Number(p.sortOrder) || 99,
    p.description || '', variants, stock
  ).run();
  const row = await env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first();
  return { success: true, product: rowToProduct(row) };
}

async function deleteProduct(id, env) {
  await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
}

async function saveCategory(c, env) {
  if (!c?.title || !c?.slug) throw new Error('নাম ও slug প্রয়োজন');
  const slug = c.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const id = c.id || slug;
  await env.DB.prepare(
    `INSERT INTO categories (id, slug, title, icon, gradient, sort_order, active)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET slug=excluded.slug, title=excluded.title, icon=excluded.icon,
       gradient=excluded.gradient, sort_order=excluded.sort_order, active=excluded.active`
  ).bind(
    id, slug, c.title, c.icon || '📦', c.gradient || GRADIENTS[0],
    Number(c.sortOrder) || 99, c.active !== false ? 1 : 0
  ).run();
  return { success: true, category: { id, slug, title: c.title, icon: c.icon, gradient: c.gradient, sortOrder: c.sortOrder, active: true } };
}

async function deleteCategory(id, env) {
  await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM products WHERE category_id = ?').bind(id).run();
}

async function saveCoupon(c, env) {
  const id = c.id || 'coupon-' + Date.now();
  const code = String(c.code || '').toUpperCase();
  await env.DB.prepare(
    `INSERT INTO coupons (id, code, type, value, note, active) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET code=excluded.code, type=excluded.type, value=excluded.value, note=excluded.note, active=excluded.active`
  ).bind(id, code, c.type === 'percent' ? 'percent' : 'fixed', Number(c.value) || 0, c.note || '', c.active !== false ? 1 : 0).run();
  return { success: true, coupon: { id, code, type: c.type, value: c.value, note: c.note, active: c.active !== false } };
}

async function deleteCoupon(id, env) {
  await env.DB.prepare('DELETE FROM coupons WHERE id = ?').bind(id).run();
}

async function getCouponByCode(code, env) {
  const want = String(code || '').trim().toUpperCase();
  if (!want) return null;
  const row = await env.DB.prepare('SELECT * FROM coupons WHERE UPPER(code) = ? AND active = 1').bind(want).first();
  if (!row) return null;
  return { id: row.id, code: row.code, type: row.type, value: Number(row.value) || 0, active: true };
}

function couponDiscount(coupon, subtotal) {
  if (!coupon || subtotal <= 0) return 0;
  let d = coupon.type === 'percent'
    ? Math.round((subtotal * (Number(coupon.value) || 0)) / 100)
    : Number(coupon.value) || 0;
  if (d < 0) d = 0;
  if (d > subtotal) d = subtotal;
  return d;
}

function orderConsumesStock(status) {
  const s = String(status || 'নতুন');
  return s !== 'বাতিল' && s !== 'ফেরত';
}

async function getProductStock(productId, env) {
  const row = await env.DB.prepare('SELECT stock FROM products WHERE id = ?').bind(productId).first();
  if (!row || row.stock === '' || row.stock == null) return null;
  return Number(row.stock);
}

async function changeStock(productId, delta, env) {
  const cur = await getProductStock(productId, env);
  if (cur === null) return;
  const next = Math.max(0, cur + Number(delta || 0));
  await env.DB.prepare('UPDATE products SET stock = ? WHERE id = ?').bind(String(next), productId).run();
}

async function handleOrder(data, env) {
  const productId = data.productId || '';
  let quantity = Number(data.quantity) || 1;
  if (quantity < 1) quantity = 1;
  const unitPrice = Number(data.unitPrice) || 0;
  let productPrice = Number(data.productPrice);
  if (!productPrice) productPrice = unitPrice * quantity;
  const deliveryFee = Number(data.deliveryFee) || 0;
  const coupon = await getCouponByCode(data.couponCode, env);
  const discount = couponDiscount(coupon, productPrice);
  const total = Math.max(0, productPrice - discount) + deliveryFee;

  if (productId) {
    const stock = await getProductStock(productId, env);
    if (stock !== null && stock < quantity) throw new Error('স্টকে পর্যাপ্ত পণ্য নেই');
    if (stock !== null) await changeStock(productId, -quantity, env);
  }

  const now = new Date().toISOString();
  const result = await env.DB.prepare(
    `INSERT INTO orders (created_at, product, product_price, delivery, delivery_fee, total, name, phone, address, status,
      product_id, quantity, unit_price, coupon_code, discount)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'নতুন', ?, ?, ?, ?, ?)`
  ).bind(
    now, data.product || '', productPrice, data.delivery || '', deliveryFee, total,
    data.name || '', data.phone || '', data.address || '',
    productId, quantity, unitPrice, coupon ? coupon.code : '', discount
  ).run();

  await sendWhatsApp(data, productPrice, deliveryFee, total, discount, coupon?.code, env);

  return { success: true, message: 'Order saved', discount, total, rowIndex: result.meta.last_row_id };
}

async function getOrders(env) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM orders ORDER BY id DESC LIMIT 50'
  ).all();
  return (results || []).map((r) => ({
    rowIndex: r.id,
    date: r.created_at,
    product: r.product,
    productPrice: r.product_price,
    delivery: r.delivery,
    deliveryFee: r.delivery_fee,
    total: r.total,
    name: r.name,
    phone: r.phone,
    address: r.address,
    status: r.status,
    productId: r.product_id,
    quantity: Number(r.quantity) || 1,
    unitPrice: Number(r.unit_price) || 0,
    couponCode: r.coupon_code || '',
    discount: Number(r.discount) || 0,
    refundReason: r.refund_reason || '',
    refundAmount: Number(r.refund_amount) || 0
  }));
}

async function updateOrderStatus(data, env) {
  const id = Number(data.rowIndex);
  if (!id) throw new Error('Invalid order id');
  const order = await env.DB.prepare('SELECT * FROM orders WHERE id = ?').bind(id).first();
  if (!order) throw new Error('Order not found');

  const prevStatus = order.status || 'নতুন';
  const status = data.status || 'নিশ্চিত';
  const productId = order.product_id || '';
  const quantity = Number(order.quantity) || 1;

  if (productId) {
    if (orderConsumesStock(prevStatus) && !orderConsumesStock(status)) {
      await changeStock(productId, quantity, env);
    } else if (!orderConsumesStock(prevStatus) && orderConsumesStock(status)) {
      const stock = await getProductStock(productId, env);
      if (stock !== null && stock < quantity) throw new Error('স্টকে পর্যাপ্ত পণ্য নেই');
      await changeStock(productId, -quantity, env);
    }
  }

  let sql = 'UPDATE orders SET status = ?';
  const binds = [status];
  if (data.refundReason !== undefined) {
    sql += ', refund_reason = ?';
    binds.push(data.refundReason || '');
  }
  if (data.refundAmount !== undefined) {
    sql += ', refund_amount = ?';
    binds.push(Number(data.refundAmount) || 0);
  }
  sql += ' WHERE id = ?';
  binds.push(id);
  await env.DB.prepare(sql).bind(...binds).run();
}

async function uploadImage(data, env) {
  const b64 = String(data.base64 || '').replace(/\s/g, '');
  if (!b64 || !data.filename) throw new Error('Image data missing');
  if (b64.length > 9000000) throw new Error('ছবি অনেক বড়');

  const key = env.IMGBB_API_KEY;
  if (!key) {
    throw new Error('Cloudflare Secret যোগ করুন: IMGBB_API_KEY (imgbb.com ফ্রি API) — অথবা ছবির URL হাতে বসান');
  }

  const body = new FormData();
  body.append('key', key);
  body.append('image', b64);
  body.append('name', data.filename || 'babyorbit');

  const resp = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body });
  const json = await resp.json();
  if (!json.success) {
    throw new Error(json.error?.message || 'ImgBB upload failed');
  }
  const url = json.data?.url || json.data?.display_url;
  if (!url) throw new Error('ছবির URL পাওয়া যায়নি');
  return { success: true, url, host: 'imgbb' };
}

async function sendWhatsApp(data, productPrice, deliveryFee, total, discount, couponCode, env) {
  const phone = env.WHATSAPP_PHONE;
  const apiKey = env.CALLMEBOT_KEY;
  if (!phone || !apiKey) return;
  const settings = await getSettings(env);
  const qty = Number(data.quantity) || 1;
  const lines = [
    '🛒 *নতুন অর্ডার — ' + settings.shopName + '*', '',
    '📦 পণ্য: ' + (data.product || '-') + (qty > 1 ? ' (×' + qty + ')' : ''),
    '💰 দাম: ৳' + productPrice,
    ...(discount > 0 ? ['🏷️ কুপন: ' + (couponCode || '-') + ' (-৳' + discount + ')'] : []),
    '🚚 ' + (data.delivery || '-') + ' (৳' + deliveryFee + ')',
    '💵 *মোট: ৳' + total + '*', '',
    '👤 ' + (data.name || '-'),
    '📱 ' + (data.phone || '-'),
    '🏠 ' + (data.address || '-')
  ];
  const text = lines.join('\n');
  const url = 'https://api.callmebot.com/whatsapp.php?phone=' + encodeURIComponent(phone)
    + '&apikey=' + encodeURIComponent(apiKey) + '&text=' + encodeURIComponent(text);
  try { await fetch(url); } catch { /* ignore */ }
}

async function seedDefaults(env) {
  const catCount = await env.DB.prepare('SELECT COUNT(*) as n FROM categories').first();
  if ((catCount?.n || 0) === 0) {
    const cats = [
      ['baby-car', 'baby-car', 'বেবি গাড়ি', '🏎️', GRADIENTS[0], 1],
      ['baby-toys', 'baby-toys', 'বেবি টয়', '🧸', GRADIENTS[1], 2],
      ['baby-books', 'baby-books', 'বেবি বুক', '📚', GRADIENTS[2], 3]
    ];
    for (const c of cats) {
      await env.DB.prepare(
        'INSERT INTO categories (id, slug, title, icon, gradient, sort_order, active) VALUES (?, ?, ?, ?, ?, ?, 1)'
      ).bind(...c).run();
    }
  }

  const prodCount = await env.DB.prepare('SELECT COUNT(*) as n FROM products').first();
  if ((prodCount?.n || 0) === 0) {
    const prods = [
      ['car-1', 'baby-car', 'রিমোট কন্ট্রোল রেইসিং কার', 4800, 3650, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=450&fit=crop&q=80', 1],
      ['car-2', 'baby-car', 'লাক্সারি রাইড-অন ইলেকট্রিক কার', 14500, 9800, 'https://images.unsplash.com/photo-1563267750-8695-4fca5fb5277d?w=600&h=450&fit=crop&q=80', 2],
      ['toy-1', 'baby-toys', 'প্রিমিয়াম সফট টেডি বিয়ার', 1450, 990, 'https://images.unsplash.com/photo-1558060370-9796a16d3c8f?w=600&h=450&fit=crop&q=80', 1],
      ['book-1', 'baby-books', 'বাংলা বর্ণমালা বই', 550, 380, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=450&fit=crop&q=80', 1]
    ];
    for (const p of prods) {
      await env.DB.prepare(
        `INSERT INTO products (id, category_id, name, original_price, offer_price, image, rating, active, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, 5, 1, ?)`
      ).bind(...p).run();
    }
  }

  const setCount = await env.DB.prepare('SELECT COUNT(*) as n FROM settings').first();
  if ((setCount?.n || 0) === 0) {
    const defaults = {
      shopName: 'Baby Orbit',
      hotline: '01812345678',
      hotlineTel: '8801812345678',
      deliveryDhaka: '60',
      deliveryOutside: '120'
    };
    for (const [k, v] of Object.entries(defaults)) await setSetting(k, v, env);
  }

  return { success: true, message: 'Default data seeded' };
}
