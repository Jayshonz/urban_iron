import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const publicFile = (name) => new URL(`../public/${name}`, import.meta.url);

test('athlete header follows the shared public-platform navigation contract', async () => {
  const html = await readFile(publicFile('index.html'), 'utf8');
  const nav = html.match(/<nav class="platform-nav"[\s\S]*?<\/nav>/)?.[0] || '';

  assert.match(nav, /href="https:\/\/urbaniron\.co\/">Home<\/a>/);
  assert.match(nav, /href="https:\/\/photos\.urbaniron\.co\/">Photos<\/a>/);
  assert.match(nav, /href="https:\/\/photos\.urbaniron\.co\/photographer">Photographer<\/a>/);
  assert.match(nav, /href="https:\/\/admin\.urbaniron\.co\/admin">Admin<\/a>/);
  assert.ok(nav.indexOf('>Home</a>') < nav.indexOf('>Photos</a>'));
  assert.ok(nav.indexOf('>Photos</a>') < nav.indexOf('>Photographer</a>'));
  assert.ok(nav.indexOf('>Photographer</a>') < nav.indexOf('>Admin</a>'));
});

test('athlete navigation typography matches the photo platform contract', async () => {
  const css = await readFile(publicFile('styles.css'), 'utf8');
  assert.match(css, /\.platform-nav a\{[^}]*font-family:"Space Mono","Courier New",monospace/);
  assert.match(css, /\.platform-nav a\{[^}]*font-size:12px/);
  assert.match(css, /\.platform-nav a\{[^}]*font-weight:400/);
});
