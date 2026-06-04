# Baby Orbit — Product Roadmap

> শেষ আপডেট: ৪ জুন ২০২৬  
> লক্ষ্য: ১০০% হ্যাসেল-ফ্রি কাস্টমার অর্ডার + প্রফেশনাল Admin + Facebook/WhatsApp ইন্টিগ্রেশন

---

## স্ট্যাটাস লেজেন্ড

| চিহ্ন | অর্থ |
|--------|------|
| ✅ | সম্পন্ন |
| 🔄 | চলমান / পরবর্তী স্প্রিন্ট |
| 📋 | পরিকল্পিত |
| 💡 | ভবিষ্যত আইডিয়া |

---

## Phase 0 — মূল সাইট (✅ সম্পন্ন)

- [x] ওয়ান-পেজ কাস্টমার সাইট (HTML + Tailwind + JS)
- [x] কোনো Cart নেই — সরাসরি COD অর্ডার বাটন
- [x] ক্যাটাগরি স্ক্রোল + Facebook `Shop Now` লিংক (`/baby-car` ইত্যাদি)
- [x] অর্ডার ফর্ম (নাম, ফোন, ঠিকানা, ঢাকা/বাইরে ডেলিভারি)
- [x] সফলতার পপআপ (বাংলা)
- [x] Sticky trust bar (COD, ডেলিভারি, হটলাইন)
- [x] Cloudflare Pages `_redirects` + `wrangler.toml`

---

## Phase 1 — Backend + Admin v1 (✅ সম্পন্ন)

### Google Sheets + WhatsApp
- [x] Apps Script: Orders, Products, Categories, Settings শীট
- [x] অর্ডার সেভ + CallMeBot WhatsApp নোটিফিকেশন
- [x] ছবি আপলোড (Google Drive)
- [x] Admin লগইন (পাসওয়ার্ড + token)

### Admin Panel v1
- [x] পণ্য CRUD + ছবি আপলোড
- [x] ক্যাটাগরি CRUD + Facebook slug লিংক হিন্ট
- [x] সেটিংস: দোকান, হটলাইন, Facebook Page/Pixel, WhatsApp, CallMeBot key
- [x] ড্যাশবোর্ড + সাম্প্রতিক অর্ডার
- [x] অর্ডার ট্যাব + স্ট্যাটাস (নতুন / কনফার্ম / ডেলিভারি / সম্পন্ন / বাতিল)

### কাস্টমার সাইট পলিশ
- [x] সব ডিভাইসে responsive (মোবাইল → ট্যাবলেট → ডেস্কটপ)
- [x] পণ্য ছাড়া অর্ডার ব্লক + মোট দাম (পণ্য + ডেলিভারি)
- [x] বাংলাদেশি মোবাইল ভ্যালিডেশন
- [x] Facebook OG meta + Pixel + Page লিংক
- [x] Favicon, robots.txt, sitemap.xml, `.gitignore`, `config.example.js`
- [x] Cache TTL (৩ মিনিট), XSS escape

---

## Phase 2 — Admin Pro + Order Memo (✅ সম্পন্ন — আপনার অনুরোধ)

> **ফোকাস (সম্পন্ন):** (১) অর্ডার মেমো PDF/Print — A5 + ৮০mm থার্মাল · (২) Admin Pro UI — ডার্ক/লাইট থিম, রেসপন্সিভ সাইডবার, রেভিনিউ চার্ট · (৩) লোগো ও সেটিংস রিয়েল-টাইম সিঙ্ক (cache bust)

