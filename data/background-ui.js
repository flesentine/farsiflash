(()=>{
  if(window.__farsiBackgroundGalleryV11)return;
  window.__farsiBackgroundGalleryV11=true;

  const STYLE_ID="iranBackgroundGalleryStylesV11";
  const WRAP_ID="iranBackgroundGalleryV11";
  const SWITCH_EVERY=6;
  const BACKGROUNDS=[
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

  const loaded=new Set([BACKGROUNDS[0],BACKGROUNDS[1]]);
  let available=BACKGROUNDS.filter(src=>loaded.has(src));
  let bgIndex=0;
  let answerCount=0;
  let activeLayer=0;
  let gradeLocked=false;

  function refreshAvailable(){
    available=BACKGROUNDS.filter(src=>loaded.has(src));
    if(!available.length)available=[BACKGROUNDS[0]];
    bgIndex=Math.min(bgIndex,available.length-1);
  }

  function installStyles(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      #iranBackgrounds,#iranPhotoBackgroundsV4,#iranRecoveredBackgroundsV5,#iranGeneratedBackgroundsV6,#iranGeneratedBackgroundsV7,#iranGeneratedBackgroundsV8,#iranSingleBackgroundV9,#iranDualBackgroundV10{display:none!important}
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
      @media(max-width:700px){#${WRAP_ID} .farsi-bg-layer{background-position:center center}#${WRAP_ID}::after{background:linear-gradient(to bottom,rgba(7,8,9,.26),rgba(7,8,9,.12) 30%,rgba(7,8,9,.18) 72%,rgba(7,8,9,.36))}.face{background:rgba(25,25,22,.66)!important}}
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
    layers[0].style.backgroundImage=`url("${available[0]}")`;
  }

  function preload(){
    BACKGROUNDS.forEach(src=>{
      const img=new Image();
      img.onload=()=>{loaded.add(src);refreshAvailable()};
      img.onerror=()=>{};
      img.src=src;
    });
  }

  function swapBackground(){
    refreshAvailable();
    if(available.length<2)return;
    const wrap=document.getElementById(WRAP_ID);
    if(!wrap)return;
    const layers=wrap.querySelectorAll(".farsi-bg-layer");
    if(layers.length<2)return;

    bgIndex=(bgIndex+1)%available.length;
    const incomingIndex=activeLayer===0?1:0;
    const incoming=layers[incomingIndex];
    const outgoing=layers[activeLayer];
    incoming.style.backgroundImage=`url("${available[bgIndex]}")`;

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
