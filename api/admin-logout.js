import { clearAdminSessionCookie, requestIsSameOrigin } from './admin-auth.js';

export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  if (!requestIsSameOrigin(req)) return res.status(403).json({ error: 'Invalid request origin' });
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Set-Cookie', clearAdminSessionCookie());
  return res.status(200).json({ authenticated: false });
}
