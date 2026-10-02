// Validate the actual Pages artifact, not the source public/ directory.
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../dist/',import.meta.url));
const base=new URL('https://example.github.io/sodium-tracker/');
async function asset(href){
  const url=new URL(href,base);
  assert(url.origin===base.origin&&url.pathname.startsWith(base.pathname),`Asset escapes app folder: ${href}`);
  const path=resolve(root,decodeURIComponent(url.pathname.slice(base.pathname.length))||'index.html');
  assert(path.startsWith(resolve(root)+sep),`Invalid asset path: ${href}`);
  assert((await stat(path)).isFile(),`Missing artifact: ${href}`);
  return readFile(path);
}
async function png(href,size){
  const data=await asset(href);
  assert.deepEqual(data.subarray(0,8),Buffer.from([137,80,78,71,13,10,26,10]),`Not PNG: ${href}`);
  assert.equal(data.readUInt32BE(16),size,`Incorrect icon width: ${href}`);
  assert.equal(data.readUInt32BE(20),size,`Incorrect icon height: ${href}`);
}
const html=await readFile(resolve(root,'index.html'),'utf8');
assert(html.includes('<title>Meal Tracker</title>'));
for(const [,href] of html.matchAll(/(?:src|href)="([^"]+)"/g))if(!href.startsWith('#'))await asset(href);
const manifest=JSON.parse(await asset('manifest.webmanifest'));
assert.equal(manifest.name,'Meal Tracker');assert.equal(manifest.short_name,'Meal Tracker');
assert.equal(manifest.id,'./','Keep the existing installed-app identity');
for(const icon of [...manifest.icons,...manifest.shortcuts.flatMap(s=>s.icons)])await png(icon.src,Number(icon.sizes.split('x')[0]));
const apple=html.match(/<link rel="apple-touch-icon"[^>]*href="([^"]+)"/);
assert(apple,'Missing iOS icon');await png(apple[1],180);
await asset('sw.js');
console.log('Validated Pages artifact: app name, paths, manifest, and PNG installation icons.');
