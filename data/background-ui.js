(()=>{
  const STYLE_ID="iranPhotoBackgroundStylesV4";
  const WRAP_ID="iranPhotoBackgroundsV4";
  const SPRITE="backgrounds/iran-sprite.webp?v=css-tiles-4";
  const COLS=4,ROWS=4,COUNT=14;
  let current=-1,showA=true,changes=0;

  function installStyles(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      /* Disable every older canvas-based background implementation. */
      #iranBackgrounds{display:none!important}
      body{background:#121210!important;background-image:none!important}
      #${WRAP_ID}{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none;background:#121210}
      #${WRAP_ID} .iran-photo-bg{position:absolute;inset:-1%;width:102%;height:102%;background-image:url("${SPRITE}");background-repeat:no-repeat;background-size:400% 400%;opacity:0;transform:scale(1.01);transition:opacity .8s ease,transform 14s ease;will-change:opacity,transform;background-color:#121210}
      #${WRAP_ID} .iran-photo-bg.show{opacity:1;transform:scale(1.045)}
      #${WRAP_ID} .iran-photo-scrim{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(8,8,7,.48),rgba(8,8,7,.24) 24%,rgba(8,8,7,.38) 72%,rgba(8,8,7,.58)),radial-gradient(circle at center,rgba(255,255,255,.025),transparent 58%)}
      .app{position:relative!important;z-index:1!important;background:transparent!important}
      header,.grade,.undo,.tiny{color:#f1ebe2!important;text-shadow:0 1px 4px rgba(0,0,0,.55)}
      .tiny,.grade,.undo{background:rgba(15,15,13,.16)!important;backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px)}
      .face{background:rgba(27,27,24,.74)!important;border-color:rgba(255,255,255,.13)!important;box-shadow:0 22px 70px rgba(0,0,0,.42),0 1px 2px rgba(0,0,0,.34)!important;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
      .roman,.english{color:#fffaf3!important;text-shadow:0 2px 18px rgba(0,0,0,.28)}
      .farsi{color:#f3e8dc!important;text-shadow:0 2px 18px rgba(0,0,0,.28)}
      .mini,.hint{color:#ded5c9!important}
      .speak{color:#f8f3ea!important;background:rgba(18,18,16,.48)!important;border-color:rgba(255,255,255,.16)!important;box-shadow:0 4px 18px rgba(0,0,0,.27)!important;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
      .sw{background:rgba(15,15,13,.68)!important;border:1px solid rgba(255,255,255,.11)}
      @media(hover:hover){.grade:hover,.undo.show:hover,.speak:hover,.tiny:hover{background:rgba(255,255,255,.11)!important}}
      @media(max-width:700px){#${WRAP_ID} .iran-photo-scrim{background:linear-gradient(to bottom,rgba(8,8,7,.56),rgba(8,8,7,.30) 24%,rgba(8,8,7,.46) 72%,rgba(8,8,7,.66))}.face{background:rgba(27,27,24,.80)!important}}
      @media(prefers-reduced-motion:reduce){#${WRAP_ID} .iran-photo-bg{transition:none!important;transform:none!important}}
    `;
    document.head.appendChild(style);
  }

  function installMarkup(){
    let wrap=document.getElementById(WRAP_ID);
    if(wrap)return wrap;
    wrap=document.createElement("div");
    wrap.id=WRAP_ID;
    wrap.setAttribute("aria-hidden","true");
    wrap.innerHTML='<div class="iran-photo-bg a"></div><div class="iran-photo-bg b"></div><div class="iran-photo-scrim"></div>';
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

  function setTile(layer,index){
    const col=index%COLS,row=Math.floor(index/COLS);
    const x=(col/(COLS-1))*100;
    const y=(row/(ROWS-1))*100;
    layer.style.backgroundPosition=`${x}% ${y}%`;
    layer.dataset.index=String(index+1);
  }

  function rotate(){
    const wrap=document.getElementById(WRAP_ID);if(!wrap)return;
    const a=wrap.querySelector(".a"),b=wrap.querySelector(".b");
    const incoming=showA?b:a,outgoing=showA?a:b;
    setTile(incoming,nextIndex());
    requestAnimationFrame(()=>{
      incoming.classList.add("show");
      outgoing.classList.remove("show");
    });
    showA=!showA;
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
    rotate();
    watchCards();
    setInterval(rotate,30000);
  }

  if(document.readyState==="complete")init();
  else window.addEventListener("load",init,{once:true});
})();
