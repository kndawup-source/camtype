import { getQuestions,getCameras,getTypes,trackStart,trackResult } from './store.js';
import { buildProfile,getRecommendations,getType,getReasons } from './scoring.js';

let QUESTIONS=getQuestions();
let CAMERAS=getCameras();
let TYPES=getTypes();

const app=document.querySelector('#app');
const state={step:-1,answers:{},draft:null};

function progressMarkup(){
  return `<div class="progress" aria-label="진행률">${QUESTIONS.map((_,i)=>`<span class="progress-segment ${i<state.step?'done':i===state.step?'current':''}"></span>`).join('')}</div>`;
}

function start(){
  state.step=-1; state.answers={}; state.draft=null;
  app.innerHTML=`
    <section class="screen start-screen">
      <div class="start-head"><div class="brand">CAMTYPE</div><a class="admin-link" href="./admin/">ADMIN</a></div>
      <div class="start-content">
        <h1>나한테 맞는<br>카메라는 뭘까?</h1>
        <p>사진 취향과 촬영 습관을 고르면<br>나에게 맞는 카메라 조합을 찾아드려요.</p>
        <div class="start-meta">10 questions · about 1 min</div>
      </div>
      <div class="start-footer"><button class="primary" id="startBtn">시작하기</button></div>
    </section>`;
  document.querySelector('#startBtn').onclick=()=>{QUESTIONS=getQuestions();CAMERAS=getCameras();TYPES=getTypes();trackStart();state.step=0;prepareDraft();renderQuestion();};
}

function prepareDraft(){
  const q=QUESTIONS[state.step];
  if(q.type==='number_wheel'){
    const saved=state.answers[q.id]?.value;
    state.draft={id:'wheel',label:`${saved ?? q.defaultValue}${q.unit||''}`,value:saved ?? q.defaultValue};
  }else{
    state.draft=state.answers[q.id] || null;
  }
}

function renderQuestion(){
  const q=QUESTIONS[state.step];
  app.innerHTML=`
    <section class="screen quiz-screen">
      <div class="quiz-top">
        ${progressMarkup()}
        <button class="close-btn" id="closeBtn" aria-label="테스트 종료">×</button>
      </div>
      <div class="question-area">
        <h2 class="question-title">${q.title}</h2>
        ${q.kicker?`<p class="question-note">${q.kicker}</p>`:''}
      </div>
      <div class="choice-area" id="choiceArea"></div>
      <div class="quiz-bottom">
        <button class="next-btn" id="nextBtn" ${state.draft?'':'disabled'}>다음</button>
        <button class="prev-btn" id="prevBtn" ${state.step===0?'disabled':''}>이전</button>
      </div>
    </section>`;

  if(q.type==='number_wheel') renderWheel(q);
  else renderOptions(q);

  document.querySelector('#nextBtn').onclick=commitAndNext;
  document.querySelector('#prevBtn').onclick=goBack;
  document.querySelector('#closeBtn').onclick=start;
}

function renderOptions(q){
  const area=document.querySelector('#choiceArea');
  area.innerHTML=`<div class="options">${q.options.map((o,i)=>{
    const selected=state.draft?.id===o.id;
    const image=o.image?`<img class="option-image" src="${o.image}" alt="" />`:'';
    return `<button class="option ${selected?'selected':''} ${o.image?'has-image':''}" data-i="${i}" aria-pressed="${selected}">
      ${image}
      <div class="option-copy"><strong>${o.label}</strong>${o.desc?`<span>${o.desc}</span>`:''}</div>
      ${o.image?'':`<div class="option-index">${String(i+1).padStart(2,'0')}</div>`}
    </button>`;
  }).join('')}</div>`;

  area.querySelectorAll('.option').forEach(btn=>{
    btn.onclick=()=>{
      state.draft=q.options[Number(btn.dataset.i)];
      area.querySelectorAll('.option').forEach(el=>{
        const active=Number(el.dataset.i)===Number(btn.dataset.i);
        el.classList.toggle('selected',active);
        el.setAttribute('aria-pressed',String(active));
      });
      document.querySelector('#nextBtn').disabled=false;
    };
  });
}

