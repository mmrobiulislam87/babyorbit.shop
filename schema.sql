-- Baby Orbit — Cloudflare D1 schema
-- Run: npx wrangler d1 execute babyorbit-db --remote --file=schema.sql

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  icon TEXT DEFAULT '📦',
  gradient TEXT DEFAULT 'from-pink-400 to-rose-500',
  sort_order INTEGER DEFAULT 99,
  active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  original_price REAL DEFAULT 0,
  offer_price REAL DEFAULT 0,
  image TEXT DEFAULT '',
  rating REAL DEFAULT 5,
  active INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 99,
  description TEXT DEFAULT '',
  variants TEXT DEFAULT '',
  stock TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  type TEXT DEFAULT 'fixed',
  value REAL DEFAULT 0,
  note TEXT DEFAULT '',
  active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  product TEXT DEFAULT '',
  product_price REAL DEFAULT 0,
  delivery TEXT DEFAULT '',
  delivery_fee REAL DEFAULT 0,
  total REAL DEFAULT 0,
  name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  address TEXT DEFAULT '',
  status TEXT DEFAULT 'নতুন',
  product_id TEXT DEFAULT '',
  quantity INTEGER DEFAULT 1,
  unit_price REAL DEFAULT 0,
  coupon_code TEXT DEFAULT '',
  discount REAL DEFAULT 0,
  refund_reason TEXT DEFAULT '',
  refund_amount REAL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(id DESC);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
