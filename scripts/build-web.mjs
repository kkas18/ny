// Builds the Android copy of the web app into www/.
//
// public/ is the app as it is served on the web, test suite included. The APK does
// not need the tests (they run from the version number in the web build), so this
// copies public/ to www/, cuts the block between @tests:start and @tests:end out of
// app.js, and minifies the script and the stylesheet.
//
// Run with `npm run build:web`; `npm run android:sync` runs it for you.
import { build, transform } from 'esbuild';
import { cpSync, readFileSync, rmSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'public');
const out = join(root, 'www');

rmSync(out, { recursive: true, force: true });
cpSync(src, out, { recursive: true });
// The service worker is for the web only; inside the APK the files are local.
rmSync(join(out, 'sw.js'), { force: true });

const appPath = join(out, 'app.js');
let app = readFileSync(appPath, 'utf8');
const start = app.indexOf('/* @tests:start');
const end = app.indexOf('/* @tests:end */');
if (start < 0 || end < start) throw new Error('Fant ikke @tests:start/@tests:end i app.js');
app = app.slice(0, start) + app.slice(end + '/* @tests:end */'.length);
const js = await transform(app, { minify: true, target: 'es2019', legalComments: 'none' });
writeFileSync(appPath, js.code);

const cssPath = join(out, 'style.css');
const css = await transform(readFileSync(cssPath, 'utf8'), { loader: 'css', minify: true, legalComments: 'inline' });
writeFileSync(cssPath, css.code);

const kb = (p) => (statSync(p).size / 1024).toFixed(0) + ' KB';
console.log('www/app.js ' + kb(appPath) + ' (fra ' + kb(join(src, 'app.js')) + '), www/style.css ' + kb(cssPath));
void build;
