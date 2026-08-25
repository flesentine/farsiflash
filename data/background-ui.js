(()=>{
  if(window.__farsiResponsiveBackgroundsV19)return;
  window.__farsiResponsiveBackgroundsV19=true;

  const STYLE_ID="farsiResponsiveBackgroundStylesV19";
  const WRAP_ID="farsiResponsiveBackgroundsV19";
  const SWITCH_EVERY=6;
  const SWAP_DELAY_MS=560;
  const VEIL_IN_MS=280;
  const VEIL_HOLD_MS=70;
  const VEIL_OUT_MS=620;

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
  let swapInProgress=false;
  const preparedImages=new Map();

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
      #iranBackgrounds,#iranPhotoBackgroundsV4,#iranRecoveredBackgroundsV5,#iranGeneratedBackgroundsV6,#iranGeneratedBackgroundsV7,#iranGeneratedBackgroundsV8,#iranSingleBackgroundV9,#iranDualBackgroundV10,#iranBackgroundGalleryV11,#farsiResponsiveBackgroundsV12,#farsiResponsiveBackgroundsV13,#farsiResponsiveBackgroundsV14,#farsiResponsiveBackgroundsV15,#farsiResponsiveBackgroundsV16,#farsiResponsiveBackgroundsV17,#farsiResponsiveBackgroundsV18{display:none!important}
      body{background:#11110f!important;background-image:none!important}
      #${WRAP_ID}{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none;background:#11110f}
      #${WRAP_ID} .farsi-bg-photo{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center center;display:block}
      #${WRAP_ID} .farsi-bg-tone{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(7,8,9,.16),rgba(7,8,9,.07) 28%,rgba(7,8,9,.12) 72%,rgba(7,8,9,.28)),radial-gradient(circle at center,transparent 30%,rgba(7,8,9,.10) 78%,rgba(7,8,9,.20))}
      #${WRAP_ID} .farsi-bg-veil{position:absolute;inset:0;background:rgba(8,9,10,.72);opacity:0;transition:opacity ${VEIL_OUT_MS}ms cubic-bezier(.22,.61,.36,1);will-change:opacity}
      #${WRAP_ID} .farsi-bg-veil.is-on{opacity:1;transition-duration:${VEIL_IN_MS}ms}
      .app{position:relative!important;z-index:1!important;background:transparent!important}
      header,.grade,.undo,.tiny{color:#f6f0e8!important;text-shadow:0 1px 5px rgba(0,0,0,.72)}
      .tiny,.grade,.undo{background:rgba(13,13,12,.18)!important;backdrop-filter:blur(5px);-webkit-backdrop-filter:blur(5px)}

      /* Glass is its own sibling layer. It never flips with .card. */
      .card-shell{background:transparent!important;border:0!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}
      .card-glass{
        border-radius:22px;
        background:rgba(25,25,22,.60);
        border:1px solid rgba(255,255,255,.15);
        box-shadow:0 22px 70px rgba(0,0,0,.43),0 1px 2px rgba(0,0,0,.36);
        backdrop-filter:blur(8px);
        -webkit-backdrop-filter:blur(8px);
      }
      .face{background:transparent!important;border-color:transparent!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important}

      .roman,.english{color:#fffaf3!important;text-shadow:0 2px 18px rgba(0,0,0,.34)}
      .farsi{color:#f4e9dc!important;text-shadow:0 2px 18px rgba(0,0,0,.34)}
      .mini,.hint{color:#e2d9ce!important}
      .speak{color:#faf5ed!important;background:rgba(16,16,14,.48)!important;border-color:rgba(255,255,255,.18)!important;box-shadow:0 4px 18px rgba(0,0,0,.28)!important;backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}
      .sw{background:rgba(14,14,12,.66)!important;border:1px solid rgba(255,255,255,.12)}
      @media(hover:hover){.grade:hover,.undo.show:hover,.speak:hover,.tiny:hover{background:rgba(255,255,255,.13)!important}}
      @media(max-width:700px) and (orientation:portrait){
        #${WRAP_ID}{inset:auto;top:0;left:0;width:100vw;height:100lvh;min-height:100lvh}
        #${WRAP_ID} .farsi-bg-tone{background:linear-gradient(to bottom,rgba(7,8,9,.18),rgba(7,8,9,.06) 30%,rgba(7,8,9,.10) 72%,rgba(7,8,9,.24))}
        /* Slightly darker stable clear tint on mobile; still no WebKit backdrop blur. */
        .card-glass{
          background:rgba(25,25,22,.46);
          backdrop-filter:none;
          -webkit-backdrop-filter:none;
        }
      }
      @media(max-width:430px){.card-glass{border-radius:18px}}
      @media(prefers-reduced-motion:reduce){#${WRAP_ID} .farsi-bg-veil{transition:none!important}}
    `;
    document.head.appendChild(style);
  }

  function installMarkup(){
    if(document.getElementById(WRAP_ID))return;
    const wrap=document.createElement("div");
    wrap.id=WRAP_ID;
    wrap.setAttribute("aria-hidden","true");
    wrap.innerHTML='<img class="farsi-bg-photo" alt=""><div class="farsi-bg-tone"></div><div class="farsi-bg-veil"></div>';
    document.body.prepend(wrap);
  }

  function prepareImage(src){
    if(preparedImages.has(src))return preparedImages.get(src);
    const promise=new Promise(resolve=>{
      const img=new Image();
      img.decoding="async";
      img.onload=()=>{
        if(typeof img.decode==="function")img.decode().then(()=>resolve(img)).catch(()=>resolve(img));
        else resolve(img);
      };
      img.onerror=()=>{
        preparedImages.delete(src);
        resolve(null);
      };
      img.src=src;
    });
    preparedImages.set(src,promise);
    return promise;
  }

  function preloadNext(){
    const list=listForMode();
    if(list.length<2)return;
    prepareImage(list[(bgIndex+1)%list.length]);
  }

  async function setBackgroundNow(src){
    const wrap=document.getElementById(WRAP_ID);
    if(!wrap)return;
    const photo=wrap.querySelector(".farsi-bg-photo");
    if(!photo)return;
    const img=await prepareImage(src);
    if(!img)return;
    photo.src=src;
    preloadNext();
  }

  function wait(ms){return new Promise(resolve=>setTimeout(resolve,ms))}

  async function swapBackground(){
    if(swapInProgress)return;
    const list=listForMode();
    if(list.length<2)return;
    const wrap=document.getElementById(WRAP_ID);
    if(!wrap)return;
    const photo=wrap.querySelector(".farsi-bg-photo");
    const veil=wrap.querySelector(".farsi-bg-veil");
    if(!photo||!veil)return;

    const nextIndex=(bgIndex+1)%list.length;
    const src=list[nextIndex];
    swapInProgress=true;

    const img=await prepareImage(src);
    if(!img){swapInProgress=false;return}

    veil.classList.add("is-on");
    await wait(VEIL_IN_MS+40);
    photo.src=src;
    await wait(VEIL_HOLD_MS);
    bgIndex=nextIndex;
    preloadNext();
    veil.classList.remove("is-on");
    await wait(VEIL_OUT_MS+40);
    swapInProgress=false;
  }

  function syncMode(force=false){
    const nextMode=isMobilePortrait()?"mobile":"desktop";
    if(!force&&nextMode===mode)return;
    mode=nextMode;
    bgIndex=0;
    answerCount=0;
    swapInProgress=false;
    const list=listForMode();
    if(list.length)setBackgroundNow(list[0]);
  }

  function registerAnswer(){
    answerCount++;
    if(answerCount%SWITCH_EVERY===0)setTimeout(swapBackground,SWAP_DELAY_MS);
  }

  function init(){
    installStyles();
    installMarkup();
    syncMode(true);
    window.addEventListener("farsi:graded",registerAnswer);
    let resizeTimer=0;
    window.addEventListener("resize",()=>{
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(()=>syncMode(false),160);
    });
    window.addEventListener("orientationchange",()=>setTimeout(()=>syncMode(false),220));
  }

  if(document.readyState==="loading")window.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
