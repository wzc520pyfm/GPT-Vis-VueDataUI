import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const manifest = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));

for (const path of [
  manifest.main,
  manifest.types,
  manifest.exports['.'].import,
  manifest.exports['.'].types,
  manifest.exports['./vue'].import,
  manifest.exports['./vue'].types,
  manifest.exports['./syntax'].import,
  manifest.exports['./syntax'].types,
]) {
  await access(resolve(root, path));
}

const syntax = await readFile(resolve(root, 'dist/syntax.js'), 'utf8');
if (/vue-data-ui|createApp|\bvue\b/.test(syntax)) {
  throw new Error('dist/syntax.js must stay free of Vue and VueDataUI imports.');
}

console.log('package exports verified');

