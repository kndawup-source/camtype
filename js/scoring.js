const LABELS={portable:'휴대성',mood:'분위기/감성',film:'필름 색감',clean:'깔끔한 색',technical:'완성도',performance:'성능',simple:'간편함',control:'조작하는 재미',snapshot:'순간 포착',planned:'계획 촬영',street:'일상/거리',portrait:'인물',travel:'여행',family:'가족/아이',af:'AF',photo:'사진',video:'영상',oneLens:'렌즈 하나로 간편하게',swapLens:'렌즈 교환'};

export function buildProfile(answers,questions=[]){
  const profile={};
  const constraints={budget:null};
  for(const q of questions){
    const ans=answers[q.id]; if(!ans) continue;
    if(q.type==='number_wheel' && q.hardConstraint) constraints[q.hardConstraint]=Number(ans.value);
    for(const [k,v] of Object.entries(ans.scores||{})) profile[k]=(profile[k]||0)+Number(v||0);
  }
  return {profile,constraints};
}

function normalizeProfile(profile){
  const vals=Object.values(profile).filter(v=>Number.isFinite(v));
  const max=Math.max(1,...vals);
  const out={};
  for(const [k,v] of Object.entries(profile)) out[k]=Math.max(0,Math.min(10,(v/max)*10));
  return out;
}

function scoreCamera(profile,camera){
  const p=normalizeProfile(profile); const keys=Object.keys(p);
  if(!keys.length) return 50;
  let distance=0,weight=0;
  for(const key of keys){
    const target=p[key], actual=Number(camera.traits?.[key]??5);
    const w=target>=7?1.45:target>=4?1.1:.75;
    distance+=Math.abs(target-actual)*w; weight+=10*w;
  }
  return Math.max(0,100-(distance/Math.max(1,weight))*100);
}

function eligibleCameras(cameras,constraints){
  const active=cameras.filter(c=>c.active!==false);
  const budget=Number(constraints?.budget);
  if(!budget) return active;
  const eligible=active.filter(c=>Number(c.price)<=budget);
  return eligible.length?eligible:active;
}

export function getRecommendationSet(profile,constraints,cameras=[]){
  const pool=eligibleCameras(cameras,constraints).map(camera=>({...camera,match:Math.round(scoreCamera(profile,camera))}));
  const best=[...pool].sort((a,b)=>b.match-a.match || a.price-b.price)[0] || null;
  if(!best) return {best:null,lighter:null,value:null,ranked:[]};
  const rest=pool.filter(c=>c.id!==best.id);
  const lighter=[...rest].sort((a,b)=>((b.traits?.portable??5)-(a.traits?.portable??5)) || b.match-a.match || a.price-b.price)[0] || null;
  const valueCandidates=rest.filter(c=>!lighter || c.id!==lighter.id);
  const value=[...valueCandidates].sort((a,b)=>((b.match/Math.max(1,b.price))-(a.match/Math.max(1,a.price))) || a.price-b.price)[0] || null;
  const ranked=[best,...rest.sort((a,b)=>b.match-a.match)].slice(0,5);
  return {best,lighter,value,ranked};
}

export function getType(profile,types=[]){
  const active=types.filter(t=>t.active!==false);
  let best=active[0]||{id:'default',name:'YOUR CAMTYPE',line:'당신에게 맞는 카메라 타입입니다.',keys:[]},bestScore=-Infinity;
  for(const type of active){
    const keys=type.keys||[];
    const score=keys.reduce((sum,k)=>sum+(profile[k]||0),0)/Math.max(1,keys.length);
    if(score>bestScore){bestScore=score;best=type;}
  }
  return best;
}

export function getReasons(profile,camera){
  const p=normalizeProfile(profile);
  return Object.entries(p)
    .sort((a,b)=>b[1]-a[1])
    .filter(([key])=>camera.traits?.[key]!==undefined)
    .slice(0,3)
    .map(([key,val])=>({label:LABELS[key]||key,text:`${LABELS[key]||key} 성향이 강하고, 이 조합이 그 조건에 잘 맞아요.`}));
}

export function getProfileHighlights(profile){
  const p=normalizeProfile(profile);
  return Object.entries(p).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([key,value])=>({key,label:LABELS[key]||key,value:Math.round(value)}));
}
