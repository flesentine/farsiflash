// Animate a visual clone of the currently visible face while the real card is graded.
// This completely decouples the exit motion from the card's rotateY flip, so a
// revealed answer can never visibly flip back before it leaves the screen.
(()=>{
  window.addEventListener("load",()=>{
    if(typeof grade!=="function")return;
    const baseGrade=grade;

    function answerVisible(){
      const englishFirst=document.body.classList.contains("english-first");
      return englishFirst?!flip:!!flip;
    }

    function animateVisibleFace(original,move){
      if(!original||!original.isConnected||original.dataset.exitCloneActive)return;
      original.dataset.exitCloneActive="1";
      const stage=original.parentElement;
      if(!stage)return;

      const ghost=original.cloneNode(true);
      ghost.removeAttribute("id");
      ghost.querySelectorAll("[id]").forEach(n=>n.removeAttribute("id"));
      ghost.setAttribute("aria-hidden","true");
      ghost.style.position="absolute";
      ghost.style.inset="0";
      ghost.style.width="100%";
      ghost.style.height="100%";
      ghost.style.margin="0";
      ghost.style.pointerEvents="none";
      ghost.style.zIndex="40";
      ghost.style.transition="none";
      // Pin the same face the learner is seeing. Individual translate/rotate
      // properties below can now animate without touching rotateY.
      ghost.style.transform=flip?"rotateY(180deg)":"rotateY(0deg)";
      ghost.style.opacity="1";
      stage.appendChild(ghost);
      original.style.visibility="hidden";
      void ghost.offsetWidth;
      requestAnimationFrame(()=>{
        ghost.style.transition="translate .18s ease,rotate .18s ease,opacity .16s";
        ghost.style.translate=`${move*window.innerWidth}px 0`;
        ghost.style.rotate=`${move*9}deg`;
        ghost.style.opacity="0";
      });
      setTimeout(()=>{
        ghost.remove();
        original.style.visibility="";
        delete original.dataset.exitCloneActive;
      },210);
    }

    grade=function(know){
      if(!E?.card||!Q?.length)return baseGrade(know);
      const original=E.card;
      const move=know?1:-1;
      if(answerVisible()){
        // Manual flip already happened: slide that exact face away immediately.
        animateVisibleFace(original,move);
      }else if(!know){
        // Again without looking: memory-engine reveals corrective feedback for
        // 850 ms. Clone that revealed face just before its exit animation.
        setTimeout(()=>{
          if(original.isConnected&&E.card===original)animateVisibleFace(original,-1);
        },835);
      }
      return baseGrade(know);
    };
  });
})();
