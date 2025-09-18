import crypto from 'crypto';

// Read raw body from the Node request in a Vercel serverless function
export async function getRawBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export function verifyShopifyHmac(rawBody, hmacHeader, secret) {
  if (!hmacHeader || !secret) return false;
  const digest = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('base64');
  try {
    // timing-safe compare
    return crypto.timingSafeEqual(Buffer.from(hmacHeader, 'utf8'), Buffer.from(digest, 'utf8'));
  } catch {
    return false;
  }
}
