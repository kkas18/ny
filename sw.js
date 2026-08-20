/* Pro Kalkulator Ultra – service worker */
const CORE='pku-core-v71';
const RUNTIME='pku-runtime-v71';
const CORE_ASSETS=['./','./index.html','./manifest.webmanifest','./icons/logo-96.jpg','./icons/icon-192.jpg','./icons/icon-512.jpg','./icons/icon-maskable-512.jpg','./icons/apple-touch-icon.jpg'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CORE)
    .then(c=>Promise.allSettled(CORE_ASSETS.map(a=>c.add(a))))
    .then(()=>{}));
});
self.addEventListener('message',e=>{
  if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys()
    .then(keys=>Promise.all(keys.filter(k=>k!==CORE&&k!==RUNTIME).map(k=>caches.delete(k))))
    .then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;

  /* Navigation: network first so a deploy lands immediately, cache as the offline fallback. */
  if(req.mode==='navigate'){
    e.respondWith(fetch(req).then(res=>{
      const copy=res.clone();
      caches.open(CORE).then(c=>c.put('./index.html',copy));
      return res;
    }).catch(()=>caches.match('./index.html').then(hit=>hit||caches.match('./'))));
    return;
  }

  const url=new URL(req.url);

  /* Exchange rates: always try the network, fall back to the last good response.
     The app also keeps its own copy in localStorage and shows how old it is. */
  if(url.hostname==='data.norges-bank.no'||url.hostname==='open.er-api.com'){
    e.respondWith(fetch(req).then(res=>{
      if(res&&res.ok){ const copy=res.clone(); caches.open(RUNTIME).then(c=>c.put(req,copy)); }
      return res;
    }).catch(()=>caches.match(req)));
    return;
  }

  /* Own files: cache first. */
  if(url.origin===self.location.origin){
    e.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{
      const copy=res.clone();
      caches.open(CORE).then(c=>c.put(req,copy));
      return res;
    })));
    return;
  }

  /* Flags and anything else external: stale-while-revalidate with a cap. */
  e.respondWith(caches.match(req).then(hit=>{
    const net=fetch(req).then(res=>{
      if(res&&(res.ok||res.type==='opaque')){
        const copy=res.clone();
        caches.open(RUNTIME).then(c=>c.put(req,copy).then(()=>trim(c)));
      }
      return res;
    }).catch(()=>hit);
    return hit||net;
  }));
});
function trim(cache){
  return cache.keys().then(keys=>{ if(keys.length>200)return cache.delete(keys[0]).then(()=>trim(cache)); });
}
