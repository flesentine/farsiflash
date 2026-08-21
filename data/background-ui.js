(()=>{
  if(window.__farsiGeneratedBackgroundsV8)return;
  window.__farsiGeneratedBackgroundsV8=true;

  const STYLE_ID="iranGeneratedBackgroundStylesV8";
  const WRAP_ID="iranGeneratedBackgroundsV8";
  const VERSION="gen10-sharp2";
  const BACKGROUNDS=Array.from({length:10},(_,i)=>
    `backgrounds/generated/iran-gen-${String(i+1).padStart(2,"0")}.avif?v=${VERSION}`
  );
  let current=-1,showA=true,changes=0,rotationToken=0,first=true;

  function installStyles(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      #iranBackgrounds,#iranPhotoBackgroundsV4,#iranRecoveredBackgroundsV5,#iranGeneratedBackgroundsV6,#iranGeneratedBackgroundsV7{display:none!important}
      body{background:#11110f!important;background-image:none!important}
      #${WRAP_ID}{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none;background:#11110f url("${BACKGROUNDS[0]}") center/cover no-repeat}
      #${WRAP_ID} .iran-generated-bg{position:absolute;inset:0;width:100%;height:100%;background-position:center;background-size:cover;background-repeat:no-repeat;opacity:0;transform:none;transition:opacity .9s ease;will-change:opacity}
      #${WRAP_ID} .iran-generated-bg.show{opacity:1;transform:none}
      #${WRAP_ID} .iran-generated-scrim{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(7,8,9,.25),rgba(7,8,9,.12) 27%,rgba(7,8,9,.20) 72%,rgba(7,8,9,.38)),radial-gradient(circle at center,transparent 20%,rgba(7,8,9,.12) 72%,rgba(7,8,9,.24))}
      .app{position:relative!important;z-index:1!important;background:transparent!important}
      header,.grade,.undo,.tiny{color:#f6f0e8!important;text-shadow:0 1px 5px rgba(0,0,0,.72)}
      .tiny,.grade,.undo{background:rgba(13,13,12,.20)!important;backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px)}
      .face{background:rgba(25,25,22,.72)!important;border-color:rgba(255,255,255,.15)!important;box-shadow:0 22px 70px rgba(0,0,0,.43),0 1px 2px rgba(0,0,0,.36)!important;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
      .roman,.english{color:#fffaf3!important;text-shadow:0 2px 18px rgba(0,0,0,.34)}
      .farsi{color:#f4e9dc!important;text-shadow:0 2px 18px rgba(0,0,0,.34)}
      .mini,.hint{color:#e2d9ce!important}
      .speak{color:#faf5ed!important;background:rgba(16,16,14,.48)!important;border-color:rgba(255,255,255,.18)!important;box-shadow:0 4px 18px rgba(0,0,0,.28)!important;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
      .sw{background:rgba(14,14,12,.66)!important;border:1px solid rgba(255,255,255,.12)}
      @media(hover:hover){.grade:hover,.undo.show:hover,.speak:hover,.tiny:hover{background:rgba(255,255,255,.13)!important}}
      @media(max-width:700px){#${WRAP_ID} .iran-generated-scrim{background:linear-gradient(to bottom,rgba(7,8,9,.34),rgba(7,8,9,.17) 27%,rgba(7,8,9,.27) 72%,rgba(7,8,9,.46))}.face{background:rgba(25,25,22,.79)!important}}
      @media(prefers-reduced-motion:reduce){#${WRAP_ID} .iran-generated-bg{transition:none!important}}
    `;
    document.head.appendChild(style);
  }

  function installMarkup(){
    let wrap=document.getElementById(WRAP_ID);
    if(wrap)return wrap;
    wrap=document.createElement("div");
    wrap.id=WRAP_ID;
    wrap.setAttribute("aria-hidden","true");
    wrap.innerHTML='<div class="iran-generated-bg a"></div><div class="iran-generated-bg b"></div><div class="iran-generated-scrim"></div>';
    document.body.prepend(wrap);
    return wrap;
  }

  function nextIndex(){
    if(first){first=false;current=0;return 0}
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
      console.error("Generated Iranian background failed to load",src);
      if(token===rotationToken)setTimeout(rotate,1200);
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
