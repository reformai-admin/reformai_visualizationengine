import { createSign } from 'node:crypto';

const CLOUD_RUN_URL = 'https://reform-ai-vis-646800391584.us-central1.run.app';

async function getOIDCToken(key, audience) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: key.client_email,
    sub: key.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    target_audience: audience,
  })).toString('base64url');

  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const sig = sign.sign(key.private_key, 'base64url');
  const jwt = `${header}.${payload}.${sig}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const data = await res.json();
  if (!data.id_token) throw new Error(`OIDC token error: ${JSON.stringify(data)}`);
  return data.id_token;
}

export const handler = async (event) => {
  try {
    const url = new URL(event.rawUrl);
    const targetUrl = `${CLOUD_RUN_URL}${url.pathname}${url.search}`;

    console.log('[proxy] method:', event.httpMethod, '| path+query:', url.pathname + url.search);
    console.log('[proxy] isBase64Encoded:', event.isBase64Encoded, '| body size:', event.body?.length ?? 0);

    const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    const token = await getOIDCToken(key, CLOUD_RUN_URL);

    // Forward all headers but override/add auth and host
    const forwardHeaders = {};
    for (const [key, value] of Object.entries(event.headers)) {
      if (!['host', 'connection', 'content-length'].includes(key.toLowerCase())) {
        forwardHeaders[key.toLowerCase()] = value;
      }
    }
    forwardHeaders['authorization'] = `Bearer ${token}`;

    // Always decode body as binary — Netlify should base64-encode all POST bodies.
    // If isBase64Encoded is somehow false for multipart, Buffer.from(string) with
    // binary content would silently corrupt image bytes. Prefer the safe path.
    let body;
    if (event.body) {
      body = event.isBase64Encoded
        ? Buffer.from(event.body, 'base64')
        : Buffer.from(event.body, 'binary'); // 'binary' = latin1, preserves raw bytes
      forwardHeaders['content-length'] = String(body.length);
      console.log('[proxy] decoded body bytes:', body.length);
    }

    const response = await fetch(targetUrl, {
      method: event.httpMethod,
      headers: forwardHeaders,
      body: event.httpMethod !== 'GET' ? body : undefined,
    });

    const responseBuffer = Buffer.from(await response.arrayBuffer());

    return {
      statusCode: response.status,
      headers: { 'content-type': response.headers.get('content-type') || 'application/json' },
      body: responseBuffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    console.error('Proxy error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Proxy error', message: err.message }),
    };
  }
};
