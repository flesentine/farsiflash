// One animation owner for the card UI:
// - .card-shell owns glass + swipe/answer movement
// - .card owns only the 3D front/back flip
// No cloned faces, no cloned words, no stationary fake card.
(()=>{
  if(window.__farsiCardShellMotionV4)return;
  window.__farsiCardShellMotionV4=true;

  const STYLE_ID="farsiCardShellMotionStylesV4";
  let answering=false;

  function installStyles(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=`
      .stage{isolation:isolate}
      .card-shell{
        position:absolute;
        inset:0;
        width:100%;
        height:100%;
        z-index:1;
        transform-style:preserve-3d;
        transform-origin:center center;
        will-change:transform,opacity;
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
      @media(prefers-reduced-motion:reduce){
        .card-shell{transition:none!important}
      }
    `;
    document.head.appendChild(style);
  }

  function shellFor(){
    const card=window.E?.card;
    if(!card)return null;
    return card.closest(".card-shell");
  }

  function resetShell(shell){
    if(!shell)return;
    shell.style.transition="";
    shell.style.transform="";
    shell.style.opacity="";
    shell.classList.remove("is-answering","is-dragging");
  }

  function finishPointer(){
    if(!window.down)return;
    window.down=false;
    const shell=shellFor();
    shell?.classList.remove("is-dragging");
    const t=Math.min(110,innerWidth*.22),tapSlop=14;
    if(window.dx<-t)grade(false);
    else if(window.dx>t)grade(true);
    else{
      if(shell){
        shell.style.transition="transform .16s ease";
        shell.style.transform="translateX(0) rotate(0deg)";
        setTimeout(()=>{if(shell.isConnected)shell.style.transition=""},180);
      }
      if(window.E){E.left.style.opacity=E.right.style.opacity=0}
      if(Math.abs(window.dx)<=tapSlop)turn();
    }
    window.dx=0;
    window.suppress=false;
  }

  function installPointerHandlers(stage){
    if(!stage||stage.dataset.cardShellPointers==="1")return;
    stage.dataset.cardShellPointers="1";

    stage.onpointerdown=e=>{
      if(!window.Q?.length||e.target.closest(".speak")||answering)return;
      const shell=shellFor();
      if(!shell)return;
      window.down=true;
      window.start=e.clientX;
      window.dx=0;
      window.suppress=false;
      stage.setPointerCapture?.(e.pointerId);
      shell.classList.add("is-dragging");
      shell.style.transition="none";
    };

    stage.onpointermove=e=>{
      if(!window.down||answering)return;
      const shell=shellFor();
      if(!shell)return;
      window.dx=e.clientX-window.start;
      if(Math.abs(window.dx)>14)window.suppress=true;
      shell.style.transform=`translateX(${window.dx}px) rotate(${window.dx/28}deg)`;
      const n=Math.min(Math.abs(window.dx)/110,1);
      E.left.style.opacity=window.dx<0?n:0;
      E.right.style.opacity=window.dx>0?n:0;
    };

    stage.onpointerup=finishPointer;
    stage.onpointercancel=finishPointer;
    stage.onlostpointercapture=finishPointer;
  }

  function ensureShell(){
    installStyles();
    const stage=window.E?.stage;
    const card=window.E?.card;
    if(!stage||!card||!card.isConnected)return null;

    let shell=card.closest(".card-shell");
    if(!shell){
      shell=document.createElement("div");
      shell.className="card-shell";
      stage.insertBefore(shell,card);
      shell.appendChild(card);
      if(window.E?.speak&&E.speak.parentElement===stage)shell.appendChild(E.speak);
    }else if(window.E?.speak&&E.speak.parentElement!==shell){
      shell.appendChild(E.speak);
    }

    installPointerHandlers(stage);
    return shell;
  }

  function animateAnswer(move){
    const shell=ensureShell();
    if(!shell)return;
    answering=true;
    shell.classList.add("is-answering");
    shell.style.transition="transform .22s cubic-bezier(.35,.05,.65,.95),opacity .18s ease";
    requestAnimationFrame(()=>{
      shell.style.transform=`translateX(${move*112}vw) rotate(${move*7}deg)`;
      shell.style.opacity=".12";
    });

    // memory-engine renders the next card at ~200ms. Bring that same physical
    // shell back only after the new content is in place.
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

  window.addEventListener("load",()=>{
    ensureShell();
    if(typeof grade!=="function")return;
    const baseGrade=grade;

    grade=function(know){
      if(answering||!window.E?.card||!window.Q?.length)return;
      const card=E.card;
      const move=know?1:-1;
      animateAnswer(move);
      const result=baseGrade(know);

      // The scheduler marks an accepted answer by setting inline opacity=0.
      // CSS suppresses that internal movement visually; the outer shell owns
      // the actual animation. Emit a semantic event for unrelated systems.
      if(card.style.opacity==="0"){
        window.dispatchEvent(new CustomEvent("farsi:graded",{detail:{know}}));
      }else{
        const shell=shellFor();
        resetShell(shell);
        answering=false;
      }
      return result;
    };

    const main=window.E?.main;
    if(main){
      new MutationObserver(()=>ensureShell()).observe(main,{childList:true});
    }
  });
})();
