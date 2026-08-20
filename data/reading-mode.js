(()=>{
  const DIR_PREF="farsi2000-direction";
  const PHON_PREF="farsi2000-hide-phonetics";
  const OLD_PREF="farsi2000-reading-mode";
  const STYLE_ID="studyModeStyles";

  let direction=localStorage.getItem(DIR_PREF)==="en"?"en":"fa";
  let hidePhonetics=localStorage.getItem(PHON_PREF)==="1";
  if(localStorage.getItem(PHON_PREF)===null&&localStorage.getItem(OLD_PREF)==="1"){
    hidePhonetics=true;
    localStorage.setItem(PHON_PREF,"1");
  }

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      body.hide-phonetics .face:not(.back) .roman,
      body.hide-phonetics .back #mr{display:none}
      body.hide-phonetics .face:not(.back) .farsi{margin-top:0;font-size:clamp(48px,12vw,78px);color:inherit}
      body.english-first .back .mini{display:none}
      #directionMode,#phoneticsMode{font-variant-numeric:tabular-nums;white-space:nowrap}
      body.hide-phonetics #phoneticsMode{text-decoration:line-through;background:#0000000b;font-weight:700}
      body.farsi-first #directionMode{background:#0000000b;font-weight:700}
      @media(prefers-color-scheme:dark){
        body.hide-phonetics #phoneticsMode,body.farsi-first #directionMode{background:#ffffff10}
      }
      :fullscreen body.hide-phonetics .face:not(.back) .farsi{font-size:clamp(64px,7vw,104px)}
    `;
    document.head.appendChild(style);
  }

  function applyStartSide(){
    if(!E?.card||!Q?.length)return;
    flip=direction==="en";
    E.card.classList.toggle("flip",flip);
    E.card.style.transform="";
  }

  function syncDirection(btn){
    const farsiFirst=direction==="fa";
    document.body.classList.toggle("farsi-first",farsiFirst);
    document.body.classList.toggle("english-first",!farsiFirst);
    btn.textContent=farsiFirst?"FA→EN":"EN→FA";
    btn.title=farsiFirst
      ?"Farsi first: Persian + phonetics, then English"
      :"English first: English, then Persian + phonetics";
    btn.setAttribute("aria-label",farsiFirst
      ?"Switch to English-first cards"
      :"Switch to Farsi-first cards");
    btn.setAttribute("aria-pressed",farsiFirst?"true":"false");
  }

  function syncPhonetics(btn){
    document.body.classList.toggle("hide-phonetics",hidePhonetics);
    btn.textContent="abc";
    btn.title=hidePhonetics?"Phonetics hidden — show romanization":"Phonetics shown — hide romanization";
    btn.setAttribute("aria-label",hidePhonetics?"Show phonetic romanization":"Hide phonetic romanization");
    btn.setAttribute("aria-pressed",hidePhonetics?"true":"false");
  }

  window.addEventListener("load",()=>{
    ensureStyle();
    const header=document.querySelector(".header-actions");
    if(!header)return;

    let directionBtn=document.getElementById("directionMode");
    if(!directionBtn){
      directionBtn=document.createElement("button");
      directionBtn.className="tiny";
      directionBtn.type="button";
      directionBtn.id="directionMode";
      directionBtn.style.fontSize="12px";
      const reset=document.getElementById("reset");
      if(reset)reset.insertAdjacentElement("beforebegin",directionBtn);
      else header.appendChild(directionBtn);
    }

    let phoneticsBtn=document.getElementById("phoneticsMode");
    if(!phoneticsBtn){
      phoneticsBtn=document.createElement("button");
      phoneticsBtn.className="tiny";
      phoneticsBtn.type="button";
      phoneticsBtn.id="phoneticsMode";
      phoneticsBtn.style.fontSize="12px";
      directionBtn.insertAdjacentElement("afterend",phoneticsBtn);
    }

    const baseRender=render;
    render=function(){
      baseRender();
      applyStartSide();
    };

    syncDirection(directionBtn);
    syncPhonetics(phoneticsBtn);
    applyStartSide();

    directionBtn.onclick=e=>{
      e.stopPropagation();
      direction=direction==="fa"?"en":"fa";
      localStorage.setItem(DIR_PREF,direction);
      syncDirection(directionBtn);
      if(typeof window.FARSI_DIRECTION_CHANGED==="function")window.FARSI_DIRECTION_CHANGED(direction);
      else render();
    };

    phoneticsBtn.onclick=e=>{
      e.stopPropagation();
      hidePhonetics=!hidePhonetics;
      localStorage.setItem(PHON_PREF,hidePhonetics?"1":"0");
      syncPhonetics(phoneticsBtn);
    };
  });
})();
