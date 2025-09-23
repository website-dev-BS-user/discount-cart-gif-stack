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
    <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" data-api-key="${process.env.SHOPIFY_API_KEY}"></script>
    <script src="https://cdn.shopify.com/shopifycloud/app-bridge-utils.js"></script>
    <style>body{font:14px system-ui;padding:24px}button{padding:6px 10px;cursor:pointer}</style>
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

        // Decode base64-URL host safely → "admin.shopify.com/store/<store>"
        function b64urlDecode(input){
          try{
            let s = input.replace(/-/g, '+').replace(/_/g, '/');
            while (s.length % 4) s += '=';
            return (window.atob || atob)(s);
          }catch(e){ return ''; }
        }
        const decodedHost = b64urlDecode(hostParam);              // e.g. "admin.shopify.com/store/blueskytestenv"
        const adminBase   = decodedHost ? ('https://' + decodedHost.replace(/\\/+$/, '')) : '';
        const discountsUrl = adminBase ? (adminBase + '/discounts') : '/admin/discounts';

        function wire(){
          const AB = window.appBridge || window['app-bridge'];
          if (!AB) return false;

          const { actions, createApp } = AB;
          const app = createApp({ apiKey: "${process.env.SHOPIFY_API_KEY}", host: hostParam });
          const Redirect = actions.Redirect;
          const redirect = Redirect.create(app);

          openBtn.onclick = function(){
            let fired = false;
            try {
              redirect.dispatch(Redirect.Action.ADMIN_PATH, '/discounts'); // official way
              fired = true;
            } catch(_) {}

            // If nothing happens, force top-level navigation using decoded host
            setTimeout(function(){
              try { window.top.location.assign(discountsUrl); }
              catch(_) { window.location.assign(discountsUrl); }
            }, fired ? 400 : 50);
          };

          return true;
        }

        if (!wire()){
          const tag = document.querySelector('script[src*="app-bridge.js"]');
          if (tag) tag.addEventListener('load', wire, { once: true });
          else window.addEventListener('load', wire, { once: true });
        }
      })();
    </script>
  </body>
</html>`);
}
