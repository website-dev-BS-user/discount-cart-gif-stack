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
        
        // Enhanced navigation function that tries multiple methods
        function navigateToDiscounts() {
          console.log('Attempting navigation to discounts...');
          
          // Method 1: Try postMessage to parent frame (most reliable for embedded apps)
          try {
            console.log('Trying postMessage to parent...');
            const message = {
              message: 'Shopify.API.remoteRedirect',
              data: { location: discountsUrl }
            };
            window.parent.postMessage(message, 'https://admin.shopify.com');
            console.log('PostMessage sent to parent');
            return;
          } catch(error) {
            console.error('PostMessage failed:', error);
          }
          
          // Method 2: Try top-level navigation
          try {
            console.log('Trying window.top.location...');
            if (window.top && window.top !== window) {
              window.top.location.href = discountsUrl;
              console.log('Top navigation attempted');
              return;
            }
          } catch(error) {
            console.error('Top navigation failed:', error);
          }
          
          // Method 3: Try parent navigation
          try {
            console.log('Trying window.parent.location...');
            if (window.parent && window.parent !== window) {
              window.parent.location.href = discountsUrl;
              console.log('Parent navigation attempted');
              return;
            }
          } catch(error) {
            console.error('Parent navigation failed:', error);
          }
          
          // Method 4: Open in new tab/window
          try {
            console.log('Opening in new window...');
            window.open(discountsUrl, '_blank');
            console.log('New window opened');
          } catch(error) {
            console.error('New window failed:', error);
            // Final fallback - show URL to user
            alert('Please navigate to: ' + discountsUrl);
          }
        }
        
        // Set up immediate click handler
        openBtn.onclick = function(){
          console.log('Button clicked!');
          navigateToDiscounts();
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
            console.log('App Bridge not available, using fallback navigation only');
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
            
            // Enhanced click handler with App Bridge
            openBtn.onclick = function(){
              console.log('App Bridge enhanced button clicked!');
              let appBridgeWorked = false;
              
              try {
                console.log('Attempting App Bridge navigation...');
                
                // Try different App Bridge navigation methods
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
              
              // If App Bridge didn't work, fall back to our enhanced navigation
              if (!appBridgeWorked) {
                console.log('App Bridge failed, using fallback navigation');
                navigateToDiscounts();
              } else {
                // Even if App Bridge worked, add a safety fallback after a delay
                setTimeout(function() {
                  console.log('Safety fallback after App Bridge attempt');
                  navigateToDiscounts();
                }, 1000);
              }
            };
            
            console.log('App Bridge enhanced button click handler attached');
            return true;
          } catch(error) {
            console.error('Error setting up App Bridge:', error);
            return false;
          }
        }
        
        // Try to set up App Bridge with reduced polling (since fallback works now)
        console.log('Attempting App Bridge setup...');
        if (!wireAppBridge()) {
          // Try a few times then give up - fallback navigation works
          let attempts = 0;
          const maxAttempts = 5;
          const pollInterval = setInterval(function() {
            attempts++;
            console.log('App Bridge polling attempt:', attempts);
            
            if (wireAppBridge() || attempts >= maxAttempts) {
              clearInterval(pollInterval);
              if (attempts >= maxAttempts) {
                console.log('App Bridge unavailable - using fallback navigation only');
              }
            }
          }, 300);
        }
        
        console.log('Setup complete - button ready with enhanced navigation');
      })();
    </script>
  </body>
</html>`);
}