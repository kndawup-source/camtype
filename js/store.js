import { QUESTIONS } from '../data/questions.js';
import { CAMERAS } from '../data/cameras.js';
import { TYPES } from '../data/types.js';
const KEYS={questions:'camtype_questions_v6',cameras:'camtype_cameras_v6',types:'camtype_types_v6',stats:'camtype_stats_v6'};
const clone=v=>JSON.parse(JSON.stringify(v));
function read(key,fallback){try{const raw=localStorage.getItem(key);return raw?JSON.parse(raw):clone(fallback);}catch{return clone(fallback);}}
function write(key,value){localStorage.setItem(key,JSON.stringify(value));return value;}
export function getQuestions(){return read(KEYS.questions,QUESTIONS).filter(q=>q.active!==false).sort((a,b)=>(a.order??999)-(b.order??999));}
export function getAllQuestions(){return read(KEYS.questions,QUESTIONS).sort((a,b)=>(a.order??999)-(b.order??999));}
export function saveQuestions(v){return write(KEYS.questions,v.map((q,i)=>({...q,order:i+1})));}
export function getCameras(){return read(KEYS.cameras,CAMERAS);}
export function saveCameras(v){return write(KEYS.cameras,v);}
export function getTypes(){return read(KEYS.types,TYPES);}
export function saveTypes(v){return write(KEYS.types,v);}
export function getStats(){return read(KEYS.stats,{starts:0,completions:0,results:{},products:{},answers:{},updatedAt:null});}
export function saveStats(v){return write(KEYS.stats,v);}
export function trackStart(){const s=getStats();s.starts=(s.starts||0)+1;s.updatedAt=new Date().toISOString();saveStats(s);}
export function trackResult(typeId,cameraId,answers={}){const s=getStats();s.completions=(s.completions||0)+1;s.results[typeId]=(s.results[typeId]||0)+1;if(cameraId)s.products[cameraId]=(s.products[cameraId]||0)+1;for(const [qid,a] of Object.entries(answers)){const val=a?.id||String(a?.value??'');if(!val)continue;s.answers[qid]??={};s.answers[qid][val]=(s.answers[qid][val]||0)+1;}s.updatedAt=new Date().toISOString();saveStats(s);}
export function resetStats(){return saveStats({starts:0,completions:0,results:{},products:{},answers:{},updatedAt:null});}
