// gift-app-host/api/home.js
export default function handler(req, res) {
  const { shop } = req.query;
  if (!shop) return res.redirect('/api/install');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <base target="_top">
    <title>Gift Discount App</title>

    <!-- Keep App Bridge for Shopify's automated checks -->
    <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" data-api-key="${process.env.SHOPIFY_API_KEY}"></script>

    <style>
      :root{--gap:10px}
      body{font:14px system-ui, -apple-system, Segoe UI, Roboto, sans-serif; padding:24px; line-height:1.35}
      h1{margin:0 0 8px}
      .row{display:flex; flex-wrap:wrap; gap:var(--gap); align-items:center; margin:12px 0}
      input[type="text"]{padding:8px 10px; min-width:280px}
      button{padding:8px 12px; cursor:pointer; border:1px solid #ddd; border-radius:8px; background:#fff}
      small{color:#6b7280}
      .muted{color:#6b7280; margin-top:6px}
      .hide{display:none}
    </style>
  </head>
  <body>
    <h1>Gift Discount App</h1>
    <p>Go to <b>Discounts → Create</b>, choose “Gift discount…”, set the threshold/max gifts, then Save.</p>

    <div class="row">
      <button id="open-discounts">Open Discounts</button>
    </div>

    <hr style="margin:18px 0; border:none; border-top:1px solid #eee"/>

    <h3 style="margin:0 0 8px">Quick gift test</h3>
    <div class="row">
      <input id="variantId" type="text" placeholder="Variant ID (numeric)" />
      <button id="pick" class="hide">Pick product</button>
      <button id="addGift">Add gift (with _gift=true)</button>
      <button id="open-cart">Open cart</button>
    </div>
    <div class="muted">
      Tip: “Pick product” lets you choose a product/variant from Admin; we’ll fill the numeric Variant ID for you.
      “Add gift” opens your storefront and adds the variant with <code>properties[_gift]=true</code>.
    </div>

    <script>
      (function(){
        const params = new URLSearchParams(window.location.search);
        const hostParam = params.get('host');
        const shopDomain = ${JSON.stringify(shop)};

        // ---------- helpers ----------
        function b64urlDecode(s){
          try {
            let t = s.replace(/-/g,'+').replace(/_/g,'/');
            while (t.length % 4) t += '=';
            return (window.atob || atob)(t);
          } catch(e) { return ''; }
        }

        // ---------- Open Discounts (works even if App Bridge is flaky) ----------
        (function wireOpenDiscounts(){
          const btn = document.getElementById('open-discounts');
          if (!hostParam) {
            btn.onclick = () => alert('Open this app from Shopify Admin (Apps) to enable navigation.');
            return;
          }
          const decodedHost = b64urlDecode(hostParam); // e.g. "admin.shopify.com/store/blueskytestenv"
          const adminBase = decodedHost ? 'https://' + decodedHost.replace(/\\/+$/, '') : '';
          const discountsUrl = adminBase ? adminBase + '/discounts' : '/admin/discounts';

          btn.onclick = function(){
            // Preferred: ask the parent Admin frame to navigate
            try {
              window.parent.postMessage(
                { type: 'Shopify.API.remoteRedirect', data: { url: discountsUrl } },
                'https://admin.shopify.com'
              );
            } catch(e) {}

            // Safety: force top navigation shortly after
            setTimeout(() => {
              try { window.top.location.assign(discountsUrl); }
              catch(_) { window.location.assign(discountsUrl); }
            }, 350);
          };
        })();

        // ---------- Quick gift test ----------
        const input = document.getElementById('variantId');
        const addBtn = document.getElementById('addGift');
        const cartBtn = document.getElementById('open-cart');
        const pickBtn = document.getElementById('pick');

        addBtn.onclick = function(){
          const id = (input.value || '').trim();
          if (!/^\\d{6,}$/.test(id)) { alert('Enter a valid numeric Variant ID (e.g., 51470559936853).'); return; }
          const url = \`https://\${shopDomain}/cart/add?id=\${encodeURIComponent(id)}&quantity=1&properties%5B_gift%5D=true\`;
          window.open(url, '_blank'); // open storefront add in a new tab
        };

        cartBtn.onclick = function(){
          window.open('https://' + shopDomain + '/cart', '_blank');
        };

        // Optional: enable ResourcePicker if App Bridge is available
        (function maybeEnablePicker(){
          const AB = window.shopifyAppBridge || window.AppBridge || window['app-bridge'] || window.appBridge;
          if (!AB || !hostParam) return; // keep hidden
          pickBtn.classList.remove('hide');

          try {
            const { actions, createApp } = AB;
            const app = createApp({ apiKey: ${JSON.stringify(process.env.SHOPIFY_API_KEY || '')}, host: hostParam });
            const RP = actions && actions.ResourcePicker;
            if (!RP) return;

            const picker = RP.create(app, {
              resourceType: RP.ResourceType.Product,
              showVariants: true,
              selectMultiple: false,
            });

            pickBtn.onclick = () => picker.dispatch(RP.Action.OPEN);

            picker.subscribe(RP.Action.SELECT, ({ selection }) => {
              if (!selection || !selection.length) return;
              // Try to grab the first variant's GraphQL ID
              const first = selection[0];
              const gid = (first.variants && first.variants[0] && first.variants[0].id) || null;
              if (!gid) { alert('Please expand and select a variant.'); return; }
              const m = gid.match(/ProductVariant\\/(\\d+)/);
              if (m) input.value = m[1];
            });
          } catch(e) {
            // If anything fails, keep the picker button hidden
            pickBtn.classList.add('hide');
          }
        })();
      })();
    </script>
  </body>
</html>`);
}
