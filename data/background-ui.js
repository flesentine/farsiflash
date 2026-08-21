(()=>{
  const STYLE_ID="iranBackgroundStyles";
  const WRAP_ID="iranBackgrounds";
  const BACKGROUNDS=[
    "asset-staging/q8-iran-01.b64?v=hq1280-4",
    "backgrounds-b64/iran-02.b64?v=hq1280-4",
    "backgrounds-b64/iran-07.b64?v=hq1280-4",
    "backgrounds-b64/iran-12.b64?v=hq1280-4",
    "backgrounds-b64/iran-13.b64?v=hq1280-4",
    "backgrounds-b64/iran-14.b64?v=hq1280-4"
  ];
  let current=-1,showA=true,changes=0;
  const cache=new Map();

  function installStyles(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      body{background:#121210!important}
      #${WRAP_ID}{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none;background:#121210}
      #${WRAP_ID} .iran-bg-layer{position:absolute;inset:-2%;background-position:center;background-size:cover;background-repeat:no-repeat;opacity:0;transform:scale(1.01);transition:opacity .9s ease,transform 12s ease;will-change:opacity,transform}
      #${WRAP_ID} .iran-bg-layer.show{opacity:1;transform:scale(1.045)}
      #${WRAP_ID} .iran-bg-scrim{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(8,8,7,.62),rgba(8,8,7,.36) 23%,rgba(8,8,7,.52) 72%,rgba(8,8,7,.72)),radial-gradient(circle at center,rgba(255,255,255,.03),transparent 52%)}
      .app{position:relative;z-index:1}
      header,.grade,.undo,.tiny{color:#ede6da!important;text-shadow:0 1px 3px rgba(0,0,0,.38)}
      .tiny,.grade,.undo{background:rgba(18,18,16,.18);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}
      .face{background:rgba(31,31,28,.76)!important;border-color:rgba(255,255,255,.10)!important;box-shadow:0 20px 70px rgba(0,0,0,.35),0 1px 2px rgba(0,0,0,.30)!important;backdrop-filter:blur(15px);-webkit-backdrop-filter:blur(15px)}
      .roman,.english{color:#fbf7f1!important;text-shadow:0 2px 18px rgba(0,0,0,.24)}
      .farsi{color:#efe5d9!important;text-shadow:0 2px 18px rgba(0,0,0,.24)}
      .mini,.hint{color:#d6cfc3!important}
      .speak{color:#f6f2ea!important;background:rgba(20,20,18,.46)!important;border-color:rgba(255,255,255,.15)!important;box-shadow:0 4px 18px rgba(0,0,0,.24)!important;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
      .sw{background:rgba(16,16,14,.66)!important;border:1px solid rgba(255,255,255,.10)}
      @media(hover:hover){.grade:hover,.undo.show:hover,.speak:hover,.tiny:hover{background:rgba(255,255,255,.11)!important}}
      @media(max-width:700px){#${WRAP_ID} .iran-bg-scrim{background:linear-gradient(to bottom,rgba(8,8,7,.70),rgba(8,8,7,.46) 23%,rgba(8,8,7,.60) 72%,rgba(8,8,7,.80))}.face{background:rgba(31,31,28,.82)!important}}
      @media(max-width:430px){#${WRAP_ID} .iran-bg-layer{inset:-4%}.face{backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}}
      @media(prefers-reduced-motion:reduce){#${WRAP_ID} .iran-bg-layer{transition:none!important;transform:none!important}}
    `;
    document.head.appendChild(style);
  }

  function installMarkup(){
    let wrap=document.getElementById(WRAP_ID);
    if(wrap)return wrap;
    wrap=document.createElement("div");
    wrap.id=WRAP_ID;
    wrap.setAttribute("aria-hidden","true");
    wrap.innerHTML='<div class="iran-bg-layer a"></div><div class="iran-bg-layer b"></div><div class="iran-bg-scrim"></div>';
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

  async function getDataUrl(src){
    if(cache.has(src))return cache.get(src);
    const raw=(await fetch(src,{cache:"force-cache"}).then(r=>{if(!r.ok)throw new Error(`${r.status} ${src}`);return r.text()})).trim();
    const url=`data:image/webp;base64,${raw}`;
    cache.set(src,url);
    return url;
  }

  async function rotate(){
    const wrap=document.getElementById(WRAP_ID);if(!wrap)return;
    const a=wrap.querySelector(".a"),b=wrap.querySelector(".b");
    const incoming=showA?b:a,outgoing=showA?a:b;
    const index=nextIndex(),src=BACKGROUNDS[index];
    try{
      const dataUrl=await getDataUrl(src);
      const img=new Image();img.decoding="async";img.src=dataUrl;
      if(img.decode)try{await img.decode()}catch{}
      incoming.style.backgroundImage=`url("${dataUrl}")`;
      requestAnimationFrame(()=>{
        incoming.classList.add("show");
        outgoing.classList.remove("show");
      });
      showA=!showA;
      getDataUrl(BACKGROUNDS[(index+1)%BACKGROUNDS.length]).catch(()=>{});
    }catch(err){console.error("Iranian background failed to load",err)}
  }

  function watchCards(attempt=0){
    const fa=document.getElementById("fa");
    if(!fa){if(attempt<24)setTimeout(()=>watchCards(attempt+1),250);return}
    new MutationObserver(()=>{changes++;if(changes%7===0)rotate()})
      .observe(fa,{childList:true,characterData:true,subtree:true});
  }

  function init(){installStyles();installMarkup();rotate();watchCards()}
  if(document.readyState==="complete")init();
  else window.addEventListener("load",init,{once:true});
})();
