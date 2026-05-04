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
    const originalPath = new URL(event.rawUrl).pathname;
    const targetUrl = `${CLOUD_RUN_URL}${originalPath}`;

    const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    const token = await getOIDCToken(key, CLOUD_RUN_URL);

    const forwardHeaders = { authorization: `Bearer ${token}` };
    for (const h of ['content-type', 'x-contractor-id']) {
      const val = event.headers[h] || event.headers[h.toLowerCase()];
      if (val) forwardHeaders[h] = val;
    }

    const body = event.body
      ? (event.isBase64Encoded ? Buffer.from(event.body, 'base64') : event.body)
      : undefined;

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
