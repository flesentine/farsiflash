window.FARSI_AUDIO=window.FARSI_AUDIO||{};

// Self-contained audio for the first 24 beginner cards. Each small OGG is served
// directly by GitHub Pages, so playback does not depend on a system Persian voice.
window.FARSI_AUDIO_CLIPS={
  "سلام":["audio/beginner-01.ogg",0.000,1.179],
  "خداحافظ":["audio/beginner-01.ogg",1.379,2.891],
  "بله":["audio/beginner-01.ogg",3.091,4.087],
  "آره":["audio/beginner-01.ogg",4.287,5.307],

  "نَه":["audio/beginner-02.ogg",0.000,0.872],
  "لطفا":["audio/beginner-02.ogg",1.072,2.193],
  "ممنون":["audio/beginner-02.ogg",2.393,3.542],
  "مرسی":["audio/beginner-02.ogg",3.742,4.870],

  "ببخشید":["audio/beginner-03.ogg",0.000,1.388],
  "خوب":["audio/beginner-03.ogg",1.588,2.677],
  "بد":["audio/beginner-03.ogg",2.877,3.762],
  "باشه":["audio/beginner-03.ogg",3.962,5.067],

  "من":["audio/beginner-04.ogg",0.000,0.948],
  "تو":["audio/beginner-04.ogg",1.148,1.999],
  "شما":["audio/beginner-04.ogg",2.199,3.220],
  "او":["audio/beginner-04.ogg",3.420,4.340],

  "ما":["audio/beginner-05.ogg",0.000,0.924],
  "آنها":["audio/beginner-05.ogg",1.124,2.176],
  "این":["audio/beginner-05.ogg",2.376,3.365],
  "آن":["audio/beginner-05.ogg",3.565,4.453],

  "چه":["audio/beginner-06.ogg",0.000,0.999],
  "کی":["audio/beginner-06.ogg",1.199,2.113],
  "کجا":["audio/beginner-06.ogg",2.313,3.382],
  "چرا":["audio/beginner-06.ogg",3.582,4.657]
};

window.addEventListener("load",()=>{
  const btn=document.getElementById("speak");
  if(!btn)return;
  const originalClick=btn.onclick;
  const players={};
  let current=null,stopTimer=null;

  const style=document.createElement("style");
  style.textContent=`
    .speak.bundled::after{content:"";position:absolute;width:7px;height:7px;border-radius:50%;right:1px;bottom:1px;background:#5d8065;border:2px solid #fff}
    .audio-test{font-weight:600}
    @media(prefers-color-scheme:dark){.speak.bundled::after{border-color:#2b2b27}}
  `;
  document.head.appendChild(style);

  function finish(){
    if(stopTimer){clearTimeout(stopTimer);stopTimer=null}
    btn.classList.remove("playing");
  }
  function getPlayer(src){return players[src]||(players[src]=new Audio(src))}
  function playClip(clip,onDone,onFail){
    if(!clip)return false;
    const [src,start,end]=clip;
    finish();
    if(current)current.pause();
    const a=getPlayer(src);
    current=a;
    a.pause();
    try{a.currentTime=start}catch{}
    btn.classList.add("playing");
    a.play().then(()=>{
      stopTimer=setTimeout(()=>{a.pause();finish();onDone?.()},Math.max(120,(end-start)*1000+80));
    }).catch(()=>{finish();onFail?.()});
    return true;
  }
  function currentFa(){return (document.getElementById("fa")?.textContent||"").trim()}
  function updateCoverage(){
    const has=!!window.FARSI_AUDIO_CLIPS[currentFa()];
    btn.classList.toggle("bundled",has);
    btn.title=has?"Hear bundled Persian audio (A)":"Audio for this card is not bundled yet (A)";
  }
  function play(){
    const fa=currentFa();
    if(!fa)return;
    const clip=window.FARSI_AUDIO_CLIPS[fa];
    if(clip){playClip(clip,null,()=>{if(originalClick)originalClick({stopPropagation(){}})});return}
    if(originalClick)originalClick({stopPropagation(){}});
  }

  const header=document.querySelector(".header-actions");
  if(header){
    const test=document.createElement("button");
    test.className="tiny audio-test";
    test.type="button";
    test.textContent="test audio";
    test.title="Play bundled سلام audio";
    test.onclick=e=>{
      e.stopPropagation();
      test.textContent="playing…";
      playClip(window.FARSI_AUDIO_CLIPS["سلام"],()=>{test.textContent="test audio"},()=>{
        test.textContent="audio failed";
        setTimeout(()=>test.textContent="test audio",2200);
      });
    };
    header.prepend(test);
  }

  btn.onclick=e=>{e.stopPropagation();play()};
  document.addEventListener("keydown",e=>{
    if(e.key?.toLowerCase()==="a"&&!e.metaKey&&!e.ctrlKey&&!e.altKey){
      e.preventDefault();
      e.stopImmediatePropagation();
      play();
    }
  },true);

  const faNode=document.getElementById("fa");
  if(faNode)new MutationObserver(updateCoverage).observe(faNode,{childList:true,characterData:true,subtree:true});
  updateCoverage();
});
