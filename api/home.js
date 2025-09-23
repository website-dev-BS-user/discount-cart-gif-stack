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
          console.log('No host param - setting fallback handler');
          openBtn.onclick = function(){
            console.log('No host - showing alert');
            alert("Please open the app from Shopify Admin (Apps) so we can navigate inside Admin.");
          };
          return;
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
        
        const decodedHost = b64urlDecode(hostParam);
        console.log('Decoded host:', decodedHost);
        
        const adminBase = decodedHost ? ('https://' + decodedHost.replace(/\\/+$/, '')) : '';
        const discountsUrl = adminBase ? (adminBase + '/discounts') : '/admin/discounts';
        console.log('Discounts URL:', discountsUrl);
        
        // Set up a fallback click handler immediately
        openBtn.onclick = function(){
          console.log('Fallback button clicked - using direct navigation');
          try { 
            console.log('Trying window.top.location.assign to:', discountsUrl);
            window.top.location.assign(discountsUrl); 
          } catch(error) { 
            console.log('window.top failed, trying window.location.assign');
            console.error('Top navigation error:', error);
            window.location.assign(discountsUrl); 
          }
        };
        
        function wireAppBridge(){
          console.log('Attempting to wire App Bridge...');
          
          // Try different ways to access App Bridge
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
            console.log('App Bridge still not available, using fallback only');
            return false;
          }
          
          try {
            console.log('App Bridge object:', AppBridge);
            const { createApp } = AppBridge;
            
            if (!createApp) {
              console.log('createApp not found in App Bridge object');
              return false;
            }
            
            const app = createApp({ 
              apiKey: "${process.env.SHOPIFY_API_KEY}", 
              host: hostParam 
            });
            console.log('App created:', app);
            
            // Enhanced click handler with App Bridge + fallback
            openBtn.onclick = function(){
              console.log('Enhanced button clicked!');
              let appBridgeWorked = false;
              
              try {
                console.log('Attempting App Bridge navigation...');
                
                // Try App Bridge navigation
                if (app && app.dispatch) {
                  app.dispatch({
                    type: 'APP::NAVIGATE',
                    payload: { path: '/discounts' }
                  });
                  appBridgeWorked = true;
                  console.log('App Bridge navigation dispatched via APP::NAVIGATE');
                } else if (AppBridge.actions && AppBridge.actions.Redirect) {
                  const Redirect = AppBridge.actions.Redirect;
                  const redirect = Redirect.create(app);
                  redirect.dispatch(Redirect.Action.ADMIN_PATH, '/discounts');
                  appBridgeWorked = true;
                  console.log('App Bridge navigation dispatched via Redirect');
                }
              } catch(error) {
                console.error('App Bridge navigation failed:', error);
              }
              
              // Always use fallback after a short delay, just in case
              setTimeout(function(){
                if (!appBridgeWorked) {
                  console.log('Using immediate fallback navigation');
                }
                try { 
                  console.log('Fallback navigation to:', discountsUrl);
                  window.top.location.assign(discountsUrl); 
                } catch(error) { 
                  console.error('Fallback navigation error:', error);
                  window.location.assign(discountsUrl); 
                }
              }, appBridgeWorked ? 500 : 100);
            };
            
            console.log('Enhanced button click handler attached with App Bridge');
            return true;
          } catch(error) {
            console.error('Error setting up App Bridge:', error);
            return false;
          }
        }
        
        // Try to wire App Bridge with multiple strategies
        console.log('Initial App Bridge setup attempt...');
        if (!wireAppBridge()) {
          console.log('Setting up App Bridge load listeners...');
          
          // Strategy 1: Wait for script onload
          const scriptTag = document.querySelector('script[src*="app-bridge"]');
          if (scriptTag) {
            console.log('Found App Bridge script, adding load listener');
            scriptTag.onload = function() {
              console.log('App Bridge script loaded');
              setTimeout(wireAppBridge, 100);
            };
          }
          
          // Strategy 2: Poll for App Bridge availability
          let attempts = 0;
          const maxAttempts = 20;
          const pollInterval = setInterval(function() {
            attempts++;
            console.log('Polling for App Bridge, attempt:', attempts);
            
            if (wireAppBridge() || attempts >= maxAttempts) {
              clearInterval(pollInterval);
              if (attempts >= maxAttempts) {
                console.log('Max polling attempts reached, using fallback only');
              }
            }
          }, 200);
          
          // Strategy 3: Window load event
          window.addEventListener('load', function() {
            console.log('Window loaded, final App Bridge attempt');
            setTimeout(wireAppBridge, 100);
          });
        }
        
        console.log('Initial setup complete - button has fallback handler');
      })();
    </script>
  </body>
</html>`);
}