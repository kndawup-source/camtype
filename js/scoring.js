const LABELS={portable:'휴대성',mood:'분위기/감성',film:'필름 색감',clean:'깨끗한 색',technical:'완성도',performance:'성능',simple:'간편함',control:'조작하는 재미',snapshot:'순간 포착',planned:'계획 촬영',street:'일상/거리',portrait:'인물',travel:'여행',family:'가족/아이',af:'AF',photo:'사진',video:'영상',oneLens:'렌즈 하나로 간편하게',swapLens:'렌즈 교환'};

const DEFAULT_IMPORTANCE=1;
const EPS=1e-9;

function safeNum(v,fallback=0){const n=Number(v);return Number.isFinite(n)?n:fallback;}
function clamp(v,min,max){return Math.max(min,Math.min(max,v));}

/**
 * Build a preference model where every question has a bounded influence.
 * Each answer's raw trait values are normalized inside that question, then
 * multiplied by q.importance. This prevents an option with more trait keys
 * from overpowering other questions.
 */
export function buildProfile(answers,questions=[]){
  const profile={};
  const constraints={budget:null,interchangeable:null};
  const contributions={};

  for(const q of questions){
    if(q.active===false) continue;
    const ans=answers[q.id];
    if(!ans) continue;

    if(q.type==='number_wheel' && q.hardConstraint){
      constraints[q.hardConstraint]=safeNum(ans.value,null);
    }
    if(ans.constraints && typeof ans.constraints==='object'){
      Object.assign(constraints,ans.constraints);
    }

    const raw=ans.weights||ans.scores||{};
    const positive=Object.entries(raw).filter(([,v])=>safeNum(v)>0);
    const total=positive.reduce((s,[,v])=>s+safeNum(v),0);
    if(!total) continue;

    const qImportance=clamp(safeNum(q.importance,DEFAULT_IMPORTANCE),0,3);
    contributions[q.id]={};
    for(const [key,val] of positive){
      const normalized=(safeNum(val)/total)*qImportance;
      profile[key]=(profile[key]||0)+normalized;
      contributions[q.id][key]=normalized;
    }
  }
  return {profile,constraints,contributions};
}

export function normalizeProfile(profile){
  const sum=Object.values(profile).reduce((a,v)=>a+Math.max(0,safeNum(v)),0);
  if(sum<=EPS) return {};
  const out={};
  for(const [k,v] of Object.entries(profile)) out[k]=Math.max(0,safeNum(v))/sum;
  return out;
}

function passesConstraints(camera,constraints){
  if(camera.active===false || camera.available===false) return false;
  const budget=safeNum(constraints?.budget,null);
  if(budget!==null && safeNum(camera.price,Infinity)>budget) return false;
  if(constraints?.interchangeable===true && camera.interchangeable!==true) return false;
  if(constraints?.interchangeable===false && camera.interchangeable===true) return false;
  return true;
}

/**
 * Trait score is satisfaction, not distance. Extra capability is never a penalty.
 * A user who doesn't care about video simply assigns little/no weight to video.
 */
export function scoreCamera(profile,camera){
  const weights=normalizeProfile(profile);
  const entries=Object.entries(weights);
  if(!entries.length) return 0;
  let fit=0,covered=0;
  for(const [key,w] of entries){
    if(camera.traits?.[key]===undefined) continue;
    const capability=clamp(safeNum(camera.traits[key],5),0,10)/10;
    fit+=w*capability;
    covered+=w;
  }
  if(covered<=EPS) return 0;
  return clamp((fit/covered)*100,0,100);
}

function rankPool(pool){
  return [...pool].sort((a,b)=>{
    const diff=b.fitScore-a.fitScore;
    if(Math.abs(diff)>1.25) return diff;
    return safeNum(a.price,Infinity)-safeNum(b.price,Infinity);
  });
}

export function getRecommendationSet(profile,constraints,cameras=[]){
  const eligible=cameras.filter(c=>passesConstraints(c,constraints));
  const ranked=rankPool(eligible.map(camera=>({...camera,fitScore:Number(scoreCamera(profile,camera).toFixed(1))})));
  const best=ranked[0]||null;
  if(!best) return {best:null,lighter:null,value:null,ranked:[],reason:'NO_ELIGIBLE'};

  const rest=ranked.filter(c=>c.id!==best.id);
  const lighter=[...rest].sort((a,b)=>{
    const pa=safeNum(a.traits?.portable,5),pb=safeNum(b.traits?.portable,5);
    if(pb!==pa) return pb-pa;
    return b.fitScore-a.fitScore;
  })[0]||null;

  const valuePool=rest.filter(c=>!lighter||c.id!==lighter.id);
  const value=[...valuePool].sort((a,b)=>{
    const va=a.fitScore/Math.max(1,safeNum(a.price,Infinity));
    const vb=b.fitScore/Math.max(1,safeNum(b.price,Infinity));
    return vb-va || a.price-b.price;
  })[0]||null;

  return {best,lighter,value,ranked:ranked.slice(0,5),reason:null};
}

export function getType(profile,types=[]){
  const p=normalizeProfile(profile);
  const active=types.filter(t=>t.active!==false);
  let best=active[0]||{id:'default',name:'YOUR CAMTYPE',line:'당신에게 맞는 카메라 타입입니다.',weights:{}},bestScore=-Infinity;
  for(const type of active){
    const typeWeights=type.weights||Object.fromEntries((type.keys||[]).map(k=>[k,1]));
    const den=Object.values(typeWeights).reduce((a,v)=>a+Math.max(0,safeNum(v)),0)||1;
    const score=Object.entries(typeWeights).reduce((sum,[k,w])=>sum+(p[k]||0)*Math.max(0,safeNum(w)),0)/den;
    if(score>bestScore){bestScore=score;best=type;}
  }
  return {...best,typeScore:bestScore};
}

export function getReasons(profile,camera,limit=3){
  const p=normalizeProfile(profile);
  return Object.entries(p)
    .filter(([key,w])=>w>0 && camera.traits?.[key]!==undefined)
    .map(([key,w])=>({key,weight:w,capability:clamp(safeNum(camera.traits[key],5),0,10),impact:w*clamp(safeNum(camera.traits[key],5),0,10)}))
    .sort((a,b)=>b.impact-a.impact)
    .slice(0,limit)
    .map(x=>({label:LABELS[x.key]||x.key,text:`${LABELS[x.key]||x.key}을 중요하게 본 선택과 잘 맞는 조합이에요.`}));
}

export function getProfileHighlights(profile,limit=4){
  const p=normalizeProfile(profile);
  return Object.entries(p).sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([key,value])=>({key,label:LABELS[key]||key,value:Math.round(value*100)}));
}

export function validateCatalog(cameras=[]){
  const errors=[];
  const ids=new Set();
  for(const c of cameras){
    if(!c.id) errors.push('제품 ID 누락');
    if(ids.has(c.id)) errors.push(`중복 제품 ID: ${c.id}`); ids.add(c.id);
    if(!c.brand||!c.body) errors.push(`${c.id||'unknown'}: 브랜드/제품명 누락`);
    if(!(safeNum(c.price)>0)) errors.push(`${c.id||'unknown'}: 가격 오류`);
    for(const [k,v] of Object.entries(c.traits||{})) if(safeNum(v,-1)<0||safeNum(v,11)>10) errors.push(`${c.id}: ${k} 점수는 0~10이어야 함`);
  }
  return errors;
}
