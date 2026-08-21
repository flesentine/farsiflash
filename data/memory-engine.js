// FSRS-6 memory scheduler for Farsi 2000.
// Uses real elapsed time, separate FA->EN / EN->FA memories, corrective feedback,
// short-term learning/relearning, and compact review history.
(()=>{
  const STATE_KEY_V5="farsi2000-v5";
  const LEGACY_KEY="farsi2000-v4";
  const DIR_PREF="farsi2000-direction";
  const MAX_LOGS=30000;
  const REVIEW_CHUNK=24;
  const FEEDBACK_MS=850;

  let memState=null;
  let scheduler=null;
  let memoryLast=null;
  let grading=false;
  let shownAt=performance.now();

  const parse=(raw,fallback)=>{try{return JSON.parse(raw)}catch{return fallback}};
  const dirNow=()=>localStorage.getItem(DIR_PREF)==="en"?"en":"fa";
  const keyFor=(fa,dir=dirNow())=>`${fa}\u241f${dir}`;
  const asMs=v=>{const n=Date.parse(v);return Number.isFinite(n)?n:Infinity};
  const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));

  function serializeCard(card){
    return {
      ...card,
      due:card.due instanceof Date?card.due.toISOString():new Date(card.due).toISOString(),
      last_review:card.last_review?(card.last_review instanceof Date?card.last_review.toISOString():new Date(card.last_review).toISOString()):null,
    };
  }

  function hydrateCard(card){
    if(!card)return null;
    return {
      ...card,
      due:new Date(card.due),
      last_review:card.last_review?new Date(card.last_review):undefined,
    };
  }

  function saveMemory(){
    if(!memState)return;
    if(memState.logs.length>MAX_LOGS)memState.logs=memState.logs.slice(-MAX_LOGS);
    localStorage.setItem(STATE_KEY_V5,JSON.stringify(memState));
  }

  function migrateLegacy(State){
    const existing=parse(localStorage.getItem(STATE_KEY_V5),null);
    if(existing&&existing.version===5&&existing.cards&&Array.isArray(existing.logs))return existing;

    const now=Date.now();
    const next={version:5,cards:{},logs:[],createdAt:new Date(now).toISOString(),migratedFrom:null};
    const old=parse(localStorage.getItem(LEGACY_KEY),null);
    if(old&&Array.isArray(old.known)){
      const oldReview=old.review||{};
      const intervals=[1,3,7,14,30];
      for(const fa of old.known){
        const level=Math.max(1,Math.min(5,Number(oldReview[fa])||1));
        const days=intervals[level-1];
        const jitter=.72+Math.random()*.42;
        const due=new Date(now+days*jitter*86400000);
        next.cards[keyFor(fa,"fa")]=serializeCard({
          due,
          stability:days,
          difficulty:5,
          elapsed_days:0,
          scheduled_days:days,
          reps:Math.max(2,level+1),
          lapses:0,
          learning_steps:0,
          state:State.Review,
          last_review:new Date(now),
        });
      }
      next.migratedFrom="farsi2000-v4";
      next.migratedAt=new Date(now).toISOString();
    }
    localStorage.setItem(STATE_KEY_V5,JSON.stringify(next));
    return next;
  }

  function cardState(c,dir=dirNow()){
    return memState.cards[keyFor(c.fa,dir)]||null;
  }

  function isKnown(c,State,dir=dirNow()){
    const m=cardState(c,dir);
    return !!m&&m.state===State.Review;
  }

  function syncLegacyKnown(State){
    const d=dirNow();
    K=new Set(D.filter(c=>isKnown(c,State,d)).map(c=>c.fa));
  }

  function shuffleCopy(a){
    const out=a.slice();
    for(let n=out.length-1;n>0;n--){
      const j=Math.floor(Math.random()*(n+1));
      [out[n],out[j]]=[out[j],out[n]];
    }
    return out;
  }

  function spreadDueByStage(cards){
    const pool=cards.slice();
    const out=[];
    let lastStage="";
    while(pool.length){
      const look=Math.min(pool.length,12);
      let pick=0;
      for(let n=0;n<look;n++){
        if(pool[n].stage!==lastStage){pick=n;break}
      }
      const [c]=pool.splice(pick,1);
      out.push(c);
      lastStage=c.stage;
    }
    return out;
  }

  function memoryMakeDeck(State){
    const d=dirNow(),now=Date.now();
    const dueCards=[];
    const unseen=[];
    for(const c of D){
      const m=cardState(c,d);
      if(!m)unseen.push(c);
      else if(asMs(m.due)<=now)dueCards.push(c);
    }
    dueCards.sort((a,b)=>asMs(cardState(a,d).due)-asMs(cardState(b,d).due));

    let newChunk=[];
    if(unseen.length){
      const stage=unseen[0].stage;
      newChunk=shuffleCopy(unseen.filter(c=>c.stage===stage).slice(0,REVIEW_CHUNK));
    }

    Q=[...spreadDueByStage(dueCards),...newChunk];
    i=0;
    syncLegacyKnown(State);
  }

  function counts(State){
    const d=dirNow();
    let known=0,seen=0;
    for(const c of D){
      const m=cardState(c,d);
      if(m){seen++;if(m.state===State.Review)known++}
    }
    return {known,seen,left:TOTAL-known};
  }

  function nextDueText(){
    const d=dirNow();
    let soon=Infinity;
    for(const c of D){
      const m=cardState(c,d);
      if(m)soon=Math.min(soon,asMs(m.due));
    }
    if(!Number.isFinite(soon))return "";
    const delta=soon-Date.now();
    if(delta<=0)return "Review ready now.";
    const mins=Math.ceil(delta/60000);
    if(mins<60)return `Next review in about ${mins} min.`;
    const hours=Math.ceil(mins/60);
    if(hours<36)return `Next review in about ${hours} hr.`;
    const days=Math.ceil(hours/24);
    return `Next review in about ${days} day${days===1?"":"s"}.`;
  }

  function answerIsVisible(){
    if(!E?.card)return false;
    return dirNow()==="fa"?!!flip:!flip;
  }

  function revealCorrectAnswer(){
    if(!E?.card)return;
    flip=dirNow()==="fa";
    E.card.classList.toggle("flip",flip);
    E.card.style.transform="";
  }

  function compactLog(c,dir,rating,responseMs,before,next,retrievability){
    memState.logs.push([
      Date.now(),c.fa,dir,rating,Math.round(responseMs),
      before?.due||null,next.due,
      Number(next.stability||0),Number(next.difficulty||0),
      Number.isFinite(retrievability)?Number(retrievability.toFixed(4)):null,
    ]);
  }

  window.addEventListener("load",()=>{
    const lib=window.TSFSRS;
    if(!lib?.fsrs||!lib?.createEmptyCard){
      console.error("FSRS browser bundle did not load; keeping legacy scheduler.");
      return;
    }

    const {createEmptyCard,fsrs,Rating,State}=lib;
    scheduler=fsrs({
      request_retention:.90,
      maximum_interval:36500,
      enable_fuzz:true,
      enable_short_term:true,
      learning_steps:["1m","10m"],
      relearning_steps:["10m"],
    });
    memState=migrateLegacy(State);

    const legacyRender=render;

    makeDeck=function(){memoryMakeDeck(State);saveMemory()};

    render=function(){
      if(!Q.length){
        makeDeck();
        if(!Q.length){
          const n=counts(State);
          E.main.innerHTML=`<div class="done"><h1>Caught up ✓</h1><p>${nextDueText()||"No review is due right now."}</p></div>`;
          E.stageName.textContent=dirNow()==="fa"?"FA→EN":"EN→FA";
          E.known.textContent=n.known;
          E.leftCount.textContent=n.left;
          shownAt=performance.now();
          return;
        }
      }
      syncLegacyKnown(State);
      legacyRender();
      const n=counts(State);
      E.known.textContent=n.known;
      E.leftCount.textContent=n.left;
      shownAt=performance.now();
    };

    grade=function(know){
      if(grading||!Q.length)return;
      const c=current();
      if(!c)return;
      const dir=dirNow();
      const k=keyFor(c.fa,dir);
      const oldStored=clone(memState.cards[k]||null);
      const oldLogLen=memState.logs.length;
      const responseMs=Math.max(0,performance.now()-shownAt);
      const wasAnswerVisible=answerIsVisible();
      grading=true;

      const apply=()=>{
        const now=new Date();
        const input=oldStored?hydrateCard(oldStored):createEmptyCard(now);
        let retrievability=0;
        try{if(input.state!==State.New)retrievability=scheduler.get_retrievability(input,now,false)}catch{}
        const result=scheduler.next(input,now,know?Rating.Good:Rating.Again);
        const next=serializeCard(result.card);
        memState.cards[k]=next;
        compactLog(c,dir,know?"good":"again",responseMs,oldStored,next,retrievability);
        memoryLast={card:c,dir,key:k,oldStored,oldLogLen};
        saveMemory();

        const move=know?1:-1;
        // Preserve whichever face the learner is already looking at while the
        // card exits. If they flipped to the answer, it should slide away as-is.
        E.card.classList.toggle("flip",flip);
        E.card.style.transition="transform .16s ease,opacity .14s";
        E.card.style.transform=cardTransform(move*innerWidth,move*9);
        E.card.style.opacity=0;
        setTimeout(()=>{
          steps++;
          makeDeck();
          E.undo.classList.add("show");
          grading=false;
          if(E.card)E.card.style.transition="none";
          render();
          requestAnimationFrame(()=>{if(E.card)E.card.style.transition=""});
        },200);
      };

      if(!know&&!wasAnswerVisible){
        revealCorrectAnswer();
        setTimeout(apply,FEEDBACK_MS);
      }else apply();
    };

    undo=function(){
      if(!memoryLast||grading)return;
      const u=memoryLast;
      if(u.oldStored)memState.cards[u.key]=u.oldStored;else delete memState.cards[u.key];
      memState.logs.length=u.oldLogLen;
      saveMemory();
      localStorage.setItem(DIR_PREF,u.dir);
      makeDeck();
      Q=Q.filter(x=>x.fa!==u.card.fa);
      Q.unshift(u.card);
      i=0;
      memoryLast=null;
      E.undo.classList.remove("show");
      render();
    };

    E.reset.onclick=()=>{
      if(!confirm("Reset all progress?"))return;
      memState={version:5,cards:{},logs:[],createdAt:new Date().toISOString(),migratedFrom:null};
      localStorage.setItem(STATE_KEY_V5,JSON.stringify(memState));
      localStorage.removeItem("farsi2000-v4");
      localStorage.removeItem("farsi2000-v3");
      localStorage.removeItem("farsi2000-v2");
      localStorage.removeItem("farsi2000-v1");
      K=new Set();miss={};review={};due={};steps=0;
      memoryLast=null;last=null;
      E.undo.classList.remove("show");
      makeDeck();render();
    };

    window.FARSI_DIRECTION_CHANGED=()=>{
      const previous=Q[i]?.fa||"";
      memoryLast=null;
      E.undo.classList.remove("show");
      makeDeck();
      if(previous&&Q.length>1&&Q[0].fa===previous)Q.push(Q.shift());
      render();
    };

    window.FARSI_MEMORY_DEBUG=()=>({
      version:memState.version,
      direction:dirNow(),
      counts:counts(State),
      cards:Object.keys(memState.cards).length,
      reviews:memState.logs.length,
      next:nextDueText(),
      retention:.90,
      scheduler:"FSRS-6",
    });

    makeDeck();
    render();
    document.documentElement.dataset.memoryEngine="fsrs6";
  });
})();
