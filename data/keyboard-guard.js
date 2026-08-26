// Prevent global study shortcuts from firing while the user is interacting
// with form controls, links, buttons, or editable UI such as the Sync modal.
(()=>{
  if(window.__farsiKeyboardGuardV1)return;
  window.__farsiKeyboardGuardV1=true;

  function isInteractiveTarget(target){
    if(!(target instanceof Element))return false;
    return !!target.closest('input,textarea,select,button,a,[contenteditable=""],[contenteditable="true"],[role="textbox"]');
  }

  document.addEventListener("keydown",event=>{
    if(!isInteractiveTarget(event.target))return;
    event.stopImmediatePropagation();
  },true);
})();
