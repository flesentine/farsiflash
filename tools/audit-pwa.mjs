#!/usr/bin/env node
import fs from "node:fs";

const read=path=>fs.readFileSync(new URL("../"+path,import.meta.url),"utf8");
const errors=[];
const need=(text,needle,label)=>{if(!text.includes(needle))errors.push(`missing ${label}: ${needle}`)};
const forbid=(text,needle,label)=>{if(text.includes(needle))errors.push(`forbidden ${label}: ${needle}`)};

const index=read("index.html");
const pwa=read("data/pwa-ui.js");
const sw=read("sw.js");
const bundle=read(".github/workflows/bundle-ui.yml");
const manifest=JSON.parse(read("manifest.webmanifest"));

if(manifest.id!=="./")errors.push("manifest id must be ./");
if(manifest.start_url!=="./")errors.push("manifest start_url must be ./");
if(manifest.scope!=="./")errors.push("manifest scope must be ./");
if(manifest.display!=="standalone")errors.push("manifest display must be standalone");
if(manifest.prefer_related_applications!==false)errors.push("manifest must not prefer related applications");
if(!manifest.name||!manifest.short_name)errors.push("manifest needs name and short_name");
if(!manifest.background_color||!manifest.theme_color)errors.push("manifest needs background/theme colors");

const icons=Array.isArray(manifest.icons)?manifest.icons:[];
const hasIcon=(size,type,purpose)=>icons.some(icon=>
  icon.sizes===size&&icon.type===type&&String(icon.purpose||"").split(/\s+/).includes(purpose)
);
if(!hasIcon("192x192","image/png","any"))errors.push("missing 192x192 PNG install icon");
if(!hasIcon("512x512","image/png","any"))errors.push("missing 512x512 PNG install icon");
if(!hasIcon("512x512","image/png","maskable"))errors.push("missing 512x512 maskable PNG icon");

need(index,'rel="manifest" href="manifest.webmanifest"',"manifest link");
need(index,'rel="icon" href="icons/icon-192.svg"',"favicon");
need(index,'name="apple-mobile-web-app-capable" content="yes"',"iOS standalone metadata");
need(index,'id="installApp" type="button" hidden',"install button");
need(index,'.pwa-install-help{position:fixed',"iOS install help styling");
forbid(index,"apple-touch-icon","legacy apple-touch icon override");

need(pwa,"window.__farsiPwaUiV1=true","PWA UI guard");
need(pwa,'navigator.serviceWorker.register("./sw.js",{scope:"./"})',"service worker registration");
need(pwa,'window.addEventListener("beforeinstallprompt"',"browser install prompt support");
need(pwa,'window.addEventListener("appinstalled"',"installed-state cleanup");
need(pwa,'matchMedia("(display-mode: standalone)")',"standalone detection");
need(pwa,'Tap Share, then choose <b>Add to Home Screen</b>.',"iOS install instructions");
need(pwa,'if(isIos())showIosInstallHelp();',"iOS install fallback");

need(sw,'const CACHE_NAME="farsi2000-shell-v1";',"versioned shell cache");
need(sw,'"./index.html"',"offline index");
need(sw,'"./manifest.webmanifest"',"offline manifest");
need(sw,'"./icons/icon-192.png"',"offline 192 PNG");
need(sw,'"./icons/icon-512.png"',"offline 512 PNG");
need(sw,'"./icons/icon-maskable.png"',"offline maskable PNG");
need(sw,'"./data/v5-deck.js"',"offline v5 deck");
need(sw,'"./data/audio-manifest.js"',"offline runtime bundle");
need(sw,'cache.match(request,{ignoreSearch:true})',"query-safe offline cache lookup");
need(sw,'if(request.mode==="navigate")',"offline navigation handling");
need(sw,'event.respondWith(media?cacheFirst(request):networkFirst(request));',"fresh-online / cached-offline strategy");
need(sw,"await self.skipWaiting();","service worker immediate activation");
need(sw,"await self.clients.claim();","service worker client claim");

need(bundle,'- "data/pwa-ui.js"',"PWA bundle trigger");
need(bundle,'Path("data/pwa-ui.js")',"PWA runtime bundling");
need(bundle,'data/pwa-ui.js \\',"PWA syntax validation");
need(bundle,'"__farsiPwaUiV1"',"PWA bundle validation marker");

for(const path of ["icons/icon-192.png","icons/icon-512.png","icons/icon-maskable.png"]){
  if(!fs.existsSync(new URL("../"+path,import.meta.url)))errors.push(`missing raster icon file: ${path}`);
}
for(const path of ["icons/icon-192.svg","icons/icon-512.svg","icons/icon-maskable.svg"]){
  if(!fs.existsSync(new URL("../"+path,import.meta.url)))errors.push(`missing SVG icon file: ${path}`);
}

if(errors.length){
  for(const error of errors)console.error("ERROR "+error);
  console.error(`\nPWA audit failed: ${errors.length} issue(s)`);
  process.exit(1);
}
console.log("PWA audit passed: install manifest/icons, standalone UI, offline shell, update-safe fetch strategy, and bundled install controls are wired.");
