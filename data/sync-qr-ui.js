(()=>{
  if(window.__farsiCloudSyncQrV1)return;
  window.__farsiCloudSyncQrV1=true;

  const SYNC_CODE_KEY="farsi2000-sync-code";
  const LOCAL_UPDATED_KEY="farsi2000-sync-local-updated";
  const STYLE_ID="farsiCloudSyncQrStylesV1";
  const QR_LIB_URL="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js";
  let qrLibPromise=null;

  const normalize=code=>String(code||"").replace(/[^0-9a-f]/gi,"").toLowerCase();
  const valid=code=>/^[0-9a-f]{32}$/.test(normalize(code));
  const codeRaw=()=>normalize(localStorage.getItem(SYNC_CODE_KEY)||"");

  function syncUrl(code){
    return `${location.origin}${location.pathname}#sync=${normalize(code)}`;
  }

  function consumeQrLink(){
    const raw=location.hash.startsWith("#sync=")?location.hash.slice(6):"";
    const incoming=normalize(raw);
    if(!valid(incoming))return false;

    const existing=codeRaw();
    if(valid(existing)&&existing!==incoming){
      const replace=confirm("Connect this device to the scanned Farsi sync code? This replaces its current sync connection, but keeps local progress for merging.");
      if(!replace){
        history.replaceState(null,"",location.pathname+location.search);
        return false;
      }
    }

    localStorage.setItem(SYNC_CODE_KEY,incoming);
    localStorage.setItem(LOCAL_UPDATED_KEY,String(Date.now()));
    history.replaceState(null,"",location.pathname+location.search);

    // The main sync client listens for online and will immediately merge/push.
    setTimeout(()=>window.dispatchEvent(new Event("online")),80);
    return true;
  }

  function ensureStyles(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      #farsiSyncQrBox{display:none;margin:16px auto 4px;padding:14px;width:max-content;max-width:100%;border-radius:16px;background:#fff;text-align:center}
      #farsiSyncQrBox.show{display:block}
      #farsiSyncQrBox img,#farsiSyncQrBox canvas{display:block;max-width:min(220px,68vw);height:auto!important;margin:auto}
      #farsiSyncQrHelp{display:none;margin:10px 2px 0;color:#c9c0b5;font-size:12px;line-height:1.4;text-align:center}
      #farsiSyncQrHelp.show{display:block}
    `;
    document.head.appendChild(style);
  }

  function ensureQrLib(){
    if(window.QRCode)return Promise.resolve(window.QRCode);
    if(qrLibPromise)return qrLibPromise;
    qrLibPromise=new Promise((resolve,reject)=>{
      const existing=document.querySelector(`script[src="${QR_LIB_URL}"]`);
      if(existing){
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

  async function showQr(button){
    const code=codeRaw();
    if(!valid(code))return;
    const panel=button.closest(".sync-panel");
    if(!panel)return;

    let box=panel.querySelector("#farsiSyncQrBox");
    let help=panel.querySelector("#farsiSyncQrHelp");
    if(box?.classList.contains("show")){
      box.classList.remove("show");
      help?.classList.remove("show");
      button.textContent="Show QR";
      return;
    }

    button.disabled=true;
    button.textContent="Making QR…";
    try{
      await ensureQrLib();
      if(!box){
        box=document.createElement("div");
        box.id="farsiSyncQrBox";
        panel.querySelector(".sync-actions")?.insertAdjacentElement("afterend",box);
      }
      if(!help){
        help=document.createElement("div");
        help.id="farsiSyncQrHelp";
        help.textContent="Scan this with the Camera app on your other phone or tablet. It opens Farsi 2000 and connects that device automatically.";
        box.insertAdjacentElement("afterend",help);
      }
      box.innerHTML="";
      new window.QRCode(box,{
        text:syncUrl(code),
        width:220,
        height:220,
        colorDark:"#111111",
        colorLight:"#ffffff",
        correctLevel:window.QRCode.CorrectLevel.M,
      });
      box.classList.add("show");
      help.classList.add("show");
      button.textContent="Hide QR";
    }catch(err){
      console.warn("Farsi sync QR:",err);
      button.textContent="QR unavailable";
    }finally{
      button.disabled=false;
    }
  }

  function enhanceSyncModal(){
    const modal=document.getElementById("farsiCloudSyncModalV1");
    if(!modal||!modal.classList.contains("open"))return;
    const code=codeRaw();
    if(!valid(code))return;
    const actions=modal.querySelector(".sync-actions");
    if(!actions||modal.querySelector("#syncQr"))return;

    const button=document.createElement("button");
    button.id="syncQr";
    button.type="button";
    button.textContent="Show QR";
    button.onclick=()=>showQr(button);
    actions.insertBefore(button,actions.querySelector("#syncDisconnect")||null);
  }

  function init(){
    ensureStyles();
    const connectedFromQr=consumeQrLink();
    const observer=new MutationObserver(()=>enhanceSyncModal());
    observer.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:["class"]});
    document.addEventListener("click",()=>setTimeout(enhanceSyncModal,0),true);
    if(connectedFromQr)setTimeout(()=>{
      const b=document.getElementById("cloudSync");
      if(b)b.textContent="Syncing…";
    },100);
  }

  if(document.readyState==="loading")window.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
