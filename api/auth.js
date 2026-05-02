// ============================================================================
// /api/auth — démarre le flow OAuth GitHub pour l'admin Decap CMS
// ----------------------------------------------------------------------------
// Variables d'env requises sur Vercel :
//   OAUTH_CLIENT_ID       — Client ID de la GitHub OAuth App
//   OAUTH_CLIENT_SECRET   — Client Secret (utilisé par /api/callback)
// ============================================================================

export default function handler(req, res) {
  const clientId = process.env.OAUTH_CLIENT_ID;
  if (!clientId) {
    res.status(500).send('OAUTH_CLIENT_ID is not set in Vercel env vars.');
    return;
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const redirectUri = `https://${host}/api/callback`;

  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('scope', 'repo,user');
  url.searchParams.set('state', 'decap-cms');

  res.redirect(302, url.toString());
}
