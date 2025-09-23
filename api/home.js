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

    <!-- Shopify App Bridge (CDN) -->
    <script
      src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
      data-api-key="${process.env.SHOPIFY_API_KEY}">
    </script>
    <script src="https://cdn.shopify.com/shopifycloud/app-bridge-utils.js"></script>

    <style>
      body{font:14px system-ui;padding:24px}
      button{padding:6px 10px;cursor:pointer}
    </style>
  </head>
  <body>
    <h1>Gift Discount App</h1>
    <p>Go to <b>Discounts → Create</b>, choose “Gift discount…”, set the threshold/max gifts, then Save.</p>
    <button id="open-discounts">Open Discounts</button>

    <script>
      (function(){
        const openBtn = document.getElementById('open-discounts');
        const params = new URLSearchParams(window.location.search);
        const hostParam = params.get('host');

        if (!hostParam) {
          openBtn.onclick = function(){
            alert("Please open the app from Shopify Admin (Apps) so we can navigate inside Admin.");
          };
          return;
        }

        // Build a guaranteed admin URL from the base64-encoded host param
        // hostParam decodes to "admin.shopify.com/store/<store>"
        let adminBase = '';
        try {
          const decoded = (window.atob || atob)(hostParam);
          adminBase = 'https://' + decoded.replace(/\\/+$/, '');
        } catch (_) {
          // Fallback to generic admin root if decoding ever failed
          adminBase = '/admin';
        }
        const discountsUrl = adminBase + '/discounts';

        function wireHandlers() {
          const AB = window.appBridge || window['app-bridge'];
          if (!AB) return false;

          const { actions, createApp } = AB;
          const utils = window['app-bridge-utils'];
          const app = createApp({ apiKey: "${process.env.SHOPIFY_API_KEY}", host: hostParam });

          // Optional: request a session token (helps embedded checks)
          try { utils.getSessionToken(app).catch(() => {}); } catch (e) {}

          const Redirect = actions.Redirect;
          const redirect = Redirect.create(app);

          openBtn.onclick = function(){
            // Try App Bridge first…
            try { redirect.dispatch(Redirect.Action.ADMIN_PATH, '/discounts'); } catch (_) {}

            // …then hard-fallback after a brief delay if nothing happened.
            setTimeout(function(){
              try { window.top.location.assign(discountsUrl); }
              catch (_) { window.location.assign(discountsUrl); }
            }, 400);
          };

          return true;
        }

        // If App Bridge is already present, wire now; otherwise wait for the script to load
        if (!wireHandlers()) {
          const tag = document.querySelector('script[src*="app-bridge.js"]');
          if (tag) tag.addEventListener('load', wireHandlers, { once: true });
          else window.addEventListener('load', wireHandlers, { once: true });
        }
      })();
    </script>
  </body>
</html>`);
}
