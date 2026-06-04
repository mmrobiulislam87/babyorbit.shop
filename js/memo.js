/**
 * Order Memo — PDF (html2pdf) + Print (window.print)
 * Layouts: A5 (office printer) and 80mm thermal receipt.
 * Shared by Admin panel and customer success screen.
 */

const MEMO_LAYOUTS = {
  a5: { label: 'A5 সাইজ', width: '148mm', jsPDFFormat: 'a5' },
  thermal: { label: '৮০mm থার্মাল', width: '80mm', jsPDFFormat: [80, 297] }
};

function memoEscape(str) {
  if (typeof escapeHtml === 'function') return escapeHtml(str);
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function memoBnDigits(str) {
  const map = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(str == null ? '' : str).replace(/\d/g, (d) => map[d]);
}

function memoTaka(n) {
  return '৳' + memoBnDigits(Number(n || 0).toLocaleString('en-US'));
}

function memoDate(value) {
  const d = value ? new Date(value) : new Date();
  if (isNaN(d.getTime())) return memoBnDigits(String(value || ''));
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  let h = d.getHours();
  const min = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return memoBnDigits(dd + '/' + mm + '/' + yyyy + ' ' + String(h).padStart(2, '0') + ':' + min + ' ' + ampm);
}

function memoOrderNo(order) {
  if (order.orderNo) return String(order.orderNo);
  if (order.rowIndex) return 'ORD-' + memoBnDigits(order.rowIndex);
  const t = order.date || order.timestamp || Date.now();
  const d = new Date(t);
  const stamp = isNaN(d.getTime()) ? Date.now() : d.getTime();
  return 'ORD-' + memoBnDigits(String(stamp).slice(-6));
}

function memoLogoUrl(settings) {
  const logo = settings.logo || '';
  if (!logo) return '';
  if (typeof withCacheBust === 'function') return withCacheBust(logo, settings.logoVersion);
  return logo;
}

/** Inline CSS so both the print iframe and html2pdf render identically (no Tailwind). */
function memoStyles(layout) {
  const isThermal = layout === 'thermal';
  const base = isThermal ? 11 : 13;
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    .memo {
      font-family: 'Noto Sans Bengali', system-ui, sans-serif;
      color: #111827;
      width: ${MEMO_LAYOUTS[layout].width};
      background: #fff;
      padding: ${isThermal ? '8px 10px' : '18px 20px'};
      font-size: ${base}px;
      line-height: 1.5;
    }
    .memo-head { text-align: center; ${isThermal ? '' : 'display:flex;align-items:center;justify-content:center;gap:12px;'} margin-bottom: ${isThermal ? 6 : 10}px; }
    .memo-logo { width: ${isThermal ? 44 : 56}px; height: ${isThermal ? 44 : 56}px; border-radius: 50%; object-fit: cover; ${isThermal ? 'margin:0 auto 4px;' : ''} display:block; }
    .memo-shop { font-size: ${base + (isThermal ? 3 : 6)}px; font-weight: 800; }
    .memo-sub { font-size: ${base - 1}px; color: #6b7280; }
    .memo-title { text-align: center; font-weight: 700; font-size: ${base + 1}px; margin: ${isThermal ? 4 : 8}px 0; padding: 4px 0; border-top: 1px dashed #9ca3af; border-bottom: 1px dashed #9ca3af; }
    .memo-meta { display: flex; justify-content: space-between; gap: 8px; font-size: ${base - 1}px; margin-bottom: ${isThermal ? 4 : 8}px; flex-wrap: wrap; }
    .memo-cust { font-size: ${base - 1}px; margin-bottom: ${isThermal ? 4 : 8}px; }
    .memo-cust div { margin-bottom: 2px; }
    .memo-cust b { font-weight: 700; }
    table { width: 100%; border-collapse: collapse; margin: ${isThermal ? 4 : 8}px 0; font-size: ${base - 1}px; }
    th, td { text-align: left; padding: ${isThermal ? '3px 2px' : '6px 4px'}; }
    th { border-bottom: 1px solid #374151; font-weight: 700; }
    td.r, th.r { text-align: right; }
    .memo-rows td { border-bottom: 1px dashed #d1d5db; }
    .memo-totals { margin-top: ${isThermal ? 4 : 8}px; font-size: ${base - 1}px; }
    .memo-totals div { display: flex; justify-content: space-between; padding: 2px 0; }
    .memo-grand { font-weight: 800; font-size: ${base + 2}px; border-top: 2px solid #111827; margin-top: 4px; padding-top: 4px !important; }
    .memo-foot { text-align: center; margin-top: ${isThermal ? 6 : 12}px; padding-top: 6px; border-top: 1px dashed #9ca3af; font-size: ${base - 2}px; color: #6b7280; }
    .memo-badge { display:inline-block; border:1px solid #111827; border-radius: 6px; padding: 1px 8px; font-weight:700; }
  `;
}

function buildMemoHtml(order, settings, layout) {
  const shopName = settings.shopName || (typeof SHOP_CONFIG !== 'undefined' && SHOP_CONFIG.shopName) || 'Baby Orbit';
  const hotline = settings.hotline || (typeof SHOP_CONFIG !== 'undefined' && SHOP_CONFIG.hotline) || '';
  const logo = memoLogoUrl(settings);
  const productPrice = Number(order.productPrice || order.total || 0);
  const deliveryFee = Number(order.deliveryFee || 0);
  const total = Number(order.total || (productPrice + deliveryFee));
  const status = order.status || 'নতুন';
  const qty = Number(order.quantity || 1);
  const unitPrice = Number(order.unitPrice || (qty ? productPrice / qty : productPrice));

  const head = layout === 'thermal'
    ? `<div class="memo-head">
         ${logo ? `<img class="memo-logo" src="${memoEscape(logo)}" alt="">` : ''}
         <div class="memo-shop">${memoEscape(shopName)}</div>
         ${hotline ? `<div class="memo-sub">📞 ${memoBnDigits(hotline)}</div>` : ''}
       </div>`
    : `<div class="memo-head">
         ${logo ? `<img class="memo-logo" src="${memoEscape(logo)}" alt="">` : ''}
         <div>
           <div class="memo-shop">${memoEscape(shopName)}</div>
           ${hotline ? `<div class="memo-sub">📞 হটলাইন: ${memoBnDigits(hotline)}</div>` : ''}
         </div>
       </div>`;

  return `
    ${head}
    <div class="memo-title">ক্যাশ মেমো / অর্ডার রসিদ</div>
    <div class="memo-meta">
      <span>নং: <b>${memoEscape(memoOrderNo(order))}</b></span>
      <span>${memoDate(order.date || order.timestamp)}</span>
    </div>
    <div class="memo-cust">
      <div><b>${memoEscape(order.name || '-')}</b></div>
      <div>📱 ${memoBnDigits(order.phone || '-')}</div>
      <div>🏠 ${memoEscape(order.address || '-')}</div>
      <div>🚚 ${memoEscape(order.delivery || '-')}</div>
    </div>
    <table>
      <thead><tr><th>পণ্য</th><th class="r">পরিমাণ</th><th class="r">দাম</th></tr></thead>
      <tbody class="memo-rows">
        <tr>
          <td>${memoEscape(order.product || '-')}${qty > 1 ? '<br><span style="color:#6b7280">@ ' + memoTaka(unitPrice) + '</span>' : ''}</td>
          <td class="r">${memoBnDigits(qty)}</td>
          <td class="r">${memoTaka(productPrice)}</td>
        </tr>
      </tbody>
    </table>
    <div class="memo-totals">
      <div><span>পণ্য মূল্য</span><span>${memoTaka(productPrice)}</span></div>
      <div><span>ডেলিভারি চার্জ</span><span>${memoTaka(deliveryFee)}</span></div>
      <div class="memo-grand"><span>সর্বমোট (COD)</span><span>${memoTaka(total)}</span></div>
    </div>
    <div class="memo-foot">
      <div>স্ট্যাটাস: <span class="memo-badge">${memoEscape(status)}</span></div>
      <div style="margin-top:4px">ধন্যবাদ — আবার আসবেন 🧡</div>
    </div>
  `;
}

function memoFullDocument(order, settings, layout) {
  return `<!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
      @page { size: ${layout === 'thermal' ? '80mm auto' : 'A5'}; margin: ${layout === 'thermal' ? '2mm' : '8mm'}; }
      body { margin: 0; display: flex; justify-content: center; background: #fff; }
      ${memoStyles(layout)}
    </style></head>
    <body><div class="memo">${buildMemoHtml(order, settings, layout)}</div></body></html>`;
}

function printMemo(order, settings, layout) {
  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.right = '0';
  frame.style.bottom = '0';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  document.body.appendChild(frame);

  const doc = frame.contentWindow.document;
  doc.open();
  doc.write(memoFullDocument(order, settings, layout));
  doc.close();

  const trigger = () => {
    try {
      frame.contentWindow.focus();
      frame.contentWindow.print();
    } catch (e) { /* ignore */ }
    setTimeout(() => frame.remove(), 1500);
  };
  // Give the web font a moment so Bengali glyphs print correctly.
  setTimeout(trigger, 600);
}

/** Packing / delivery list for a batch of orders (A4 print). */
function printPackingList(orders, settings) {
  settings = settings || {};
  const shop = (settings.shopName) || 'Baby Orbit';
  const today = memoDate(new Date());
  let grand = 0;
  const rows = (orders || []).map((o, i) => {
    const total = Number(o.total || o.productPrice || 0);
    grand += total;
    const qty = Number(o.quantity) || 1;
    return `<tr>
      <td class="c">${memoBnDigits(i + 1)}</td>
      <td><strong>${memoEscape(o.name || '')}</strong><br><span class="muted">${memoBnDigits(o.phone || '')}</span><br><span class="muted">${memoEscape(o.address || '')}</span></td>
      <td>${memoEscape(o.product || '')}${qty > 1 ? ' <strong>×' + memoBnDigits(qty) + '</strong>' : ''}<br><span class="muted">${memoEscape(o.delivery || '')}</span></td>
      <td class="r"><strong>${memoTaka(total)}</strong></td>
      <td class="c">▢</td>
    </tr>`;
  }).join('');

  const html = `<!DOCTYPE html><html lang="bn"><head><meta charset="UTF-8">
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
      @page { size: A4; margin: 10mm; }
      * { font-family: 'Noto Sans Bengali', sans-serif; box-sizing: border-box; }
      body { margin: 0; color: #111; }
      h1 { font-size: 18px; margin: 0; }
      .head { display: flex; justify-content: space-between; align-items: flex-end; border-bottom: 2px solid #111; padding-bottom: 6px; margin-bottom: 10px; }
      .muted { color: #666; font-size: 11px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #bbb; padding: 6px 8px; text-align: left; vertical-align: top; }
      th { background: #f3f4f6; }
      .c { text-align: center; }
      .r { text-align: right; white-space: nowrap; }
      tfoot td { font-size: 13px; font-weight: 800; background: #f9fafb; }
    </style></head>
    <body>
      <div class="head">
        <div><h1>${memoEscape(shop)}</h1><div class="muted">প্যাকিং / ডেলিভারি লিস্ট</div></div>
        <div class="muted">${today} · মোট ${memoBnDigits((orders || []).length)} টি অর্ডার</div>
      </div>
      <table>
        <thead><tr><th class="c">#</th><th>কাস্টমার</th><th>পণ্য</th><th class="r">মোট (COD)</th><th class="c">✓</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td colspan="3" class="r">সর্বমোট সংগ্রহ (COD)</td><td class="r">${memoTaka(grand)}</td><td></td></tr></tfoot>
      </table>
    </body></html>`;

  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(frame);
  const doc = frame.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    try { frame.contentWindow.focus(); frame.contentWindow.print(); } catch (e) {}
    setTimeout(() => frame.remove(), 1500);
  }, 600);
}

const HTML2PDF_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
let _html2pdfLoading = null;

// Lazy-load html2pdf only when a PDF is requested (keeps page load fast).
function ensureHtml2Pdf() {
  if (typeof html2pdf !== 'undefined') return Promise.resolve();
  if (_html2pdfLoading) return _html2pdfLoading;
  _html2pdfLoading = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = HTML2PDF_CDN;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  return _html2pdfLoading;
}

function downloadMemoPdf(order, settings, layout) {
  ensureHtml2Pdf().then(() => renderMemoPdf(order, settings, layout)).catch(() => {
    alert('PDF লাইব্রেরি লোড করা যায়নি — ইন্টারনেট সংযোগ দেখুন।');
  });
}

function renderMemoPdf(order, settings, layout) {
  const holder = document.createElement('div');
  holder.style.position = 'fixed';
  holder.style.left = '-9999px';
  holder.style.top = '0';
  holder.innerHTML = `<style>${memoStyles(layout)}</style><div class="memo">${buildMemoHtml(order, settings, layout)}</div>`;
  document.body.appendChild(holder);

  const fmt = MEMO_LAYOUTS[layout].jsPDFFormat;
  const opt = {
    margin: layout === 'thermal' ? 2 : 6,
    filename: 'memo-' + memoOrderNo(order).replace(/[^\w-]/g, '') + '.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
    jsPDF: { unit: 'mm', format: fmt, orientation: 'portrait' }
  };

  const el = holder.querySelector('.memo');
  // Delay so the embedded font is ready before html2canvas snapshots.
  setTimeout(() => {
    html2pdf().set(opt).from(el).save().then(() => holder.remove()).catch(() => holder.remove());
  }, 400);
}

/** Memo preview modal with layout toggle + Print + Download buttons. */
function openMemoModal(order, settings) {
  settings = settings || (typeof store !== 'undefined' && store && store.settings) || (typeof STORE !== 'undefined' && STORE && STORE.settings) || {};
  let layout = 'a5';

  let modal = document.getElementById('memo-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'memo-modal';
    modal.className = 'fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-3';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        <div class="flex items-center justify-between gap-2 px-4 py-3 border-b dark:border-gray-700">
          <h3 class="font-extrabold text-gray-900 dark:text-gray-100">🧾 অর্ডার মেমো</h3>
          <button id="memo-close" class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 dark:text-gray-200 font-bold">✕</button>
        </div>
        <div class="px-4 pt-3">
          <div class="inline-flex rounded-xl bg-gray-100 dark:bg-gray-700 p-1 text-sm font-bold">
            <button data-memo-layout="a5" class="px-3 py-1.5 rounded-lg">A5 সাইজ</button>
            <button data-memo-layout="thermal" class="px-3 py-1.5 rounded-lg">৮০mm থার্মাল</button>
          </div>
        </div>
        <div class="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-900">
          <div id="memo-preview-wrap" class="flex justify-center"></div>
        </div>
        <div class="grid grid-cols-2 gap-2 p-4 border-t dark:border-gray-700">
          <button id="memo-print" class="py-3 bg-gray-800 text-white font-bold rounded-xl">🖨️ প্রিন্ট</button>
          <button id="memo-pdf" class="py-3 bg-pink-500 text-white font-bold rounded-xl">📄 PDF ডাউনলোড</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }
  modal.classList.remove('hidden');

  const wrap = modal.querySelector('#memo-preview-wrap');
  const renderPreview = () => {
    wrap.innerHTML = `<style>${memoStyles(layout)}</style>
      <div class="memo" style="box-shadow:0 4px 20px rgba(0,0,0,.15)">${buildMemoHtml(order, settings, layout)}</div>`;
    modal.querySelectorAll('[data-memo-layout]').forEach((b) => {
      const on = b.dataset.memoLayout === layout;
      b.classList.toggle('bg-white', on);
      b.classList.toggle('dark:bg-gray-800', on);
      b.classList.toggle('shadow', on);
      b.classList.toggle('text-pink-600', on);
      b.classList.toggle('text-gray-500', !on);
    });
  };
  renderPreview();

  const close = () => modal.classList.add('hidden');
  modal.querySelector('#memo-close').onclick = close;
  modal.onclick = (e) => { if (e.target === modal) close(); };
  modal.querySelectorAll('[data-memo-layout]').forEach((b) => {
    b.onclick = () => { layout = b.dataset.memoLayout; renderPreview(); };
  });
  modal.querySelector('#memo-print').onclick = () => printMemo(order, settings, layout);
  modal.querySelector('#memo-pdf').onclick = () => downloadMemoPdf(order, settings, layout);
}
