const CACHE_NAME="farsi2000-shell-v1";
const CORE_ASSETS=[
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.svg",
  "./icons/icon-512.svg",
  "./icons/icon-maskable.svg",
  "./data/00.js",
  "./data/01.js",
  "./data/02.js",
  "./data/03.js",
  "./data/04.js",
  "./data/05.js",
  "./data/06.js",
  "./data/07.js",
  "./data/miller-00.js",
  "./data/miller-01.js",
  "./data/miller-02.js",
  "./data/miller-03.js",
  "./data/miller-04.js",
  "./data/miller-05.js",
  "./data/miller-06.js",
  "./data/miller-07.js",
  "./data/v5-deck.js",
  "./data/path.js",
  "./data/audio-manifest.js"
];

self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE_NAME);
    await Promise.all(CORE_ASSETS.map(async asset=>{
      try{
        const response=await fetch(asset,{cache:"reload"});
        if(response.ok)await cache.put(asset,response);
      }catch{}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(name=>name.startsWith("farsi2000-shell-")&&name!==CACHE_NAME).map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});

async function cachedFallback(request){
  const cache=await caches.open(CACHE_NAME);
  return cache.match(request,{ignoreSearch:true});
}

async function networkFirst(request){
  const cache=await caches.open(CACHE_NAME);
  try{
    const response=await fetch(request);
    if(response&&response.ok)await cache.put(request,response.clone());
    return response;
  }catch{
    return (await cachedFallback(request))||Response.error();
  }
}

async function cacheFirst(request){
  const cache=await caches.open(CACHE_NAME);
  const cached=await cache.match(request,{ignoreSearch:true});
  if(cached)return cached;
  try{
    const response=await fetch(request);
    if(response&&response.ok)await cache.put(request,response.clone());
    return response;
  }catch{
    return Response.error();
  }
}

self.addEventListener("fetch",event=>{
  const request=event.request;
  if(request.method!=="GET")return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  if(request.mode==="navigate"){
    event.respondWith(networkFirst(request).then(response=>{
      if(response&&response.ok)return response;
      return cachedFallback(new Request("./index.html"));
    }));
    return;
  }

  const media=/\.(?:mp3|m4a|wav|ogg|webp|png|jpe?g|svg)$/i.test(url.pathname);
  event.respondWith(media?cacheFirst(request):networkFirst(request));
});
