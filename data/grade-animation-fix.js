// Slide a clone of the currently visible FACE, not the 3D card.
// Grade exits always preserve exactly what the learner is looking at.
(()=>{
  if(window.__farsiGradeAnimationFixV2)return;
  window.__farsiGradeAnimationFixV2=true;

  window.addEventListener("load",()=>{
    if(typeof grade!=="function")return;
    const baseGrade=grade;

    function visibleFace(card){
      return card?.querySelector(flip?".face.back":".face:not(.back)")||null;
    }

    function animateVisibleFace(card,move){
      if(!card||!card.isConnected||card.dataset.exitFaceActive)return;
      const stage=card.parentElement;
      const face=visibleFace(card);
      if(!stage||!face)return;
      card.dataset.exitFaceActive="1";

      const ghost=face.cloneNode(true);
      ghost.classList.remove("back");
      ghost.removeAttribute("id");
      ghost.querySelectorAll("[id]").forEach(n=>n.removeAttribute("id"));
      ghost.setAttribute("aria-hidden","true");
      Object.assign(ghost.style,{
        position:"absolute",inset:"0",width:"100%",height:"100%",margin:"0",
        transform:"none",backfaceVisibility:"visible",webkitBackfaceVisibility:"visible",
        pointerEvents:"none",zIndex:"60",opacity:"1",transition:"none"
      });
      stage.appendChild(ghost);
      card.style.visibility="hidden";
      void ghost.offsetWidth;
      requestAnimationFrame(()=>{
        ghost.style.transition="transform .18s ease,opacity .16s";
        ghost.style.transform=`translateX(${move*window.innerWidth}px) rotate(${move*9}deg)`;
        ghost.style.opacity="0";
      });
      setTimeout(()=>{
        ghost.remove();
        if(card.isConnected)card.style.visibility="";
        delete card.dataset.exitFaceActive;
      },220);
    }

    grade=function(know){
      if(!E?.card||!Q?.length)return baseGrade(know);
      // Never reveal or flip on Again. Slide away the exact face currently shown.
      animateVisibleFace(E.card,know?1:-1);
      return baseGrade(know);
    };
  });
})();
