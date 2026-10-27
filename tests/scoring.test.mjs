import assert from 'node:assert/strict';
import { QUESTIONS } from '../data/questions.js';
import { CAMERAS } from '../data/cameras.js';
import { TYPES } from '../data/types.js';
import { buildProfile,getRecommendationSet,getType,validateCatalog } from '../js/scoring.js';

assert.deepEqual(validateCatalog(CAMERAS),[],'catalog must be valid');

const nonBudget=QUESTIONS.filter(q=>q.id!=='budget');
function* combos(qs,index=0,current={}){
  if(index>=qs.length){yield current;return;}
  const q=qs[index];
  for(const option of q.options){yield* combos(qs,index+1,{...current,[q.id]:option});}
}

let checked=0, noEligible=0;
for(const budget of [150,200,250,300,500]){
  for(const answers0 of combos(nonBudget)){
    const answers={budget:{id:`budget-${budget}`,value:budget,label:`${budget}만원`},...answers0};
    const {profile,constraints}=buildProfile(answers,QUESTIONS);
    const result=getRecommendationSet(profile,constraints,CAMERAS);
    const type=getType(profile,TYPES);
    assert.ok(type?.id,'type must resolve');
    if(!result.best){noEligible++;continue;}
    assert.ok(result.best.price<=budget,`over budget: ${result.best.id} ${result.best.price} > ${budget}`);
    if(answers.lens_style.id==='swap') assert.equal(result.best.interchangeable,true,`fixed lens recommended for swap: ${result.best.id}`);
    const again=getRecommendationSet(profile,constraints,CAMERAS);
    assert.equal(result.best.id,again.best.id,'same answers must produce deterministic result');
    checked++;
  }
}
assert.ok(checked>1000,'must exercise many valid combinations');
console.log(JSON.stringify({ok:true,checked,noEligible,catalog:CAMERAS.length,questions:QUESTIONS.length}));
