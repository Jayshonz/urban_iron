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

test('race admin presents the shared password as the primary login', async () => {
  const html = await readFile(publicFile('admin.html'), 'utf8');
  assert.match(html, /id="adminLoginForm" class="admin-login-form"/);
  assert.match(html, /shared Urban Iron admin password/);
  assert.match(html, /Open admin portal/);
  assert.doesNotMatch(html, /Continue with Urban Iron Admin/);
  assert.doesNotMatch(html, /Temporary password fallback/);
});

test('race admin routes Photo Admin navigation through the signed session handoff', async () => {
  const html = await readFile(publicFile('admin.html'), 'utf8');
  assert.match(html, /href="\/api\/admin-handoff">Photos<\/a>/);
  assert.match(html, /id="openPhotoAdmin"[^>]+href="\/api\/admin-handoff"/);
  assert.doesNotMatch(html, /href="https:\/\/admin\.urbaniron\.co\/admin">(?:Photos|Photo admin|Manage photos)/);
});
