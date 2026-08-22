(()=>{
  if(window.__farsiSingleBackgroundV9)return;
  window.__farsiSingleBackgroundV9=true;

  const STYLE_ID="iranSingleBackgroundStylesV9";
  const WRAP_ID="iranSingleBackgroundV9";
  const BACKGROUND="backgrounds/generated/twilight-courtyard.jpg?v=twilight-local1";

  function installStyles(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      #iranBackgrounds,#iranPhotoBackgroundsV4,#iranRecoveredBackgroundsV5,#iranGeneratedBackgroundsV6,#iranGeneratedBackgroundsV7,#iranGeneratedBackgroundsV8{display:none!important}
      body{background:#11110f!important;background-image:none!important}
      #${WRAP_ID}{position:fixed;inset:0;z-index:0;overflow:hidden;pointer-events:none;background:#11110f url("${BACKGROUND}") center center/cover no-repeat}
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
      @media(max-width:700px){#${WRAP_ID}{background-position:center center}#${WRAP_ID}::after{background:linear-gradient(to bottom,rgba(7,8,9,.26),rgba(7,8,9,.12) 30%,rgba(7,8,9,.18) 72%,rgba(7,8,9,.36))}.face{background:rgba(25,25,22,.79)!important}}
    `;
    document.head.appendChild(style);
  }

  function installMarkup(){
    if(document.getElementById(WRAP_ID))return;
    const wrap=document.createElement("div");
    wrap.id=WRAP_ID;
    wrap.setAttribute("aria-hidden","true");
    document.body.prepend(wrap);
  }

  function init(){installStyles();installMarkup()}
  if(document.readyState==="loading")window.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
