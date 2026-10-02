const BASE=new URL('./',self.location.href);
const PREFIX=`a-little-less-scope:${BASE.pathname}:`;
const CACHE=PREFIX+'a-little-less-852e899322d4';
const ASSETS=['./','index.html','src/app.js','src/core.js','src/starter-foods.js','src/storage.js','src/catalog.js','src/styles.css','manifest.webmanifest','icons/icon.svg','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png','icons/apple-touch-icon.png','icons/orange-touch-icon.png'].map(path=>new URL(path,BASE).href);
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==BASE.origin||!url.pathname.startsWith(BASE.pathname))return;
  // Cache only this app's static shell. Food logs never enter the HTTP cache.
  if(event.request.mode==='navigate'){
    event.respondWith(caches.open(CACHE).then(cache=>cache.match(new URL('index.html',BASE).href)).then(cached=>cached||fetch(event.request)));return;
  }
  url.search='';
  if(ASSETS.includes(url.href))event.respondWith(caches.open(CACHE).then(cache=>cache.match(event.request,{ignoreSearch:true})).then(cached=>cached||fetch(event.request)));
});
