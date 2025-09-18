import { getRawBody, verifyShopifyHmac } from '../../_utils/verifyWebhook.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const rawBody = await getRawBody(req);
  const hmac = req.headers['x-shopify-hmac-sha256'];
  const ok = verifyShopifyHmac(rawBody, hmac, process.env.SHOPIFY_API_SECRET);

  if (!ok) return res.status(401).send('Invalid HMAC');
  return res.status(200).send('ok');
}
