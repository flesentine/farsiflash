window.FARSI_AUDIO=window.FARSI_AUDIO||{};

// Bundled audio sprite for the first 24 beginner cards. This plays from GitHub Pages
// and does not depend on browser speech voices or a third-party TTS request.
window.FARSI_AUDIO_SPRITE={
  src:"audio/beginner-01.ogg",
  clips:{
    "سلام":[0.0,1.179],"خداحافظ":[1.399,2.911],"بله":[3.131,4.127],"آره":[4.347,5.367],"نَه":[5.587,6.459],
    "لطفا":[6.679,7.8],"ممنون":[8.02,9.169],"مرسی":[9.389,10.516],"ببخشید":[10.736,12.124],"خوب":[12.344,13.433],
    "بد":[13.653,14.538],"باشه":[14.758,15.863],"من":[16.083,17.031],"تو":[17.251,18.102],"شما":[18.322,19.343],
    "او":[19.563,20.483],"ما":[20.703,21.628],"آنها":[21.848,22.899],"این":[23.119,24.108],"آن":[24.328,25.216],
    "چه":[25.436,26.435],"کی":[26.655,27.568],"کجا":[27.788,28.858],"چرا":[29.078,30.153]
  }
};

window.addEventListener("load",()=>{
  const btn=document.getElementById("speak");
  if(!btn)return;
  const originalClick=btn.onclick;
  const sprite=new Audio(window.FARSI_AUDIO_SPRITE.src);
  sprite.preload="auto";
  let stopTimer=null;

  function finish(){if(stopTimer){clearTimeout(stopTimer);stopTimer=null}btn.classList.remove("playing")}
  function playSprite(fa){
    const clip=window.FARSI_AUDIO_SPRITE.clips[fa];
    if(!clip)return false;
    finish();sprite.pause();sprite.currentTime=clip[0];btn.classList.add("playing");
    sprite.play().then(()=>{stopTimer=setTimeout(()=>{sprite.pause();finish()},Math.max(120,(clip[1]-clip[0])*1000+60))}).catch(()=>{finish();if(originalClick)originalClick({stopPropagation(){}})});
    return true;
  }
  function play(){
    const fa=(document.getElementById("fa")?.textContent||"").trim();
    if(!fa)return;
    if(playSprite(fa))return;
    if(originalClick)originalClick({stopPropagation(){}});
  }
  btn.onclick=e=>{e.stopPropagation();play()};
  document.addEventListener("keydown",e=>{if(e.key?.toLowerCase()==="a"&&!e.metaKey&&!e.ctrlKey&&!e.altKey){e.preventDefault();e.stopImmediatePropagation();play()}},true);
});
