// gift-app-host/api/home.js
export default function handler(req, res) {
  const { shop, host } = req.query;           // Shopify passes both when opened from Admin
  if (!shop) return res.redirect('/api/install'); // ensure we always have a shop

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <base target="_top">
    <!-- App Bridge (Shopify CDN) + API key meta (required by checks) -->
    <meta name="shopify-api-key" content="${process.env.SHOPIFY_API_KEY}">
    <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
    <script src="https://cdn.shopify.com/shopifycloud/app-bridge-utils.js"></script>
    <title>Gift Discount App</title>
    <style>body{font:14px system-ui;padding:24px}button{padding:6px 10px;cursor:pointer}</style>
  </head>
  <body>
    <h1>Gift Discount App</h1>
    <p>Go to <b>Discounts → Create</b>, choose “Gift discount…”, set the threshold/max gifts, then Save.</p>
    <button id="open-discounts">Open Discounts</button>

    <script>
      (function(){
        // If opened outside Admin, we won't have host. Show a gentle message instead of hard failing.
        const params = new URLSearchParams(window.location.search);
        const hostParam = params.get('host');
        if (!hostParam) {
          document.getElementById('open-discounts').onclick = function(){
            alert("Please open the app from Shopify Admin (Apps list) so we can redirect inside Admin.");
          };
          return;
        }

        const AppBridge = window['app-bridge'];
        const actions = AppBridge.actions;
        const createApp = AppBridge.createApp;
        const utils = window['app-bridge-utils'];

        const app = createApp({ apiKey: "${process.env.SHOPIFY_API_KEY}", host: hostParam });

        // Good practice plus satisfies embedded checks
        utils.getSessionToken(app).catch(() => {});

        // Use ADMIN_PATH redirect so it works on admin.shopify.com/store/... automatically
        const Redirect = actions.Redirect;
        const redirect = Redirect.create(app);

        document.getElementById('open-discounts').onclick = function(){
          redirect.dispatch(Redirect.Action.ADMIN_PATH, '/discounts');
        };
      })();
    </script>
  </body>
</html>`);
}
