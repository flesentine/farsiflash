// Autoplay/replay controls for Persian pronunciation.
// Loaded into audio-manifest.js by the natural-audio workflow so future audio builds preserve it.
(()=>{
  const PREF="farsi2000-autoplay";
  let enabled=localStorage.getItem(PREF)!=="0";
  const player=new Audio();
  player.preload="auto";
  let lastFa="";

  function currentFa(){return (document.getElementById("fa")?.textContent||"").trim()}
  function stop(){player.pause();try{player.currentTime=0}catch{}}
  function playCurrent(force=false){
    const fa=currentFa(),src=(window.FARSI_AUDIO||{})[fa];
    if(!enabled||!fa||!src)return;
    if(!force&&fa===lastFa)return;
    lastFa=fa;
    stop();
    player.src=src;
    player.play().catch(()=>{});
  }
  function sync(btn){
    btn.textContent=enabled?"🔊":"🔇";
    btn.title=enabled?"Automatic pronunciation on":"Automatic pronunciation off";
    btn.setAttribute("aria-label",enabled?"Mute automatic pronunciation":"Turn on automatic pronunciation");
    btn.setAttribute("aria-pressed",enabled?"true":"false");
  }

  window.addEventListener("load",()=>{
    const header=document.querySelector(".header-actions");
    if(!header)return;

    const btn=document.createElement("button");
    btn.className="tiny";
    btn.type="button";
    btn.id="autoAudio";
    btn.style.fontSize="16px";
    btn.style.lineHeight="1";
    sync(btn);

    const fullscreen=document.getElementById("fullscreen");
    if(fullscreen)fullscreen.insertAdjacentElement("afterend",btn);else header.prepend(btn);

    btn.onclick=e=>{
      e.stopPropagation();
      enabled=!enabled;
      localStorage.setItem(PREF,enabled?"1":"0");
      sync(btn);
      if(enabled){lastFa="";playCurrent(true)}else stop();
    };

    const faNode=document.getElementById("fa");
    if(faNode){
      new MutationObserver(()=>{
        lastFa="";
        setTimeout(()=>playCurrent(false),25);
      }).observe(faNode,{childList:true,characterData:true,subtree:true});
    }

    // Manual replay always wins over an autoplay clip already in progress.
    document.addEventListener("pointerdown",e=>{if(e.target.closest?.("#speak"))stop()},true);
    document.addEventListener("keydown",e=>{
      if(e.key?.toLowerCase()==="a"&&!e.metaKey&&!e.ctrlKey&&!e.altKey)stop();
    },true);

    // Browsers may block this very first attempt until the user interacts once;
    // later cards will autoplay normally after interaction.
    setTimeout(()=>{lastFa="";playCurrent(false)},100);
  });
})();
