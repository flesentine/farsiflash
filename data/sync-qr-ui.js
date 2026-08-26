(()=>{
  if(window.__farsiCloudSyncQrV4)return;
  window.__farsiCloudSyncQrV4=true;

  const SYNC_CODE_KEY="farsi2000-sync-code";
  const LOCAL_UPDATED_KEY="farsi2000-sync-local-updated";
  const STYLE_ID="farsiCloudSyncQrStylesV4";
  const QR_LIB_URL="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js";
  let qrLibPromise=null;
  let enhanceQueued=false;

  const normalize=code=>String(code||"").replace(/[^0-9a-f]/gi,"").toLowerCase();
  const valid=code=>/^[0-9a-f]{32}$/.test(normalize(code));
  const codeRaw=()=>normalize(localStorage.getItem(SYNC_CODE_KEY)||"");

  function extractSyncCode(value){
    const text=String(value||"").trim();
    if(!text)return "";
    let candidate=text;
    try{
      const url=new URL(text,location.href);
      const hashParams=new URLSearchParams(url.hash.replace(/^#/,""));
      candidate=hashParams.get("sync")||url.searchParams.get("sync")||text;
    }catch{}
    const match=text.match(/(?:#|\?|&)sync=([^&#\s]+)/i);
    if(match)candidate=match[1];
    const clean=normalize(candidate);
    return valid(clean)?clean:"";
  }

  function syncUrl(code){
    return `${location.origin}${location.pathname}#sync=${normalize(code)}`;
  }

  function consumeQrLink(){
    const hashParams=new URLSearchParams(location.hash.replace(/^#/,""));
    const incoming=extractSyncCode(hashParams.get("sync")||"");
    if(!valid(incoming))return false;

    const existing=codeRaw();
    if(valid(existing)&&existing!==incoming){
      const replace=confirm("Connect this device to the scanned Farsi sync link? This replaces its current sync connection, but keeps local progress for merging.");
      if(!replace){
        history.replaceState(null,"",location.pathname+location.search);
        return false;
      }
    }

    localStorage.setItem(SYNC_CODE_KEY,incoming);
    localStorage.setItem(LOCAL_UPDATED_KEY,String(Date.now()));
    history.replaceState(null,"",location.pathname+location.search);
    setTimeout(()=>window.dispatchEvent(new Event("online")),80);
    return true;
  }

  function ensureStyles(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      #farsiCloudSyncModalV1 .sync-panel{width:min(92vw,400px)!important;padding:20px!important}
      #farsiCloudSyncModalV1 .sync-panel>p{margin:6px 0 12px!important;line-height:1.4!important}
      #farsiSyncQrBox{display:block;margin:10px auto 10px;padding:10px;width:max-content;max-width:100%;border-radius:18px;background:#fff;text-align:center;min-width:194px;min-height:194px;color:#333;font-size:12px}
      #farsiSyncQrBox img,#farsiSyncQrBox canvas{display:block;width:min(206px,62vw)!important;max-width:206px;height:auto!important;margin:auto}
      #farsiCloudSyncModalV1 .sync-code.sync-link{display:block;margin:8px 0 6px!important;padding:10px 11px!important;border-radius:11px!important;background:rgba(255,255,255,.075)!important;font-size:10px!important;line-height:1.4!important;letter-spacing:0!important;word-break:break-all;text-align:left;color:#eee8df}
      #farsiSyncQrHelp{margin:0 0 12px;color:#aaa297;font-size:11px;line-height:1.35;text-align:center}
      #farsiCloudSyncModalV1 .sync-actions{display:grid!important;grid-template-columns:1fr 1fr;gap:8px!important;margin-top:10px!important}
      #farsiCloudSyncModalV1 .sync-actions button{width:100%;min-height:42px}
      #farsiCloudSyncModalV1 #syncCopy{grid-column:1}
      #farsiCloudSyncModalV1 #syncNowBtn{grid-column:2}
      #farsiCloudSyncModalV1 #syncDisconnect{grid-column:1/-1;background:transparent!important;border-color:rgba(255,255,255,.10)!important;color:#c9c0b5!important;min-height:38px!important}
      #farsiCloudSyncModalV1 .sync-note{margin-top:10px!important;text-align:center;font-size:11px!important;line-height:1.35!important;color:#8f887f!important}
      @media(max-width:430px){
        #farsiCloudSyncModalV1 .sync-panel{width:min(94vw,380px)!important;padding:18px!important}
        #farsiSyncQrBox img,#farsiSyncQrBox canvas{width:min(196px,60vw)!important;max-width:196px}
      }
    `;
    document.head.appendChild(style);
  }

  function ensureQrLib(){
    if(window.QRCode)return Promise.resolve(window.QRCode);
    if(qrLibPromise)return qrLibPromise;
    qrLibPromise=new Promise((resolve,reject)=>{
      const existing=document.querySelector(`script[src="${QR_LIB_URL}"]`);
      if(existing){
        if(window.QRCode){resolve(window.QRCode);return}
        existing.addEventListener("load",()=>resolve(window.QRCode),{once:true});
        existing.addEventListener("error",()=>reject(new Error("QR library failed to load")),{once:true});
        return;
      }
      const script=document.createElement("script");
      script.src=QR_LIB_URL;
      script.async=true;
      script.crossOrigin="anonymous";
      script.onload=()=>window.QRCode?resolve(window.QRCode):reject(new Error("QR library unavailable"));
      script.onerror=()=>reject(new Error("QR library failed to load"));
      document.head.appendChild(script);
    });
    return qrLibPromise;
  }

  async function renderQr(panel,code){
    if(!panel||!valid(code))return;
    if(panel.dataset.qrAutoCode===code)return;
    panel.dataset.qrAutoCode=code;

    const url=syncUrl(code);
    const codeEl=panel.querySelector(".sync-code");
    if(codeEl){
      codeEl.textContent=url;
      codeEl.classList.add("sync-link");
      codeEl.title=url;
    }

    const copy=panel.querySelector("#syncCopy");
    if(copy){
      copy.textContent="Copy link";
      copy.onclick=async e=>{
        try{await navigator.clipboard.writeText(url);e.currentTarget.textContent="Copied ✓"}
        catch{e.currentTarget.textContent="Select link above"}
      };
    }

    const intro=panel.querySelector("p");
    if(intro)intro.textContent="Scan on your other device to open Farsi 2000 and connect sync automatically.";
    const note=panel.querySelector(".sync-note");
    if(note)note.textContent="Keep this pairing link private.";

    let box=panel.querySelector("#farsiSyncQrBox");
    if(!box){
      box=document.createElement("div");
      box.id="farsiSyncQrBox";
      box.textContent="Making QR…";
      if(codeEl)codeEl.insertAdjacentElement("beforebegin",box);
      else panel.querySelector(".sync-actions")?.insertAdjacentElement("beforebegin",box);
    }

    let help=panel.querySelector("#farsiSyncQrHelp");
    if(!help){
      help=document.createElement("div");
      help.id="farsiSyncQrHelp";
      help.textContent="Scan the QR, or copy the link above.";
      if(codeEl)codeEl.insertAdjacentElement("afterend",help);
      else box.insertAdjacentElement("afterend",help);
    }

    try{
      await ensureQrLib();
      if(!panel.isConnected||panel.dataset.qrAutoCode!==code)return;
      box.replaceChildren();
      new window.QRCode(box,{
        text:url,
        width:206,
        height:206,
        colorDark:"#111111",
        colorLight:"#ffffff",
        correctLevel:window.QRCode.CorrectLevel.M,
      });
    }catch(err){
      console.warn("Farsi sync QR:",err);
      if(panel.isConnected){
        box.textContent="QR unavailable — use the sync link below.";
        panel.dataset.qrAutoCode="error:"+code;
      }
    }
  }

  function streamlineSetup(panel){
    if(!panel||panel.dataset.qrSetupDone==="1")return;
    panel.dataset.qrSetupDone="1";
    const input=panel.querySelector("#syncCodeInput");
    if(input)input.placeholder="Paste sync link or 32-character code";
    const create=panel.querySelector("#syncCreate");
    if(create)create.textContent="Create sync link";
    const connect=panel.querySelector("#syncConnect");
    if(connect)connect.textContent="Connect link";
    const intro=panel.querySelector("p");
    if(intro)intro.textContent="Create a private sync link for this progress, or paste one from another device.";
    const note=panel.querySelector(".sync-note");
    if(note)note.textContent="No account is required. Keep the sync link private.";
  }

  function enhanceSyncModal(){
    const modal=document.getElementById("farsiCloudSyncModalV1");
    if(!modal||!modal.classList.contains("open"))return;
    const panel=modal.querySelector(".sync-panel");
    if(!panel)return;
    const code=codeRaw();
    if(valid(code))renderQr(panel,code);
    else streamlineSetup(panel);
  }

  function scheduleEnhance(){
    if(enhanceQueued)return;
    enhanceQueued=true;
    requestAnimationFrame(()=>{
      enhanceQueued=false;
      enhanceSyncModal();
    });
  }

  function init(){
    ensureStyles();
    const connectedFromQr=consumeQrLink();
    const modal=document.getElementById("farsiCloudSyncModalV1");
    if(modal){
      const observer=new MutationObserver(scheduleEnhance);
      observer.observe(modal,{subtree:true,childList:true,attributes:true,attributeFilter:["class"]});
    }

    document.addEventListener("click",e=>{
      const connect=e.target.closest?.("#syncConnect");
      if(connect){
        const panel=connect.closest(".sync-panel");
        const input=panel?.querySelector("#syncCodeInput");
        const parsed=extractSyncCode(input?.value||"");
        if(parsed&&input)input.value=parsed;
      }
      if(e.target.closest?.("#cloudSync,#syncCreate,#syncConnect"))scheduleEnhance();
    },true);

    if(connectedFromQr)setTimeout(()=>{
      const b=document.getElementById("cloudSync");
      if(b)b.textContent="Syncing…";
    },100);
  }

  if(document.readyState==="loading")window.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
