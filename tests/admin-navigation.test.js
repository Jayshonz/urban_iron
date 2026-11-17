import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const publicFile = (name) => new URL(`../public/${name}`, import.meta.url);

test('central admin home links only administrator workspaces', async () => {
  const html = await readFile(publicFile('admin-home.html'), 'utf8');
  assert.match(html, /https:\/\/athletes\.urbaniron\.co\/admin/);
  assert.match(html, /https:\/\/admin\.urbaniron\.co\/admin/);
  assert.doesNotMatch(html, /href="[^"]*photographer/i);
});

test('race admin does not expose photographer upload navigation', async () => {
  const [html, script] = await Promise.all([
    readFile(publicFile('admin.html'), 'utf8'),
    readFile(publicFile('admin.js'), 'utf8'),
  ]);
  assert.doesNotMatch(html, /openPhotographerUploads/);
  assert.doesNotMatch(script, /openPhotographerUploads/);
  assert.doesNotMatch(script, /\/photographer\/events/);
});

test('race admin relies on the central admin session without a duplicate login', async () => {
  const html = await readFile(publicFile('admin.html'), 'utf8');
  assert.match(html, /id="adminEditor"/);
  assert.doesNotMatch(html, /id="adminLoginForm"|Admin password|Continue with Google|Temporary password fallback/);
});

test('race admin routes Photo Admin navigation through the central admin shell', async () => {
  const html = await readFile(publicFile('admin.html'), 'utf8');
  assert.match(html, /href="\/photos">Photos<\/a>/);
  assert.match(html, /id="openPhotoAdmin"[^>]+href="\/photos"/);
});

test('portal content admin uses structured race guides and offers only', async () => {
  const [html, script] = await Promise.all([
    readFile(publicFile('admin.html'), 'utf8'),
    readFile(publicFile('admin.js'), 'utf8'),
  ]);

  assert.match(html, /<h3>Race Guides<\/h3>/);
  assert.match(html, /id="addRaceGuide"/);
  assert.match(html, /id="raceGuideList"/);
  assert.match(html, /id="addOffer"/);
  assert.match(html, /id="offerList"/);
  assert.doesNotMatch(html, /id="(?:routeDescription|routeUrl|workoutDescription|workoutUrl|raceDayNotes)"/);
  assert.match(script, /prepGuides: readRaceGuides\(\), offers: readOffers\(\)/);
});
