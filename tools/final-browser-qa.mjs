#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import {spawn} from "node:child_process";
import process from "node:process";

const ROOT=process.cwd();
const PORT=4173;
const DEBUG_PORT=9222;
const BASE=`http://127.0.0.1:${PORT}/`;
const ARTIFACT_DIR=path.join(ROOT,"qa-artifacts");
fs.mkdirSync(ARTIFACT_DIR,{recursive:true});

function rebuildRuntimeBundle(){
  const manifestPath=path.join(ROOT,"data","audio-manifest.js");
  const first=fs.readFileSync(manifestPath,"utf8").split(/\r?\n/)[0];
  if(!first.startsWith("window.FARSI_AUDIO="))throw new Error("audio manifest mapping is missing");
  const modules=[
    "fsrs-browser.js","keyboard-guard.js","storage-guard.js","audio-ui.js",
    "memory-engine.js","grade-animation-fix.js","reading-mode.js","examples-ui.js",
    "responsive-ui.js","pwa-ui.js","background-ui.js","audio-quality-lock.js",
    "sync-ui.js","sync-qr-ui.js",
  ];
  const chunks=[first.trimEnd()+"\n"];
  for(const name of modules){
    chunks.push(fs.readFileSync(path.join(ROOT,"data",name),"utf8").trimEnd()+"\n");
  }
  fs.writeFileSync(manifestPath,chunks.join(""),"utf8");
}

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function assert(condition,message){
  if(!condition)throw new Error(message);
}
function chromeBinary(){
  const candidates=[
    process.env.CHROME_BIN,
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
  ].filter(Boolean);
  for(const file of candidates)if(fs.existsSync(file))return file;
  throw new Error("No Chrome/Chromium executable found");
}
async function waitHttp(url,timeout=15000){
  const start=Date.now();
  while(Date.now()-start<timeout){
    try{
      const r=await fetch(url);
      if(r.ok)return;
    }catch{}
    await sleep(150);
  }
  throw new Error(`Timed out waiting for ${url}`);
}
async function debuggerTarget(timeout=15000){
  const start=Date.now();
  while(Date.now()-start<timeout){
    try{
      const r=await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
      const list=await r.json();
      const target=list.find(x=>x.type==="page"&&x.webSocketDebuggerUrl);
      if(target)return target;
    }catch{}
    await sleep(150);
  }
  throw new Error("Timed out waiting for Chrome DevTools endpoint");
}

class CDP {
  constructor(url){
    this.url=url;
    this.id=0;
    this.pending=new Map();
    this.listeners=new Map();
  }
  async connect(){
    this.ws=new WebSocket(this.url);
    await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error("CDP websocket timeout")),10000);
      this.ws.addEventListener("open",()=>{clearTimeout(timer);resolve()},{once:true});
      this.ws.addEventListener("error",event=>{clearTimeout(timer);reject(new Error("CDP websocket error: "+event.message))},{once:true});
    });
    this.ws.addEventListener("message",event=>{
      const msg=JSON.parse(event.data);
      if(msg.id){
        const p=this.pending.get(msg.id);
        if(!p)return;
        this.pending.delete(msg.id);
        if(msg.error)p.reject(new Error(`${p.method}: ${msg.error.message}`));
        else p.resolve(msg.result||{});
        return;
      }
      for(const fn of this.listeners.get(msg.method)||[])fn(msg.params||{});
    });
  }
  send(method,params={}){
    const id=++this.id;
    return new Promise((resolve,reject)=>{
      this.pending.set(id,{resolve,reject,method});
      this.ws.send(JSON.stringify({id,method,params}));
    });
  }
  on(method,fn){
    const list=this.listeners.get(method)||[];
    list.push(fn);
    this.listeners.set(method,list);
  }
  close(){this.ws?.close()}
}

