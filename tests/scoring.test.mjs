import assert from 'node:assert/strict';
import { QUESTIONS } from '../data/questions.js';
import { CAMERAS } from '../data/cameras.js';
import { TYPES } from '../data/types.js';
import { buildProfile,getRecommendationSet,getType,validateCatalog } from '../js/scoring.js';

assert.deepEqual(validateCatalog(CAMERAS),[],'catalog must be valid');
assert.ok(CAMERAS.length>=25,'release catalog should have at least 25 combinations');
assert.ok(new Set(CAMERAS.map(c=>c.brand)).size>=6,'release catalog should cover at least 6 brands');
assert.ok(QUESTIONS.some(q=>q.id==='photo_video'&&q.type==='choice'),'photo/video single choice required');
assert.ok(QUESTIONS.some(q=>q.type==='multi_choice'),'multi choice required');
assert.ok(QUESTIONS.some(q=>q.type==='tap_scale'),'tap scale required');
assert.ok(TYPES.some(t=>t.id==='phone-first'),'PHONE FIRST fallback type required');
for(const q of QUESTIONS){for(const o of q.options||[])assert.ok(/[가-힣]/.test(o.label),`answer label must be Korean: ${q.id}/${o.id}/${o.label}`);}
assert.ok(!QUESTIONS.some(q=>q.id==='carry_weight'),'numeric weight question must be removed');

let seed=20261027;
const rnd=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);
const pick=a=>a[Math.floor(rnd()*a.length)];
const mixWeights=(left={},right={},t=.5)=>{const out={},keys=new Set([...Object.keys(left),...Object.keys(right)]);for(const k of keys)out[k]=(Number(left[k])||0)*(1-t)+(Number(right[k])||0)*t;return out};
function answerFor(q){
  if(q.type==='number_wheel'){const count=Math.floor((q.max-q.min)/q.step)+1,value=q.min+Math.floor(rnd()*count)*q.step;return{id:`${q.id}-${value}`,value,label:`${value}${q.unit||''}`};}
  if(q.type==='ratio_slider'){const count=Math.floor((q.max-q.min)/q.step)+1,value=q.min+Math.floor(rnd()*count)*q.step,t=(value-q.min)/(q.max-q.min);return{id:`${q.id}-${value}`,value,weights:mixWeights(q.leftWeights,q.rightWeights,t)};}
  if(q.type==='tap_scale'){const steps=q.steps||5,value=Math.floor(rnd()*steps),t=value/(steps-1);return{id:`${q.id}-${value}`,value,weights:mixWeights(q.leftWeights,q.rightWeights,t)};}
  if(q.type==='multi_choice'){const max=Math.min(q.maxSelections||2,q.options.length),n=1+Math.floor(rnd()*max),pool=[...q.options],chosen=[];while(chosen.length<n){const o=pool.splice(Math.floor(rnd()*pool.length),1)[0];chosen.push(o)}const weights={},constraints={};for(const o of chosen){for(const[k,v]of Object.entries(o.weights||{}))weights[k]=(weights[k]||0)+Number(v||0);Object.assign(constraints,o.constraints||{})}return{id:`${q.id}-${chosen.map(o=>o.id).join('+')}`,selectedIds:chosen.map(o=>o.id),weights,constraints};}
  return pick(q.options);
}

let checked=0,noEligible=0;
const activeTypes=TYPES.filter(t=>t.active!==false),typeCounts=Object.fromEntries(activeTypes.map(t=>[t.id,0])),productCounts={};
for(let i=0;i<30000;i++){
  const answers=Object.fromEntries(QUESTIONS.map(q=>[q.id,answerFor(q)]));
  const {profile,constraints,traitPotential}=buildProfile(answers,QUESTIONS);
  const result=getRecommendationSet(profile,constraints,CAMERAS),type=getType(profile,TYPES,traitPotential);
  assert.ok(type?.id,'type must resolve');typeCounts[type.id]=(typeCounts[type.id]||0)+1;
  if(!result.best){noEligible++;continue;}
  if(constraints.budget!=null)assert.ok(result.best.price<=constraints.budget,`over budget: ${result.best.id}`);
  if(constraints.interchangeable===true)assert.equal(result.best.interchangeable,true,`fixed lens recommended for swap: ${result.best.id}`);
  const again=getRecommendationSet(profile,constraints,CAMERAS);assert.equal(result.best.id,again.best.id,'deterministic result required');
  productCounts[result.best.id]=(productCounts[result.best.id]||0)+1;checked++;
}
assert.ok(checked>10000,'must exercise many valid combinations');
const forcedNoEligible=getRecommendationSet({}, {budget:1}, CAMERAS);
assert.equal(forcedNoEligible.best,null,'PHONE FIRST/no eligible path must resolve when hard constraints exclude all products');
const totalTypes=Object.values(typeCounts).reduce((a,b)=>a+b,0),shares=Object.fromEntries(Object.entries(typeCounts).map(([k,v])=>[k,+(v/totalTypes*100).toFixed(1)]));
assert.ok(Math.max(...Object.values(shares))<45,`type distribution too concentrated: ${JSON.stringify(shares)}`);
const recommendedProducts=Object.keys(productCounts).length;assert.ok(recommendedProducts>=12,`catalog diversity too low: only ${recommendedProducts} products became best match`);
console.log(JSON.stringify({ok:true,checked,noEligible,catalog:CAMERAS.length,brands:new Set(CAMERAS.map(c=>c.brand)).size,questions:QUESTIONS.length,interactionTypes:[...new Set(QUESTIONS.map(q=>q.type))],typeShares:shares,recommendedProducts,topProducts:Object.entries(productCounts).sort((a,b)=>b[1]-a[1]).slice(0,8)}));
