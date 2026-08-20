(()=>{
  // Temporary safety lock: the current natural-audio set was generated with
  // an English/American premade voice. Keep the files for replacement/audit,
  // but do not play them in the learning UI until a native Persian voice is approved.
  window.FARSI_AUDIO_QUARANTINED=true;

  const originalPlay=HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play=function(...args){
    const src=String(this.currentSrc||this.src||"");
    if(window.FARSI_AUDIO_QUARANTINED&&/\/audio\/natural\//.test(src)){
      return Promise.reject(new DOMException("Persian audio is temporarily quarantined for pronunciation quality review","NotAllowedError"));
    }
    return originalPlay.apply(this,args);
  };

  const style=document.createElement("style");
  style.id="audioQualityLockStyles";
  style.textContent=`
    body.audio-quality-lock .speak{display:none!important}
    body.audio-quality-lock #autoAudio{display:none!important}
  `;
  document.head.appendChild(style);

  document.addEventListener("keydown",e=>{
    if(window.FARSI_AUDIO_QUARANTINED&&e.key?.toLowerCase()==="a"&&!e.metaKey&&!e.ctrlKey&&!e.altKey){
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  },true);

  window.addEventListener("load",()=>{
    document.body.classList.add("audio-quality-lock");
    localStorage.setItem("farsi2000-autoplay","0");
  });
})();