async function main(){
  rebuildRuntimeBundle();
  const chrome=chromeBinary();
  const server=spawn("python3",["-m","http.server",String(PORT),"--bind","127.0.0.1"],{
    cwd:ROOT,stdio:["ignore","pipe","pipe"]
  });
  let serverErr="";
  server.stderr.on("data",d=>{serverErr+=String(d)});

  const profile=fs.mkdtempSync("/tmp/farsi-qa-chrome-");
  const browser=spawn(chrome,[
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--no-default-browser-check",
    "--remote-allow-origins=*",
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${profile}`,
    "about:blank"
  ],{stdio:["ignore","ignore","pipe"]});
  let chromeErr="";
  browser.stderr.on("data",d=>{chromeErr+=String(d)});

  const cleanup=()=>{
    try{browser.kill("SIGKILL")}catch{}
    try{server.kill("SIGKILL")}catch{}
    try{fs.rmSync(profile,{recursive:true,force:true})}catch{}
  };
  process.on("exit",cleanup);
  process.on("SIGTERM",()=>{cleanup();process.exit(143)});
  process.on("SIGINT",()=>{cleanup();process.exit(130)});

  try{
    await waitHttp(BASE);
    const target=await debuggerTarget();
    const cdp=new CDP(target.webSocketDebuggerUrl);
    await cdp.connect();

    const consoleErrors=[];
    const exceptions=[];
    cdp.on("Runtime.exceptionThrown",p=>exceptions.push(p.exceptionDetails?.text||"runtime exception"));
    cdp.on("Runtime.consoleAPICalled",p=>{
      if(p.type==="error"){
        consoleErrors.push((p.args||[]).map(a=>a.value??a.description??"").join(" "));
      }
    });
    cdp.on("Log.entryAdded",p=>{
      if(p.entry?.level==="error")consoleErrors.push(p.entry.text||"log error");
    });

    await Promise.all([
      cdp.send("Page.enable"),
      cdp.send("Runtime.enable"),
      cdp.send("Network.enable"),
      cdp.send("Log.enable"),
      cdp.send("ServiceWorker.enable"),
    ]);

    const evaluate=async expression=>{
      const r=await cdp.send("Runtime.evaluate",{expression,awaitPromise:true,returnByValue:true,userGesture:true});
      if(r.exceptionDetails)throw new Error(`Browser eval failed: ${r.exceptionDetails.text}`);
      return r.result?.value;
    };
    const waitFor=async(expression,label,timeout=15000)=>{
      const start=Date.now();
      while(Date.now()-start<timeout){
        try{if(await evaluate(`Boolean(${expression})`))return}catch{}
        await sleep(100);
      }
      throw new Error(`Timed out waiting for ${label}`);
    };
    const navigate=async url=>{
      await cdp.send("Page.navigate",{url});
      await waitFor('document.readyState==="complete"',"document complete",15000);
    };
    const click=async selector=>{
      const ok=await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)return false;el.click();return true})()`);
      assert(ok,`Could not click ${selector}`);
    };
    const debug=()=>evaluate('JSON.parse(JSON.stringify(window.FARSI_MEMORY_DEBUG?.()||null))');
    const screenshot=async name=>{
      const shot=await cdp.send("Page.captureScreenshot",{format:"png",captureBeyondViewport:false});
      fs.writeFileSync(path.join(ARTIFACT_DIR,name),Buffer.from(shot.data,"base64"));
    };
    const key=async keyName=>{
      const codes={Escape:{code:"Escape",keyCode:27},Enter:{code:"Enter",keyCode:13},Space:{code:"Space",keyCode:32}};
      const m=codes[keyName]||{code:keyName,keyCode:0};
      await cdp.send("Input.dispatchKeyEvent",{type:"keyDown",key:keyName,code:m.code,windowsVirtualKeyCode:m.keyCode,nativeVirtualKeyCode:m.keyCode});
      await cdp.send("Input.dispatchKeyEvent",{type:"keyUp",key:keyName,code:m.code,windowsVirtualKeyCode:m.keyCode,nativeVirtualKeyCode:m.keyCode});
    };

    console.log("QA desktop: fresh load");
    await cdp.send("Emulation.setDeviceMetricsOverride",{width:1280,height:900,deviceScaleFactor:1,mobile:false});
    await cdp.send("Emulation.setTouchEmulationEnabled",{enabled:false});
    await cdp.send("Network.setUserAgentOverride",{userAgent:"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/153 Safari/537.36"});
    await navigate(BASE);
    await cdp.send("Storage.clearDataForOrigin",{origin:BASE.slice(0,-1),storageTypes:"all"});
    await navigate(BASE);
    await waitFor('document.querySelector(".card")&&window.FARSI_MEMORY_DEBUG',"FSRS card");
    let d=await debug();
    assert(d.scheduler==="FSRS-6","Desktop did not initialize FSRS-6");
    assert(d.retention===0.9,"Desktop retention target changed");
    assert(d.counts.known+d.counts.learning+d.counts.left===2000,"Desktop progress counts do not partition 2000");
    assert(d.counts.known===0&&d.counts.learning===0&&d.counts.left===2000,"Fresh desktop state is not empty");
    const today=await evaluate('document.getElementById("todayStatus").textContent');
    assert(/^New 0\/24 · Reviews 0 · Streak 0$/.test(today),`Unexpected fresh Today line: ${today}`);

    const desktopLayout=await evaluate(`(()=>{const s=document.querySelector(".stage").getBoundingClientRect();return {vw:innerWidth,vh:innerHeight,scrollW:document.documentElement.scrollWidth,stage:{left:s.left,right:s.right,top:s.top,bottom:s.bottom}}})()`);
    assert(desktopLayout.scrollW<=desktopLayout.vw+1,"Desktop has horizontal overflow");
    assert(desktopLayout.stage.left>=0&&desktopLayout.stage.right<=desktopLayout.vw+1,"Desktop card exceeds viewport");
    assert(desktopLayout.stage.top>=0&&desktopLayout.stage.bottom<=desktopLayout.vh+1,"Desktop card exceeds viewport vertically");

    console.log("QA desktop: progress modal");
    await click(".progress");
    await waitFor('document.getElementById("progressOverlay").classList.contains("open")',"progress modal");
    const progress=await evaluate(`(()=>({stats:[...document.querySelectorAll(".progress-summary-stat strong")].map(x=>Number(x.textContent)),stages:document.querySelectorAll(".progress-stage-row").length,aria:document.getElementById("progressOverlay").getAttribute("aria-hidden")}))()`);
    assert(progress.stats.length===3&&progress.stats.reduce((a,b)=>a+b,0)===2000,"Progress modal counts do not total 2000");
    assert(progress.stages>1,"Progress modal stage list is missing");
    assert(progress.aria==="false","Progress modal aria state is wrong");
    await key("Escape");
    await waitFor('!document.getElementById("progressOverlay").classList.contains("open")',"progress modal close");

    console.log("QA desktop: sync and direction controls");
    await waitFor('document.getElementById("cloudSync")&&document.getElementById("directionMode")',"header controls");
    await click("#cloudSync");
    await waitFor('document.getElementById("farsiCloudSyncModalV1").classList.contains("open")',"sync modal");
    assert(await evaluate('Boolean(document.getElementById("syncCodeInput"))'),"Sync setup input is missing");
    await click("#syncClose");
    await click("#directionMode");
    await waitFor('localStorage.getItem("farsi2000-direction")==="en"',"EN→FA direction");
    d=await debug();
    assert(d.direction==="en"&&d.activeDirection==="en","Direction switch did not update memory engine");
    await click("#directionMode");
    await waitFor('localStorage.getItem("farsi2000-direction")==="fa"',"FA→EN direction");

    console.log("QA desktop: grade + undo");
    await click("#knowBtn");
    await waitFor('window.FARSI_MEMORY_DEBUG().session.answers===1',"first grade");
    d=await debug();
    assert(d.session.newConcepts===1&&d.newToday===1,"First grade did not count as one new concept");
    assert(d.counts.learning===1,"First FSRS Good did not enter Learning");
    await waitFor('document.getElementById("undo").classList.contains("show")',"Undo visible");
    await click("#undo");
    await waitFor('window.FARSI_MEMORY_DEBUG().session.answers===0',"undo");
    d=await debug();
    assert(d.newToday===0&&d.counts.learning===0&&d.counts.left===2000,"Undo did not fully restore fresh progress");

    console.log("QA desktop: 24-new daily cap and caught-up summary");
    for(let n=1;n<=24;n++){
      await click("#knowBtn");
      await waitFor(`window.FARSI_MEMORY_DEBUG().session.answers===${n}`,`grade ${n}/24`,5000);
    }
    await waitFor('document.body.classList.contains("caught-up")',"caught-up screen",10000);
    d=await debug();
    assert(d.newToday===24&&d.newRemainingToday===0,"Daily new-card cap did not stop at 24");
    assert(d.session.answers===24&&d.session.newConcepts===24,"Session summary did not retain 24 new concepts");
    assert(d.streak.count===1&&d.streak.studiedToday===true,"Study streak did not start");
    const caught=await evaluate('document.getElementById("main").innerText');
    assert(caught.includes("Caught up ✓"),"Caught-up title missing");
    assert(caught.includes("24/24"),"Caught-up new count missing");
    assert(caught.includes("24 answers"),"Caught-up session count missing");
    const actionsVisibility=await evaluate('getComputedStyle(document.querySelector(".actions")).visibility');
    assert(actionsVisibility==="hidden","Grade actions are visible while caught up");
    await screenshot("desktop-caught-up.png");

    console.log("QA PWA: manifest, registration, cache");
    const manifest=await evaluate('fetch("./manifest.webmanifest",{cache:"no-store"}).then(r=>r.json())');
    assert(manifest.display==="standalone"&&manifest.start_url==="./"&&manifest.scope==="./","Manifest install scope/display is wrong");
    assert((manifest.icons||[]).some(i=>i.sizes==="192x192"&&i.type==="image/png"),"Manifest 192 PNG missing");
    assert((manifest.icons||[]).some(i=>i.sizes==="512x512"&&i.type==="image/png"),"Manifest 512 PNG missing");
    assert((manifest.icons||[]).some(i=>String(i.purpose||"").includes("maskable")),"Manifest maskable icon missing");
    await evaluate('navigator.serviceWorker.ready.then(()=>true)');
    await waitFor('navigator.serviceWorker.controller',"service worker controller",10000);
    const cacheState=await evaluate(`caches.keys().then(async keys=>{const cache=await caches.open("farsi2000-shell-v1");return {keys,index:!!(await cache.match("./index.html")),deck:!!(await cache.match("./data/v5-deck.js")),bundle:!!(await cache.match("./data/audio-manifest.js"))}})`);
    assert(cacheState.keys.includes("farsi2000-shell-v1"),"PWA shell cache missing");
    assert(cacheState.index&&cacheState.deck&&cacheState.bundle,"Offline shell is missing a core study asset");

    console.log("QA iPhone: responsive layout and install help");
    await cdp.send("Emulation.setDeviceMetricsOverride",{width:390,height:844,deviceScaleFactor:3,mobile:true,screenWidth:390,screenHeight:844});
    await cdp.send("Emulation.setTouchEmulationEnabled",{enabled:true,maxTouchPoints:5});
    await cdp.send("Network.setUserAgentOverride",{userAgent:"Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"});
    await evaluate('localStorage.clear();sessionStorage.clear();location.reload()');
    await waitFor('document.querySelector(".card")&&window.FARSI_MEMORY_DEBUG',"iPhone FSRS card",15000);
    const mobile=await evaluate(`(()=>{const s=document.querySelector(".stage").getBoundingClientRect();const a=document.querySelector(".actions").getBoundingClientRect();return {vw:innerWidth,vh:innerHeight,scrollW:document.documentElement.scrollWidth,stage:{left:s.left,right:s.right,top:s.top,bottom:s.bottom},actions:{left:a.left,right:a.right,bottom:a.bottom},installHidden:document.getElementById("installApp").hidden}})()`);
    assert(mobile.vw===390,"iPhone emulation width is wrong");
    assert(mobile.scrollW<=mobile.vw+1,"iPhone layout has horizontal overflow");
    assert(mobile.stage.left>=-1&&mobile.stage.right<=mobile.vw+1,"iPhone card exceeds viewport");
    assert(mobile.stage.bottom<=mobile.vh+1,"iPhone card exceeds viewport vertically");
    assert(mobile.actions.left>=-1&&mobile.actions.right<=mobile.vw+1&&mobile.actions.bottom<=mobile.vh+1,"iPhone actions exceed viewport");
    assert(mobile.installHidden===false,"iPhone install-help button is not visible");
    await click("#installApp");
    await waitFor('document.getElementById("pwaInstallHelp")',"iPhone install help");
    const help=await evaluate('document.getElementById("pwaInstallHelp").innerText');
    assert(help.includes("Add to Home Screen"),"iPhone Add to Home Screen guidance is missing");
    await click("#pwaInstallHelp button");

    await click(".progress");
    await waitFor('document.getElementById("progressOverlay").classList.contains("open")',"mobile progress modal");
    const panel=await evaluate(`(()=>{const r=document.querySelector(".progress-panel").getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width}})()`);
    assert(panel.left>=0&&panel.right<=390.5&&panel.width<=390*0.95,"Progress panel does not fit iPhone viewport");
    await key("Escape");
    await screenshot("iphone-card.png");

    console.log("QA iPhone: offline reload");
    await evaluate('navigator.serviceWorker.ready.then(()=>true)');
    await waitFor('navigator.serviceWorker.controller',"iPhone service worker controller",10000);
    await cdp.send("Network.emulateNetworkConditions",{offline:true,latency:0,downloadThroughput:0,uploadThroughput:0});
    await cdp.send("Page.reload",{ignoreCache:true});
    await waitFor('document.querySelector(".card")&&window.FARSI_MEMORY_DEBUG',"offline cached card",15000);
    const offline=await evaluate(`(()=>({online:navigator.onLine,engine:window.FARSI_MEMORY_DEBUG().scheduler,counts:window.FARSI_MEMORY_DEBUG().counts,manifest:document.querySelector('link[rel="manifest"]')?.getAttribute("href")}))()`);
    assert(offline.online===false,"Offline emulation did not report offline");
    assert(offline.engine==="FSRS-6","Offline reload did not restore FSRS app");
    assert(offline.counts.known+offline.counts.learning+offline.counts.left===2000,"Offline progress counts are invalid");
    assert(offline.manifest==="manifest.webmanifest","Offline page lost manifest link");
    await screenshot("iphone-offline.png");
    await cdp.send("Network.emulateNetworkConditions",{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});

    const seriousConsole=consoleErrors.filter(x=>!x.includes("Failed to load resource")&&!x.includes("ERR_INTERNET_DISCONNECTED"));
    assert(exceptions.length===0,`Browser exceptions: ${exceptions.join(" | ")}`);
    assert(seriousConsole.length===0,`Browser console errors: ${seriousConsole.join(" | ")}`);

    console.log("FINAL BROWSER QA PASSED");
    console.log("Desktop: FSRS load, layout, progress, sync UI, directions, grade/undo, 24-card cap, caught-up stats");
    console.log("iPhone: responsive fit, install help, progress modal, service worker, offline reload");
    console.log("PWA: manifest/icons, shell cache, controller, network/offline behavior");
    cdp.close();
  }finally{
    cleanup();
    if(serverErr&&!serverErr.includes("GET /"))console.error(serverErr);
    if(chromeErr&&process.env.QA_VERBOSE_CHROME==="1")console.error(chromeErr);
  }
}

main().catch(error=>{
  console.error("FINAL BROWSER QA FAILED:",error.stack||error);
  process.exit(1);
});
