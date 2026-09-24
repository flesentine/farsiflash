// Show the v5 example trio only on the revealed answer side.
// FA→EN: examples live on the meaning/back face.
// EN→FA: examples live on the Persian/front face after reveal.
(()=>{
  if(window.__farsiExamplesUiV1)return;
  window.__farsiExamplesUiV1=true;

  const STYLE_ID="farsiExampleStylesV1";

  function installStyles(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      .example-block{
        position:absolute;
        left:24px;
        right:24px;
        display:none;
        text-align:center;
        pointer-events:none;
        color:#7d766d;
        line-height:1.45;
        overflow-wrap:normal;
        word-break:normal;
        hyphens:none;
      }
      .example-front{bottom:28px}
      .example-back{bottom:118px}
      body.english-first .example-front,
      body.farsi-first .example-back{display:block}
      body.english-first .face:not(.back).example-ready{padding-bottom:178px}
      body.farsi-first .face.back.example-ready{padding-bottom:228px}
      .example-fa{
        font-family:Tahoma,"Geeza Pro","Noto Naskh Arabic",sans-serif;
        direction:rtl;
        font-size:20px;
        line-height:1.65;
        color:#5f5951;
      }
      .example-roman{
        margin-top:7px;
        font-size:13px;
        line-height:1.45;
        font-weight:650;
        color:#8a8379;
      }
      .example-en{
        margin-top:4px;
        font-size:13px;
        line-height:1.45;
        color:#8a8379;
      }
      body.hide-phonetics .example-roman{display:none}
      .face.back.example-ready .mini{
        display:grid;
        gap:7px;
        line-height:1.35;
      }
      .face.back.example-ready .mini br{display:none}
      .face.back.example-ready .mini #mr,
      .face.back.example-ready .mini #mf{display:block}
      @media(max-width:430px){
        .example-block{left:18px;right:18px}
        .example-front{bottom:22px}
        .example-back{bottom:104px}
        body.english-first .face:not(.back).example-ready{padding-bottom:158px}
        body.farsi-first .face.back.example-ready{padding-bottom:202px}
        .example-fa{font-size:18px;line-height:1.62}
        .example-roman,.example-en{font-size:12px;line-height:1.45}
        .face.back.example-ready .mini{gap:6px}
      }
      @media(max-height:620px){
        .example-fa{font-size:16px;line-height:1.58}
        .example-roman,.example-en{font-size:11px;line-height:1.4}
        .example-front{bottom:16px}
        .example-back{bottom:92px}
        body.english-first .face:not(.back).example-ready{padding-bottom:146px}
        body.farsi-first .face.back.example-ready{padding-bottom:178px}
      }
      @media(prefers-color-scheme:dark){
        .example-block{color:#a49b90}
        .example-fa{color:#d0c8bd}
        .example-roman,.example-en{color:#a49b90}
      }
    `;
    document.head.appendChild(style);
  }

  function ensureBlock(face,kind){
    if(!face)return null;
    let block=face.querySelector(`.example-${kind}`);
    if(block)return block;
    block=document.createElement("div");
    block.className=`example-block example-${kind}`;
    block.innerHTML='<div class="example-fa" dir="rtl"></div><div class="example-roman"></div><div class="example-en"></div>';
    face.appendChild(block);
    face.classList.add("example-ready");
    return block;
  }

  function fill(block,card){
    if(!block)return;
    const fa=String(card?.exampleFa||"").trim();
    const roman=String(card?.exampleRoman||"").trim();
    const en=String(card?.exampleEn||"").trim();
    block.querySelector(".example-fa").textContent=fa;
    block.querySelector(".example-roman").textContent=roman;
    block.querySelector(".example-en").textContent=en;
    block.hidden=!(fa&&en);
  }

  function syncExamples(){
    if(typeof E==="undefined"||!E?.card||!E.card.isConnected||!Q?.length)return;
    const card=current();
    if(!card)return;
    const front=E.card.querySelector(".face:not(.back)");
    const back=E.card.querySelector(".face.back");
    fill(ensureBlock(front,"front"),card);
    fill(ensureBlock(back,"back"),card);
    requestAnimationFrame(()=>window.fitCardText?.());
  }

  window.addEventListener("load",()=>{
    installStyles();
    if(typeof render!=="function")return;
    const baseRender=render;
    render=function(){
      const result=baseRender();
      syncExamples();
      return result;
    };
    syncExamples();
  });
})();
