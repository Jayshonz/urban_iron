import crypto from 'node:crypto';
import { safeEqual } from './session.js';

export const ADMIN_COOKIE_NAME = 'urban_iron_athlete_admin';
const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;

function adminPassword() {
  return String(process.env.ATHLETE_ADMIN_PASSWORD || '');
}

function signingKey() {
  return crypto
    .createHash('sha256')
    .update(`urban-iron-athlete-admin\n${adminPassword()}`)
    .digest();
}

export function adminAuthConfigured() {
  return adminPassword().length >= 12;
}

export function verifyAdminPassword(value) {
  if (!adminAuthConfigured()) return false;
  const candidate = String(value || '');
  if (!candidate || candidate.length > 256) return false;
  return safeEqual(candidate, adminPassword());
}

export function createAdminSession(ttlSeconds = ADMIN_SESSION_TTL_SECONDS) {
  if (!adminAuthConfigured()) throw new Error('Admin authentication is not configured');
  const encoded = Buffer.from(JSON.stringify({
    scope: 'athlete-admin',
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', signingKey())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyAdminSession(token) {
  if (!adminAuthConfigured()) return false;
  try {
    const [encoded, signature] = String(token || '').split('.');
    if (!encoded || !signature) return false;
    const expected = crypto
      .createHmac('sha256', signingKey())
      .update(encoded)
      .digest('base64url');
    if (!safeEqual(signature, expected)) return false;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    return payload.scope === 'athlete-admin'
      && Number(payload.exp) > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function parseCookies(header) {
  return String(header || '').split(';').reduce((cookies, pair) => {
    const separator = pair.indexOf('=');
    if (separator < 0) return cookies;
    const name = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1).trim();
    if (name) cookies[name] = decodeURIComponent(value);
    return cookies;
  }, {});
}

export function requestHasAdminSession(req) {
  const cookies = parseCookies(req.headers?.cookie);
  return verifyAdminSession(cookies[ADMIN_COOKIE_NAME]);
}

export function adminSessionCookie(token, maxAge = ADMIN_SESSION_TTL_SECONDS) {
  return `${ADMIN_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

export function clearAdminSessionCookie() {
  return `${ADMIN_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function requestIsSameOrigin(req) {
  const origin = String(req.headers?.origin || '');
  if (!origin) return true;
  try {
    const host = String(req.headers?.['x-forwarded-host'] || req.headers?.host || '').split(',')[0].trim();
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
