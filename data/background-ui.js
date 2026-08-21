(()=>{
  if(window.__farsiRecoveredBackgroundsV5)return;
  window.__farsiRecoveredBackgroundsV5=true;

  const STYLE_ID="iranRecoveredBackgroundStylesV5";
  const WRAP_ID="iranRecoveredBackgroundsV5";
  const BACKGROUNDS=[
    "backgrounds/iran-01.webp?v=5302b519",
    "backgrounds/iran-07.webp?v=5302b519",
    "backgrounds/iran-13.webp?v=5302b519",
    "backgrounds/iran-14.webp?v=5302b519"
  ];
  let current=-1,showA=true,changes=0,rotationToken=0;

  function installStyles(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      /* Retire every corrupt sprite-based background implementation. */
      #iranBackgrounds,#iranPhotoBackgroundsV4{display:none!important}
      body{background:#121210!important;background-image:none!important}
      #${WRAP_ID}{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none;background:#121210}
      #${WRAP_ID} .iran-recovered-bg{position:absolute;inset:-2%;width:104%;height:104%;background-position:center;background-size:cover;background-repeat:no-repeat;opacity:0;transform:scale(1.01);transition:opacity .85s ease,transform 14s ease;will-change:opacity,transform}
      #${WRAP_ID} .iran-recovered-bg.show{opacity:1;transform:scale(1.045)}
      #${WRAP_ID} .iran-recovered-scrim{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(8,8,7,.40),rgba(8,8,7,.20) 24%,rgba(8,8,7,.31) 72%,rgba(8,8,7,.50)),radial-gradient(circle at center,rgba(255,255,255,.025),transparent 58%)}
      .app{position:relative!important;z-index:1!important;background:transparent!important}
      header,.grade,.undo,.tiny{color:#f1ebe2!important;text-shadow:0 1px 4px rgba(0,0,0,.58)}
      .tiny,.grade,.undo{background:rgba(15,15,13,.15)!important;backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px)}
      .face{background:rgba(27,27,24,.72)!important;border-color:rgba(255,255,255,.13)!important;box-shadow:0 22px 70px rgba(0,0,0,.42),0 1px 2px rgba(0,0,0,.34)!important;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
      .roman,.english{color:#fffaf3!important;text-shadow:0 2px 18px rgba(0,0,0,.30)}
      .farsi{color:#f3e8dc!important;text-shadow:0 2px 18px rgba(0,0,0,.30)}
      .mini,.hint{color:#ded5c9!important}
      .speak{color:#f8f3ea!important;background:rgba(18,18,16,.46)!important;border-color:rgba(255,255,255,.16)!important;box-shadow:0 4px 18px rgba(0,0,0,.27)!important;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
      .sw{background:rgba(15,15,13,.68)!important;border:1px solid rgba(255,255,255,.11)}
      @media(hover:hover){.grade:hover,.undo.show:hover,.speak:hover,.tiny:hover{background:rgba(255,255,255,.11)!important}}
      @media(max-width:700px){#${WRAP_ID} .iran-recovered-scrim{background:linear-gradient(to bottom,rgba(8,8,7,.48),rgba(8,8,7,.25) 24%,rgba(8,8,7,.39) 72%,rgba(8,8,7,.58))}.face{background:rgba(27,27,24,.79)!important}}
      @media(prefers-reduced-motion:reduce){#${WRAP_ID} .iran-recovered-bg{transition:none!important;transform:none!important}}
    `;
    document.head.appendChild(style);
  }

  function installMarkup(){
    let wrap=document.getElementById(WRAP_ID);
    if(wrap)return wrap;
    wrap=document.createElement("div");
    wrap.id=WRAP_ID;
    wrap.setAttribute("aria-hidden","true");
    wrap.innerHTML='<div class="iran-recovered-bg a"></div><div class="iran-recovered-bg b"></div><div class="iran-recovered-scrim"></div>';
    document.body.prepend(wrap);
    return wrap;
  }

  function nextIndex(){
    if(BACKGROUNDS.length<2)return 0;
    let n=current;
    while(n===current)n=Math.floor(Math.random()*BACKGROUNDS.length);
    current=n;
    return n;
  }

  function rotate(){
    const wrap=document.getElementById(WRAP_ID);if(!wrap)return;
    const a=wrap.querySelector(".a"),b=wrap.querySelector(".b");
    const incoming=showA?b:a,outgoing=showA?a:b;
    const src=BACKGROUNDS[nextIndex()];
    const token=++rotationToken;
    const img=new Image();
    img.decoding="async";
    img.onload=()=>{
      if(token!==rotationToken)return;
      incoming.style.backgroundImage=`url("${src}")`;
      requestAnimationFrame(()=>{
        incoming.classList.add("show");
        outgoing.classList.remove("show");
      });
      showA=!showA;
    };
    img.onerror=()=>{
      console.error("Recovered Iranian background failed to load",src);
      setTimeout(rotate,1200);
    };
    img.src=src;
  }

  function watchCards(attempt=0){
    const fa=document.getElementById("fa");
    if(!fa){if(attempt<32)setTimeout(()=>watchCards(attempt+1),250);return}
    new MutationObserver(()=>{changes++;if(changes%6===0)rotate()})
      .observe(fa,{childList:true,characterData:true,subtree:true});
  }

  function init(){
    installStyles();
    installMarkup();
    BACKGROUNDS.forEach(src=>{const p=new Image();p.decoding="async";p.src=src});
    rotate();
    watchCards();
    setInterval(rotate,30000);
  }

  if(document.readyState==="complete")init();
  else window.addEventListener("load",init,{once:true});
})();
