import assert from 'node:assert/strict';
import test from 'node:test';
import {
  contentFromRow,
  contentToRow,
  findRaceContent,
  publicRaceContent,
  validateRaceContent,
} from '../api/race-content-store.js';

test('normalizes editable race-day content', () => {
  const result = validateRaceContent({
    routeDescription: '  Two laps\r\nClockwise  ',
    routeUrl: 'https://example.com/route',
    workoutDescription: 'Row, carry, run',
    workoutUrl: '',
    raceDayNotes: 'Arrive early',
    prepGuides: [{ title: 'Packing list', description: 'Bring water', url: 'https://example.com/pack' }],
    offers: [{ partner: 'Storm', title: '50% off', code: 'IRON50', url: 'https://example.com/storm', active: true }],
  });
  assert.deepEqual(result.errors, []);
  assert.equal(result.content.routeDescription, 'Two laps\nClockwise');
  assert.equal(result.content.routeUrl, 'https://example.com/route');
  assert.equal(result.content.prepGuides[0].title, 'Packing list');
  assert.equal(result.content.offers[0].code, 'IRON50');
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

test('rejects incomplete guides and unsafe offer links', () => {
  const result = validateRaceContent({
    prepGuides: [{ title: '', url: 'https://example.com/guide' }],
    offers: [{ partner: 'Partner', title: 'Offer', url: 'http://example.com', logoUrl: 'javascript:alert(1)' }],
  });
  assert.match(result.errors.join(' '), /Prep guide 1 needs a title/);
  assert.match(result.errors.join(' '), /Offer 1 needs a valid https destination/);
  assert.match(result.errors.join(' '), /logo must be a valid https URL/);
});

test('public content hides inactive offers without changing admin content', () => {
  const content = {
    raceId: 'la-2026',
    prepGuides: [],
    offers: [
      { partner: 'Visible', title: 'Offer', url: 'https://example.com/visible', active: true },
      { partner: 'Hidden', title: 'Offer', url: 'https://example.com/hidden', active: false },
    ],
  };
  assert.deepEqual(publicRaceContent(content).offers.map((offer) => offer.partner), ['Visible']);
  assert.equal(content.offers.length, 2);
});

test('finds content only for the exact requested race', () => {
  const rows = [
    ['miami-2026', 'Miami route', '', '', '', '', '[]', '[]', '2026-10-29T10:00:00.000Z'],
    ['nyc-2026', 'NYC route', '', '', '', '', '[]', '[]', '2026-10-29T11:00:00.000Z'],
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
    prepGuides: [{ title: 'Guide', description: '', url: 'https://example.com/guide' }],
    offers: [{ partner: 'Storm', title: 'Offer', description: '', code: 'IRON', url: 'https://example.com/', logoUrl: '', active: true }],
  };
  const row = contentToRow('la-2026', content, '2026-10-29T12:00:00.000Z');
  assert.deepEqual(contentFromRow(row), {
    raceId: 'la-2026',
    ...content,
    updatedAt: '2026-10-29T12:00:00.000Z',
  });
});
