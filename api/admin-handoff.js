import { requestHasAdminSession } from './admin-auth.js';
import { createPasswordAdminHandoff, PHOTO_ADMIN_AUDIENCE } from './admin-sso-contract.js';

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] || character);
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'private, no-store');
  if (req.method !== 'GET') return res.status(405).end();
  if (!requestHasAdminSession(req)) {
    res.setHeader('Location', '/admin');
    return res.status(303).end();
  }

  const secret = String(process.env.ADMIN_SSO_SECRET || '');
  if (secret.length < 32) return res.status(503).send('Cross-portal admin access is not configured');
  const photoAdminUrl = String(process.env.PHOTO_ADMIN_URL || 'https://admin.urbaniron.co');
  const assertion = createPasswordAdminHandoff({
    audience: PHOTO_ADMIN_AUDIENCE,
    issuer: String(process.env.ATHLETE_ADMIN_ISSUER || 'https://athletes.urbaniron.co'),
    secret,
  });
  const action = new URL('/api/auth/handoff/races', photoAdminUrl);
  const html = `<!doctype html><html><head><meta name="referrer" content="no-referrer"><title>Opening Photo Admin…</title></head><body><p>Opening Photo Admin…</p><form id="handoff" method="post" action="${escapeHtml(action)}"><input type="hidden" name="assertion" value="${escapeHtml(assertion)}"><button type="submit">Continue to Photo Admin</button></form><script>document.getElementById('handoff').submit()</script></body></html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', `default-src 'none'; script-src 'unsafe-inline'; form-action ${action.origin}`);
  return res.status(200).send(html);
}
