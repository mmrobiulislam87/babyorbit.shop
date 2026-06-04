# Baby Orbit — Cloudflare Deploy

Cloudflare প্রজেক্ট: **`babyorbitshopb`** (Worker + static assets in `dist/`)

## Build settings (Git)

| ফিল্ড | মান |
|--------|-----|
| Build command | `npm install && npm run build` |
| Deploy command | `npx wrangler deploy` |
| Path | `/` |

## API token — Authentication error [10000] ঠিক করুন

লগে `CLOUDFLARE_API_TOKEN` থাকলে পুরনো/ভুল token — **মুছে দিন:**

1. **Settings → Variables** → `CLOUDFLARE_API_TOKEN` **Delete**
2. **Settings → Build → API token** → **+ Create new token** (অটো) — `zeniusanalyzerpro` বা অন্য প্রজেক্টের token **নয়**
3. নতুন token-এ অন্তত: **Workers Scripts — Edit**, **Account — Read**

`wrangler pages deploy` **ব্যবহার করবেন না** — deploy = `wrangler deploy` (শুধু `dist/` যায়, `node_modules` নয়)।

## সাইট URL চালু করুন

1. **Domains** ট্যাব → **workers.dev** → **Enable**
2. URL: `https://babyorbitshopb.<subdomain>.workers.dev`
3. **Custom domain:** `babyorbit.shop` যোগ করুন

## Environment variables

| Name | Encrypt |
|------|---------|
| `ADMIN_PASSWORD` | Yes |
| `GOOGLE_SCRIPT_URL` | No (ঐচ্ছিক — `js/config.defaults.js`-এ আছে) |

## সমস্যা

| Error | সমাধান |
|-------|---------|
| Authentication error 10000 | Variables থেকে `CLOUDFLARE_API_TOKEN` মুছুন; Build-এ নতুন auto token |
| Pages project failed | Deploy command `npx wrangler deploy` (pages deploy নয়) |
| No URLs enabled | Domains → workers.dev Enable |
| Asset too large (workerd 111 MiB) | `dist/` শুধু সাইট ফাইল — `node_modules` deploy হয় না |
| Worker name mismatch | `wrangler.toml` → `babyorbitshopb` (CI নামের সাথে মিল) |