### 2.1 Admin Pro UI — আধুনিক ইন্টারফেস (✅)
- [x] **ডার্ক/লাইট থিম** টগল (পছন্দ `localStorage`-এ সেভ, সিস্টেম থিম ডিটেক্ট)
- [x] **রেসপন্সিভ সাইডবার** — মোবাইলে কোলাপ্স/হ্যামবার্গার, ডেস্কটপে fixed
- [x] আধুনিক কার্ড, টাইপোগ্রাফি ও কনসিস্টেন্ট স্পেসিং
- [x] **ড্যাশবোর্ড সামারি:** আজকের অর্ডার সংখ্যা + আজকের রেভিনিউ কার্ড
- [x] **চার্ট:** ৭ দিনের রেভিনিউ বার চার্ট + অর্ডার স্ট্যাটাস ডোনাট (Chart.js)
- [x] **লোগো আপলোড** — Header + সাইট favicon/OG-তে ব্যবহার
- [x] সেটিংস গ্রুপ: লোগো | দোকান | Facebook | WhatsApp | ডেলিভারি
- [ ] **ব্যানার/হিরো ইমেজ** সেটিংস (ঐচ্ছিক — পরে)
- [ ] পণ্য: bulk actions, স্টক/অ্যাক্টিভ টগল, ডুপ্লিকেট পণ্য (পরে)
- [ ] Admin URL গোপনীয়তা (`/admin` → custom path) + শক্তিশালী auth (পরে)

### 2.2 অর্ডার মেমো — PDF + Print (✅)
- [x] অর্ডার সফল হলে **“মেমো প্রিন্ট / PDF”** বাটন (কাস্টমার সফলতা পপআপে)
- [x] Admin-এ প্রতিটি অর্ডারে **🧾 মেমো** (PDF + Print)
- [x] মেমোতে: **স্টোর লোগো**, অর্ডার নং, তারিখ, পণ্য, দাম, ডেলিভারি, মোট, **কাস্টমার ইনফরমেশন** (নাম, ফোন, ঠিকানা)
- [x] **html2pdf** দিয়ে PDF জেনারেশন + ডাউনলোড
- [x] ব্রাউজার `window.print()` সাপোর্ট (iframe + print CSS, Bengali font)
- [x] **দুই লেআউট:** A5 সাইজ এবং **৮০mm থার্মাল রিসিপ্ট** (টগলসহ)
- [x] মেমো প্রিভিউ মডাল — প্রিন্ট/ডাউনলোডের আগে দেখা (`js/memo.js`)

### 2.3 লোগো ও সেটিংস সিঙ্ক — রিয়েল-টাইম (✅)
- [x] Admin থেকে আপলোড করা **লোগো** সরাসরি কাস্টমার সাইটের **Header**-এ আপডেট
- [x] লোগো → **`og:image`** অটো সেট (ogImage খালি থাকলে)
- [x] **Cache bust মেকানিজম** — লোগো URL-এ `?v=logoVersion` (লোগো বদলালে অটো bump)
- [x] সেটিংস সেভের পর কাস্টমার সাইটে রিফ্লেক্ট (cache invalidation)

### 2.4 কাস্টমার UX আপগ্রেড — সহজ ও দ্রুত কেনাকাটা (✅)
- [x] **পণ্যের বিস্তারিত (Quick View) মডাল** — বড় ছবি, বর্ণনা/ফিচার, দাম, রিভিউ + সরাসরি অর্ডার
- [x] **সার্চ বার + স্টিকি ক্যাটাগরি ফিল্টার চিপস** — নাম/বর্ণনা দিয়ে দ্রুত খোঁজা
- [x] **পরিমাণ (Quantity) সিলেক্টর** — +/− সহ, মোট দাম অটো আপডেট
- [x] **মোবাইলে স্টিকি অর্ডার বার** — পণ্য সিলেক্ট করলে নিচে (ফর্ম দেখা গেলে অটো হাইড)
- [x] **"কীভাবে অর্ডার করবেন" ৩-স্টেপ + ট্রাস্ট ব্যাজ** — সরাসরি আসা ভিজিটরের আস্থা
- [x] পণ্যে **বর্ণনা (description)** ফিল্ড — Admin ফর্ম + ব্যাকএন্ড (`Code.gs`) + Quick View

