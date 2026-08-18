window.FARSI_AUDIO=window.FARSI_AUDIO||{};

// Temporary fallback while the static MP3 library is being generated.
// Once the generated manifest lands, the app's local MP3 player takes priority.
window.addEventListener("load",()=>{
  const btn=document.getElementById("speak");
  if(!btn)return;
  const originalClick=btn.onclick;
  const remote=new Audio();
  remote.preload="none";

  function playRemote(){
    const fa=(document.getElementById("fa")?.textContent||"").trim();
    if(!fa)return;
    const local=(window.FARSI_AUDIO||{})[fa];
    if(local&&originalClick){originalClick({stopPropagation(){}});return;}
    remote.pause();
    remote.src="https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=fa&ttsspeed=0.7&q="+encodeURIComponent(fa);
    btn.classList.add("playing");
    remote.onended=()=>btn.classList.remove("playing");
    remote.onerror=()=>{btn.classList.remove("playing");if(originalClick)originalClick({stopPropagation(){}})};
    remote.play().catch(()=>{btn.classList.remove("playing");if(originalClick)originalClick({stopPropagation(){}})});
  }

  btn.onclick=e=>{e.stopPropagation();playRemote()};
  document.addEventListener("keydown",e=>{
    if(e.key?.toLowerCase()==="a"&&!e.metaKey&&!e.ctrlKey&&!e.altKey){
      e.preventDefault();
      e.stopImmediatePropagation();
      playRemote();
    }
  },true);
});
