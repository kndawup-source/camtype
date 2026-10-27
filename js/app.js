import { getQuestions,getCameras,getTypes,trackStart,trackResult } from './store.js';
import { buildProfile,getRecommendationSet,getType,getReasons } from './scoring.js';

let QUESTIONS=getQuestions(), CAMERAS=getCameras(), TYPES=getTypes();
const app=document.querySelector('#app');
const state={step:-1,answers:{},draft:null};
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;

function progressMarkup(){
  return `<div class="progress" aria-label="진행률">${QUESTIONS.map((_,i)=>`<span class="progress-segment ${i<state.step?'done':i===state.step?'current':''}"></span>`).join('')}</div>`;
}

function start(){
  state.step=-1; state.answers={}; state.draft=null;
  app.innerHTML=`<section class="screen start-screen">
    <div class="start-head"><div class="brand">CAMTYPE</div></div>
    <div class="start-content"><h1>나한테 맞는<br>카메라는 뭘까?</h1><p>복잡한 스펙 대신 취향과 사용 방식으로<br>나에게 맞는 카메라 조합을 찾아보세요.</p><div class="start-meta">${QUESTIONS.length} questions · about 1 min</div></div>
    <div class="start-footer"><button class="primary" id="startBtn">시작하기</button></div>
  </section>`;
  document.querySelector('#startBtn').onclick=()=>{QUESTIONS=getQuestions();CAMERAS=getCameras();TYPES=getTypes();trackStart();state.step=0;prepareDraft();renderQuestion();};
}

function mixWeights(left={},right={},t=.5){
  const out={},keys=new Set([...Object.keys(left||{}),...Object.keys(right||{})]);
  for(const k of keys) out[k]=num(left?.[k])*(1-t)+num(right?.[k])*t;
  return out;
}
function aggregateOptions(options=[]){
  const weights={},constraints={};
  for(const o of options){for(const [k,v] of Object.entries(o.weights||o.scores||{}))weights[k]=(weights[k]||0)+num(v);if(o.constraints)Object.assign(constraints,o.constraints);}
  return {weights,constraints};
}
function scaleAnswer(q,value){
  const min=num(q.min,0),max=num(q.max,100),t=max===min?0:(value-min)/(max-min);
  const weights=mixWeights(q.leftWeights,q.rightWeights,t);
  return {id:`${q.id}-${value}`,label:`${value}`,value,weights};
}
function tapScaleAnswer(q,value){
  const steps=Math.max(2,num(q.steps,5)),t=value/(steps-1),weights=mixWeights(q.leftWeights,q.rightWeights,t);
  return {id:`${q.id}-${value}`,label:`${value+1}/${steps}`,value,weights};
}

function prepareDraft(){
  const q=QUESTIONS[state.step],saved=state.answers[q.id];
  if(q.type==='number_wheel'){
    const value=saved?.value??q.defaultValue; state.draft={id:`${q.id}-${value}`,label:`${value}${q.unit||''}`,value};
  }else if(q.type==='ratio_slider'){
    state.draft=saved||scaleAnswer(q,saved?.value??q.defaultValue??50);
  }else if(q.type==='tap_scale'){
    state.draft=saved||tapScaleAnswer(q,saved?.value??q.defaultValue??Math.floor((q.steps||5)/2));
  }else if(q.type==='multi_choice'){
    state.draft=saved||null;
  }else state.draft=saved||null;
}

