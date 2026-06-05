# Baby Orbit — Cloudflare D1 (Google Sheet ছাড়া)

সব কিছু **একই Cloudflare Worker**-এ: সাইট + API (`/api`) + D1 ডাটাবেস।

## ১. D1 ডাটাবেস তৈরি

```bash
npx wrangler login
npm run db:create
```

আউটপুটে `database_id` কপি করুন → `wrangler.toml`-এ বসান:

```toml
database_id = "আপনার-uuid-এখানে"
```

## ২. টেবিল তৈরি (মাইগ্রেশন)

```bash
npm run db:migrate
```

## ৩. Worker Secrets (Cloudflare Dashboard)

Worker `babyorbitshopb` → **Settings → Variables → Secrets**:

| Secret | বাধ্যতামূলক | কাজ |
|--------|-------------|-----|
| `ADMIN_PASSWORD` | হ্যাঁ | Admin লগইন |
| `IMGBB_API_KEY` | ছবি আপলোডের জন্য | [imgbb.com](https://imgbb.com) ফ্রি API |
| `WHATSAPP_PHONE` | না | `88018...` |
| `CALLMEBOT_KEY` | না | WhatsApp নোটিফাই |

CLI দিয়ে:
```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put IMGBB_API_KEY
```

## ৪. Deploy

```bash
npm install && npm run build
npx wrangler deploy
```

Git push হলে Cloudflare auto deploy (Build + Deploy command আগের মতো)।

## ৫. প্রথম ডেটা (Seed)

1. `babyorbit.shop/admin/` → লগইন (`ADMIN_PASSWORD`)
2. **সেটিংস** → ডিফল্ট ডেটা সিড (বাটন থাকলে) অথবা ক্যাটাগরি/পণ্য হাতে যোগ

অথবা API:
```bash
curl -X POST https://babyorbit.shop/api -H "Content-Type: application/json" \
  -d '{"action":"login","password":"YOUR_PASS"}'
# token নিয়ে seedDefaults কল
```

## ৬. যাচাই

- `https://babyorbit.shop/api?action=store` → JSON `success: true`
- Admin → পণ্য সেভ → D1-এ ডেটা (Cloudflare Dashboard → D1 → babyorbit-db → Browse)

## ৭. Google Sheet বন্ধ

- `js/config.defaults.js` → `apiUrl: '/api'`, `googleScriptUrl: ''`
- Apps Script আর লাগে না

## সমস্যা

| সমস্যা | সমাধান |
|--------|---------|
| D1 binding error | `wrangler.toml`-এ সঠিক `database_id` |
| API 400 Unauthorized | Admin আবার লগইন; `ADMIN_PASSWORD` secret |
| ছবি fail | `IMGBB_API_KEY` secret সেট করুন |
| খালি সাইট | `npm run db:migrate` + seedDefaults |
