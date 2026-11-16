import crypto from 'node:crypto';
import { safeEqual } from './session.js';

export const ATHLETE_ADMIN_AUDIENCE = 'urban-iron-athlete-admin';
export const PHOTO_ADMIN_AUDIENCE = 'urban-iron-photo-admin';

function signature(value, secret) {
  return crypto.createHmac('sha256', secret).update(`urban-iron-admin-handoff\n${value}`).digest('base64url');
}

function allowedEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  const allowed = new Set(String(process.env.ADMIN_ALLOWED_EMAILS || '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean));
  return normalized.endsWith('@urbaniron.co') && allowed.has(normalized);
}

export function createPasswordAdminHandoff({
  audience,
  issuer = String(process.env.ATHLETE_ADMIN_ISSUER || 'https://athletes.urbaniron.co'),
  secret = String(process.env.ADMIN_SSO_SECRET || ''),
  ttlSeconds = 60,
  now = Date.now(),
} = {}) {
  if (![ATHLETE_ADMIN_AUDIENCE, PHOTO_ADMIN_AUDIENCE].includes(audience)) throw new Error('Admin handoff audience is invalid');
  if (secret.length < 32) throw new Error('Admin handoff secret is not configured');
  if (ttlSeconds < 1 || ttlSeconds > 120) throw new Error('Admin handoff lifetime is invalid');
  const issuedAt = Math.floor(now / 1000);
  const encoded = Buffer.from(JSON.stringify({
    version: 2,
    issuer,
    audience,
    subject: 'shared-admin',
    authMethod: 'password',
    issuedAt,
    expiresAt: issuedAt + ttlSeconds,
    nonce: crypto.randomUUID(),
  })).toString('base64url');
  return `${encoded}.${signature(encoded, secret)}`;
}

export function verifyAdminHandoff(token, now = Date.now()) {
  const secret = String(process.env.ADMIN_SSO_SECRET || '');
  const issuer = String(process.env.ADMIN_SSO_ISSUER || 'https://admin.urbaniron.co');
  if (secret.length < 32) return null;
  try {
    const [encoded, suppliedSignature, extra] = String(token || '').split('.');
    if (!encoded || !suppliedSignature || extra || !safeEqual(suppliedSignature, signature(encoded, secret))) return null;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    const nowSeconds = Math.floor(now / 1000);
    if (payload.issuer !== issuer || payload.audience !== ATHLETE_ADMIN_AUDIENCE) return null;
    if (!Number.isFinite(payload.issuedAt) || !Number.isFinite(payload.expiresAt)) return null;
    if (payload.issuedAt > nowSeconds + 30 || payload.expiresAt <= nowSeconds || payload.expiresAt - payload.issuedAt > 120) return null;
    if (typeof payload.nonce !== 'string' || payload.nonce.length < 16) return null;
    if (payload.version === 2 && payload.subject === 'shared-admin' && payload.authMethod === 'password') {
      return { authMethod: 'password' };
    }
    if (payload.version !== 1 || !allowedEmail(payload.email)) return null;
    return { authMethod: 'google', email: String(payload.email).trim().toLowerCase() };
  } catch {
    return null;
  }
}

export function requestHasSsoOrigin(req) {
  try {
    return new URL(String(req.headers?.origin || '')).origin === new URL(String(process.env.ADMIN_SSO_ISSUER || 'https://admin.urbaniron.co')).origin;
  } catch {
    return false;
  }
}
