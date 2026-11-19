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
    'athlete_race_selected', 'athlete_portal_sign_in_completed', 'athlete_portal_tab_viewed',
    'athlete_heat_lookup_completed', 'athlete_race_guide_clicked', 'athlete_offer_clicked',
    'athlete_check_in_completed',
  ]) assert.match(app, new RegExp(`track\\('${event}'`));

  for (const event of ['admin_race_session_started', 'admin_race_controls_saved', 'admin_race_content_saved']) {
    assert.match(admin, new RegExp(`track\\('${event}'`));
  }
  for (const parameter of ['race_name', 'resource_type', 'resource_title']) assert.match(app, new RegExp(parameter));
  assert.doesNotMatch(app, /track\([^\n]+query:/);
  assert.doesNotMatch(admin, /track\([^\n]+updated_by:/);
});
