import { adminSessionCookie, createAdminSession } from './admin-auth.js';
import { requestHasSsoOrigin, verifyAdminHandoff } from './admin-sso-contract.js';

function assertionFromBody(body) {
  if (typeof body === 'string') return new URLSearchParams(body).get('assertion') || '';
  return String(body?.assertion || '');
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).end();
  if (!requestHasSsoOrigin(req)) return res.status(403).json({ error: 'Invalid sign-in origin' });
  const identity = verifyAdminHandoff(assertionFromBody(req.body));
  if (!identity) return res.status(401).json({ error: 'Admin sign-in expired. Start again.' });
  res.setHeader('Set-Cookie', adminSessionCookie(createAdminSession({ authMethod: 'google', email: identity.email })));
  res.setHeader('Location', '/admin');
  return res.status(303).end();
}
