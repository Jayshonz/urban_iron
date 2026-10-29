import { adminAuthConfigured, requestHasAdminSession } from './admin-auth.js';

export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).json({
    configured: adminAuthConfigured(),
    authenticated: requestHasAdminSession(req),
  });
}
