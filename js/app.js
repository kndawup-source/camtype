import { getQuestions,getCameras,getTypes,trackStart,trackResult } from './store.js';
import { buildProfile,getRecommendationSet,getType,getReasons } from './scoring.js';

let QUESTIONS=getQuestions(), CAMERAS=getCameras(), TYPES=getTypes();
const app=document.querySelector('#app');
const state={step:-1,answers:{},draft:null};

const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

function progressMarkup(){
  return `<div class="progress" aria-label="진행률">${QUESTIONS.map((_,i)=>`<span class="progress-segment ${i<state.step?'done':i===state.step?'current':''}"></span>`).join('')}</div>`;
}

function start(){
  state.step=-1; state.answers={}; state.draft=null;
  app.innerHTML=`<section class="screen start-screen">
    <div class="start-head"><div class="brand">CAMTYPE</div></div>
    <div class="start-content"><h1>나한테 맞는<br>카메라는 뭘까?</h1><p>복잡한 스펙 대신 취향과 사용 방식으로<br>나에게 맞는 카메라 조합을 찾아보세요.</p><div class="start-meta">10 questions · about 1 min</div></div>
    <div class="start-footer"><button class="primary" id="startBtn">시작하기</button></div>
  </section>`;
  document.querySelector('#startBtn').onclick=()=>{QUESTIONS=getQuestions();CAMERAS=getCameras();TYPES=getTypes();trackStart();state.step=0;prepareDraft();renderQuestion();};
}

function prepareDraft(){
  const q=QUESTIONS[state.step];
  if(q.type==='number_wheel'){
    const saved=state.answers[q.id]?.value;
    state.draft={id:`${q.id}-${saved??q.defaultValue}`,label:`${saved??q.defaultValue}${q.unit||''}`,value:saved??q.defaultValue};
  }else state.draft=state.answers[q.id]||null;
}

function renderQuestion(){
  const q=QUESTIONS[state.step];
  app.innerHTML=`<section class="screen quiz-screen">
    <div class="quiz-top">${progressMarkup()}</div>
    <div class="question-area"><div class="step-label">${String(state.step+1).padStart(2,'0')} / ${String(QUESTIONS.length).padStart(2,'0')}</div><h2 class="question-title">${esc(q.title)}</h2>${q.kicker?`<p class="question-note">${esc(q.kicker)}</p>`:''}</div>
    <div class="choice-area" id="choiceArea"></div>
    <div class="quiz-bottom"><button class="next-btn" id="nextBtn" ${state.draft?'':'disabled'}>다음</button><button class="prev-btn" id="prevBtn" ${state.step===0?'disabled':''}>이전</button></div>
  </section>`;
  q.type==='number_wheel'?renderWheel(q):renderOptions(q);
  document.querySelector('#nextBtn').onclick=commitAndNext;
  document.querySelector('#prevBtn').onclick=goBack;
}

function renderOptions(q){
  const area=document.querySelector('#choiceArea');
  area.innerHTML=`<div class="options ${q.options.length>=4?'compact-options':''}">${q.options.map((o,i)=>{
    const selected=state.draft?.id===o.id;
    return `<button class="option ${selected?'selected':''} ${o.image?'has-image':''}" data-i="${i}" aria-pressed="${selected}">
      ${o.image?`<img class="option-image" src="${esc(o.image)}" alt="">`:''}
      <div class="option-copy"><strong>${esc(o.label)}</strong>${o.desc?`<span>${esc(o.desc)}</span>`:''}</div>
    </button>`;
  }).join('')}</div>`;
  area.querySelectorAll('.option').forEach(btn=>btn.onclick=()=>{
    state.draft=q.options[Number(btn.dataset.i)];
    area.querySelectorAll('.option').forEach(el=>{const active=el===btn;el.classList.toggle('selected',active);el.setAttribute('aria-pressed',String(active));});
    document.querySelector('#nextBtn').disabled=false;
  });
}

