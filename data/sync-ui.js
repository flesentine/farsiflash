(()=>{
  if(window.__farsiCloudSyncV1)return;
  window.__farsiCloudSyncV1=true;

  const ENDPOINT="https://qifvbdwdawmuwptdxgvu.supabase.co/functions/v1/farsi-sync";
  const MEMORY_KEY="farsi2000-v5";
  const LEGACY_KEY="farsi2000-v4";
  const DIR_KEY="farsi2000-direction";
  const PHON_KEY="farsi2000-hide-phonetics";
  const SYNC_CODE_KEY="farsi2000-sync-code";
  const LOCAL_UPDATED_KEY="farsi2000-sync-local-updated";
  const RESET_AT_KEY="farsi2000-reset-at";
  const STYLE_ID="farsiCloudSyncStylesV1";
  const MODAL_ID="farsiCloudSyncModalV1";
  const POLL_MS=1500;
  const CLOUD_POLL_MS=45000;

  let syncing=false;
  let queued=false;
  let applying=false;
  let debounceTimer=0;
  let lastFingerprint="";
  let localUpdatedAt=0;
  let lastCardCount=0;

  const parse=(raw,fallback)=>{try{return raw==null?fallback:JSON.parse(raw)}catch{return fallback}};
  const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
  const asTime=v=>{const n=Date.parse(v||"");return Number.isFinite(n)?n:0};
  const codeRaw=()=>String(localStorage.getItem(SYNC_CODE_KEY)||"").replace(/[^0-9a-f]/gi,"").toLowerCase();
  const validCode=code=>/^[0-9a-f]{32}$/.test(String(code||"").replace(/[^0-9a-f]/gi,"").toLowerCase());
  const formatCode=code=>String(code||"").replace(/[^0-9a-f]/gi,"").toUpperCase().match(/.{1,4}/g)?.join("-")||"";

  function randomCode(){
    const bytes=new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return [...bytes].map(b=>b.toString(16).padStart(2,"0")).join("");
  }

  function memoryCardCount(){
    const m=parse(localStorage.getItem(MEMORY_KEY),null);
    return m&&m.cards&&typeof m.cards==="object"?Object.keys(m.cards).length:0;
  }

  function fingerprint(){
    return JSON.stringify({
      memory:localStorage.getItem(MEMORY_KEY)||"",
      legacy:localStorage.getItem(LEGACY_KEY)||"",
      direction:localStorage.getItem(DIR_KEY)||"",
      phonetics:localStorage.getItem(PHON_KEY)||"",
      resetAt:localStorage.getItem(RESET_AT_KEY)||"",
    });
  }

  function ensureLocalClock(){
    const stored=Number(localStorage.getItem(LOCAL_UPDATED_KEY));
    localUpdatedAt=Number.isFinite(stored)&&stored>0?stored:Date.now();
    localStorage.setItem(LOCAL_UPDATED_KEY,String(localUpdatedAt));
  }

  function localPayload(){
    return {
      version:1,
      savedAt:localUpdatedAt||Date.now(),
      resetAt:Number(localStorage.getItem(RESET_AT_KEY))||0,
      memory:parse(localStorage.getItem(MEMORY_KEY),null),
      legacy:parse(localStorage.getItem(LEGACY_KEY),null),
      settings:{
        direction:localStorage.getItem(DIR_KEY)==="en"?"en":"fa",
        hidePhonetics:localStorage.getItem(PHON_KEY)==="1",
      },
    };
  }

  function emptyMemory(){
    return {version:5,cards:{},logs:[],reverseProgress:{},createdAt:new Date().toISOString(),migratedFrom:null};
  }

  function latestLogTimes(memory){
    const out={};
    for(const row of memory?.logs||[]){
      if(!Array.isArray(row)||!row[1])continue;
      const t=Number(row[0])||0;
      if(t>(out[row[1]]||0))out[row[1]]=t;
    }
    return out;
  }

  function mergeMemory(a,b){
    if(!a&& !b)return null;
    if(!a)return clone(b);
    if(!b)return clone(a);
    if(a.version!==5||b.version!==5)return clone((Number(a?.logs?.at?.(-1)?.[0])||0)>=(Number(b?.logs?.at?.(-1)?.[0])||0)?a:b);

    const out=emptyMemory();
    out.createdAt=[a.createdAt,b.createdAt].filter(Boolean).sort()[0]||new Date().toISOString();
    out.migratedFrom=a.migratedFrom||b.migratedFrom||null;
    if(a.migratedAt||b.migratedAt)out.migratedAt=[a.migratedAt,b.migratedAt].filter(Boolean).sort().at(-1);

    const keys=new Set([...Object.keys(a.cards||{}),...Object.keys(b.cards||{})]);
    for(const key of keys){
      const ca=a.cards?.[key],cb=b.cards?.[key];
      if(!ca){out.cards[key]=clone(cb);continue}
      if(!cb){out.cards[key]=clone(ca);continue}
      const ta=asTime(ca.last_review),tb=asTime(cb.last_review);
      if(ta!==tb)out.cards[key]=clone(ta>tb?ca:cb);
      else{
        const ra=Number(ca.reps)||0,rb=Number(cb.reps)||0;
        out.cards[key]=clone(ra>=rb?ca:cb);
      }
    }

    const seen=new Set();
    const logs=[];
    for(const row of [...(a.logs||[]),...(b.logs||[])]){
      if(!Array.isArray(row))continue;
      const k=JSON.stringify(row);
      if(seen.has(k))continue;
      seen.add(k);logs.push(clone(row));
    }
    logs.sort((x,y)=>(Number(x?.[0])||0)-(Number(y?.[0])||0));
    out.logs=logs.slice(-30000);

    const ta=latestLogTimes(a),tb=latestLogTimes(b);
    const words=new Set([...Object.keys(a.reverseProgress||{}),...Object.keys(b.reverseProgress||{})]);
    for(const fa of words){
      if((ta[fa]||0)>=(tb[fa]||0))out.reverseProgress[fa]=Number(a.reverseProgress?.[fa])||0;
      else out.reverseProgress[fa]=Number(b.reverseProgress?.[fa])||0;
    }
    return out;
  }

  function sanitizedSide(side,resetAt){
    if(!side)return null;
    if(resetAt&&Number(side.savedAt||0)<resetAt){
      return {...side,memory:emptyMemory(),legacy:null};
    }
    return side;
  }

  function mergePayload(local,remote){
    if(!remote||typeof remote!=="object")return local;
    const resetAt=Math.max(Number(local.resetAt)||0,Number(remote.resetAt)||0);
    const a=sanitizedSide(local,resetAt);
    const b=sanitizedSide(remote,resetAt);
    const aTime=Number(a?.savedAt)||0,bTime=Number(b?.savedAt)||0;
    return {
      version:1,
      savedAt:Math.max(aTime,bTime),
      resetAt,
      memory:mergeMemory(a?.memory,b?.memory),
      legacy:clone(aTime>=bTime?a?.legacy:b?.legacy),
      settings:clone(aTime>=bTime?a?.settings:b?.settings)||{direction:"fa",hidePhonetics:false},
    };
  }

  function payloadFingerprint(payload){
    return JSON.stringify({
      memory:payload?.memory||null,
      legacy:payload?.legacy||null,
      direction:payload?.settings?.direction||"fa",
      phonetics:!!payload?.settings?.hidePhonetics,
      resetAt:Number(payload?.resetAt)||0,
    });
  }

  function applyPayload(payload){
    const before=payloadFingerprint(localPayload());
    const after=payloadFingerprint(payload);
    if(before===after)return false;
    applying=true;
    try{
      if(payload.memory)localStorage.setItem(MEMORY_KEY,JSON.stringify(payload.memory));
      else localStorage.removeItem(MEMORY_KEY);
      if(payload.legacy)localStorage.setItem(LEGACY_KEY,JSON.stringify(payload.legacy));
      else localStorage.removeItem(LEGACY_KEY);
      localStorage.setItem(DIR_KEY,payload.settings?.direction==="en"?"en":"fa");
      localStorage.setItem(PHON_KEY,payload.settings?.hidePhonetics?"1":"0");
      if(Number(payload.resetAt)>0)localStorage.setItem(RESET_AT_KEY,String(Number(payload.resetAt)));
      else localStorage.removeItem(RESET_AT_KEY);
      localUpdatedAt=Number(payload.savedAt)||Date.now();
      localStorage.setItem(LOCAL_UPDATED_KEY,String(localUpdatedAt));
      lastFingerprint=fingerprint();
      lastCardCount=memoryCardCount();
    }finally{applying=false}
    return true;
  }

  async function api(action,state){
    const code=codeRaw();
    if(!validCode(code))throw new Error("No sync code");
    const res=await fetch(ENDPOINT,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({action,code,state}),
      cache:"no-store",
    });
    const body=await res.json().catch(()=>({}));
    if(!res.ok)throw new Error(body?.error||`Sync failed (${res.status})`);
    return body;
  }

  function button(){return document.getElementById("cloudSync")}
  function setStatus(status){
    const b=button();if(!b)return;
    b.dataset.status=status;
    if(!validCode(codeRaw()))b.textContent="Sync";
    else if(status==="syncing")b.textContent="Syncing…";
    else if(status==="offline")b.textContent="Offline";
    else if(status==="error")b.textContent="Sync !";
    else b.textContent="Synced";
    b.title=validCode(codeRaw())?"Cross-device progress sync":"Set up cross-device progress sync";
  }

  function scheduleSync(delay=900){
    if(!validCode(codeRaw()))return;
    clearTimeout(debounceTimer);
    debounceTimer=setTimeout(()=>syncNow(),delay);
  }

  async function syncNow(){
    if(!validCode(codeRaw())){setStatus("idle");return}
    if(!navigator.onLine){setStatus("offline");return}
    if(document.visibilityState==="hidden")return;
    if(syncing){queued=true;return}
    syncing=true;setStatus("syncing");
    let changed=false;
    try{
      const local=localPayload();
      const pulled=await api("pull");
      const merged=mergePayload(local,pulled.state);
      changed=applyPayload(merged);
      await api("push",merged);
      setStatus("synced");
    }catch(err){
      console.warn("Farsi cloud sync:",err);
      setStatus(navigator.onLine?"error":"offline");
    }finally{
      syncing=false;
      if(queued){queued=false;scheduleSync(250)}
    }
    if(changed){
      sessionStorage.setItem("farsi2000-sync-reloaded","1");
      setTimeout(()=>location.reload(),220);
    }
  }

  function installStyle(){
    if(document.getElementById(STYLE_ID))return;
    const s=document.createElement("style");s.id=STYLE_ID;
    s.textContent=`
      #cloudSync[data-status="syncing"]{opacity:.72}
      #cloudSync[data-status="error"]{font-weight:800}
      #${MODAL_ID}{position:fixed;inset:0;z-index:9999;display:none;place-items:center;padding:20px;background:rgba(0,0,0,.56);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
      #${MODAL_ID}.open{display:grid}
      #${MODAL_ID} .sync-panel{width:min(92vw,430px);border-radius:20px;padding:22px;background:rgba(30,30,27,.94);border:1px solid rgba(255,255,255,.16);box-shadow:0 24px 80px rgba(0,0,0,.5);color:#f6f0e8;text-align:left}
      #${MODAL_ID} h2{margin:0 0 8px;font-size:22px}
      #${MODAL_ID} p{margin:8px 0 16px;color:#d8d0c5;line-height:1.45;font-size:14px}
      #${MODAL_ID} .sync-code{display:block;margin:10px 0 16px;padding:12px;border-radius:12px;background:rgba(255,255,255,.08);font:700 15px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.06em;overflow-wrap:anywhere;user-select:text;-webkit-user-select:text}
      #${MODAL_ID} input{width:100%;height:46px;border:1px solid rgba(255,255,255,.18);border-radius:12px;background:rgba(255,255,255,.08);color:#fff;padding:0 12px;font:600 14px ui-monospace,SFMono-Regular,Menlo,monospace;outline:none}
      #${MODAL_ID} .sync-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:14px}
      #${MODAL_ID} button{min-height:42px;border-radius:11px;padding:0 13px;background:rgba(255,255,255,.11);color:#fff;border:1px solid rgba(255,255,255,.13)}
      #${MODAL_ID} button.primary{background:#f4eee4;color:#24231f;font-weight:800}
      #${MODAL_ID} .sync-close{float:right;margin:-8px -8px 0 8px;width:38px;padding:0;font-size:20px}
      #${MODAL_ID} .sync-note{font-size:12px;color:#aaa297;margin-top:14px}
    `;
    document.head.appendChild(s);
  }

  function installModal(){
    if(document.getElementById(MODAL_ID))return;
    const el=document.createElement("div");el.id=MODAL_ID;
    el.addEventListener("click",e=>{if(e.target===el)closeModal()});
    document.body.appendChild(el);
  }

  function closeModal(){document.getElementById(MODAL_ID)?.classList.remove("open")}

  function renderModal(){
    const modal=document.getElementById(MODAL_ID);if(!modal)return;
    const code=codeRaw();
    if(validCode(code)){
      modal.innerHTML=`<div class="sync-panel"><button class="sync-close" id="syncClose" aria-label="Close">×</button><h2>Cloud Sync</h2><p>This private code connects your progress on your other phone, tablet, or computer.</p><code class="sync-code">${formatCode(code)}</code><div class="sync-actions"><button class="primary" id="syncCopy">Copy code</button><button id="syncNowBtn">Sync now</button><button id="syncDisconnect">Disconnect this device</button></div><div class="sync-note">Treat this code like a password. Anyone with it could sync this study progress.</div></div>`;
      modal.querySelector("#syncClose").onclick=closeModal;
      modal.querySelector("#syncCopy").onclick=async e=>{
        try{await navigator.clipboard.writeText(formatCode(code));e.currentTarget.textContent="Copied ✓"}catch{e.currentTarget.textContent="Select code above"}
      };
      modal.querySelector("#syncNowBtn").onclick=()=>{closeModal();syncNow()};
      modal.querySelector("#syncDisconnect").onclick=()=>{
        if(!confirm("Disconnect cloud sync on this device? Your local progress will stay here."))return;
        localStorage.removeItem(SYNC_CODE_KEY);setStatus("idle");renderModal();
      };
    }else{
      modal.innerHTML=`<div class="sync-panel"><button class="sync-close" id="syncClose" aria-label="Close">×</button><h2>Cloud Sync</h2><p>Create a private sync code for this progress, or paste the code from another device.</p><input id="syncCodeInput" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="ABCD-EF01-2345-6789-ABCD-EF01-2345-6789"><div class="sync-actions"><button class="primary" id="syncCreate">Create sync code</button><button id="syncConnect">Use existing code</button></div><div class="sync-note">No account is required. Keep the code private.</div></div>`;
      modal.querySelector("#syncClose").onclick=closeModal;
      modal.querySelector("#syncCreate").onclick=()=>{
        const next=randomCode();
        localStorage.setItem(SYNC_CODE_KEY,next);
        localUpdatedAt=Date.now();localStorage.setItem(LOCAL_UPDATED_KEY,String(localUpdatedAt));
        renderModal();syncNow();
      };
      modal.querySelector("#syncConnect").onclick=()=>{
        const input=modal.querySelector("#syncCodeInput");
        const next=String(input.value||"").replace(/[^0-9a-f]/gi,"").toLowerCase();
        if(!validCode(next)){input.focus();input.setCustomValidity("Enter the full 32-character sync code");input.reportValidity();return}
        input.setCustomValidity("");
        localStorage.setItem(SYNC_CODE_KEY,next);
        renderModal();syncNow();
      };
    }
  }

  function openModal(){renderModal();document.getElementById(MODAL_ID)?.classList.add("open")}

  function installButton(){
    const header=document.querySelector(".header-actions");if(!header)return;
    let b=button();
    if(!b){
      b=document.createElement("button");b.id="cloudSync";b.type="button";b.className="tiny";b.onclick=e=>{e.stopPropagation();openModal()};
      const reset=document.getElementById("reset");
      if(reset)reset.insertAdjacentElement("beforebegin",b);else header.appendChild(b);
    }
    setStatus("idle");
  }

  function watchLocal(){
    const fp=fingerprint();
    const count=memoryCardCount();
    if(fp!==lastFingerprint&&!applying){
      lastFingerprint=fp;
      localUpdatedAt=Date.now();
      localStorage.setItem(LOCAL_UPDATED_KEY,String(localUpdatedAt));
      lastCardCount=count;
      scheduleSync();
    }else lastCardCount=count;
  }

  function installResetWatch(){
    const reset=document.getElementById("reset");if(!reset)return;
    reset.addEventListener("click",()=>{
      const before=memoryCardCount();
      setTimeout(()=>{
        const after=memoryCardCount();
        if(before>0&&after===0){
          const now=Date.now();
          localStorage.setItem(RESET_AT_KEY,String(now));
          localUpdatedAt=now;localStorage.setItem(LOCAL_UPDATED_KEY,String(now));
          lastFingerprint=fingerprint();
          scheduleSync(150);
        }
      },260);
    });
  }

  function init(){
    installStyle();installModal();installButton();ensureLocalClock();
    lastFingerprint=fingerprint();lastCardCount=memoryCardCount();
    installResetWatch();
    setInterval(watchLocal,POLL_MS);
    setInterval(()=>{if(document.visibilityState==="visible")syncNow()},CLOUD_POLL_MS);
    window.addEventListener("online",()=>syncNow());
    window.addEventListener("offline",()=>setStatus("offline"));
    document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")syncNow()});
    if(validCode(codeRaw()))setTimeout(syncNow,800);
  }

  if(document.readyState==="loading")window.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
