// One animation owner for the card UI:
// - .card-shell owns swipe/answer movement
// - .card-glass is a non-transforming sibling that owns translucency
// - .card owns only the 3D front/back flip
// Mobile portrait avoids transform/opacity animation on the glass hierarchy.
(()=>{
  if(window.__farsiCardShellMotionV5)return;
  window.__farsiCardShellMotionV5=true;

  const STYLE_ID="farsiCardShellMotionStylesV5";
  let answering=false;

  function mobileSafeMotion(){
    return window.matchMedia("(max-width:700px) and (orientation:portrait)").matches;
  }

  function installStyles(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      .card-shell{
        position:absolute;
        top:0;
        left:0;
        width:100%;
        height:100%;
        z-index:1;
        transform-origin:center center;
      }
      .card-glass{
        position:absolute;
        inset:0;
        z-index:0;
        pointer-events:none;
      }
      .card-shell>.card{
        position:absolute;
        inset:0;
        width:100%;
        height:100%;
        z-index:1;
      }
      .card-shell>.speak{z-index:12}
      .card-shell.is-answering>.card{
        transition:none!important;
        opacity:1!important;
        transform:none!important;
      }
      .card-shell.is-answering>.card.flip{
        transform:rotateY(180deg)!important;
      }
      @media(min-width:701px),(max-width:700px) and (orientation:landscape){
        .card-shell{will-change:transform,opacity}
      }
      @media(max-width:700px) and (orientation:portrait){
        .card-shell{
          transform:none!important;
          opacity:1!important;
          will-change:auto;
        }
      }
      @media(prefers-reduced-motion:reduce){
        .card-shell{transition:none!important}
      }
    `;
    document.head.appendChild(style);
  }

  function shellFor(){
    if(typeof E==="undefined"||!E?.card)return null;
    return E.card.closest(".card-shell");
  }

  function ensureGlass(shell){
    if(!shell)return null;
    let glass=shell.querySelector(":scope > .card-glass");
    if(!glass){
      glass=document.createElement("div");
      glass.className="card-glass";
      shell.insertBefore(glass,shell.firstChild);
    }
    return glass;
  }

  function resetShell(shell){
    if(!shell)return;
    shell.style.transition="";
    shell.style.transform="";
    shell.style.opacity="";
    shell.style.left="";
    shell.classList.remove("is-answering","is-dragging");
  }

  function settleShell(shell){
    if(!shell)return;
    if(mobileSafeMotion()){
      shell.style.transform="";
      shell.style.opacity="1";
      shell.style.transition="left .16s ease";
      shell.style.left="0px";
    }else{
      shell.style.left="";
      shell.style.transition="transform .16s ease";
      shell.style.transform="translateX(0) rotate(0deg)";
    }
    setTimeout(()=>{if(shell.isConnected)shell.style.transition=""},180);
  }

  function finishPointer(){
    if(!down)return;
    down=false;
    const shell=shellFor();
    shell?.classList.remove("is-dragging");
    const t=Math.min(110,innerWidth*.22),tapSlop=14;
    if(dx<-t)grade(false);
    else if(dx>t)grade(true);
    else{
      settleShell(shell);
      E.left.style.opacity=E.right.style.opacity=0;
      if(Math.abs(dx)<=tapSlop)turn();
    }
    dx=0;
    suppress=false;
  }

  function installPointerHandlers(stage){
    if(!stage||stage.dataset.cardShellPointers==="2")return;
    stage.dataset.cardShellPointers="2";

    stage.onpointerdown=e=>{
      if(!Q.length||e.target.closest(".speak")||answering)return;
      const shell=shellFor();
      if(!shell)return;
      down=true;
      start=e.clientX;
      dx=0;
      suppress=false;
      stage.setPointerCapture?.(e.pointerId);
      shell.classList.add("is-dragging");
      shell.style.transition="none";
      if(mobileSafeMotion()){
        shell.style.transform="";
        shell.style.opacity="1";
        shell.style.left="0px";
      }else{
        shell.style.left="";
      }
    };

    stage.onpointermove=e=>{
      if(!down||answering)return;
      const shell=shellFor();
      if(!shell)return;
      dx=e.clientX-start;
      if(Math.abs(dx)>14)suppress=true;
      if(mobileSafeMotion()){
        // WebKit-safe path: no transform/rotate/opacity on the glass hierarchy.
        shell.style.left=`${dx}px`;
      }else{
        shell.style.transform=`translateX(${dx}px) rotate(${dx/28}deg)`;
      }
      const n=Math.min(Math.abs(dx)/110,1);
      E.left.style.opacity=dx<0?n:0;
      E.right.style.opacity=dx>0?n:0;
    };

    stage.onpointerup=finishPointer;
    stage.onpointercancel=finishPointer;
    stage.onlostpointercapture=finishPointer;
  }

  function ensureShell(){
    installStyles();
    if(typeof E==="undefined")return null;
    const stage=E?.stage;
    const card=E?.card;
    if(!stage||!card||!card.isConnected)return null;

    let shell=card.closest(".card-shell");
    if(!shell){
      shell=document.createElement("div");
      shell.className="card-shell";
      stage.insertBefore(shell,card);
      shell.appendChild(card);
    }
    ensureGlass(shell);
    if(E?.speak&&E.speak.parentElement!==shell)shell.appendChild(E.speak);

    installPointerHandlers(stage);
    return shell;
  }

  function animateMobileAnswer(shell,move){
    shell.style.transform="";
    shell.style.opacity="1";
    shell.style.left="0px";
    shell.style.transition="left .22s cubic-bezier(.35,.05,.65,.95)";
    requestAnimationFrame(()=>{
      shell.style.left=`${move*112}vw`;
    });

    // The scheduler renders the next card at ~200ms. Bring the same full glass
    // card back with layout-position motion only, so WebKit never drops blur.
    setTimeout(()=>{
      const nextShell=ensureShell()||shell;
      if(!nextShell?.isConnected){answering=false;return}
      nextShell.classList.remove("is-answering");
      nextShell.style.transform="";
      nextShell.style.opacity="1";
      nextShell.style.transition="none";
      nextShell.style.left=`${-move*24}px`;
      void nextShell.offsetWidth;
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        nextShell.style.transition="left .20s cubic-bezier(.22,.61,.36,1)";
        nextShell.style.left="0px";
      }));
      setTimeout(()=>{
        if(nextShell.isConnected)resetShell(nextShell);
        answering=false;
      },240);
    },230);
  }

  function animateDesktopAnswer(shell,move){
    shell.style.left="";
    shell.style.transition="transform .22s cubic-bezier(.35,.05,.65,.95),opacity .18s ease";
    requestAnimationFrame(()=>{
      shell.style.transform=`translateX(${move*112}vw) rotate(${move*7}deg)`;
      shell.style.opacity=".12";
    });

    setTimeout(()=>{
      const nextShell=ensureShell()||shell;
      if(!nextShell?.isConnected){answering=false;return}
      nextShell.classList.remove("is-answering");
      nextShell.style.transition="none";
      nextShell.style.transform=`translateX(${-move*28}px) rotate(0deg)`;
      nextShell.style.opacity=".45";
      void nextShell.offsetWidth;
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        nextShell.style.transition="transform .20s cubic-bezier(.22,.61,.36,1),opacity .18s ease";
        nextShell.style.transform="translateX(0) rotate(0deg)";
        nextShell.style.opacity="1";
      }));
      setTimeout(()=>{
        if(nextShell.isConnected)resetShell(nextShell);
        answering=false;
      },240);
    },230);
  }

  function animateAnswer(move){
    const shell=ensureShell();
    if(!shell)return false;
    answering=true;
    shell.classList.add("is-answering");
    if(mobileSafeMotion())animateMobileAnswer(shell,move);
    else animateDesktopAnswer(shell,move);
    return true;
  }

  window.addEventListener("load",()=>{
    ensureShell();
    if(typeof grade!=="function")return;
    const baseGrade=grade;

    grade=function(know){
      if(answering||!E?.card||!Q?.length)return;
      const move=know?1:-1;
      if(!animateAnswer(move))return baseGrade(know);
      const result=baseGrade(know);

      // At this point the wrapper has accepted exactly one user grade. Other
      // systems receive a semantic event and no longer inspect card animation.
      window.dispatchEvent(new CustomEvent("farsi:graded",{detail:{know}}));
      return result;
    };

    if(E?.main){
      new MutationObserver(()=>ensureShell()).observe(E.main,{childList:true});
    }
  });
})();
