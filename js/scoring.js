const LABELS={portable:'휴대성',mood:'분위기/감성',film:'필름 색감',clean:'깨끗한 색',technical:'완성도',performance:'성능',simple:'간편함',control:'조작하는 재미',snapshot:'순간 포착',planned:'계획 촬영',street:'일상/거리',portrait:'인물',travel:'여행',family:'가족/아이',af:'AF',photo:'사진',video:'영상',oneLens:'렌즈 하나로 간편하게',swapLens:'렌즈 교환'};
const DEFAULT_IMPORTANCE=1,EPS=1e-9;
const safeNum=(v,f=0)=>{const n=Number(v);return Number.isFinite(n)?n:f};
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

export function buildProfile(answers,questions=[]){
  const profile={},constraints={budget:null,maxWeight:null,interchangeable:null},contributions={};
  for(const q of questions){
    if(q.active===false) continue;
    const ans=answers[q.id]; if(!ans) continue;
    if(q.type==='number_wheel'&&q.hardConstraint) constraints[q.hardConstraint]=safeNum(ans.value,null);
    if(ans.constraints&&typeof ans.constraints==='object') Object.assign(constraints,ans.constraints);
    const raw=ans.weights||ans.scores||{},positive=Object.entries(raw).filter(([,v])=>safeNum(v)>0),total=positive.reduce((s,[,v])=>s+safeNum(v),0);
    if(!total) continue;
    const imp=clamp(safeNum(q.importance,DEFAULT_IMPORTANCE),0,3); contributions[q.id]={};
    for(const [key,val] of positive){const n=(safeNum(val)/total)*imp;profile[key]=(profile[key]||0)+n;contributions[q.id][key]=n;}
  }
  const traitPotential={};
  for(const q of questions){
    if(q.active===false||q.type==='number_wheel')continue;
    const imp=clamp(safeNum(q.importance,DEFAULT_IMPORTANCE),0,3);
    const perQ={};
    for(const opt of q.options||[]){
      const raw=opt.weights||opt.scores||{},positive=Object.entries(raw).filter(([,v])=>safeNum(v)>0),total=positive.reduce((sum,[,v])=>sum+safeNum(v),0);
      if(!total)continue;
      for(const [key,val] of positive){const n=(safeNum(val)/total)*imp;perQ[key]=Math.max(perQ[key]||0,n);}
    }
    for(const [key,val] of Object.entries(perQ))traitPotential[key]=(traitPotential[key]||0)+val;
  }
  return {profile,constraints,contributions,traitPotential};
}

export function normalizeProfile(profile){const sum=Object.values(profile).reduce((a,v)=>a+Math.max(0,safeNum(v)),0);if(sum<=EPS)return{};return Object.fromEntries(Object.entries(profile).map(([k,v])=>[k,Math.max(0,safeNum(v))/sum]));}

function passesConstraints(camera,constraints){
  if(camera.active===false||camera.available===false||camera.status==='discontinued')return false;
  const budget=safeNum(constraints?.budget,null); if(budget!==null&&safeNum(camera.price,Infinity)>budget)return false;
  const maxWeight=safeNum(constraints?.maxWeight,null); if(maxWeight!==null&&safeNum(camera.weight,Infinity)>maxWeight)return false;
  if(constraints?.interchangeable===true&&camera.interchangeable!==true)return false;
  if(constraints?.interchangeable===false&&camera.interchangeable===true)return false;
  return true;
}

export function scoreCamera(profile,camera){
  const weights=normalizeProfile(profile),entries=Object.entries(weights); if(!entries.length)return 0;
  let fit=0,covered=0;
  for(const [key,w] of entries){if(camera.traits?.[key]===undefined)continue;const capability=clamp(safeNum(camera.traits[key],5),0,10)/10;fit+=w*capability;covered+=w;}
  if(covered<=EPS)return 0; return clamp((fit/covered)*100,0,100);
}

function rankPool(pool){return [...pool].sort((a,b)=>{const d=b.fitScore-a.fitScore;if(Math.abs(d)>1.25)return d;return safeNum(a.price,Infinity)-safeNum(b.price,Infinity);});}

export function getRecommendationSet(profile,constraints,cameras=[]){
  const eligible=cameras.filter(c=>passesConstraints(c,constraints));
  const ranked=rankPool(eligible.map(camera=>({...camera,fitScore:Number(scoreCamera(profile,camera).toFixed(1))})));
  const best=ranked[0]||null;if(!best)return{best:null,lighter:null,value:null,ranked:[],reason:'NO_ELIGIBLE'};
  const rest=ranked.filter(c=>c.id!==best.id);
  const lighter=[...rest].filter(c=>safeNum(c.weight,Infinity)<safeNum(best.weight,Infinity)).sort((a,b)=>safeNum(a.weight,Infinity)-safeNum(b.weight,Infinity)||b.fitScore-a.fitScore)[0]||rest.sort((a,b)=>safeNum(b.traits?.portable)-safeNum(a.traits?.portable)||b.fitScore-a.fitScore)[0]||null;
  const valuePool=rest.filter(c=>!lighter||c.id!==lighter.id);
  const value=[...valuePool].sort((a,b)=>(b.fitScore/Math.max(1,safeNum(b.price,Infinity)))-(a.fitScore/Math.max(1,safeNum(a.price,Infinity)))||a.price-b.price)[0]||null;
  return{best,lighter,value,ranked:ranked.slice(0,5),reason:null};
}

