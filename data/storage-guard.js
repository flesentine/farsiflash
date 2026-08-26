// Keep review history comfortably below browser/cloud storage limits without
// touching FSRS card scheduling state. Compaction runs before the memory engine
// loads and again when the page is leaving, never mid-study.
(()=>{
  if(window.__farsiStorageGuardV1)return;
  window.__farsiStorageGuardV1=true;

  const MEMORY_KEY="farsi2000-v5";
  const MAX_LOGS=12000;
  const TARGET_CHARS=1400000;
  const MIN_LOGS=4000;

  function parse(raw){try{return raw?JSON.parse(raw):null}catch{return null}}

  function compact(){
    const raw=localStorage.getItem(MEMORY_KEY);
    const memory=parse(raw);
    if(!memory||memory.version!==5||!Array.isArray(memory.logs))return false;
    if(memory.logs.length<=MAX_LOGS&&raw.length<=TARGET_CHARS)return false;

    let keep=Math.min(memory.logs.length,MAX_LOGS);
    let next={...memory,logs:memory.logs.slice(-keep)};
    let encoded=JSON.stringify(next);

    while(encoded.length>TARGET_CHARS&&keep>MIN_LOGS){
      keep=Math.max(MIN_LOGS,Math.floor(keep*.75));
      next={...memory,logs:memory.logs.slice(-keep)};
      encoded=JSON.stringify(next);
    }

    try{
      localStorage.setItem(MEMORY_KEY,encoded);
      console.info(`Farsi 2000: compacted review history to ${keep} recent logs.`);
      return true;
    }catch(err){
      console.warn("Farsi 2000: review history compaction failed",err);
      return false;
    }
  }

  compact();
  window.addEventListener("pagehide",compact,{capture:true});
})();
