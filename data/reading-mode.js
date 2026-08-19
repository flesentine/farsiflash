(()=>{
  const PREF="farsi2000-reading-mode";
  const STYLE_ID="readingModeStyles";
  let enabled=localStorage.getItem(PREF)==="1";

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      body.reading-mode .face:not(.back) .roman{display:none}
      body.reading-mode .face:not(.back) .farsi{margin-top:0;font-size:clamp(48px,12vw,78px);color:inherit}
      body.reading-mode #readingMode{background:#0000000b;font-weight:700}
      @media(prefers-color-scheme:dark){body.reading-mode #readingMode{background:#ffffff10}}
      :fullscreen body.reading-mode .face:not(.back) .farsi{font-size:clamp(64px,7vw,104px)}
    `;
    document.head.appendChild(style);
  }

  function sync(btn){
    document.body.classList.toggle("reading-mode",enabled);
    btn.textContent="abc";
    btn.title=enabled?"Phonetics hidden — show romanization":"Hide phonetic romanization";
    btn.setAttribute("aria-label",enabled?"Show phonetic romanization":"Hide phonetic romanization");
    btn.setAttribute("aria-pressed",enabled?"true":"false");
  }

  window.addEventListener("load",()=>{
    ensureStyle();
    const header=document.querySelector(".header-actions");
    if(!header)return;

    let btn=document.getElementById("readingMode");
    if(!btn){
      btn=document.createElement("button");
      btn.className="tiny";
      btn.type="button";
      btn.id="readingMode";
      btn.style.fontSize="13px";
      btn.style.letterSpacing=".03em";
      const reset=document.getElementById("reset");
      if(reset)reset.insertAdjacentElement("beforebegin",btn);
      else header.appendChild(btn);
    }

    sync(btn);
    btn.onclick=e=>{
      e.stopPropagation();
      enabled=!enabled;
      localStorage.setItem(PREF,enabled?"1":"0");
      sync(btn);
    };
  });
})();
