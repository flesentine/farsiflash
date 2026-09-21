(()=>{
  const STYLE_ID="responsiveUiStyles";
  function install(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      header{min-width:0;gap:12px}
      .progress{min-width:0}
      .header-actions{flex:0 0 auto}

      /* Large learner text may wrap only at natural spaces. Never split a
         Romanized/English word in the middle just to satisfy the card width. */
      .roman,.english,.farsi{
        width:100%;
        max-width:100%;
        min-width:0;
        overflow-wrap:normal!important;
        word-break:normal!important;
        hyphens:none!important;
      }

      /* Keep the desktop focus outline on the same stationary glass layer as
         the dark card tint, so flipping only rotates the card content. */
      @media(min-width:701px){
        @supports selector(.card-shell:has(>.card:focus-visible)){
          .card:focus-visible{box-shadow:none!important}
          .card-shell:has(>.card:focus-visible)>.card-glass{
            box-shadow:0 22px 70px rgba(0,0,0,.43),0 1px 2px rgba(0,0,0,.36),0 0 0 3px rgba(255,255,255,.22)!important;
          }
        }
      }

      @media(max-width:700px){
        .app{
          grid-template-rows:auto minmax(0,1fr) auto;
          padding:max(10px,env(safe-area-inset-top)) 12px max(10px,env(safe-area-inset-bottom));
        }
        header{
          height:auto;
          min-height:72px;
          display:grid;
          grid-template-columns:1fr;
          grid-template-rows:auto auto;
          align-content:start;
          gap:5px;
          padding:2px 2px 4px;
        }
        .progress{
          width:100%;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
          line-height:1.35;
          font-size:12px;
          letter-spacing:.025em;
        }
        .header-actions{
          width:100%;
          justify-content:flex-end;
          gap:0;
          min-width:0;
        }
        .header-actions .tiny{padding:7px 8px}
        #directionMode,#phoneticsMode{font-size:11px!important}
        main{padding:6px 0 4px}
        .stage{
          width:min(94vw,480px);
          height:min(60dvh,560px);
          max-height:calc(100dvh - 176px);
        }
        .stage,.card{
          -webkit-tap-highlight-color:transparent;
        }
        .card:focus,.card:focus-visible{
          outline:none!important;
          box-shadow:none!important;
        }
        .face{padding:32px 24px}
        .roman,.english{font-size:clamp(36px,11vw,58px)}
        .farsi{font-size:clamp(31px,9vw,50px)}
        .hint{top:20px}
        .speak{top:13px;right:13px;width:44px;height:44px}
        .actions{height:58px;align-items:center}
        .grade,.undo{min-height:46px}
      }

      @media(max-width:430px){
        .app{padding-left:10px;padding-right:10px}
        header{min-height:68px}
        .header-actions .tiny{padding:6px 7px}
        .header-actions a[title="Frequency source"]{display:none}
        .stage{
          width:94vw;
          height:min(58dvh,520px);
          max-height:calc(100dvh - 164px);
        }
        .face{padding:28px 20px;border-radius:18px}
        .roman,.english{font-size:clamp(34px,12vw,52px)}
        .farsi{margin-top:18px;font-size:clamp(30px,10vw,46px)}
        .mini{bottom:22px;left:20px;right:20px;font-size:14px}
        .mini [dir=rtl]{font-size:18px}
        .grade{font-size:13px;padding:0 8px}
        .undo{min-width:56px;font-size:11px}
      }

      @media(max-height:720px){
        header{min-height:60px}
        .stage{
          height:min(54dvh,440px);
          max-height:calc(100dvh - 146px);
        }
        .actions{height:52px}
        .grade,.undo{min-height:42px}
      }

      @media(max-width:700px) and (orientation:landscape){
        header{
          min-height:40px;
          grid-template-columns:minmax(0,1fr) auto;
          grid-template-rows:1fr;
          align-items:center;
          gap:8px;
        }
        .header-actions{width:auto}
        .header-actions a[title="Frequency source"]{display:none}
        .stage{
          width:min(56vw,430px);
          height:min(68dvh,420px);
          max-height:calc(100dvh - 102px);
        }
        .actions{height:44px}
        .grade,.undo{min-height:38px}
      }
    `;
    document.head.appendChild(style);
  }
  const FIT_SELECTORS=[
    {selector:".roman",preferredMin:24,hardMin:12,maxHeightRatio:.42},
    {selector:".english",preferredMin:24,hardMin:12,maxHeightRatio:.56},
    {selector:".farsi",preferredMin:22,hardMin:14,maxHeightRatio:.34}
  ];
  let fitFrame=0;
  let resizeTimer=0;

  function fitsBox(el,maxHeight){
    return el.scrollWidth<=el.clientWidth+1&&el.scrollHeight<=maxHeight+1;
  }

  function fitTextElement(el,config){
    if(!el||!el.isConnected||!el.textContent.trim())return;
    const face=el.closest(".face");
    if(!face||face.clientWidth<1||face.clientHeight<1)return;

    /* Clear a previous fit first so media queries/fullscreen can establish
       the new natural maximum size for this viewport. */
    el.style.fontSize="";
    const naturalSize=parseFloat(getComputedStyle(el).fontSize)||48;
    const faceStyle=getComputedStyle(face);
    const paddingY=(parseFloat(faceStyle.paddingTop)||0)+(parseFloat(faceStyle.paddingBottom)||0);
    const usableHeight=Math.max(72,face.clientHeight-paddingY);
    const maxHeight=Math.max(54,usableHeight*config.maxHeightRatio);

    if(fitsBox(el,maxHeight)){
      el.dataset.fitFontSize=String(Math.round(naturalSize));
      return;
    }

    const natural=Math.max(config.hardMin,Math.floor(naturalSize));
    const preferred=Math.min(natural,config.preferredMin);
    let low=preferred,high=natural,best=preferred;

    /* First preserve a comfortable minimum where possible. */
    while(low<=high){
      const mid=Math.floor((low+high)/2);
      el.style.fontSize=mid+"px";
      if(fitsBox(el,maxHeight)){best=mid;low=mid+1}
      else high=mid-1;
    }
    el.style.fontSize=best+"px";

    /* Exceptionally long unbroken words still must fit. Continue below the
       preferred floor rather than clipping or splitting the word. */
    if(!fitsBox(el,maxHeight)){
      low=config.hardMin;
      high=Math.max(config.hardMin,best-1);
      let hardBest=config.hardMin;
      while(low<=high){
        const mid=Math.floor((low+high)/2);
        el.style.fontSize=mid+"px";
        if(fitsBox(el,maxHeight)){hardBest=mid;low=mid+1}
        else high=mid-1;
      }
      el.style.fontSize=hardBest+"px";
    }

    /* Last-resort floor for pathological single tokens. This should almost
       never run, but guarantees no horizontal clipping. */
    let size=parseFloat(el.style.fontSize)||config.hardMin;
    while(!fitsBox(el,maxHeight)&&size>9){
      size-=1;
      el.style.fontSize=size+"px";
    }
    el.dataset.fitFontSize=String(size);
  }

  function fitFrontPair(){
    const roman=document.querySelector(".face:not(.back) .roman");
    const farsi=document.querySelector(".face:not(.back) .farsi");
    if(!roman||!farsi)return;
    const face=roman.closest(".face");
    if(!face)return;
    const style=getComputedStyle(face);
    const paddingY=(parseFloat(style.paddingTop)||0)+(parseFloat(style.paddingBottom)||0);
    const reserve=Math.min(88,face.clientHeight*.18);
    const available=Math.max(120,face.clientHeight-paddingY-reserve);
    const marginTop=parseFloat(getComputedStyle(farsi).marginTop)||0;
    let total=roman.scrollHeight+farsi.scrollHeight+marginTop;
    let guard=0;
    while(total>available&&guard++<30){
      const target=roman.scrollHeight>=farsi.scrollHeight?roman:farsi;
      const current=parseFloat(getComputedStyle(target).fontSize)||20;
      if(current<=10)break;
      target.style.fontSize=(current-1)+"px";
      total=roman.scrollHeight+farsi.scrollHeight+marginTop;
    }
  }

  function fitCardText(){
    fitFrame=0;
    for(const config of FIT_SELECTORS){
      document.querySelectorAll(config.selector).forEach(el=>fitTextElement(el,config));
    }
    fitFrontPair();
  }

  function scheduleFit(){
    if(fitFrame)return;
    fitFrame=requestAnimationFrame(()=>requestAnimationFrame(fitCardText));
  }

  function initTextFit(){
    install();
    scheduleFit();
    const main=document.getElementById("main");
    if(main){
      new MutationObserver(scheduleFit).observe(main,{subtree:true,childList:true,characterData:true});
    }
    window.addEventListener("resize",()=>{
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(scheduleFit,80);
    });
    window.addEventListener("orientationchange",()=>setTimeout(scheduleFit,120));
    document.addEventListener("fullscreenchange",()=>setTimeout(scheduleFit,80));
    if(document.fonts?.ready)document.fonts.ready.then(scheduleFit).catch(()=>{});
    window.addEventListener("load",scheduleFit,{once:true});
  }

  window.fitCardText=fitCardText;

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initTextFit,{once:true});
  else initTextFit();
})();
