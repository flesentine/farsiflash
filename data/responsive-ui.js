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
        .card:focus-visible{border-radius:18px}
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
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});
  else install();
})();
