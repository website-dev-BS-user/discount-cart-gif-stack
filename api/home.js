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
    <script src="https://cdn.shopify.com/shopifycloud/app-bridge/releases/4.0.0/app-bridge.js" data-api-key="${process.env.SHOPIFY_API_KEY}"></script>
    <style>
      body{font:14px system-ui;padding:24px}
      button{padding:6px 10px;cursor:pointer}
      .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:12px 0}
      input[type="text"]{padding:8px 10px;min-width:280px}
      .muted{color:#6b7280}
      .hide{display:none}
    </style>
  </head>
  <body>
    <h1>Gift Discount App</h1>
    <p>Go to <b>Discounts → Create</b>, choose "Gift discount…", set the threshold/max gifts, then Save.</p>

    <button id="open-discounts">Open Discounts</button>

    <hr style="margin:18px 0;border:none;border-top:1px solid #eee"/>

    <h3 style="margin:0 0 8px">Quick gift test</h3>
    <div class="row">
      <input id="variantId" type="text" placeholder="Variant ID (numeric)" />
      <button id="pick" class="hide">Pick product</button>
      <button id="addGift">Add gift (with _gift=true)</button>
      <button id="open-cart">Open cart</button>
    </div>
    <p class="muted">Tip: “Pick product” lets you choose a product/variant from Admin; we’ll fill the numeric Variant ID for you. “Add gift” opens your storefront and adds the variant with <code>properties[_gift]=true</code>.</p>

    <script>
      (function(){
        console.log('Script starting...');
        const openBtn = document.getElementById('open-discounts');
        console.log('Button element:', openBtn);

        const params = new URLSearchParams(window.location.search);
        const hostParam = params.get('host');
        console.log('Host param:', hostParam);

        if (!hostParam) {
          console.log('No host param - setting fallback handler');
          openBtn.onclick = function(){
            console.log('No host - showing alert');
            alert("Please open the app from Shopify Admin (Apps) so we can navigate inside Admin.");
          };
        }

        // Decode base64-URL host safely
        function b64urlDecode(input){
          try{
            let s = input.replace(/-/g, '+').replace(/_/g, '/');
            while (s.length % 4) s += '=';
            return (window.atob || atob)(s);
          }catch(e){
            console.error('Base64 decode error:', e);
            return '';
          }
        }

        const decodedHost = hostParam ? b64urlDecode(hostParam) : '';
        console.log('Decoded host:', decodedHost);

        const adminBase = decodedHost ? ('https://' + decodedHost.replace(/\\/+$/, '')) : '';
        const discountsUrl = adminBase ? (adminBase + '/discounts') : '/admin/discounts';
        console.log('Discounts URL:', discountsUrl);

        // Enhanced navigation function that tries multiple methods
        function navigateToDiscounts() {
          console.log('Attempting navigation to discounts...');

          // Method 1: postMessage to parent frame (embedded apps)
          try {
            console.log('Trying postMessage to parent...');
            const message = {
              message: 'Shopify.API.remoteRedirect',
              data: { location: discountsUrl }
            };
            window.parent.postMessage(message, 'https://admin.shopify.com');
            console.log('PostMessage sent to parent');
          } catch(error) {
            console.error('PostMessage failed:', error);
          }

          // Safety: force top navigation shortly after
          setTimeout(() => {
            try {
              console.log('Trying window.top.location...');
              if (window.top) window.top.location.href = discountsUrl;
            } catch(error) {
              console.error('Top navigation failed:', error);
              try {
                console.log('Trying window.parent.location...');
                if (window.parent) window.parent.location.href = discountsUrl;
              } catch(e2) {
                console.error('Parent navigation failed:', e2);
                try {
                  console.log('Opening in new tab...');
                  window.open(discountsUrl, '_blank');
                } catch(e3) {
                  console.error('New window failed:', e3);
                  alert('Please navigate to: ' + discountsUrl);
                }
              }
            }
          }, 350);
        }

        // Set up immediate click handler
        openBtn.onclick = function(){
          console.log('Button clicked!');
          navigateToDiscounts();
        };

        function wireAppBridge(){
          console.log('Attempting to wire App Bridge...');
          let AppBridge = null;
          if (window.shopifyAppBridge) {
            AppBridge = window.shopifyAppBridge;
            console.log('Found App Bridge via shopifyAppBridge');
          } else if (window.AppBridge) {
            AppBridge = window.AppBridge;
            console.log('Found App Bridge via AppBridge');
          } else if (window['app-bridge']) {
            AppBridge = window['app-bridge'];
            console.log('Found App Bridge via app-bridge');
          } else if (window.appBridge) {
            AppBridge = window.appBridge;
            console.log('Found App Bridge via appBridge');
          }

          if (!AppBridge) {
            console.log('App Bridge not available, using fallback navigation only');
            return false;
          }

          try {
            console.log('App Bridge object:', AppBridge);
            const { createApp, actions } = AppBridge;

            if (!createApp) {
              console.log('createApp not found in App Bridge object');
              return false;
            }

            const app = createApp({
              apiKey: "${process.env.SHOPIFY_API_KEY}",
              host: hostParam
            });
            console.log('App created:', app);

            // Enhanced click handler with App Bridge (still keep fallback)
            openBtn.onclick = function(){
              console.log('App Bridge enhanced button clicked!');
              let appBridgeWorked = false;

              try {
                if (app && app.dispatch) {
                  app.dispatch({ type: 'APP::NAVIGATE', payload: { path: '/discounts' } });
                  appBridgeWorked = true;
                  console.log('App Bridge navigation dispatched via APP::NAVIGATE');
                } else if (actions && actions.Redirect) {
                  const Redirect = actions.Redirect;
                  const redirect = Redirect.create(app);
                  redirect.dispatch(Redirect.Action.ADMIN_PATH, '/discounts');
                  appBridgeWorked = true;
                  console.log('App Bridge navigation dispatched via Redirect');
                }
              } catch(error) {
                console.error('App Bridge navigation failed:', error);
              }

              if (!appBridgeWorked) {
                console.log('App Bridge failed, using fallback navigation');
                navigateToDiscounts();
              } else {
                setTimeout(function() {
                  console.log('Safety fallback after App Bridge attempt');
                  navigateToDiscounts();
                }, 1000);
              }
            };

            // ---------- Enable ResourcePicker for Quick gift test ----------
            try {
              const RP = actions && actions.ResourcePicker;
              if (RP) {
                const pickBtn = document.getElementById('pick');
                pickBtn.classList.remove('hide');
                const picker = RP.create(app, {
                  resourceType: RP.ResourceType.Product,
                  showVariants: true,
                  selectMultiple: false
                });
                pickBtn.onclick = () => picker.dispatch(RP.Action.OPEN);
                picker.subscribe(RP.Action.SELECT, ({ selection }) => {
                  if (!selection || !selection.length) return;
                  const first = selection[0];
                  const gid = (first.variants && first.variants[0] && first.variants[0].id) || null;
                  if (!gid) { alert('Please expand and select a variant.'); return; }
                  const m = gid.match(/ProductVariant\\/(\\d+)/);
                  if (m) document.getElementById('variantId').value = m[1];
                });
              }
            } catch(e) {
              console.warn('ResourcePicker setup failed:', e);
            }

            console.log('App Bridge enhanced handlers attached');
            return true;
          } catch(error) {
            console.error('Error setting up App Bridge:', error);
            return false;
          }
        }

        // Try to set up App Bridge with a few attempts; fallback navigation already works
        console.log('Attempting App Bridge setup...');
        if (!wireAppBridge()) {
          let attempts = 0;
          const maxAttempts = 5;
          const poll = setInterval(function() {
            attempts++;
            console.log('App Bridge polling attempt:', attempts);
            if (wireAppBridge() || attempts >= maxAttempts) clearInterval(poll);
          }, 300);
        }

        console.log('Setup complete - button ready with enhanced navigation');

        // ---------- Quick gift test: add gift + open cart ----------
        const shopDomain = ${JSON.stringify(shop)};
        const variantInput = document.getElementById('variantId');
        const addBtn = document.getElementById('addGift');
        const cartBtn = document.getElementById('open-cart');

        addBtn.onclick = function(){
          const id = (variantInput.value || '').trim();
          if (!/^\\d{6,}$/.test(id)) { alert('Enter a valid numeric Variant ID (e.g., 51470559936853).'); return; }
          const url = \`https://\${shopDomain}/cart/add?id=\${encodeURIComponent(id)}&quantity=1&properties%5B_gift%5D=true\`;
          window.open(url, '_blank');
        };

        cartBtn.onclick = function(){
          window.open('https://' + shopDomain + '/cart', '_blank');
        };
      })();
    </script>
  </body>
</html>`);
}
