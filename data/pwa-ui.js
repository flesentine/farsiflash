(()=>{
  if(window.__farsiPwaUiV1)return;
  window.__farsiPwaUiV1=true;

  const isStandalone=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
  const isIos=()=>/iphone|ipad|ipod/i.test(navigator.userAgent)||(
    navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1
  );
  let deferredInstall=null;

  function installButton(){
    return document.getElementById("installApp");
  }

  function syncInstallButton(){
    const button=installButton();
    if(!button)return;
    const show=!isStandalone()&&(!!deferredInstall||isIos());
    button.hidden=!show;
  }

  function closeInstallHelp(){
    document.getElementById("pwaInstallHelp")?.remove();
  }

  function showIosInstallHelp(){
    closeInstallHelp();
    const tip=document.createElement("div");
    tip.id="pwaInstallHelp";
    tip.className="pwa-install-help";
    tip.setAttribute("role","dialog");
    tip.setAttribute("aria-label","Install Farsi 2000");
    tip.innerHTML='<strong>Install on iPhone or iPad</strong><span>Tap Share, then choose <b>Add to Home Screen</b>.</span><button type="button" aria-label="Close install instructions">×</button>';
    tip.querySelector("button")?.addEventListener("click",closeInstallHelp);
    document.body.appendChild(tip);
  }

  async function requestInstall(){
    if(deferredInstall){
      const prompt=deferredInstall;
      deferredInstall=null;
      await prompt.prompt();
      try{await prompt.userChoice}catch{}
      syncInstallButton();
      return;
    }
    if(isIos())showIosInstallHelp();
  }

  window.addEventListener("beforeinstallprompt",event=>{
    event.preventDefault();
    deferredInstall=event;
    syncInstallButton();
  });

  window.addEventListener("appinstalled",()=>{
    deferredInstall=null;
    closeInstallHelp();
    syncInstallButton();
  });

  window.addEventListener("load",async()=>{
    installButton()?.addEventListener("click",requestInstall);
    syncInstallButton();

    if(!("serviceWorker" in navigator))return;
    try{
      const registration=await navigator.serviceWorker.register("./sw.js",{scope:"./"});
      registration.update().catch(()=>{});
    }catch(error){
      console.warn("Farsi 2000 offline support could not start.",error);
    }
  },{once:true});

  matchMedia("(display-mode: standalone)").addEventListener?.("change",syncInstallButton);
})();
