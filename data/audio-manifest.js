window.FARSI_AUDIO={"سلام":"audio/natural/fa65ac7860c0f271.mp3","خداحافظ":"audio/natural/bfa6a2ab2b6b8df8.mp3","بله":"audio/natural/afcb410b5cc2d1a7.mp3","آره":"audio/natural/4748e5e7f6733fab.mp3","نَه":"audio/natural/f27de78c5a48f4ec.mp3","لطفا":"audio/natural/0a17d07a11aabdd3.mp3","ممنون":"audio/natural/c07c033787a9872e.mp3","مرسی":"audio/natural/c674dff244eeb4f3.mp3","ببخشید":"audio/natural/4d42eaeea102a52e.mp3","خوب":"audio/natural/b3188f4c34dee1b8.mp3","بد":"audio/natural/90926820c0776e29.mp3","باشه":"audio/natural/626cc599b2bc40e9.mp3","من":"audio/natural/aa7099e27834277a.mp3","تو":"audio/natural/51f03b86a43ffab2.mp3","شما":"audio/natural/06b7a1b1dd34bc0b.mp3","او":"audio/natural/c8ac1215959d2555.mp3","ما":"audio/natural/a62caa1e09674f71.mp3","آنها":"audio/natural/6ee9ee4e1491220a.mp3","این":"audio/natural/3b9e49d3a61f3248.mp3","آن":"audio/natural/4e10cfbf239fa6d5.mp3","چه":"audio/natural/23f3070fb2224a33.mp3","کی":"audio/natural/eefe45e75eeb2c7e.mp3","کجا":"audio/natural/79c16fb6302aa9c7.mp3","چرا":"audio/natural/6cf23ea62e565601.mp3","چطور":"audio/natural/808a4cd8938a7553.mp3","چند":"audio/natural/c2b608329ec68403.mp3","کدام":"audio/natural/b8cb3fcb4a28b3c7.mp3","اینجا":"audio/natural/c8a42200720ac1ec.mp3","آنجا":"audio/natural/c872c1696034fecb.mp3","الان":"audio/natural/e0c067ccea9c8444.mp3"};
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
