import {
  adminAuthConfigured,
  adminSessionCookie,
  clearAdminSessionCookie,
  createAdminSession,
  requestHasAdminSession,
  requestIsSameOrigin,
  verifyAdminPassword,
} from './admin-auth.js';

const failures = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 8;

function clientKey(req) {
  return String(req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
}

function rateLimited(key) {
  const record = failures.get(key);
  if (!record || Date.now() - record.startedAt > WINDOW_MS) {
    failures.delete(key);
    return false;
  }
  return record.count >= MAX_ATTEMPTS;
}

function recordFailure(key) {
  const existing = failures.get(key);
  if (!existing || Date.now() - existing.startedAt > WINDOW_MS) {
    failures.set(key, { count: 1, startedAt: Date.now() });
    return;
  }
  existing.count += 1;
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).end();
  res.setHeader('Cache-Control', 'no-store');
  if (req.method === 'GET') {
    return res.status(200).json({
      configured: adminAuthConfigured(),
      authenticated: requestHasAdminSession(req),
    });
  }

  if (!requestIsSameOrigin(req)) return res.status(403).json({ error: 'Invalid request origin' });
  const action = String(req.body?.action || '');
  if (action === 'logout') {
    res.setHeader('Set-Cookie', clearAdminSessionCookie());
    return res.status(200).json({ authenticated: false });
  }
  if (action !== 'login') return res.status(400).json({ error: 'Invalid admin action' });
  if (!adminAuthConfigured()) return res.status(503).json({ error: 'Admin access is not configured yet.' });

  const key = clientKey(req);
  if (rateLimited(key)) return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
  if (!verifyAdminPassword(req.body?.password)) {
    recordFailure(key);
    await new Promise((resolve) => setTimeout(resolve, 250));
    return res.status(401).json({ error: 'Incorrect admin password' });
  }

  failures.delete(key);
  res.setHeader('Set-Cookie', adminSessionCookie(createAdminSession()));
  return res.status(200).json({ authenticated: true });
}
