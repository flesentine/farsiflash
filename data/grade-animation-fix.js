// Slide a clone of the currently visible FACE, not the 3D card.
// This guarantees a revealed answer never rotates back before leaving.
(()=>{
  window.addEventListener("load",()=>{
    if(typeof grade!=="function")return;
    const baseGrade=grade;

    function answerVisible(){
      const englishFirst=document.body.classList.contains("english-first");
      return englishFirst?!flip:!!flip;
    }

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
      const card=E.card;
      if(answerVisible()){
        animateVisibleFace(card,know?1:-1);
      }else if(!know){
        // memory-engine reveals the answer for 850ms first.
        setTimeout(()=>{
          if(card.isConnected&&E.card===card)animateVisibleFace(card,-1);
        },825);
      }
      return baseGrade(know);
    };
  });
})();
