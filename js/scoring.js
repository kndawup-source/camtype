import { CAMERAS } from '../data/cameras.js';
import { TYPES } from '../data/types.js';

export function buildProfile(answers){
  const profile={};
  let budget=999;
  for(const ans of Object.values(answers)){
    if(!ans) continue;
    if(typeof ans.value==='number') budget=ans.value;
    for(const [k,v] of Object.entries(ans.scores||{})) profile[k]=(profile[k]||0)+v;
  }
  return {profile,budget};
}

function normalizeProfile(profile){
  const max=Math.max(1,...Object.values(profile));
  const out={};
  for(const [k,v] of Object.entries(profile)) out[k]=(v/max)*10;
  return out;
}

function scoreCamera(profile,camera){
  const p=normalizeProfile(profile);
  const keys=Object.keys(p);
  if(!keys.length) return 0;
  let distance=0, weight=0;
  for(const key of keys){
    const target=p[key];
    const actual=camera.traits[key] ?? 5;
    const w=target>=7?1.35:1;
    distance += Math.abs(target-actual)*w;
    weight += 10*w;
  }
  return Math.max(0,100-(distance/weight)*100);
}

export function getRecommendations(profile,budget){
  const eligible=CAMERAS.filter(c=>c.price<=budget || budget>=999);
  const pool=eligible.length>=3?eligible:CAMERAS;
  return pool
    .map(camera=>({...camera,match:Math.round(scoreCamera(profile,camera))}))
    .sort((a,b)=>b.match-a.match)
    .slice(0,3);
}

export function getType(profile){
  let best=TYPES[0], bestScore=-1;
  for(const type of TYPES){
    const score=type.keys.reduce((sum,k)=>sum+(profile[k]||0),0)/type.keys.length;
    if(score>bestScore){bestScore=score;best=type;}
  }
  return best;
}

export function getReasons(profile,camera){
  const labels={
    portable:'휴대성',mood:'분위기/감성',film:'필름 색감',clean:'깔끔한 색',technical:'완성도',performance:'성능',simple:'간편함',control:'조작하는 재미',snapshot:'순간 포착',planned:'계획 촬영',street:'일상/거리',portrait:'인물',travel:'여행',family:'가족/아이',af:'AF',photo:'사진',video:'영상',oneLens:'렌즈 하나로 간편하게',swapLens:'렌즈 교환'
  };
  const p=normalizeProfile(profile);
  return Object.entries(p)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,4)
    .map(([key,val])=>({label:labels[key]||key,text:`당신 ${Math.round(val*10)} / 이 조합 ${camera.traits[key]??5}0`}));
}
