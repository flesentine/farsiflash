(()=>{
  const STYLE_ID="iranBackgroundStyles";
  const WRAP_ID="iranBackgrounds";
  const SPRITE="backgrounds/iran-sprite.webp?v=native-q30-1";
  const TILE_W=1672,TILE_H=941,COLS=4,COUNT=14;
  let current=-1,showA=true,changes=0,sprite=null,resizeTimer=0;

  function installStyles(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      body{background:#121210!important}
      #${WRAP_ID}{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none;background:#121210}
      #${WRAP_ID} .iran-bg-canvas{position:absolute;inset:-2%;width:104%;height:104%;opacity:0;transform:scale(1.01);transition:opacity .9s ease,transform 12s ease;will-change:opacity,transform}
      #${WRAP_ID} .iran-bg-canvas.show{opacity:1;transform:scale(1.045)}
      #${WRAP_ID} .iran-bg-scrim{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(8,8,7,.62),rgba(8,8,7,.35) 23%,rgba(8,8,7,.50) 72%,rgba(8,8,7,.70)),radial-gradient(circle at center,rgba(255,255,255,.03),transparent 52%)}
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
      @media(max-width:700px){#${WRAP_ID} .iran-bg-scrim{background:linear-gradient(to bottom,rgba(8,8,7,.69),rgba(8,8,7,.44) 23%,rgba(8,8,7,.58) 72%,rgba(8,8,7,.78))}.face{background:rgba(31,31,28,.82)!important}}
      @media(max-width:430px){#${WRAP_ID} .iran-bg-canvas{inset:-4%;width:108%;height:108%}.face{backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}}
      @media(prefers-reduced-motion:reduce){#${WRAP_ID} .iran-bg-canvas{transition:none!important;transform:none!important}}
    `;
    document.head.appendChild(style);
  }

  function installMarkup(){
    let wrap=document.getElementById(WRAP_ID);
    if(wrap)return wrap;
    wrap=document.createElement("div");
    wrap.id=WRAP_ID;
    wrap.setAttribute("aria-hidden","true");
    wrap.innerHTML='<canvas class="iran-bg-canvas a"></canvas><canvas class="iran-bg-canvas b"></canvas><div class="iran-bg-scrim"></div>';
    document.body.prepend(wrap);
    return wrap;
  }

  function nextIndex(){
    if(COUNT<2)return 0;
    let n=current;
    while(n===current)n=Math.floor(Math.random()*COUNT);
    current=n;
    return n;
  }

  function drawCover(canvas,index){
    if(!sprite||!sprite.complete||!sprite.naturalWidth||index<0)return;
    const rect=canvas.getBoundingClientRect();
    const cssW=Math.max(1,rect.width),cssH=Math.max(1,rect.height);
    const dpr=Math.min(window.devicePixelRatio||1,2);
    const w=Math.max(1,Math.round(cssW*dpr)),h=Math.max(1,Math.round(cssH*dpr));
    if(canvas.width!==w)canvas.width=w;
    if(canvas.height!==h)canvas.height=h;
    const ctx=canvas.getContext("2d",{alpha:false});
    if(!ctx)return;
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality="high";
    const col=index%COLS,row=Math.floor(index/COLS);
    const tileX=col*TILE_W,tileY=row*TILE_H;
    const targetRatio=w/h,tileRatio=TILE_W/TILE_H;
    let sx=tileX,sy=tileY,sw=TILE_W,sh=TILE_H;
    if(targetRatio>tileRatio){
      sh=TILE_W/targetRatio;
      sy=tileY+(TILE_H-sh)/2;
    }else{
      sw=TILE_H*targetRatio;
      sx=tileX+(TILE_W-sw)/2;
    }
    ctx.drawImage(sprite,sx,sy,sw,sh,0,0,w,h);
    canvas.dataset.index=String(index);
  }

  function redrawVisible(){
    const wrap=document.getElementById(WRAP_ID);if(!wrap)return;
    for(const c of wrap.querySelectorAll(".iran-bg-canvas")){
      const n=Number(c.dataset.index);
      if(Number.isFinite(n))drawCover(c,n);
    }
  }

  function rotate(){
    const wrap=document.getElementById(WRAP_ID);if(!wrap||!sprite||!sprite.complete||!sprite.naturalWidth)return;
    const a=wrap.querySelector(".a"),b=wrap.querySelector(".b");
    const incoming=showA?b:a,outgoing=showA?a:b;
    drawCover(incoming,nextIndex());
    requestAnimationFrame(()=>{
      incoming.classList.add("show");
      outgoing.classList.remove("show");
    });
    showA=!showA;
  }

  function watchCards(attempt=0){
    const fa=document.getElementById("fa");
    if(!fa){if(attempt<24)setTimeout(()=>watchCards(attempt+1),250);return}
    new MutationObserver(()=>{changes++;if(changes%7===0)rotate()})
      .observe(fa,{childList:true,characterData:true,subtree:true});
  }

  function init(){
    installStyles();installMarkup();
    sprite=new Image();
    sprite.decoding="async";
    sprite.onload=()=>{rotate();redrawVisible()};
    sprite.onerror=()=>console.error("Iranian background artwork failed to load",SPRITE);
    sprite.src=SPRITE;
    watchCards();
    window.addEventListener("resize",()=>{
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(redrawVisible,90);
    },{passive:true});
  }

  if(document.readyState==="complete")init();
  else window.addEventListener("load",init,{once:true});
})();
