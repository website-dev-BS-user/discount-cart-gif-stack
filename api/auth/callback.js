export default async function handler(req, res) {
  const { shop, code } = req.query;
  if (!shop || !code) return res.status(400).send('Missing shop or code');
  const r = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_API_KEY,
      client_secret: process.env.SHOPIFY_API_SECRET,
      code
    })
  });
  if (!r.ok) return res.status(400).send('OAuth exchange failed');
  // const { access_token } = await r.json(); // storing not required for your use-case
  return res.redirect(`/api/home?shop=${encodeURIComponent(shop)}`);
}
