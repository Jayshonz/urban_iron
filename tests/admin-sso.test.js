import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  ATHLETE_ADMIN_AUDIENCE,
  PHOTO_ADMIN_AUDIENCE,
  createPasswordAdminHandoff,
  requestHasSsoOrigin,
  verifyAdminHandoff,
} from '../api/admin-sso-contract.js';

const secret = 'a-secure-cross-portal-test-secret-value';

function assertion(overrides = {}, now = Date.now()) {
  const issuedAt = Math.floor(now / 1000);
  const payload = {
    version: 1,
    issuer: 'https://admin.urbaniron.co',
    audience: ATHLETE_ADMIN_AUDIENCE,
    email: 'jake@urbaniron.co',
    issuedAt,
    expiresAt: issuedAt + 60,
    nonce: crypto.randomUUID(),
    ...overrides,
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`urban-iron-admin-handoff\n${encoded}`).digest('base64url');
  return `${encoded}.${signature}`;
}

test.beforeEach(() => {
  process.env.ADMIN_SSO_SECRET = secret;
  process.env.ADMIN_SSO_ISSUER = 'https://admin.urbaniron.co';
  process.env.ADMIN_ALLOWED_EMAILS = 'jake@urbaniron.co';
});

test('accepts an exact short-lived handoff and rejects tampering', () => {
  assert.deepEqual(verifyAdminHandoff(assertion()), { authMethod: 'google', email: 'jake@urbaniron.co' });
  assert.equal(verifyAdminHandoff(`${assertion()}tampered`), null);
});

test('creates a password-session handoff for the Photo Admin without exposing the password', () => {
  const token = createPasswordAdminHandoff({
    audience: PHOTO_ADMIN_AUDIENCE,
    issuer: 'https://athletes.urbaniron.co',
    secret,
  });
  const [encoded] = token.split('.');
  const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  assert.equal(payload.version, 2);
  assert.equal(payload.audience, PHOTO_ADMIN_AUDIENCE);
  assert.equal(payload.subject, 'shared-admin');
  assert.equal(payload.authMethod, 'password');
  assert.equal(JSON.stringify(payload).includes('a-secure-test-admin-password'), false);
});

test('rejects expired, wrong-audience, and unapproved-email handoffs', () => {
  const now = Date.now();
  assert.equal(verifyAdminHandoff(assertion({ expiresAt: Math.floor(now / 1000) - 1 }, now), now), null);
  assert.equal(verifyAdminHandoff(assertion({ audience: 'other-admin' }, now), now), null);
  assert.equal(verifyAdminHandoff(assertion({ email: 'attacker@urbaniron.co' }, now), now), null);
});

test('requires the exact central admin origin', () => {
  assert.equal(requestHasSsoOrigin({ headers: { origin: 'https://admin.urbaniron.co' } }), true);
  assert.equal(requestHasSsoOrigin({ headers: { origin: 'https://evil.example' } }), false);
});

test('Race Admin handoff requires a session and posts only a signed assertion', async () => {
  const source = await readFile(new URL('../api/admin-handoff.js', import.meta.url), 'utf8');
  assert.match(source, /requestHasAdminSession\(req\)/);
  assert.match(source, /method="post"/);
  assert.match(source, /name="assertion"/);
  assert.doesNotMatch(source, /URBAN_IRON_ADMIN_PASSWORD|ATHLETE_ADMIN_PASSWORD/);
  assert.doesNotMatch(source, /\?assertion=/);
});
