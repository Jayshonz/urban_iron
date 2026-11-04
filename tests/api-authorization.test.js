import assert from 'node:assert/strict';
import test from 'node:test';
import adminRaceContentHandler from '../api/admin-race-content.js';
import raceContentHandler from '../api/race-content.js';

function responseRecorder() {
  return {
    statusCode: 200,
    body: undefined,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    end() {
      return this;
    },
  };
}

test('admin race content denies requests without an admin session before storage access', async () => {
  const req = { method: 'GET', headers: {} };
  const res = responseRecorder();
  await adminRaceContentHandler(req, res);
  assert.equal(res.statusCode, 401);
  assert.equal(res.body.error, 'Admin session expired');
});

test('public race content rejects requests without a race entitlement', async () => {
  const req = { method: 'POST', body: { raceId: 'urban-iron-nyc' } };
  const res = responseRecorder();
  await raceContentHandler(req, res);
  assert.equal(res.statusCode, 400);
  assert.equal(res.body.error, 'Missing race access');
});
