(()=>{
  if(window.__farsiResponsiveBackgroundsV12)return;
  window.__farsiResponsiveBackgroundsV12=true;

  const STYLE_ID="farsiResponsiveBackgroundStylesV12";
  const WRAP_ID="farsiResponsiveBackgroundsV12";
  const SWITCH_EVERY=6;

  const DESKTOP_BACKGROUNDS=[
    "backgrounds/generated/twilight-courtyard-2.jpg?v=twilight-local2",
    "backgrounds/generated/twilight-courtyard.jpg?v=twilight-local1",
    "backgrounds/generated/hq-set-2/twilight_courtyard_of_lanterns.png?v=hqset2-v1",
    "backgrounds/generated/hq-set-2/lantern_lit_bazaar_at_blue_dusk.png?v=hqset2-v1",
    "backgrounds/generated/hq-set-2/twilight_adobe_rooftops_and_windcatchers.png?v=hqset2-v1",
    "backgrounds/generated/hq-set-2/twilight_persian_garden_reflections.png?v=hqset2-v1",
    "backgrounds/generated/hq-set-2/lanternlit_mountain_village_at_blue_hour.png?v=hqset2-v1",
    "backgrounds/generated/hq-set-2/twilight_lanterns_in_a_desert_courtyard.png?v=hqset2-v1",
    "backgrounds/generated/hq-set-2/luminous_persian_hall_of_mosaic_light.png?v=hqset2-v1",
    "backgrounds/generated/hq-set-2/moonlit_ruins_under_golden_light.png?v=hqset2-v1",
    "backgrounds/generated/hq-set-2/rainy_twilight_alley_with_tower_glow.png?v=hqset2-v1",
    "backgrounds/generated/hq-set-2/twilight_courtyard_of_blue_mosaic_domes.png?v=hqset2-v1"
  ];

  const MOBILE_BACKGROUNDS=[
    "backgrounds/generated/mobile-portrait-set-1/twilight_persian_courtyard_with_lanterns.png?v=mobileportrait1",
    "backgrounds/generated/mobile-portrait-set-1/twilight_lanterns_in_the_historic_bazaar.png?v=mobileportrait1",
    "backgrounds/generated/mobile-portrait-set-1/twilight_over_an_ancient_desert_city.png?v=mobileportrait1",
    "backgrounds/generated/mobile-portrait-set-1/illuminated_persian_garden_at_twilight.png?v=mobileportrait1",
    "backgrounds/generated/mobile-portrait-set-1/twilight_lanterns_in_a_mountain_village.png?v=mobileportrait1",
    "backgrounds/generated/mobile-portrait-set-1/twilight_adobe_courtyard_retreat.png?v=mobileportrait1",
    "backgrounds/generated/mobile-portrait-set-1/luminous_persian_mosque_interior.png?v=mobileportrait1",
    "backgrounds/generated/mobile-portrait-set-1/moonlit_ruins_among_ancient_columns.png?v=mobileportrait1",
    "backgrounds/generated/mobile-portrait-set-1/rainy_lanterns_in_an_historic_alley.png?v=mobileportrait1",
    "backgrounds/generated/mobile-portrait-set-1/twilight_persian_courtyard_reflections.png?v=mobileportrait1"
  ];

  let mode="";
  let bgIndex=0;
  let answerCount=0;
  let activeLayer=0;
  let gradeLocked=false;

  function isMobilePortrait(){
    return window.matchMedia("(max-width:700px) and (orientation:portrait)").matches;
  }

  function listForMode(){
    return isMobilePortrait()?MOBILE_BACKGROUNDS:DESKTOP_BACKGROUNDS;
  }

  function installStyles(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      #iranBackgrounds,#iranPhotoBackgroundsV4,#iranRecoveredBackgroundsV5,#iranGeneratedBackgroundsV6,#iranGeneratedBackgroundsV7,#iranGeneratedBackgroundsV8,#iranSingleBackgroundV9,#iranDualBackgroundV10,#iranBackgroundGalleryV11{display:none!important}
      body{background:#11110f!important;background-image:none!important}
      #${WRAP_ID}{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none;background:#11110f}
      #${WRAP_ID} .farsi-bg-layer{position:absolute;inset:0;background-position:center center;background-size:cover;background-repeat:no-repeat;opacity:0;transform:scale(1.002);transition:opacity .9s ease}
      #${WRAP_ID} .farsi-bg-layer.is-active{opacity:1}
      #${WRAP_ID}::after{content:"";position:absolute;inset:0;background:linear-gradient(to bottom,rgba(7,8,9,.16),rgba(7,8,9,.07) 28%,rgba(7,8,9,.12) 72%,rgba(7,8,9,.28)),radial-gradient(circle at center,transparent 30%,rgba(7,8,9,.10) 78%,rgba(7,8,9,.20))}
      .app{position:relative!important;z-index:1!important;background:transparent!important}
      header,.grade,.undo,.tiny{color:#f6f0e8!important;text-shadow:0 1px 5px rgba(0,0,0,.72)}
      .tiny,.grade,.undo{background:rgba(13,13,12,.18)!important;backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px)}
      .face{background:rgba(25,25,22,.60)!important;border-color:rgba(255,255,255,.15)!important;box-shadow:0 22px 70px rgba(0,0,0,.43),0 1px 2px rgba(0,0,0,.36)!important;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
      .roman,.english{color:#fffaf3!important;text-shadow:0 2px 18px rgba(0,0,0,.34)}
      .farsi{color:#f4e9dc!important;text-shadow:0 2px 18px rgba(0,0,0,.34)}
      .mini,.hint{color:#e2d9ce!important}
      .speak{color:#faf5ed!important;background:rgba(16,16,14,.48)!important;border-color:rgba(255,255,255,.18)!important;box-shadow:0 4px 18px rgba(0,0,0,.28)!important;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
      .sw{background:rgba(14,14,12,.66)!important;border:1px solid rgba(255,255,255,.12)}
      @media(hover:hover){.grade:hover,.undo.show:hover,.speak:hover,.tiny:hover{background:rgba(255,255,255,.13)!important}}
      @media(max-width:700px) and (orientation:portrait){
        #${WRAP_ID}::after{background:linear-gradient(to bottom,rgba(7,8,9,.18),rgba(7,8,9,.06) 30%,rgba(7,8,9,.10) 72%,rgba(7,8,9,.24))}
        .face{background:rgba(25,25,22,.56)!important;backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px)}
      }
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
  }

  function loadImage(src,onload,onerror){
    const img=new Image();
    img.onload=onload;
    img.onerror=onerror||(()=>{});
    img.src=src;
  }

  function preloadNext(){
    const list=listForMode();
    if(list.length<2)return;
    const next=list[(bgIndex+1)%list.length];
    const img=new Image();
    img.src=next;
  }

  function setBackgroundNow(src){
    const wrap=document.getElementById(WRAP_ID);
    if(!wrap)return;
    const layers=wrap.querySelectorAll(".farsi-bg-layer");
    if(layers.length<2)return;
    layers[0].style.backgroundImage=`url("${src}")`;
    layers[0].classList.add("is-active");
    layers[1].classList.remove("is-active");
    layers[1].style.backgroundImage="";
    activeLayer=0;
    preloadNext();
  }

  function swapBackground(){
    const list=listForMode();
    if(list.length<2)return;
    const wrap=document.getElementById(WRAP_ID);
    if(!wrap)return;
    const layers=wrap.querySelectorAll(".farsi-bg-layer");
    if(layers.length<2)return;

    const nextIndex=(bgIndex+1)%list.length;
    const src=list[nextIndex];
    const incomingIndex=activeLayer===0?1:0;
    const incoming=layers[incomingIndex];
    const outgoing=layers[activeLayer];

    loadImage(src,()=>{
      incoming.style.backgroundImage=`url("${src}")`;
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        incoming.classList.add("is-active");
        outgoing.classList.remove("is-active");
        activeLayer=incomingIndex;
        bgIndex=nextIndex;
        preloadNext();
      }));
    });
  }

  function syncMode(force=false){
    const nextMode=isMobilePortrait()?"mobile":"desktop";
    if(!force&&nextMode===mode)return;
    mode=nextMode;
    bgIndex=0;
    answerCount=0;
    const list=listForMode();
    if(list.length)setBackgroundNow(list[0]);
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
    if(grade.__farsiResponsiveBackgroundRotation)return;

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
    wrapped.__farsiResponsiveBackgroundRotation=true;
    grade=wrapped;
  }

  function init(){
    installStyles();
    installMarkup();
    syncMode(true);
    let resizeTimer=0;
    window.addEventListener("resize",()=>{
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(()=>syncMode(false),120);
    });
    window.addEventListener("orientationchange",()=>setTimeout(()=>syncMode(false),180));
  }

  if(document.readyState==="loading")window.addEventListener("DOMContentLoaded",init,{once:true});
  else init();

  window.addEventListener("load",()=>setTimeout(()=>hookGrade(),0),{once:true});
})();