### 2.5 পণ্য ভ্যারিয়েন্ট — কালার/সাইজ + আলাদা দাম (✅)
- [x] ব্যাকএন্ডে `variants` (JSON) কলাম — প্রতিটি ভ্যারিয়েন্ট: কালার, সাইজ, দাম, আসল দাম
- [x] Admin পণ্য মডালে **ভ্যারিয়েন্ট এডিটর** — সারি যোগ/মোছা, প্রতিটির আলাদা দাম
- [x] Quick View-তে স্মার্ট সিলেক্টর — শুধু কালার হলে কালার চিপস, শুধু সাইজ হলে সাইজ চিপস, দুটো হলে কম্বো চিপস
- [x] ভ্যারিয়েন্ট সিলেক্টে **দাম + ছাড় + সেভিংস লাইভ আপডেট**
- [x] কার্ডে "৳... থেকে" + কালার/সাইজ ব্যাজ; ভ্যারিয়েন্ট পণ্যে অর্ডারে সিলেকশন বাধ্যতামূলক
- [x] অর্ডার/মেমো/WhatsApp-এ নির্বাচিত ভ্যারিয়েন্ট পণ্যের নামে যুক্ত
- [x] প্রতি ভ্যারিয়েন্টে **আলাদা ছবি আপলোড** (Admin) + সিলেক্টে **লাইভ ছবি সোয়াপ** (কাস্টমার)

### 2.7 Admin Pro+ টুলস (✅ ব্যাচ ১ — ফ্রন্টএন্ড, রি-ডিপ্লয় লাগে না)
- [x] **অর্ডার সার্চ** (নাম/মোবাইল/পণ্য) + **স্ট্যাটাস ফিল্টার চিপ** (কাউন্টসহ)
- [x] প্রতি অর্ডারে **📞 কল + 💬 WhatsApp** কুইক বাটন (নম্বর প্রি-ফিলড)
- [x] **CSV এক্সপোর্ট** (UTF-8 BOM — Excel-এ বাংলা ঠিক থাকে)
- [x] **ড্যাশবোর্ড সম্প্রসারণ:** এই মাসের রেভিনিউ, মোট অর্ডার, পেন্ডিং + **🏆 টপ-সেলিং পণ্য** বার
- [x] **পণ্য সার্চ** + প্রতি পণ্যে **🔗 অ্যাড ডিপ-লিংক কপি** (`?product=ID`)
- [x] **নিরাপত্তা:** ৩০ মিনিট নিষ্ক্রিয়তায় **অটো-লগআউট** + নামসহ ডিলিট কনফার্ম
- [x] **🖨️ আজকের প্যাকিং লিস্ট** (A4 — সব অর্ডার একসাথে প্রিন্ট)

### ✅ Admin Pro+ ব্যাচ ২ (backend + storefront + admin)
- [x] **স্টক কাউন্ট ট্র্যাকিং** — `Products`-এ `stock` কলাম, Admin product form-এ stock input, customer site-এ **স্টক শেষ** badge/disable
- [x] **অর্ডার স্টকে অটো প্রভাব** — অর্ডার হলে stock কমে; `বাতিল`/`ফেরত` হলে stock আবার ফেরত আসে
- [x] **রিফান্ড ডিটেইলস** — `Orders`-এ `refundReason` + `refundAmount`; Admin order card-এ refund modal + refund info box
- [x] **রিফান্ড সামারি** — ড্যাশবোর্ডে **এই মাসের রিফান্ড** কার্ড
- [x] **কুপন সিস্টেম** — নতুন `Coupons` sheet, Admin settings-এ coupon manager, customer checkout-এ coupon apply/clear + total-এ discount row
- [x] `Orders`-এ `productId`, `quantity`, `unitPrice`, `couponCode`, `discount` সেভ
- [x] WhatsApp order message-এ coupon discount summary

### 2.6 QA, বাগ ফিক্স ও পলিশ (✅)
- [x] সিঙ্গেল-ক্যাটাগরি মোডে সার্চ/ফিল্টার দ্বন্দ্ব ফিক্স (`exitSingleCategoryMode`)
- [x] ক্যাটাগরি সার্কেল ক্লিকে লুকানো সেকশনে স্ক্রল ফিক্স (সার্চ/ফিল্টার রিসেট)
- [x] Purchase পিক্সেল ইভেন্টে সঠিক product id (রিসেটের আগে ক্যাপচার)
- [x] ESC কী দিয়ে Quick View/সফলতা মডাল বন্ধ
- [x] সফলতা পপআপে **অর্ডার সামারি** (পণ্য, পরিমাণ, ডেলিভারি, মোট)

