export default function handler(req, res) {
  const { shop, host } = req.query;
  if (!shop) return res.redirect('/api/install');
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.status(200).send(`<!doctype html><html><head>
<base target="_top"><meta charset="utf-8"><title>Gift Discount App</title>
<script src="https://unpkg.com/@shopify/app-bridge@3"></script>
<script src="https://unpkg.com/@shopify/app-bridge-utils@3"></script>
<style>body{font:14px system-ui;padding:24px}</style>
</head><body>
<h1>Gift Discount App</h1>
<p>Go to <b>Discounts → Create</b>, pick “Gift discount…”, set Threshold/Max gifts in the block, then Save.</p>
<p><button id="open">Open Discounts</button></p>
<script>
  const AppBridge = window["app-bridge"];
  const createApp = AppBridge.createApp;
  const utils = window["app-bridge-utils"];
  const app = createApp({ apiKey: "${process.env.SHOPIFY_API_KEY}", host: "${host||''}" });
  utils.getSessionToken(app).then(()=>{});
  document.getElementById('open').onclick = () => { window.top.location.href = "/admin/discounts"; };
</script>
</body></html>`);
}
