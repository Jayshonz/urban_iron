import assert from 'node:assert/strict';
import test from 'node:test';
import { createRaceSession, verifyRaceSession } from '../api/session.js';

test('race access tokens cannot cross race boundaries', () => {
  const token = createRaceSession('urban-iron-nyc', 'nyc-password');
  assert.equal(verifyRaceSession(token, 'urban-iron-nyc', 'nyc-password'), true);
  assert.equal(verifyRaceSession(token, 'urban-iron-la', 'nyc-password'), false);
  assert.equal(verifyRaceSession(token, 'urban-iron-nyc', 'different-password'), false);
});

test('expired race access tokens are denied', () => {
  const token = createRaceSession('urban-iron-nyc', 'nyc-password', -1);
  assert.equal(verifyRaceSession(token, 'urban-iron-nyc', 'nyc-password'), false);
});