---

## Phase 3 — লাইভ ও মার্কেটিং (📋 Git-এর পর)

> **হোস্টিং খরচ = ০৳** | GitHub → Cloudflare Pages (ফ্রি স্ট্যাটিক) + Google Apps Script (ফ্রি backend)। **একমাত্র খরচ = ডোমেইন।**

### ⚡ Tailwind প্রোডাকশন বিল্ড (✅ — CDN বাদ, দ্রুত সাইট)
- [x] CDN (`cdn.tailwindcss.com`, ~৩MB+ রানটাইম) বাদ → **প্রি-বিল্ট `css/tailwind.css` (~৩৬KB / gzip ≈ ৭KB)**
- [x] `tailwind.config.js` (content scan + `darkMode:'class'` + কাস্টম ফন্ট/animation + gradient safelist)
- [x] `package.json` স্ক্রিপ্ট: `npm run build:css` (মিনিফাই), `npm run watch:css`
- [x] `css/tailwind.css` **git-এ কমিট করা** → Cloudflare-এ আলাদা বিল্ড স্টেপ লাগে না (সরাসরি স্ট্যাটিক পুশ)
- **ক্লাস/HTML বদলালে:** আবার `npm run build:css` চালিয়ে কমিট করুন (অথবা ডেভ-এ `npm run watch:css`)
- **অপশনাল:** Cloudflare Pages-এ Build command `npm run build:css`, Output `/` দিলে অটো-বিল্ড হবে

### Deploy (আপনার কাজ)
- [ ] `js/config.example.js` → `config.js` কপি
- [ ] Git init + GitHub push (`node_modules/` ignore হয়, `css/tailwind.css` কমিট হয়)
- [ ] Cloudflare Pages connect + `babyorbit.shop` ডোমেইন
- [ ] Google Apps Script **নতুন Deploy** (Code.gs আপডেট হয়েছে — `logo`, `description` যোগ)
- [ ] `config.js`-এ `googleScriptUrl` বসানো
- [ ] Script Properties: `ADMIN_PASSWORD`, `CALLMEBOT_KEY`, `WHATSAPP_PHONE`
- [ ] Admin → Settings সেভ + ডিফল্ট ডেটা সিড (প্রথমবার)
- [ ] `sitemap.xml` / `robots.txt`-এ আসল ডোমেইন

### Facebook Boost — দ্রুত কনভার্শন (✅ কোড রেডি)
- [x] **অ্যাড ডিপ-লিংক:** `?product=ID` → পণ্য অটো-সিলেক্ট + সোজা অর্ডার ফর্মে; `/baby-car` ক্যাটাগরি ল্যান্ডিং
- [x] **জেনেরিক `_redirects`** — নতুন ক্যাটাগরির slug-ও Cloudflare-এ অটো কাজ করে (404 নেই)
- [x] **Pixel ইভেন্ট কমপ্লিট:** PageView, **ViewContent**, InitiateCheckout, Purchase (অপ্টিমাইজেশন + রিটার্গেটিং)
- [x] **মোবাইল স্পিড:** backend `preconnect`, html2pdf লেজি-লোড (শুধু মেমোতে)
- [x] **রিটার্নিং বায়ার অটো-ফিল** (নাম/ফোন/ঠিকানা) + **অ্যাবাভ-দ্য-ফোল্ড CTA**
- [ ] লাইভে Pixel Events যাচাই (Meta Events Manager)
- [ ] Product Catalog / Feed export (💡)

### WhatsApp
- [ ] CallMeBot টেস্ট অর্ডার
- [ ] WhatsApp Business Chat বাটন টেস্ট

---

## Phase 4 — গ্রোথ ফিচার (💡 ভবিষ্যত)

