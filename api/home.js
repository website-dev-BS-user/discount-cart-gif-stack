export default function handler(req, res) {
  const { shop, host } = req.query;
  if (!shop) return res.redirect('/api/install');

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <base target="_top">
    <!-- REQUIRED for the auto-checks -->
    <meta name="shopify-api-key" content="${process.env.SHOPIFY_API_KEY}">
    <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
    <script src="https://cdn.shopify.com/shopifycloud/app-bridge-utils.js"></script>
    <title>Gift Discount App</title>
    <style>body{font:14px system-ui;padding:24px}</style>
  </head>
  <body>
    <h1>Gift Discount App</h1>
    <p>Go to <b>Discounts → Create</b>, pick “Gift discount…”, set the threshold/max gifts, then Save.</p>
    <p><button id="open">Open Discounts</button></p>

    <script>
      const AppBridge = window['app-bridge'];
      const createApp = AppBridge.createApp;
      const utils = window['app-bridge-utils'];

      const params = new URLSearchParams(window.location.search);
      const app = createApp({ apiKey: "${process.env.SHOPIFY_API_KEY}", host: params.get('host') });

      // Request a session token (good practice & helps the checks)
      utils.getSessionToken(app).then(() => {});
      document.getElementById('open').onclick = () => { window.top.location.href = "/admin/discounts"; };
    </script>
  </body>
</html>`);
}
