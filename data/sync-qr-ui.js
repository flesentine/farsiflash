(()=>{
  if(window.__farsiCloudSyncQrV3)return;
  window.__farsiCloudSyncQrV3=true;

  const SYNC_CODE_KEY="farsi2000-sync-code";
  const LOCAL_UPDATED_KEY="farsi2000-sync-local-updated";
  const STYLE_ID="farsiCloudSyncQrStylesV3";
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
      #farsiSyncQrBox{display:block;margin:12px auto 10px;padding:14px;width:max-content;max-width:100%;border-radius:16px;background:#fff;text-align:center;min-width:180px;min-height:180px;color:#333;font-size:12px}
      #farsiSyncQrBox img,#farsiSyncQrBox canvas{display:block;max-width:min(220px,68vw);height:auto!important;margin:auto}
      #farsiSyncQrHelp{margin:9px 2px 12px;color:#c9c0b5;font-size:12px;line-height:1.4;text-align:center}
      #farsiCloudSyncModalV1 .sync-code.sync-link{font-size:11px;line-height:1.45;letter-spacing:0;word-break:break-all;text-align:left}
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

    // Mark this panel before touching its DOM. The QR renderer and text updates
    // create mutations; marking first prevents the observer from recursively
    // rebuilding the modal until the browser appears frozen.
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
        catch{e.currentTarget.textContent="Select link below"}
      };
    }

    const intro=panel.querySelector("p");
    if(intro)intro.textContent="Scan this QR on your other device. It opens Farsi 2000 and connects sync automatically.";
    const note=panel.querySelector(".sync-note");
    if(note)note.textContent="Keep this link private. Anyone with it could sync this study progress.";

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
      help.textContent="Or copy the sync link underneath and open it on another device.";
      if(codeEl)codeEl.insertAdjacentElement("afterend",help);
      else box.insertAdjacentElement("afterend",help);
    }

    try{
      await ensureQrLib();
      if(!panel.isConnected||panel.dataset.qrAutoCode!==code)return;
      box.replaceChildren();
      new window.QRCode(box,{
        text:url,
        width:220,
        height:220,
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
