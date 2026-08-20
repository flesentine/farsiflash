// Keep a revealed answer on the same face while it slides away.
// The legacy card uses a class transform for the flip, while grading switches
// to an inline transform. Priming the inline transform prevents browsers from
// interpolating through a visible flip-back during the swipe animation.
(()=>{
  window.addEventListener("load",()=>{
    if(typeof grade!=="function"||typeof cardTransform!=="function")return;
    const baseGrade=grade;
    grade=function(know){
      if(E?.card&&flip){
        E.card.style.transition="none";
        E.card.style.transform=cardTransform(0,0);
        void E.card.offsetWidth;
        E.card.style.transition="";
      }
      return baseGrade(know);
    };
  });
})();
