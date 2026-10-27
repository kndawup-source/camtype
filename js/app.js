import { QUESTIONS } from '../data/questions.js';
import { buildProfile,getRecommendations,getType,getReasons } from './scoring.js';

const app=document.querySelector('#app');
const state={step:-1,answers:{}};

function shell(content,{admin=true}={}){
  app.innerHTML=`<header class="topbar"><div class="brand">CAMTYPE</div>${admin?'<a class="admin-link" href="./admin/">ADMIN</a>':''}</header>${content}`;
}

function start(){
  state.step=-1; state.answers={};
  shell(`
    <section class="start-screen">
      <h1>내 카메라<br>타입은?</h1>
      <p>좋아하는 사진과 촬영 방식을 고르면 나에게 맞는 카메라 조합을 찾아드립니다.</p>
      <div class="start-meta">10문항 · 약 1분</div>
      <button class="primary" id="startBtn">시작하기</button>
    </section>`);
  document.querySelector('#startBtn').onclick=()=>{state.step=0;renderQuestion();};
}

function renderQuestion(){
  const q=QUESTIONS[state.step];
  const options=q.options.map((o,i)=>{
    const imageBlock=q.type==='image_choice'
      ? `<div class="image-placeholder">${o.image?'IMAGE':'IMAGE SLOT'}</div>`
      : '';
    return `<button class="option ${q.type==='image_choice'?'image-option':''}" data-i="${i}">${imageBlock}<div class="${q.type==='image_choice'?'option-copy':''}"><strong>${o.label}</strong>${o.desc?`<span>${o.desc}</span>`:''}</div></button>`;
  }).join('');

  shell(`
    <section class="quiz-screen">
      <div class="quiz-head">
        <div class="step">${String(state.step+1).padStart(2,'0')} / ${String(QUESTIONS.length).padStart(2,'0')}</div>
        ${state.step>0?'<button class="back-btn" id="backBtn">이전</button>':'<span></span>'}
      </div>
      <div class="question-block">
        <h2 class="question-title">${q.title}</h2>
        ${q.kicker?`<p class="question-note">${q.kicker}</p>`:''}
      </div>
      <div class="options ${q.options.length>2?'multi':''}">${options}</div>
    </section>`);

  document.querySelectorAll('.option').forEach(btn=>btn.onclick=()=>choose(q,q.options[Number(btn.dataset.i)]));
  const back=document.querySelector('#backBtn');
  if(back) back.onclick=()=>{state.step--;renderQuestion();};
}

function choose(q,option){
  state.answers[q.id]=option;
  if(state.step<QUESTIONS.length-1){state.step++;renderQuestion();}
  else renderResult();
}

function renderResult(){
  const {profile,budget}=buildProfile(state.answers);
  const recs=getRecommendations(profile,budget);
  const type=getType(profile);
  const best=recs[0];
  const reasons=getReasons(profile,best);

  shell(`
    <section class="result-screen">
      <div class="result-hero">
        <div class="result-kicker">YOUR CAMTYPE</div>
        <h1 class="result-title">${type.name}</h1>
        <p class="result-line">${type.line}</p>
        <div class="product-slot">PRODUCT IMAGE SLOT</div>
        <div class="best-label">BEST MATCH</div>
        <div class="best-name">${best.brand} ${best.body}</div>
        <div class="best-lens">${best.lens}</div>
        <div class="match">${best.match}% MATCH</div>
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
    </section>`);

  document.querySelector('#detailBtn').onclick=()=>document.querySelector('#details').scrollIntoView({behavior:'smooth'});
  document.querySelector('#retryBtn').onclick=start;
  document.querySelector('#copyBtn').onclick=async()=>{
    const text=`나는 ${type.name}\n추천 조합: ${best.brand} ${best.body} + ${best.lens}`;
    try{await navigator.clipboard.writeText(text);document.querySelector('#copyBtn').textContent='복사됨';}catch{alert(text);}
  };
}

start();