export function getType(profile,types=[],traitPotential={}){
  const active=types.filter(t=>t.active!==false);
  const rel={};
  for(const [key,val] of Object.entries(profile||{})){const max=safeNum(traitPotential?.[key],0);rel[key]=max>EPS?clamp(safeNum(val)/max,0,1):0;}
  let best=active[0]||{id:'default',name:'YOUR CAMTYPE',line:'당신에게 맞는 카메라 타입입니다.',weights:{}},bestScore=-Infinity;
  for(const type of active){
    const tw=type.weights||Object.fromEntries((type.keys||[]).map(k=>[k,1]));
    let den=Object.values(tw).reduce((a,v)=>a+Math.max(0,safeNum(v)),0)||0;
    let num=Object.entries(tw).reduce((sum,[k,w])=>sum+(rel[k]||0)*Math.max(0,safeNum(w)),0);
    for(const group of type.anyOf||[]){const w=Math.max(0,safeNum(group.weight,1)),bestKey=Math.max(0,...(group.keys||[]).map(k=>rel[k]||0));num+=bestKey*w;den+=w;}
    const score=den>0?num/den:0;
    if(score>bestScore){bestScore=score;best=type;}
  }
  return {...best,typeScore:bestScore};
}

function specificReason(camera,key){
  if(key==='portable'&&camera.weight)return `바디와 기본 렌즈를 합쳐 약 ${camera.weight}g 기준이라 휴대 조건에 잘 맞아요.`;
  if(key==='oneLens')return camera.interchangeable===false?`${camera.lens} 고정렌즈라 렌즈를 고르는 과정 없이 바로 촬영할 수 있어요.`:`${camera.lens} 하나로 시작하기 좋은 구성이라 장비를 단순하게 유지할 수 있어요.`;
  if(key==='swapLens'&&camera.mount)return `${camera.mount} 마운트 교환식 시스템이라 촬영 목적에 따라 렌즈 구성을 확장할 수 있어요.`;
  const map={street:'일상과 거리 촬영',portrait:'인물 촬영',travel:'여행 촬영',family:'가족·아이·반려동물 촬영',video:'영상 촬영',photo:'사진 촬영',af:'움직이는 피사체 촬영',control:'조작하는 재미',film:'색감과 분위기',mood:'분위기 중심 결과물',technical:'후보정과 완성도',performance:'성능 우선 사용'};
  if(map[key]&&camera.strengths?.length)return `${camera.strengths[0]}. ${map[key]}을 중요하게 본 선택과 잘 맞아요.`;
  return camera.strengths?.[0]?`${camera.strengths[0]}. 당신의 ${LABELS[key]||key} 성향과 잘 맞아요.`:`${LABELS[key]||key}을 중요하게 본 선택과 잘 맞는 조합이에요.`;
}

export function getReasons(profile,camera,limit=3){
  const p=normalizeProfile(profile);const ranked=Object.entries(p).filter(([key,w])=>w>0&&camera.traits?.[key]!==undefined).map(([key,w])=>({key,impact:w*clamp(safeNum(camera.traits[key],5),0,10)})).sort((a,b)=>b.impact-a.impact);
  const seen=new Set(),out=[];
  for(const x of ranked){const text=specificReason(camera,x.key);if(seen.has(text))continue;seen.add(text);out.push({label:LABELS[x.key]||x.key,text});if(out.length>=limit)break;}
  while(out.length<limit&&camera.strengths?.[out.length])out.push({label:'이 조합의 강점',text:camera.strengths[out.length]});
  return out.slice(0,limit);
}

export function getProfileHighlights(profile,limit=4){const p=normalizeProfile(profile);return Object.entries(p).sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([key,value])=>({key,label:LABELS[key]||key,value:Math.round(value*100)}));}

export function validateCatalog(cameras=[]){
  const errors=[],ids=new Set();
  for(const c of cameras){
    if(!c.id)errors.push('제품 ID 누락');if(ids.has(c.id))errors.push(`중복 제품 ID: ${c.id}`);ids.add(c.id);
    if(!c.brand||!c.body)errors.push(`${c.id||'unknown'}: 브랜드/제품명 누락`);
    if(!(safeNum(c.price)>0))errors.push(`${c.id||'unknown'}: 가격 오류`);
    if(!(safeNum(c.weight)>0))errors.push(`${c.id||'unknown'}: 무게 오류`);
    if(!c.priceAsOf)errors.push(`${c.id||'unknown'}: 가격 기준일 누락`);
    for(const [k,v] of Object.entries(c.traits||{}))if(safeNum(v,-1)<0||safeNum(v,11)>10)errors.push(`${c.id}: ${k} 점수는 0~10이어야 함`);
  }
  return errors;
}
