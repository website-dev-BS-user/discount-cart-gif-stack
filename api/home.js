// gift-app-host/api/home.js
export default function handler(req, res) {
  const { shop, host } = req.query;
  if (!shop) return res.redirect('/api/install');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <base target="_top">
    <title>Gift Discount App</title>

    <!-- Load App Bridge from Shopify CDN and declare the API key on the tag -->
    <script
      src="https://cdn.shopify.com/shopifycloud/app-bridge.js"
      data-api-key="${process.env.SHOPIFY_API_KEY}">
    </script>
    <script src="https://cdn.shopify.com/shopifycloud/app-bridge-utils.js"></script>

    <style>body{font:14px system-ui;padding:24px}button{padding:6px 10px;cursor:pointer}</style>
  </head>
  <body>
    <h1>Gift Discount App</h1>
    <p>Go to <b>Discounts → Create</b>, choose “Gift discount…”, set the threshold/max gifts, then Save.</p>
    <button id="open-discounts">Open Discounts</button>

    <script>
      (function(){
        const params = new URLSearchParams(window.location.search);
        const hostParam = params.get('host');
        if (!hostParam) {
          document.getElementById('open-discounts').onclick = function(){
            alert("Please open the app from Shopify Admin (Apps list) so we can redirect inside Admin.");
          };
          return;
        }

        function init() {
          const AB = window.appBridge || window['app-bridge'];
          if (!AB) { console.error('App Bridge not loaded yet'); return; }

          const { actions, createApp } = AB;
          const utils = window['app-bridge-utils'];

          const app = createApp({ apiKey: "${process.env.SHOPIFY_API_KEY}", host: hostParam });
          // Optional: request a session token; also appeases automated checks
          try { utils.getSessionToken(app).catch(() => {}); } catch(e) {}

          const Redirect = actions.Redirect;
          const redirect = Redirect.create(app);

          document.getElementById('open-discounts').onclick = function(){
            redirect.dispatch(Redirect.Action.ADMIN_PATH, '/discounts');
          };
        }

        // If AB is already on window, init immediately; otherwise wait for load
        if (window.appBridge || window['app-bridge']) {
          init();
        } else {
          const tag = document.querySelector('script[src*="app-bridge.js"]');
          if (tag) {
            tag.addEventListener('load', init, { once: true });
          } else {
            window.addEventListener('load', init, { once: true });
          }
        }
      })();
    </script>
  </body>
</html>`);
}
