import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ADMIN_COOKIE_NAME,
  adminAuthConfigured,
  adminPasswordConfigured,
  adminSessionCookie,
  createAdminSession,
  parseCookies,
  requestHasAdminSession,
  verifyAdminPassword,
  verifyAdminSession,
} from '../api/admin-auth.js';

const originalPassword = process.env.ATHLETE_ADMIN_PASSWORD;
const originalSsoSecret = process.env.ADMIN_SSO_SECRET;
const originalAllowedEmails = process.env.ADMIN_ALLOWED_EMAILS;

test.beforeEach(() => {
  process.env.ATHLETE_ADMIN_PASSWORD = 'a-secure-test-admin-password';
  process.env.ADMIN_SSO_SECRET = 'a-secure-test-admin-sso-secret-value';
  process.env.ADMIN_ALLOWED_EMAILS = 'jake@urbaniron.co';
});

test.after(() => {
  if (originalPassword === undefined) delete process.env.ATHLETE_ADMIN_PASSWORD;
  else process.env.ATHLETE_ADMIN_PASSWORD = originalPassword;
  if (originalSsoSecret === undefined) delete process.env.ADMIN_SSO_SECRET;
  else process.env.ADMIN_SSO_SECRET = originalSsoSecret;
  if (originalAllowedEmails === undefined) delete process.env.ADMIN_ALLOWED_EMAILS;
  else process.env.ADMIN_ALLOWED_EMAILS = originalAllowedEmails;
});

test('requires a meaningful configured password', () => {
  assert.equal(adminAuthConfigured(), true);
  assert.equal(adminPasswordConfigured(), true);
  process.env.ATHLETE_ADMIN_PASSWORD = 'too-short';
  assert.equal(adminPasswordConfigured(), false);
  assert.equal(adminAuthConfigured(), true);
});

test('compares the configured password without exposing it', () => {
  assert.equal(verifyAdminPassword('a-secure-test-admin-password'), true);
  assert.equal(verifyAdminPassword('wrong-password'), false);
});

test('creates a valid admin session and rejects tampering or expiration', () => {
  const token = createAdminSession();
  assert.equal(verifyAdminSession(token), true);
  assert.equal(verifyAdminSession(`${token}tampered`), false);
  assert.equal(verifyAdminSession(createAdminSession({}, -1)), false);
  assert.equal(verifyAdminSession(createAdminSession({ authMethod: 'google', email: 'jake@urbaniron.co' })), true);
  process.env.ADMIN_ALLOWED_EMAILS = 'someone-else@urbaniron.co';
  assert.equal(verifyAdminSession(createAdminSession({ authMethod: 'google', email: 'jake@urbaniron.co' })), false);
});

test('reads the admin session only from the dedicated cookie', () => {
  const token = createAdminSession();
  const cookie = adminSessionCookie(token);
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Strict/);
  const parsed = parseCookies(`unrelated=1; ${ADMIN_COOKIE_NAME}=${token}`);
  assert.equal(parsed[ADMIN_COOKIE_NAME], token);
  assert.equal(requestHasAdminSession({ headers: { cookie: `${ADMIN_COOKIE_NAME}=${token}` } }), true);
  assert.equal(requestHasAdminSession({ headers: { cookie: 'unrelated=1' } }), false);
});
