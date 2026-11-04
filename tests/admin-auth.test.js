import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ADMIN_COOKIE_NAME,
  adminAuthConfigured,
  adminSessionCookie,
  createAdminSession,
  parseCookies,
  requestHasAdminSession,
  verifyAdminPassword,
  verifyAdminSession,
} from '../api/admin-auth.js';

const originalPassword = process.env.ATHLETE_ADMIN_PASSWORD;

test.beforeEach(() => {
  process.env.ATHLETE_ADMIN_PASSWORD = 'a-secure-test-admin-password';
});

test.after(() => {
  if (originalPassword === undefined) delete process.env.ATHLETE_ADMIN_PASSWORD;
  else process.env.ATHLETE_ADMIN_PASSWORD = originalPassword;
});

test('requires a meaningful configured password', () => {
  assert.equal(adminAuthConfigured(), true);
  process.env.ATHLETE_ADMIN_PASSWORD = 'too-short';
  assert.equal(adminAuthConfigured(), false);
});

test('compares the configured password without exposing it', () => {
  assert.equal(verifyAdminPassword('a-secure-test-admin-password'), true);
  assert.equal(verifyAdminPassword('wrong-password'), false);
});

test('creates a valid admin session and rejects tampering or expiration', () => {
  const token = createAdminSession();
  assert.equal(verifyAdminSession(token), true);
  assert.equal(verifyAdminSession(`${token}tampered`), false);
  assert.equal(verifyAdminSession(createAdminSession(-1)), false);
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
