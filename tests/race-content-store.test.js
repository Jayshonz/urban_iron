import assert from 'node:assert/strict';
import test from 'node:test';
import {
  contentFromRow,
  contentToRow,
  findRaceContent,
  validateRaceContent,
} from '../api/race-content-store.js';

test('normalizes editable race-day content', () => {
  const result = validateRaceContent({
    routeDescription: '  Two laps\r\nClockwise  ',
    routeUrl: 'https://example.com/route',
    workoutDescription: 'Row, carry, run',
    workoutUrl: '',
    raceDayNotes: 'Arrive early',
  });
  assert.deepEqual(result.errors, []);
  assert.equal(result.content.routeDescription, 'Two laps\nClockwise');
  assert.equal(result.content.routeUrl, 'https://example.com/route');
});

test('rejects executable and malformed links', () => {
  const javascript = validateRaceContent({ routeUrl: 'javascript:alert(1)' });
  const malformed = validateRaceContent({ workoutUrl: 'not a URL' });
  const insecure = validateRaceContent({ routeUrl: 'http://example.com/route' });
  assert.equal(javascript.errors.length, 1);
  assert.equal(malformed.errors.length, 1);
  assert.equal(insecure.errors.length, 1);
  assert.equal(javascript.content.routeUrl, '');
});

test('finds content only for the exact requested race', () => {
  const rows = [
    ['miami-2026', 'Miami route', '', '', '', '', '2026-10-29T10:00:00.000Z'],
    ['nyc-2026', 'NYC route', '', '', '', '', '2026-10-29T11:00:00.000Z'],
  ];
  assert.equal(findRaceContent(rows, 'miami-2026').routeDescription, 'Miami route');
  assert.equal(findRaceContent(rows, 'nyc-2026').routeDescription, 'NYC route');
  assert.equal(findRaceContent(rows, 'miami').routeDescription, '');
});

test('round-trips the sheet row contract', () => {
  const content = {
    routeDescription: 'Route',
    routeUrl: 'https://example.com/route',
    workoutDescription: 'Workout',
    workoutUrl: 'https://example.com/workout',
    raceDayNotes: 'Notes',
  };
  const row = contentToRow('la-2026', content, '2026-10-29T12:00:00.000Z');
  assert.deepEqual(contentFromRow(row), {
    raceId: 'la-2026',
    ...content,
    updatedAt: '2026-10-29T12:00:00.000Z',
  });
});
