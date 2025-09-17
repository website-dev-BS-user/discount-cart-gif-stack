export default function handler(req, res) {
  const { shop } = req.query;
  if (!shop) {
    return res.status(200).send('<form method="get"><input name="shop" placeholder="your-store.myshopify.com"/><button>Install</button></form>');
  }
  const url = new URL(`https://${shop}/admin/oauth/authorize`);
  url.searchParams.set('client_id', process.env.SHOPIFY_API_KEY);
  url.searchParams.set('scope', process.env.SCOPES || 'write_discounts,read_discounts');
  url.searchParams.set('redirect_uri', `${process.env.APP_URL}/api/auth/callback`);
  url.searchParams.set('state', 'nonce123');
  res.redirect(url.toString());
}
