(()=>{
  if(window.__farsiDualBackgroundV10)return;
  window.__farsiDualBackgroundV10=true;

  const STYLE_ID="iranDualBackgroundStylesV10";
  const WRAP_ID="iranDualBackgroundV10";
  const SWITCH_EVERY=6;
  const BACKGROUNDS=[
    "backgrounds/generated/twilight-courtyard-2.jpg?v=twilight-local2",
    "backgrounds/generated/twilight-courtyard.jpg?v=twilight-local1"
  ];

  let bgIndex=0;
  let answerCount=0;
  let activeLayer=0;
  let gradeLocked=false;

  function installStyles(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      #iranBackgrounds,#iranPhotoBackgroundsV4,#iranRecoveredBackgroundsV5,#iranGeneratedBackgroundsV6,#iranGeneratedBackgroundsV7,#iranGeneratedBackgroundsV8,#iranSingleBackgroundV9{display:none!important}
      body{background:#11110f!important;background-image:none!important}
      #${WRAP_ID}{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none;background:#11110f}
      #${WRAP_ID} .farsi-bg-layer{position:absolute;inset:0;background-position:center center;background-size:cover;background-repeat:no-repeat;opacity:0;transform:scale(1.002);transition:opacity .9s ease}
      #${WRAP_ID} .farsi-bg-layer.is-active{opacity:1}
      #${WRAP_ID}::after{content:"";position:absolute;inset:0;background:linear-gradient(to bottom,rgba(7,8,9,.16),rgba(7,8,9,.07) 28%,rgba(7,8,9,.12) 72%,rgba(7,8,9,.28)),radial-gradient(circle at center,transparent 30%,rgba(7,8,9,.10) 78%,rgba(7,8,9,.20))}
      .app{position:relative!important;z-index:1!important;background:transparent!important}
      header,.grade,.undo,.tiny{color:#f6f0e8!important;text-shadow:0 1px 5px rgba(0,0,0,.72)}
      .tiny,.grade,.undo{background:rgba(13,13,12,.18)!important;backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px)}
      .face{background:rgba(25,25,22,.72)!important;border-color:rgba(255,255,255,.15)!important;box-shadow:0 22px 70px rgba(0,0,0,.43),0 1px 2px rgba(0,0,0,.36)!important;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
      .roman,.english{color:#fffaf3!important;text-shadow:0 2px 18px rgba(0,0,0,.34)}
      .farsi{color:#f4e9dc!important;text-shadow:0 2px 18px rgba(0,0,0,.34)}
      .mini,.hint{color:#e2d9ce!important}
      .speak{color:#faf5ed!important;background:rgba(16,16,14,.48)!important;border-color:rgba(255,255,255,.18)!important;box-shadow:0 4px 18px rgba(0,0,0,.28)!important;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
      .sw{background:rgba(14,14,12,.66)!important;border:1px solid rgba(255,255,255,.12)}
      @media(hover:hover){.grade:hover,.undo.show:hover,.speak:hover,.tiny:hover{background:rgba(255,255,255,.13)!important}}
      @media(max-width:700px){#${WRAP_ID} .farsi-bg-layer{background-position:center center}#${WRAP_ID}::after{background:linear-gradient(to bottom,rgba(7,8,9,.26),rgba(7,8,9,.12) 30%,rgba(7,8,9,.18) 72%,rgba(7,8,9,.36))}.face{background:rgba(25,25,22,.79)!important}}
      @media(prefers-reduced-motion:reduce){#${WRAP_ID} .farsi-bg-layer{transition:none!important}}
    `;
    document.head.appendChild(style);
  }

  function installMarkup(){
    if(document.getElementById(WRAP_ID))return;
    const wrap=document.createElement("div");
    wrap.id=WRAP_ID;
    wrap.setAttribute("aria-hidden","true");
    wrap.innerHTML='<div class="farsi-bg-layer is-active"></div><div class="farsi-bg-layer"></div>';
    document.body.prepend(wrap);
    const layers=wrap.querySelectorAll(".farsi-bg-layer");
    layers[0].style.backgroundImage=`url("${BACKGROUNDS[0]}")`;
  }

  function preload(){
    BACKGROUNDS.forEach(src=>{const img=new Image();img.src=src});
  }

  function swapBackground(){
    const wrap=document.getElementById(WRAP_ID);
    if(!wrap)return;
    const layers=wrap.querySelectorAll(".farsi-bg-layer");
    if(layers.length<2)return;

    bgIndex=(bgIndex+1)%BACKGROUNDS.length;
    const incomingIndex=activeLayer===0?1:0;
    const incoming=layers[incomingIndex];
    const outgoing=layers[activeLayer];
    incoming.style.backgroundImage=`url("${BACKGROUNDS[bgIndex]}")`;

    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      incoming.classList.add("is-active");
      outgoing.classList.remove("is-active");
      activeLayer=incomingIndex;
    }));
  }

  function registerAnswer(){
    answerCount++;
    if(answerCount%SWITCH_EVERY===0)setTimeout(swapBackground,170);
  }

  function hookGrade(attempt=0){
    if(typeof grade!=="function"){
      if(attempt<30)setTimeout(()=>hookGrade(attempt+1),100);
      return;
    }
    if(grade.__farsiBackgroundRotation)return;

    const baseGrade=grade;
    const wrapped=function(know){
      if(gradeLocked)return baseGrade(know);
      const card=document.getElementById("card");
      const result=baseGrade(know);
      const accepted=!!card&&card.style.opacity==="0";
      if(accepted){
        gradeLocked=true;
        registerAnswer();
        setTimeout(()=>{gradeLocked=false},260);
      }
      return result;
    };
    wrapped.__farsiBackgroundRotation=true;
    grade=wrapped;
  }

  function init(){
    installStyles();
    installMarkup();
    preload();
  }

  if(document.readyState==="loading")window.addEventListener("DOMContentLoaded",init,{once:true});
  else init();

  window.addEventListener("load",()=>setTimeout(()=>hookGrade(),0),{once:true});
})();
