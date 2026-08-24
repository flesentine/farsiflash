// Keep the glass card visually anchored while the current answer leaves.
// The scheduler still advances normally, but only the text gets a small fade/slide.
(()=>{
  if(window.__farsiGradeAnimationFixV3)return;
  window.__farsiGradeAnimationFixV3=true;

  window.addEventListener("load",()=>{
    if(typeof grade!=="function")return;
    const baseGrade=grade;

    function visibleFace(card){
      if(!card)return null;
      const flipped=card.classList.contains("flip");
      return card.querySelector(flipped?".face.back":".face:not(.back)")||null;
    }

    function stripIds(node){
      node.removeAttribute("id");
      node.querySelectorAll("[id]").forEach(n=>n.removeAttribute("id"));
    }

    function stationaryShell(face){
      const shell=face.cloneNode(true);
      shell.classList.remove("back");
      stripIds(shell);
      shell.setAttribute("aria-hidden","true");
      Array.from(shell.children).forEach(n=>{n.style.visibility="hidden"});
      Object.assign(shell.style,{
        position:"absolute",inset:"0",width:"100%",height:"100%",margin:"0",
        transform:"none",backfaceVisibility:"visible",webkitBackfaceVisibility:"visible",
        pointerEvents:"none",zIndex:"59",opacity:"1",transition:"none"
      });
      return shell;
    }

    function contentGhost(face){
      const ghost=face.cloneNode(true);
      ghost.classList.remove("face","back");
      stripIds(ghost);
      ghost.setAttribute("aria-hidden","true");
      const cs=getComputedStyle(face);
      Object.assign(ghost.style,{
        position:"absolute",inset:"0",width:"100%",height:"100%",margin:"0",
        display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
        padding:cs.padding,borderRadius:cs.borderRadius,textAlign:"center",
        transform:"none",pointerEvents:"none",zIndex:"60",opacity:"1",transition:"none",
        background:"transparent",border:"0",boxShadow:"none",
        backdropFilter:"none",webkitBackdropFilter:"none"
      });
      return ghost;
    }

    function animateIncomingContent(card,move){
      const face=visibleFace(card);
      if(!face)return;
      const nodes=Array.from(face.children);
      if(!nodes.length)return;
      nodes.forEach(n=>{
        n.style.transition="none";
        n.style.opacity="0";
        n.style.transform=`translateX(${-move*8}px)`;
      });
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        nodes.forEach(n=>{
          n.style.transition="opacity .20s ease,transform .20s ease";
          n.style.opacity="1";
          n.style.transform="translateX(0)";
        });
      }));
      setTimeout(()=>{
        nodes.forEach(n=>{
          n.style.transition="";
          n.style.opacity="";
          n.style.transform="";
        });
      },240);
    }

    function animateVisibleFace(card,move){
      if(!card||!card.isConnected||card.dataset.exitFaceActive)return;
      const stage=card.parentElement;
      const face=visibleFace(card);
      if(!stage||!face)return;
      card.dataset.exitFaceActive="1";

      const shell=stationaryShell(face);
      const ghost=contentGhost(face);
      stage.appendChild(shell);
      stage.appendChild(ghost);

      // The scheduler moves the real card offscreen internally. Hide that movement,
      // while the stationary shell keeps the glass surface continuously visible.
      card.style.visibility="hidden";
      void ghost.offsetWidth;
      requestAnimationFrame(()=>{
        ghost.style.transition="transform .18s ease-out,opacity .16s ease";
        ghost.style.transform=`translateX(${move*18}px)`;
        ghost.style.opacity="0";
      });

      setTimeout(()=>{
        const nextCard=(window.E&&E.card&&E.card.isConnected)?E.card:card;
        if(nextCard&&nextCard.isConnected)nextCard.style.visibility="";
        ghost.remove();
        shell.remove();
        if(nextCard&&nextCard.isConnected)animateIncomingContent(nextCard,move);
        delete card.dataset.exitFaceActive;
      },225);
    }

    grade=function(know){
      if(!E?.card||!Q?.length)return baseGrade(know);
      // Again never reveals the reverse side; preserve exactly what is visible.
      animateVisibleFace(E.card,know?1:-1);
      return baseGrade(know);
    };
  });
})();
