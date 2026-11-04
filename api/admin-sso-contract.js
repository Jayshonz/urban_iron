import crypto from 'node:crypto';
import { safeEqual } from './session.js';

export const ATHLETE_ADMIN_AUDIENCE = 'urban-iron-athlete-admin';

function signature(value, secret) {
  return crypto.createHmac('sha256', secret).update(`urban-iron-admin-handoff\n${value}`).digest('base64url');
}

function allowedEmail(email) {
  const normalized = String(email || '').trim().toLowerCase();
  const allowed = new Set(String(process.env.ADMIN_ALLOWED_EMAILS || '').split(',').map((value) => value.trim().toLowerCase()).filter(Boolean));
  return normalized.endsWith('@urbaniron.co') && allowed.has(normalized);
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
    if (payload.version !== 1 || payload.issuer !== issuer || payload.audience !== ATHLETE_ADMIN_AUDIENCE) return null;
    if (!Number.isFinite(payload.issuedAt) || !Number.isFinite(payload.expiresAt)) return null;
    if (payload.issuedAt > nowSeconds + 30 || payload.expiresAt <= nowSeconds || payload.expiresAt - payload.issuedAt > 120) return null;
    if (typeof payload.nonce !== 'string' || payload.nonce.length < 16 || !allowedEmail(payload.email)) return null;
    return { email: String(payload.email).trim().toLowerCase() };
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
