// FSRS-6 memory scheduler for Farsi 2000.
// Uses real elapsed time, separate manual FA->EN / EN->FA memories, corrective
// feedback, short-term learning/relearning, and adaptive reverse-recall checks.
(()=>{
  if(window.__farsiMemoryEngineV6)return;
  window.__farsiMemoryEngineV6=true;

  const STATE_KEY_V5="farsi2000-v5";
  const LEGACY_KEY="farsi2000-v4";
  const DIR_PREF="farsi2000-direction";
  const MEMORY_VERSION=6;
  const KEY_MODE="id";
  const KEY_SEP="\u241f";
  const MAX_LOGS=30000;
  const REVIEW_CHUNK=24;
  const AUTO_REVERSE_GOODS=4;

  let memState=null;
  let scheduler=null;
  let memoryLast=null;
  let grading=false;
  let shownAt=performance.now();

  const parse=(raw,fallback)=>{try{return JSON.parse(raw)}catch{return fallback}};
  const dirNow=()=>localStorage.getItem(DIR_PREF)==="en"?"en":"fa";
  const activeDirNow=()=>window.FARSI_ACTIVE_DIRECTION==="en"?"en":dirNow();
  const keyFor=(id,dir=dirNow())=>`${id}${KEY_SEP}${dir}`;
  const normalizeFa=value=>String(value||"")
    .normalize("NFC")
    .replace(/[\u064B-\u0652\u0670]/g,"")
    .replace(/\u200c/g,"")
    .replace(/ي/g,"ی")
    .replace(/ك/g,"ک")
    .trim();
  const asMs=v=>{const n=Date.parse(v);return Number.isFinite(n)?n:Infinity};
  const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
  const hasOwn=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);

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

  function normalizeMemory(state){
    if(!state.reverseProgress||typeof state.reverseProgress!=="object"||Array.isArray(state.reverseProgress))state.reverseProgress={};
    if(!Array.isArray(state.logs))state.logs=[];
    if(!state.cards||typeof state.cards!=="object"||Array.isArray(state.cards))state.cards={};
    return state;
  }

  function idsForPrimaryForm(value){
    const target=normalizeFa(value);
    if(!target)return [];
    return D.filter(card=>normalizeFa(card.fa)===target).map(card=>card.id);
  }

  function idsForAnyForm(value){
    const target=normalizeFa(value);
    if(!target)return [];
    const out=[];
    const seen=new Set();
    for(const card of D){
      for(const form of [card.fa,card.spokenFa,card.formalFa]){
        if(normalizeFa(form)!==target)continue;
        if(!seen.has(card.id)){seen.add(card.id);out.push(card.id)}
        break;
      }
    }
    return out;
  }

  function idsForLegacyToken(value){
    const token=String(value||"");
    if(D.some(card=>card.id===token))return [token];
    return idsForAnyForm(token);
  }

  function splitLegacyKey(key){
    const raw=String(key||"");
    const at=raw.lastIndexOf(KEY_SEP);
    if(at<0)return {entity:raw,dir:"fa"};
    return {entity:raw.slice(0,at),dir:raw.slice(at+KEY_SEP.length)||"fa"};
  }

  function makeReviewCard(State,days,now){
    return serializeCard({
      due:new Date(now+days*(.72+Math.random()*.42)*86400000),
      stability:days,
      difficulty:5,
      elapsed_days:0,
      scheduled_days:days,
      reps:Math.max(2,days>=30?6:days>=14?5:days>=7?4:days>=3?3:2),
      lapses:0,
      learning_steps:0,
      state:State.Review,
      last_review:new Date(now),
    });
  }

  function upgradeFsrsV5(state){
    const old=normalizeMemory(clone(state));
    const next={
      ...old,
      version:MEMORY_VERSION,
      keyMode:KEY_MODE,
      cards:{},
      logs:[],
      reverseProgress:{},
      migratedKeySchemaFrom:"fa",
      migratedKeySchemaAt:new Date().toISOString(),
    };

    for(const [legacyKey,stored] of Object.entries(old.cards)){
      const {entity,dir}=splitLegacyKey(legacyKey);
      for(const id of idsForPrimaryForm(entity)){
        const nextKey=keyFor(id,dir);
        const prior=next.cards[nextKey];
        if(!prior){
          next.cards[nextKey]=clone(stored);
          continue;
        }
        const priorTime=Date.parse(prior.last_review||"")||0;
        const storedTime=Date.parse(stored?.last_review||"")||0;
        if(storedTime>priorTime)next.cards[nextKey]=clone(stored);
      }
    }

    for(const row of old.logs){
      if(!Array.isArray(row)||!row[1])continue;
      const ids=idsForPrimaryForm(row[1]);
      for(const id of ids){
        const copy=clone(row);
        copy[1]=id;
        next.logs.push(copy);
      }
    }
    next.logs.sort((a,b)=>(Number(a?.[0])||0)-(Number(b?.[0])||0));
    if(next.logs.length>MAX_LOGS)next.logs=next.logs.slice(-MAX_LOGS);

    for(const [form,value] of Object.entries(old.reverseProgress)){
      for(const id of idsForPrimaryForm(form)){
        next.reverseProgress[id]=Math.max(Number(next.reverseProgress[id])||0,Number(value)||0);
      }
    }
    return normalizeMemory(next);
  }

  function migrateKnownState(source,State,sourceName){
    const now=Date.now();
    const intervals=[1,3,7,14,30];
    const next={
      version:MEMORY_VERSION,
      keyMode:KEY_MODE,
      cards:{},
      logs:[],
      reverseProgress:{},
      createdAt:new Date(now).toISOString(),
      migratedFrom:sourceName,
      migratedAt:new Date(now).toISOString(),
    };
    const oldReview=source?.review||{};
    for(const token of source?.known||[]){
      const ids=idsForLegacyToken(token);
      const level=Math.max(1,Math.min(5,Number(oldReview[token])||1));
      const days=intervals[level-1];
      for(const id of ids)next.cards[keyFor(id,"fa")]=makeReviewCard(State,days,now);
    }
    return next;
  }

  function saveMemory(){
    if(!memState)return;
    normalizeMemory(memState);
    memState.version=MEMORY_VERSION;
    memState.keyMode=KEY_MODE;
    if(memState.logs.length>MAX_LOGS)memState.logs=memState.logs.slice(-MAX_LOGS);
    localStorage.setItem(STATE_KEY_V5,JSON.stringify(memState));
  }

  function migrateLegacy(State){
    const existing=parse(localStorage.getItem(STATE_KEY_V5),null);
    if(existing&&existing.version===MEMORY_VERSION&&existing.keyMode===KEY_MODE&&existing.cards&&Array.isArray(existing.logs)){
      return normalizeMemory(existing);
    }

    if(existing&&existing.version===5&&existing.cards&&Array.isArray(existing.logs)){
      const upgraded=upgradeFsrsV5(existing);
      localStorage.setItem(STATE_KEY_V5,JSON.stringify(upgraded));
      return upgraded;
    }

    if(existing&&Array.isArray(existing.known)){
      const migrated=migrateKnownState(existing,State,"farsi2000-v5-legacy");
      localStorage.setItem(STATE_KEY_V5,JSON.stringify(migrated));
      return migrated;
    }

    const old=parse(localStorage.getItem(LEGACY_KEY),null);
    const next=old&&Array.isArray(old.known)
      ?migrateKnownState(old,State,"farsi2000-v4")
      :{
          version:MEMORY_VERSION,
          keyMode:KEY_MODE,
          cards:{},
          logs:[],
          reverseProgress:{},
          createdAt:new Date().toISOString(),
          migratedFrom:null,
        };
    localStorage.setItem(STATE_KEY_V5,JSON.stringify(next));
    return next;
  }

  function cardState(c,dir=dirNow()){
    return memState.cards[keyFor(c.id,dir)]||null;
  }

  function progressFor(c){
    normalizeMemory(memState);
    if(hasOwn(memState.reverseProgress,c.id)){
      const n=Number(memState.reverseProgress[c.id])||0;
      return Math.max(0,Math.min(AUTO_REVERSE_GOODS,n));
    }

    // Bootstrap existing users from their recent FA-first review history. Four
    // consecutive successful recognition reviews are enough to introduce the
    // harder English->Farsi production check.
    let streak=0;
    for(let n=memState.logs.length-1;n>=0;n--){
      const row=memState.logs[n];
      if(!Array.isArray(row)||row[1]!==c.id||row[2]!=="fa")continue;
      const mode=row[10]||"normal";
      if(mode==="reverse"){
        streak=row[3]==="again"?AUTO_REVERSE_GOODS:0;
        break;
      }
      if(row[3]==="good"){
        streak++;
        if(streak>=AUTO_REVERSE_GOODS)break;
      }else{
        streak=0;
        break;
      }
    }
    memState.reverseProgress[c.id]=Math.min(AUTO_REVERSE_GOODS,streak);
    return memState.reverseProgress[c.id];
  }

  function knownIds(State,dir=dirNow()){
    const out=new Set();
    for(const c of D){
      const m=cardState(c,dir);
      if(m?.state===State.Review)out.add(c.id);
    }
    return out;
  }

  function syncLegacyKnown(State){
    K=knownIds(State,dirNow());
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
      else if(asMs(m.due)<=now){
        const autoReverse=d==="fa"&&progressFor(c)>=AUTO_REVERSE_GOODS;
        dueCards.push({...c,_autoReverse:autoReverse});
      }
    }
    dueCards.sort((a,b)=>asMs(cardState(a,d).due)-asMs(cardState(b,d).due));

    let newChunk=[];
    if(unseen.length){
      const stage=unseen[0].stage;
      newChunk=shuffleCopy(unseen.filter(c=>c.stage===stage).slice(0,REVIEW_CHUNK))
        .map(c=>({...c,_autoReverse:false}));
    }

    Q=[...spreadDueByStage(dueCards),...newChunk];
    i=0;
    syncLegacyKnown(State);
  }

  function counts(State){
    const d=dirNow();
    let known=0,learning=0,seen=0;
    for(const c of D){
      const m=cardState(c,d);
      if(!m)continue;
      seen++;
      if(m.state===State.Review)known++;
      else learning++;
    }
    return {known,learning,seen,left:TOTAL-known-learning};
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
    return activeDirNow()==="fa"?!!flip:!flip;
  }

  function revealCorrectAnswer(){
    if(!E?.card)return;
    flip=activeDirNow()==="fa";
    E.card.classList.toggle("flip",flip);
    E.card.style.transform="";
  }

  function compactLog(c,dir,rating,responseMs,before,next,retrievability,mode="normal"){
    memState.logs.push([
      Date.now(),c.id,dir,rating,Math.round(responseMs),
      before?.due||null,next.due,
      Number(next.stability||0),Number(next.difficulty||0),
      Number.isFinite(retrievability)?Number(retrievability.toFixed(4)):null,
      mode,
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
          window.FARSI_ACTIVE_DIRECTION=dirNow();
          window.FARSI_AUTO_REVERSE=false;
          E.main.innerHTML=`<div class="done"><h1>Caught up ✓</h1><p>${nextDueText()||"No review is due right now."}</p></div>`;
          E.stageName.textContent=dirNow()==="fa"?"FA→EN":"EN→FA";
          E.known.textContent=n.known;
          E.learning.textContent=n.learning;
          E.leftCount.textContent=n.left;
          shownAt=performance.now();
          return;
        }
      }

      const c=current();
      const globalDir=dirNow();
      const autoReverse=globalDir==="fa"&&!!c?._autoReverse;
      window.FARSI_ACTIVE_DIRECTION=autoReverse?"en":globalDir;
      window.FARSI_AUTO_REVERSE=autoReverse;
      document.documentElement.dataset.reverseRecall=autoReverse?"1":"0";

      syncLegacyKnown(State);
      legacyRender();
      if(autoReverse&&c)E.stageName.textContent=`${c.stage} · Recall Farsi`;
      const n=counts(State);
      E.known.textContent=n.known;
      E.learning.textContent=n.learning;
      E.leftCount.textContent=n.left;
      shownAt=performance.now();
    };

    grade=function(know){
      if(grading||!Q.length)return;
      const c=current();
      if(!c)return;
      const dir=dirNow();
      const autoReverse=dir==="fa"&&!!c._autoReverse;
      const k=keyFor(c.id,dir);
      const oldStored=clone(memState.cards[k]||null);
      const oldLogLen=memState.logs.length;
      const hadReverseProgress=hasOwn(memState.reverseProgress,c.id);
      const oldReverseProgress=hadReverseProgress?memState.reverseProgress[c.id]:undefined;
      const progressBefore=dir==="fa"?progressFor(c):0;
      const responseMs=Math.max(0,performance.now()-shownAt);
      grading=true;

      const apply=()=>{
        const now=new Date();
        const input=oldStored?hydrateCard(oldStored):createEmptyCard(now);
        let retrievability=0;
        try{if(input.state!==State.New)retrievability=scheduler.get_retrievability(input,now,false)}catch{}
        const result=scheduler.next(input,now,know?Rating.Good:Rating.Again);
        const next=serializeCard(result.card);
        memState.cards[k]=next;

        if(dir==="fa"){
          if(autoReverse){
            // Passing the harder production test resets the recognition streak.
            // Failing keeps reverse recall armed for the next FSRS retry.
            memState.reverseProgress[c.id]=know?0:AUTO_REVERSE_GOODS;
          }else{
            memState.reverseProgress[c.id]=know
              ?Math.min(AUTO_REVERSE_GOODS,progressBefore+1)
              :0;
          }
        }

        compactLog(c,dir,know?"good":"again",responseMs,oldStored,next,retrievability,autoReverse?"reverse":"normal");
        memoryLast={card:c,dir,key:k,oldStored,oldLogLen,hadReverseProgress,oldReverseProgress};
        saveMemory();

        const move=know?1:-1;
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

      apply();
    };

    undo=function(){
      if(!memoryLast||grading)return;
      const u=memoryLast;
      if(u.oldStored)memState.cards[u.key]=u.oldStored;else delete memState.cards[u.key];
      memState.logs.length=u.oldLogLen;
      if(u.dir==="fa"){
        if(u.hadReverseProgress)memState.reverseProgress[u.card.id]=u.oldReverseProgress;
        else delete memState.reverseProgress[u.card.id];
      }
      saveMemory();
      localStorage.setItem(DIR_PREF,u.dir);
      makeDeck();
      Q=Q.filter(x=>x.id!==u.card.id);
      Q.unshift(u.card);
      i=0;
      memoryLast=null;
      E.undo.classList.remove("show");
      render();
    };

    E.reset.onclick=()=>{
      if(!confirm("Reset all progress?"))return;
      memState={version:MEMORY_VERSION,keyMode:KEY_MODE,cards:{},logs:[],reverseProgress:{},createdAt:new Date().toISOString(),migratedFrom:null};
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
      window.FARSI_ACTIVE_DIRECTION=dirNow();
      window.FARSI_AUTO_REVERSE=false;
      makeDeck();
      if(previous&&Q.length>1&&Q[0].fa===previous)Q.push(Q.shift());
      render();
    };

    window.FARSI_MEMORY_DEBUG=()=>({
      version:memState.version,
      direction:dirNow(),
      activeDirection:activeDirNow(),
      autoReverse:!!window.FARSI_AUTO_REVERSE,
      reverseAfterGoods:AUTO_REVERSE_GOODS,
      reverseReady:Object.values(memState.reverseProgress||{}).filter(n=>Number(n)>=AUTO_REVERSE_GOODS).length,
      counts:counts(State),
      cards:Object.keys(memState.cards).length,
      reviews:memState.logs.length,
      next:nextDueText(),
      retention:.90,
      scheduler:"FSRS-6",
    });

    makeDeck();
    render();
    document.documentElement.dataset.memoryEngine="fsrs6-reverse-recall";
  });
})();
