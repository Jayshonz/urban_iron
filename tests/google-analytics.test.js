import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('loads the single GA4 tag across athlete and race-admin surfaces', async () => {
  const [home, admin, adminHome, vercel] = await Promise.all([
    read('public/index.html'), read('public/admin.html'), read('public/admin-home.html'), read('vercel.json'),
  ]);

  for (const html of [home, admin, adminHome]) {
    assert.match(html, /data-measurement-id="G-2EJ2D589KG"/);
    assert.match(html, /analytics\.js/);
  }
  assert.equal(JSON.parse(vercel).rewrites.some((rule) => rule.source === '/analytics.js'), true);
});

test('analytics helper anonymizes traffic and accepts only bounded primitive parameters', async () => {
  const analytics = await read('public/analytics.js');
  assert.match(analytics, /anonymize_ip: true/);
  assert.match(analytics, /allowedEventName/);
  assert.match(analytics, /allowedParameterName/);
  assert.match(analytics, /slice\(0, 100\)/);
  assert.doesNotMatch(analytics, /email|first_name|last_name|bib_number|password|photo_filename/i);
});

test('tracks privacy-safe athlete and race-admin outcomes', async () => {
  const [app, admin] = await Promise.all([read('public/app.js'), read('public/admin.js')]);
  for (const event of [
    'race_selected', 'portal_unlocked', 'portal_tab_viewed', 'heat_lookup_completed',
    'race_guide_opened', 'partner_offer_opened', 'athlete_check_in_completed',
  ]) assert.match(app, new RegExp(`track\\('${event}'`));

  for (const event of ['admin_session_started', 'race_controls_saved', 'race_content_saved']) {
    assert.match(admin, new RegExp(`track\\('${event}'`));
  }
  assert.doesNotMatch(app, /track\([^\n]+query:/);
  assert.doesNotMatch(admin, /track\([^\n]+updated_by:/);
});