| ফিচার | উপকারিতা |
|--------|-----------|
| SMS অ্যালার্ট (BulkSMS BD) | WhatsApp ছাড়াও নোটিফিকেশন |
| Google Analytics 4 | ট্রাফিক ও কনভার্শন |
| PWA (Add to Home Screen) | মোবাইলে অ্যাপের মতো |
| কুপন/ডিসকাউন্ট কোড | মার্কেটিং ক্যাম্পেইন |
| স্টক আউট / “শীঘ্রই আসছে” | ইনভেন্টরি |
| Multi-admin + role | স্টাফ ম্যানেজমেন্ট |
| Cloudflare R2 / imgbb CDN | দ্রুত ও স্থিতিশীল ছবি |
| বাংলা/ইংরেজি টগল | বিস্তৃত অডিয়েন্স |

---

## ফাইল ম্যাপ (ডেভেলপার)

```
baby shop/
├── index.html              # কাস্টমার সাইট
├── admin/index.html        # Admin UI
├── js/
│   ├── config.js           # ⚠️ Git-এ ignore — secrets
│   ├── config.example.js   # টেমপ্লেট
│   ├── app.js              # Storefront
│   ├── admin.js            # Admin logic
│   ├── api.js              # Sheets API + cache
│   ├── memo.js             # অর্ডার মেমো (A5 + ৮০mm, PDF/Print)
│   ├── products.js         # Fallback ডেটা
│   └── utils.js            # escape, phone validate
├── css/
│   ├── input.css           # Tailwind directives (বিল্ড ইনপুট)
│   └── tailwind.css        # ⚡ বিল্ট মিনিফাই CSS (HTML এটাই লোড করে)
├── google-apps-script/
│   └── Code.gs             # Backend — Sheet-এ paste + Deploy
├── tailwind.config.js      # content/theme/safelist
├── package.json            # build:css / watch:css স্ক্রিপ্ট
├── ROADMAP.md              # এই ফাইল
├── _redirects              # Cloudflare
└── wrangler.toml
```

---

## প্রস্তুতি স্কোর

```
কাস্টমার UX       ██████████  98%  ← QuickView + সার্চ + qty + স্টিকি বার
Admin Panel       █████████░  90%  ← Pro UI + থিম + চার্ট সম্পন্ন
Backend/API       █████░░░░░  50%  ← googleScriptUrl Deploy বাকি
Security          █████░░░░░  55%  ← পাসওয়ার্ড + admin path
Order Memo PDF    █████████░  95%  ← A5 + ৮০mm থার্মাল সম্পন্ন
Production Live   ████░░░░░░  40%  ← Git + Cloudflare বাকি
```

---

## পরবর্তী স্প্রিন্ট (সুপারিশকৃত ক্রম)

1. ~~**Phase 2.2** — অর্ডার মেমো PDF + Print~~ ✅ সম্পন্ন
2. ~~**Phase 2.1** — Admin Pro UI + লোগো আপলোড~~ ✅ সম্পন্ন
3. ~~**Phase 2.3** — লোগো ও সেটিংস সিঙ্ক~~ ✅ সম্পন্ন
4. **Phase 3** — Git push + Cloudflare + Google Script নতুন Deploy (Code.gs বদলেছে — logo ফিল্ড যোগ)
5. **Phase 4** — Analytics, PWA, Catalog (প্রয়োজন অনুযায়ী)

---

## নোট

- Admin ডিফল্ট পাসওয়ার্ড (`babyshop2024`) — **লাইভের আগে অবশ্যই বদলান**
- `js/config.js` কখনো GitHub-এ push করবেন না (`.gitignore`-এ আছে)
- Apps Script কোড বদলালে **নতুন deployment** করতে হয় — পুরনো URL কাজ করতে পারে, তবু নতুন version Deploy নিরাপদ

---

*এই রোডম্যাপ প্রজেক্টের সাথে আপডেট রাখুন। Phase 2 শুরু করতে বললে Admin Pro + PDF মেমো একসাথে ইমপ্লিমেন্ট করা হবে।*
