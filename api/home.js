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
    <p>Go to <b>Discounts → Create</b>, choose "Gift discount…", set the threshold/max gifts, then Save.</p>
    <button id="open-discounts">Open Discounts</button>
    <script>
      (function(){
        console.log('Script starting...');
        const openBtn = document.getElementById('open-discounts');
        console.log('Button element:', openBtn);
        
        const params = new URLSearchParams(window.location.search);
        const hostParam = params.get('host');
        console.log('Host param:', hostParam);
        
        if (!hostParam) {
          console.log('No host param found');
          openBtn.onclick = function(){
            console.log('No host - showing alert');
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
          }catch(e){ 
            console.error('Base64 decode error:', e);
            return ''; 
          }
        }
        
        const decodedHost = b64urlDecode(hostParam);
        console.log('Decoded host:', decodedHost);
        
        const adminBase = decodedHost ? ('https://' + decodedHost.replace(/\\/+$/, '')) : '';
        const discountsUrl = adminBase ? (adminBase + '/discounts') : '/admin/discounts';
        console.log('Discounts URL:', discountsUrl);
        
        function wire(){
          console.log('Wiring function called...');
          const AB = window.appBridge || window['app-bridge'];
          console.log('App Bridge object:', AB);
          
          if (!AB) {
            console.log('App Bridge not available');
            return false;
          }
          
          try {
            const { actions, createApp } = AB;
            console.log('App Bridge actions:', actions);
            
            const app = createApp({ 
              apiKey: "${process.env.SHOPIFY_API_KEY}", 
              host: hostParam 
            });
            console.log('App created:', app);
            
            const Redirect = actions.Redirect;
            const redirect = Redirect.create(app);
            console.log('Redirect created:', redirect);
            
            openBtn.onclick = function(){
              console.log('Button clicked!');
              let fired = false;
              
              try {
                console.log('Attempting App Bridge redirect...');
                redirect.dispatch(Redirect.Action.ADMIN_PATH, '/discounts');
                fired = true;
                console.log('App Bridge redirect dispatched');
              } catch(error) {
                console.error('App Bridge redirect failed:', error);
              }
              
              // Fallback navigation
              setTimeout(function(){
                console.log('Fallback navigation triggered, fired:', fired);
                try { 
                  console.log('Trying window.top.location.assign');
                  window.top.location.assign(discountsUrl); 
                } catch(error) { 
                  console.log('window.top failed, trying window.location.assign');
                  console.error('Top navigation error:', error);
                  window.location.assign(discountsUrl); 
                }
              }, fired ? 400 : 50);
            };
            
            console.log('Button click handler attached');
            return true;
          } catch(error) {
            console.error('Error in wire function:', error);
            return false;
          }
        }
        
        // Try to wire immediately
        console.log('Attempting to wire immediately...');
        if (!wire()){
          console.log('Initial wire failed, setting up event listeners...');
          
          // Try when app-bridge script loads
          const tag = document.querySelector('script[src*="app-bridge.js"]');
          if (tag) {
            console.log('Found app-bridge script tag, adding load listener');
            tag.addEventListener('load', function() {
              console.log('App Bridge script loaded, attempting to wire...');
              wire();
            }, { once: true });
          }
          
          // Also try when page loads completely
          window.addEventListener('load', function() {
            console.log('Window loaded, attempting to wire...');
            wire();
          }, { once: true });
          
          // Additional fallback - try after a short delay
          setTimeout(function() {
            console.log('Timeout fallback, attempting to wire...');
            wire();
          }, 1000);
        }
      })();
    </script>
  </body>
</html>`);
}