function renderQuestion(){
  const q=QUESTIONS[state.step];
  app.innerHTML=`<section class="screen quiz-screen">
    <div class="quiz-top">${progressMarkup()}</div>
    <div class="question-area"><div class="step-label">${String(state.step+1).padStart(2,'0')} / ${String(QUESTIONS.length).padStart(2,'0')}</div><h2 class="question-title">${esc(q.title)}</h2>${q.kicker?`<p class="question-note">${esc(q.kicker)}</p>`:''}</div>
    <div class="choice-area" id="choiceArea"></div>
    <div class="quiz-bottom"><button class="next-btn" id="nextBtn" ${state.draft?'':'disabled'}>다음</button><button class="prev-btn" id="prevBtn" ${state.step===0?'disabled':''}>이전</button></div>
  </section>`;
  if(q.type==='number_wheel')renderWheel(q);
  else if(q.type==='ratio_slider')renderRatio(q);
  else if(q.type==='tap_scale')renderTapScale(q);
  else if(q.type==='multi_choice')renderMultiChoice(q);
  else renderOptions(q);
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

function renderMultiChoice(q){
  const area=document.querySelector('#choiceArea'),selectedIds=new Set(state.draft?.selectedIds||[]),max=Math.max(1,num(q.maxSelections,2)),min=Math.max(1,num(q.minSelections,1));
  const paint=()=>{
    area.innerHTML=`<div class="multi-status">${selectedIds.size} / ${max} 선택</div><div class="options compact-options">${(q.options||[]).map((o,i)=>`<button class="option multi-option ${selectedIds.has(o.id)?'selected':''}" data-i="${i}" aria-pressed="${selectedIds.has(o.id)}"><div class="option-copy"><strong>${esc(o.label)}</strong>${o.desc?`<span>${esc(o.desc)}</span>`:''}</div><div class="multi-count">${selectedIds.has(o.id)?[...selectedIds].indexOf(o.id)+1:''}</div></button>`).join('')}</div>`;
    area.querySelectorAll('.multi-option').forEach(btn=>btn.onclick=()=>{
      const o=q.options[Number(btn.dataset.i)];
      if(selectedIds.has(o.id)) selectedIds.delete(o.id); else {if(selectedIds.size>=max)return;selectedIds.add(o.id);}
      const chosen=q.options.filter(o=>selectedIds.has(o.id)),agg=aggregateOptions(chosen);
      state.draft=chosen.length?{id:`${q.id}-${chosen.map(o=>o.id).join('+')}`,label:chosen.map(o=>o.label).join(', '),selectedIds:[...selectedIds],weights:agg.weights,constraints:agg.constraints}:null;
      document.querySelector('#nextBtn').disabled=selectedIds.size<min; paint();
    });
    document.querySelector('#nextBtn').disabled=selectedIds.size<min;
  };
  paint();
}

function renderRatio(q){
  const area=document.querySelector('#choiceArea'),min=num(q.min,0),max=num(q.max,100),step=Math.max(1,num(q.step,10)),value=num(state.draft?.value,q.defaultValue??50);
  area.innerHTML=`<div class="ratio-wrap"><div class="ratio-value" id="ratioValue"></div><input id="ratioRange" class="ratio-range" type="range" min="${min}" max="${max}" step="${step}" value="${value}"><div class="ratio-labels"><span>${esc(q.leftLabel||'왼쪽')}</span><span>${esc(q.rightLabel||'오른쪽')}</span></div></div>`;
  const range=document.querySelector('#ratioRange'),label=document.querySelector('#ratioValue');
  const sync=()=>{const v=num(range.value),pct=Math.round((v-min)/(max-min)*100),left=100-pct,right=pct;state.draft=scaleAnswer(q,v);label.innerHTML=`<strong>${esc(q.leftLabel||'왼쪽')} ${left}</strong><span>${esc(q.rightLabel||'오른쪽')} ${right}</span>`;range.style.setProperty('--fill',`${pct}%`);document.querySelector('#nextBtn').disabled=false;};
  range.addEventListener('input',sync,{passive:true});sync();
}

function renderTapScale(q){
  const area=document.querySelector('#choiceArea'),steps=Math.max(2,num(q.steps,5)),value=num(state.draft?.value,q.defaultValue??Math.floor(steps/2));
  area.innerHTML=`<div class="tap-scale-wrap"><div class="tap-scale-labels"><span>${esc(q.leftLabel||'낮음')}</span><span>${esc(q.rightLabel||'높음')}</span></div><div class="tap-scale" style="grid-template-columns:repeat(${steps},1fr)">${Array.from({length:steps},(_,i)=>`<button class="tap-point ${i===value?'selected':''}" data-v="${i}" aria-label="${i+1}단계"><span></span></button>`).join('')}</div><div class="tap-scale-value" id="tapScaleValue"></div></div>`;
  const valueEl=document.querySelector('#tapScaleValue');
  const sync=v=>{state.draft=tapScaleAnswer(q,v);area.querySelectorAll('.tap-point').forEach((b,i)=>b.classList.toggle('selected',i===v));const ratio=v/(steps-1);valueEl.textContent=ratio<.25?(q.leftLabel||'낮음'):ratio>.75?(q.rightLabel||'높음'):'중간쯤';document.querySelector('#nextBtn').disabled=false;};
  area.querySelectorAll('.tap-point').forEach(b=>b.onclick=()=>sync(num(b.dataset.v)));sync(value);
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
  return `<div class="recommend-card"><div class="recommend-label">${label}</div><div class="recommend-name">${esc(item.brand)} ${esc(item.body)}</div><div class="recommend-lens">${esc(item.lens)}</div><div class="recommend-meta"><span>추천 기준가 ${Number(item.price).toLocaleString()}만원</span><span>${item.weight?` · 약 ${item.weight}g`:``}</span></div></div>`;
}

function renderPhoneFirst(){
  const type=TYPES.find(t=>t.id==='phone-first')||{id:'phone-first',name:'PHONE FIRST',line:'카메라를 추천하려고 했는데, 조건을 다 맞춰보니 아이폰이 이겼습니다.'};
  trackResult(type.id,null,state.answers);
  app.innerHTML=`<section class="result-screen"><div class="result-hero phone-result">
    <div class="result-top"><div class="result-kicker">YOUR CAMTYPE</div></div>
    <div class="result-main"><h1 class="result-title">${esc(type.name)}</h1><p class="result-line">${esc(type.line)}</p></div>
    <div class="phone-card"><div class="phone-word">iPhone</div><p>가볍고, 바로 꺼내 찍을 수 있고,<br>추가 렌즈도 필요 없으니까요.</p></div>
    <div class="phone-copy"><strong>지금 조건이라면<br>카메라를 굳이 살 필요가 없어요.</strong><span>예산이나 무게 조건을 넓히면 다시 카메라 조합을 찾아볼 수 있어요.</span></div>
    <div class="result-bottom"><button class="secondary" id="retryBtn">조건 바꿔보기</button></div>
  </div></section>`;
  document.querySelector('#retryBtn').onclick=start;
}

function renderResult(){
  const {profile,constraints,traitPotential}=buildProfile(state.answers,QUESTIONS);
  const set=getRecommendationSet(profile,constraints,CAMERAS),type=getType(profile,TYPES,traitPotential),best=set.best;
  if(!best){renderPhoneFirst();return;}
  const reasons=getReasons(profile,best);trackResult(type.id,best.id,state.answers);
  app.innerHTML=`<section class="result-screen"><div class="result-hero">
    <div class="result-top"><div class="result-kicker">YOUR CAMTYPE</div></div>
    <div class="result-main"><h1 class="result-title">${esc(type.name)}</h1><p class="result-line">${esc(type.line)}</p></div>
    <div class="product-slot">${best.image?`<img src="${esc(best.image)}" alt="${esc(best.brand)} ${esc(best.body)}">`:'PRODUCT IMAGE'}</div>
    <div class="best-block"><div class="best-label">BEST MATCH</div><div class="best-name">${esc(best.brand)} ${esc(best.body)}</div><div class="best-lens">${esc(best.lens)}</div><div class="best-meta"><span>추천 기준가 ${best.price}만원</span><span>${best.weight?` · 약 ${best.weight}g`:``}</span></div><div class="price-note">${esc(best.priceType||'추천 기준가')} · ${esc(best.priceAsOf||best.verifiedAt||'')} 기준</div></div>
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