function renderWheel(q){
  const values=[];
  for(let v=q.min;v<=q.max;v+=q.step) values.push(v);
  const current=state.draft?.value ?? q.defaultValue;
  const area=document.querySelector('#choiceArea');
  area.innerHTML=`
    <div class="wheel-wrap">
      <div class="wheel-fade-top"></div><div class="wheel-fade-bottom"></div>
      <div class="wheel-center"></div>
      <div class="wheel-list" id="wheelList">
        ${values.map(v=>`<div class="wheel-item" data-value="${v}">${v}</div>`).join('')}
      </div>
      <div class="wheel-unit">${q.unit||''}</div>
    </div>`;

  const list=document.querySelector('#wheelList');
  const items=[...list.querySelectorAll('.wheel-item')];
  const itemHeight=64;
  let raf=0;

  function sync(){
    const index=Math.max(0,Math.min(items.length-1,Math.round(list.scrollTop/itemHeight)));
    const value=Number(items[index].dataset.value);
    state.draft={id:`${q.id}-${value}`,label:`${value}${q.unit||''}`,value};
    items.forEach((el,i)=>{
      const d=Math.abs(i-index);
      el.classList.toggle('active',d===0);
      el.classList.toggle('near',d===1);
      el.style.opacity=d>2?'.35':'1';
    });
    document.querySelector('#nextBtn').disabled=false;
  }

  list.addEventListener('scroll',()=>{
    cancelAnimationFrame(raf);
    raf=requestAnimationFrame(sync);
  },{passive:true});

  items.forEach((el,i)=>el.onclick=()=>list.scrollTo({top:i*itemHeight,behavior:'smooth'}));
  requestAnimationFrame(()=>{
    const idx=Math.max(0,values.indexOf(current));
    list.scrollTop=idx*itemHeight;
    sync();
  });
}

function commitAndNext(){
  if(!state.draft) return;
  const q=QUESTIONS[state.step];
  state.answers[q.id]=state.draft;
  if(state.step<QUESTIONS.length-1){
    state.step++;
    prepareDraft();
    renderQuestion();
  }else renderResult();
}

function goBack(){
  if(state.step===0) return;
  state.step--;
  prepareDraft();
  renderQuestion();
}

function renderResult(){
  const {profile,budget}=buildProfile(state.answers);
  const recs=getRecommendations(profile,budget,CAMERAS);
  const type=getType(profile,TYPES);
  const best=recs[0] || CAMERAS[0];
  const reasons=getReasons(profile,best);
  trackResult(type.id,best.id);
  const productVisual=best.image?`<img src="${best.image}" alt="${best.brand} ${best.body}" />`:'PRODUCT IMAGE';

  app.innerHTML=`
    <section class="result-screen">
      <div class="result-hero">
        <div class="result-top"><div class="result-kicker">YOUR CAMTYPE</div><button class="close-btn" id="closeBtn" aria-label="처음으로">×</button></div>
        <div class="result-main">
          <h1 class="result-title">${type.name}</h1>
          <p class="result-line">${type.line}</p>
        </div>
        <div class="product-slot">${productVisual}</div>
        <div class="best-block">
          <div class="best-label">BEST MATCH</div>
          <div class="best-name">${best.brand} ${best.body}</div>
          <div class="best-lens">${best.lens}</div>
          <div class="match">${best.match}% MATCH</div>
        </div>
        <div class="result-bottom"><button class="secondary" id="detailBtn">추천 이유 보기</button></div>
      </div>

      <section class="detail" id="details">
        <h3>추천 이유</h3>
        <div class="reason-list">${reasons.map(r=>`<div class="reason"><b>${r.label}</b><span>${r.text}</span></div>`).join('')}</div>
      </section>
      <section class="detail">
        <h3>다른 추천</h3>
        <div class="alt-list">${recs.slice(1).map((r,i)=>`<div class="alt-item"><div class="alt-rank">0${i+2}</div><div class="alt-name">${r.brand} ${r.body}<small>${r.lens}</small></div><div class="alt-score">${r.match}%</div></div>`).join('')}</div>
      </section>
      <div class="actions"><button class="retry" id="retryBtn">다시 하기</button><button class="copy" id="copyBtn">결과 복사</button></div>
    </section>`;

  document.querySelector('#detailBtn').onclick=()=>document.querySelector('#details').scrollIntoView({behavior:'smooth'});
  document.querySelector('#retryBtn').onclick=start;
  document.querySelector('#closeBtn').onclick=start;
  document.querySelector('#copyBtn').onclick=async()=>{
    const text=`나는 ${type.name}\n추천 조합: ${best.brand} ${best.body} + ${best.lens}`;
    try{await navigator.clipboard.writeText(text);document.querySelector('#copyBtn').textContent='복사됨';}catch{alert(text);}
  };
}

start();
