// ============================================================================
// /api/callback — échange le code GitHub contre un token, le passe à Decap CMS
// ----------------------------------------------------------------------------
// Variables d'env requises sur Vercel :
//   OAUTH_CLIENT_ID
//   OAUTH_CLIENT_SECRET
// ============================================================================

export default async function handler(req, res) {
  const { code } = req.query;
  if (!code) {
    res.status(400).send('Missing ?code parameter.');
    return;
  }

  const clientId = process.env.OAUTH_CLIENT_ID;
  const clientSecret = process.env.OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    res.status(500).send('OAuth env vars not set on Vercel.');
    return;
  }

  let payload;
  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const data = await response.json();
    payload = data.access_token
      ? { token: data.access_token, provider: 'github' }
      : { error: data.error_description || data.error || 'unknown_error' };
  } catch (err) {
    res.status(500).send('Token exchange failed: ' + err.message);
    return;
  }

  const status = payload.error ? 'error' : 'success';
  const message = `authorization:github:${status}:${JSON.stringify(payload)}`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(`<!doctype html>
<html><head><meta charset="utf-8"><title>Authorizing…</title></head>
<body>Authentification réussie, vous pouvez fermer cette fenêtre.
<script>
(function () {
  function send() {
    if (window.opener) window.opener.postMessage(${JSON.stringify(message)}, '*');
  }
  window.addEventListener('message', function (e) {
    if (e.data === 'authorizing:github') send();
  }, false);
  send();
  setTimeout(function () { window.close(); }, 1500);
})();
</script>
</body></html>`);
}
