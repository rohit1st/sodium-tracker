import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

const worker=await readFile(new URL('../public/sw.js',import.meta.url),'utf8');
for(const path of ['/','/sodium-tracker/']){
  test(`PWA assets, shortcuts and offline cache stay under ${path}`,async()=>{
    const base=`https://example.github.io${path}`;
    const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
    for(const [,asset] of html.matchAll(/(?:src|href)="([^"]+)"/g)){
      assert(new URL(asset,base).pathname.startsWith(path));
    }
    const manifest=JSON.parse(await readFile(new URL('../public/manifest.webmanifest',import.meta.url),'utf8'));
    for(const asset of [manifest.id,manifest.scope,manifest.start_url,...manifest.icons.map(i=>i.src),...manifest.shortcuts.flatMap(s=>[s.url,...s.icons.map(i=>i.src)])])assert(new URL(asset,base).pathname.startsWith(path));
    const events={},deleted=[],added=[];
    const prefix=`a-little-less-scope:${path}:`;
    const cache={addAll:async assets=>added.push(...assets),match:async key=>String(key)===base+'index.html'?'cached app':undefined};
    const self={location:{href:base+'sw.js'},addEventListener:(type,fn)=>events[type]=fn,clients:{claim:async()=>{}},skipWaiting:()=>{}};
    const caches={open:async()=>cache,keys:async()=>[prefix+'old','unrelated-site-cache','a-little-less-scope:/another-app/:old',prefix+'a-little-less-v1'],delete:async key=>deleted.push(key)};
    vm.runInNewContext(worker,{self,caches,URL,fetch:()=>{throw Error('Network is offline');}});
    let pending;events.install({waitUntil:p=>pending=p});await pending;
    assert(added.every(url=>url.startsWith(base)));assert(added.includes(base+'index.html'));
    events.activate({waitUntil:p=>pending=p});await pending;
    assert.deepEqual(deleted,[prefix+'old']);
    events.fetch({request:{url:base,method:'GET',mode:'navigate'},respondWith:p=>pending=p});
    assert.equal(await pending,'cached app');
    let intercepted=false;events.fetch({request:{url:'https://other.example/',method:'GET',mode:'navigate'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);
    if(path!=='/'){events.fetch({request:{url:'https://example.github.io/another-app/',method:'GET',mode:'navigate'},respondWith:()=>intercepted=true});assert.equal(intercepted,false);}
  });
}
