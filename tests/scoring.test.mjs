import assert from 'node:assert/strict';
import { QUESTIONS } from '../data/questions.js';
import { CAMERAS } from '../data/cameras.js';
import { TYPES } from '../data/types.js';
import { buildProfile,getRecommendationSet,getType,validateCatalog } from '../js/scoring.js';

assert.deepEqual(validateCatalog(CAMERAS),[],'catalog must be valid');
assert.ok(CAMERAS.length>=25,'release catalog should have at least 25 combinations');
assert.ok(new Set(CAMERAS.map(c=>c.brand)).size>=6,'release catalog should cover at least 6 brands');

const wheels=QUESTIONS.filter(q=>q.type==='number_wheel');
const choices=QUESTIONS.filter(q=>q.type!=='number_wheel');
function* combos(qs,index=0,current={}){
  if(index>=qs.length){yield current;return;}
  const q=qs[index];
  for(const option of q.options) yield* combos(qs,index+1,{...current,[q.id]:option});
}

const budgets=[150,250,350,500],weights=[500,700,900,1200];
let checked=0,noEligible=0;
const typeCounts=Object.fromEntries(TYPES.map(t=>[t.id,0]));
const productCounts={};
for(const budget of budgets){
  for(const maxWeight of weights){
    for(const answers0 of combos(choices)){
      const answers={...answers0,budget:{id:`budget-${budget}`,value:budget,label:`${budget}만원`},carry_weight:{id:`carry-${maxWeight}`,value:maxWeight,label:`${maxWeight}g`}};
      const {profile,constraints,traitPotential}=buildProfile(answers,QUESTIONS);
      const result=getRecommendationSet(profile,constraints,CAMERAS),type=getType(profile,TYPES,traitPotential);
      assert.ok(type?.id,'type must resolve'); typeCounts[type.id]=(typeCounts[type.id]||0)+1;
      if(!result.best){noEligible++;continue;}
      assert.ok(result.best.price<=budget,`over budget: ${result.best.id}`);
      assert.ok(result.best.weight<=maxWeight,`over weight: ${result.best.id}`);
      if(answers.lens_style.id==='swap') assert.equal(result.best.interchangeable,true,`fixed lens recommended for swap: ${result.best.id}`);
      const again=getRecommendationSet(profile,constraints,CAMERAS);assert.equal(result.best.id,again.best.id,'deterministic result required');
      productCounts[result.best.id]=(productCounts[result.best.id]||0)+1;checked++;
    }
  }
}
assert.ok(checked>10000,'must exercise many valid combinations');
const totalTypes=Object.values(typeCounts).reduce((a,b)=>a+b,0);
const shares=Object.fromEntries(Object.entries(typeCounts).map(([k,v])=>[k,+(v/totalTypes*100).toFixed(1)]));
const maxShare=Math.max(...Object.values(shares));
assert.ok(maxShare<45,`type distribution too concentrated: ${JSON.stringify(shares)}`);
const recommendedProducts=Object.keys(productCounts).length;
assert.ok(recommendedProducts>=12,`catalog diversity too low: only ${recommendedProducts} products became best match`);
console.log(JSON.stringify({ok:true,checked,noEligible,catalog:CAMERAS.length,brands:new Set(CAMERAS.map(c=>c.brand)).size,questions:QUESTIONS.length,typeShares:shares,recommendedProducts,topProducts:Object.entries(productCounts).sort((a,b)=>b[1]-a[1]).slice(0,8)}));
