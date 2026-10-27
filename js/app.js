import { QUESTIONS } from '../data/questions.js';
import { buildProfile,getRecommendations,getType,getReasons } from './scoring.js';

const app=document.querySelector('#app');
const state={step:-1,answers:{}};

function shell(content){
  app.innerHTML=`<div class="topbar"><div class="brand">CAMERA TYPE</div><a class="ghost-link" href="./admin/">ADMIN</a></div>${content}`;
}

function start(){
  state.step=-1; state.answers={};
  shell(`
    <section class="hero">
      <div class="eyebrow">Camera personality test</div>
      <h1>나한테 맞는<br>카메라는 뭘까?</h1>
      <p class="lead">스펙을 몰라도 괜찮아요. 평소 사진 취향과 촬영 습관만 고르면, 당신에게 잘 맞는 카메라 조합을 찾아드립니다.</p>
      <button class="cta" id="startBtn">테스트 시작</button>
      <div class="subtle">약 1분 · 10문항 · 결과는 바디 + 렌즈 조합으로 제공</div>
    </section>`);
  document.querySelector('#startBtn').onclick=()=>{state.step=0;renderQuestion();};
}

function renderQuestion(){
  const q=QUESTIONS[state.step];
  const pct=Math.round((state.step/QUESTIONS.length)*100);
  const options=q.options.map((o,i)=>{
    const imageBlock=q.type==='image_choice'?`<div class="image-placeholder">${o.image?`IMAGE`:'IMAGE SLOT · 나중에 어드민에서 등록'}</div>`:'';
    return `<button class="option ${q.type==='image_choice'?'image-option':''}" data-i="${i}">${imageBlock}<div class="${q.type==='image_choice'?'option-copy':''}"><strong>${o.label}</strong><span>${o.desc||''}</span></div></button>`;
  }).join('');
  shell(`
    <div class="progress-wrap"><div class="progress-meta"><span>${String(state.step+1).padStart(2,'0')} / ${QUESTIONS.length}</span><span>${pct}%</span></div><div class="progress"><span style="width:${pct}%"></span></div></div>
    <section class="question-wrap">
      ${state.step>0?'<button class="back-btn" id="backBtn">← 이전</button>':''}
      <div><div class="question-kicker">${q.kicker}</div><h2 class="question-title">${q.title}</h2></div>
      <div class="options ${q.options.length>2?'pill-grid':''}">${options}</div>
    </section>`);
  document.querySelectorAll('.option').forEach(btn=>btn.onclick=()=>choose(q,q.options[Number(btn.dataset.i)]));
  const back=document.querySelector('#backBtn'); if(back) back.onclick=()=>{state.step--;renderQuestion();};
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
    <section class="result">
      <span class="type-tag">YOUR CAMERA TYPE</span>
      <h1 class="result-title">${type.name}</h1>
      <p class="result-copy">${type.line}</p>

      <div class="match-card">
        <div class="match-label">BEST MATCH</div>
        <div class="match-name">${best.brand} ${best.body}</div>
        <div class="match-lens">+ ${best.lens}</div>
        <div class="match-score">${best.match}% MATCH</div>
        <div class="result-image">PRODUCT IMAGE SLOT · 추후 Supabase Storage 연결</div>
      </div>

      <section class="section">
        <h3>왜 이 조합일까요?</h3>
        <div class="reason-list">${reasons.map(r=>`<div class="reason"><b>${r.label}</b><span>${r.text}</span></div>`).join('')}</div>
      </section>

      <section class="section">
        <h3>다른 추천</h3>
        <div class="alt-list">${recs.slice(1).map((r,i)=>`<div class="alt-item"><div class="alt-rank">0${i+2}</div><div class="alt-name">${r.brand} ${r.body}<br><span style="font-weight:400;color:var(--muted);font-size:12px">${r.lens}</span></div><div class="alt-score">${r.match}%</div></div>`).join('')}</div>
      </section>

      <section class="section">
        <div class="note-card">전체 인기 조합, 같은 타입 사용자 통계, 이미지 업로드는 Supabase 연결 후 활성화하도록 구조만 분리해둔 상태입니다.</div>
      </section>

      <div class="result-actions"><button class="cta" id="retryBtn" style="margin-top:0">다시 하기</button><button class="secondary" id="copyBtn">결과 복사</button></div>
    </section>`);
  document.querySelector('#retryBtn').onclick=start;
  document.querySelector('#copyBtn').onclick=async()=>{
    const text=`나는 ${type.name}\n추천 조합: ${best.brand} ${best.body} + ${best.lens}`;
    try{await navigator.clipboard.writeText(text);document.querySelector('#copyBtn').textContent='복사됨';}catch{alert(text);}
  };
}

start();
