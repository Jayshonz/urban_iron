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