function renderWheel(q){
  const values=[]; for(let v=q.min;v<=q.max;v+=q.step) values.push(v);
  const current=state.draft?.value??q.defaultValue, area=document.querySelector('#choiceArea');
  area.innerHTML=`<div class="wheel-wrap"><div class="wheel-fade-top"></div><div class="wheel-fade-bottom"></div><div class="wheel-center"></div><div class="wheel-list" id="wheelList">${values.map(v=>`<div class="wheel-item" data-value="${v}">${v}</div>`).join('')}</div><div class="wheel-unit">${esc(q.unit||'')}</div></div>`;
  const list=document.querySelector('#wheelList'),items=[...list.querySelectorAll('.wheel-item')],itemHeight=64; let raf=0;
  function sync(){const index=Math.max(0,Math.min(items.length-1,Math.round(list.scrollTop/itemHeight))),value=Number(items[index].dataset.value);state.draft={id:`${q.id}-${value}`,label:`${value}${q.unit||''}`,value};items.forEach((el,i)=>{const d=Math.abs(i-index);el.classList.toggle('active',d===0);el.classList.toggle('near',d===1);el.style.opacity=d>2?'.28':'1';});document.querySelector('#nextBtn').disabled=false;}
  list.addEventListener('scroll',()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(sync)},{passive:true});
  items.forEach((el,i)=>el.onclick=()=>list.scrollTo({top:i*itemHeight,behavior:'smooth'}));
  requestAnimationFrame(()=>{list.scrollTop=Math.max(0,values.indexOf(current))*itemHeight;sync();});
}

function commitAndNext(){if(!state.draft)return;const q=QUESTIONS[state.step];state.answers[q.id]=state.draft;if(state.step<QUESTIONS.length-1){state.step++;prepareDraft();renderQuestion();}else renderResult();}
function goBack(){if(state.step===0)return;state.step--;prepareDraft();renderQuestion();}

function productCard(item,label){
  if(!item)return '';
  return `<div class="recommend-card"><div class="recommend-label">${label}</div><div class="recommend-name">${esc(item.brand)} ${esc(item.body)}</div><div class="recommend-lens">${esc(item.lens)}</div><div class="recommend-meta"><span>${Number(item.price).toLocaleString()}만원</span></div></div>`;
}

function renderResult(){
  const {profile,constraints}=buildProfile(state.answers,QUESTIONS);
  const set=getRecommendationSet(profile,constraints,CAMERAS),type=getType(profile,TYPES),best=set.best;
  if(!best){app.innerHTML=`<section class="screen start-screen"><div class="start-head"><div class="brand">CAMTYPE</div></div><div class="start-content"><h1>예산 안에서<br>추천 조합을 찾지 못했어요.</h1><p>조건을 임의로 무시하지 않았습니다.<br>예산을 조정해 다시 확인해보세요.</p></div><div class="start-footer"><button class="primary" id="retryBtn">다시 하기</button></div></section>`;document.querySelector('#retryBtn').onclick=start;return;}
  const reasons=getReasons(profile,best);trackResult(type.id,best.id,state.answers);
  app.innerHTML=`<section class="result-screen"><div class="result-hero">
    <div class="result-top"><div class="result-kicker">YOUR CAMTYPE</div></div>
    <div class="result-main"><h1 class="result-title">${esc(type.name)}</h1><p class="result-line">${esc(type.line)}</p></div>
    <div class="product-slot">${best.image?`<img src="${esc(best.image)}" alt="${esc(best.brand)} ${esc(best.body)}">`:'PRODUCT IMAGE'}</div>
    <div class="best-block"><div class="best-label">BEST MATCH</div><div class="best-name">${esc(best.brand)} ${esc(best.body)}</div><div class="best-lens">${esc(best.lens)}</div><div class="best-meta"><span>${best.price}만원</span></div></div>
    <div class="result-bottom"><button class="secondary" id="detailBtn">결과 자세히 보기</button></div>
  </div>
  <section class="detail" id="details"><h3>왜 이 조합인가요?</h3><div class="reason-list">${reasons.map(r=>`<div class="reason"><b>${esc(r.label)}</b><span>${esc(r.text)}</span></div>`).join('')}</div></section>
  <section class="detail"><h3>다른 선택</h3>${productCard(set.lighter,'LIGHTER')}${productCard(set.value,'BETTER VALUE')}</section>
  <div class="actions"><button class="retry" id="retryBtn">다시 하기</button><button class="copy" id="copyBtn">결과 복사</button></div></section>`;
  document.querySelector('#detailBtn').onclick=()=>document.querySelector('#details').scrollIntoView({behavior:'smooth'});
  document.querySelector('#retryBtn').onclick=start;
  document.querySelector('#copyBtn').onclick=async()=>{const text=`나는 ${type.name}\n추천 조합: ${best.brand} ${best.body} + ${best.lens}`;try{await navigator.clipboard.writeText(text);document.querySelector('#copyBtn').textContent='복사됨';}catch{alert(text)}};
}
start();
