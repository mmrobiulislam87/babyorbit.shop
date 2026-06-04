# Baby Orbit — Cloudflare Deploy (শেষ ধাপ)

## ১. Cloudflare Dashboard — সঠিক মান

**Workers & Pages** → আপনার প্রজেক্ট (`babyorbitshops`) → **Settings** → **Build**

| ফিল্ড | মান |
|--------|-----|
| Build command | `npm install && npm run build` |
| Deploy command | `npx wrangler pages deploy . --project-name=babyorbitshops` |
| Root / Path | `/` |

**Environment variables** (Settings → Variables):

| Name | Value | Encrypt |
|------|--------|---------|
| `GOOGLE_SCRIPT_URL` | Apps Script Web App URL | No |
| `ADMIN_PASSWORD` | আপনার admin পাসওয়ার্ড (Script Properties-এর মতো) | **Yes** |

`GOOGLE_SCRIPT_URL` না দিলেও `js/config.defaults.js` থেকে URL নেবে।

## ২. API token

- **+ Create new token** (অটো) — ঠিক আছে
- অন্য প্রজেক্টের token (zeniusanalyzerpro) **ব্যবহার করবেন না**

## ৩. Custom domain

প্রজেক্ট → **Custom domains** → `babyorbit.shop` যোগ করুন।

## ৪. Git push

কোড push হলে Cloudflare অটো deploy চালাবে। Build log-এ দেখবেন:

```
generate-config: wrote js/config.js
Done in ...ms (tailwind)
```

## ৫. লোকাল deploy (ঐচ্ছিক)

```bash
npm install
npm run build
npx wrangler login
npm run deploy
# same as: npx wrangler pages deploy . --project-name=babyorbitshops
```

## ৬. সমস্যা হলে

- **`Workers-specific command in a Pages project`:** Deploy command অবশ্যই `npx wrangler pages deploy . --project-name=babyorbitshops` (`wrangler deploy` নয়)
- **`Wrangler requires Node.js v22`:** প্রজেক্টে `wrangler@3.114.1` পিন করা — Cloudflare Node 20-এ deploy চলবে
- **Build fail:** log-এ `GOOGLE_SCRIPT_URL missing` → variable যোগ করুন বা `config.defaults.js` চেক করুন
- **Deploy fail / project not found:** `wrangler.toml`-এ `name = "babyorbitshops"` Cloudflare project name-এর সাথে মিলুন
- **সাইট খালি / API কাজ না:** Browser → `js/config.js` খুলে `googleScriptUrl` আছে কিনা দেখুন
