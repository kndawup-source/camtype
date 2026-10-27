export const TYPES = [
  {id:'observer',name:'THE EVERYDAY OBSERVER',line:'좋은 사진을 찍으러 가기보다, 좋은 순간을 먼저 발견하는 사람.',weights:{snapshot:1.3,street:1.15,portable:.75}},
  {id:'maker',name:'THE IMAGE MAKER',line:'한 장을 대충 남기기보다, 제대로 완성하고 싶은 사람.',weights:{technical:1.3,planned:1.1,performance:.9}},
  {id:'color',name:'THE COLOR HUNTER',line:'선명함보다 색과 분위기에서 먼저 마음이 움직이는 사람.',weights:{film:1.35,mood:1.2,photo:.35}},
  {id:'control',name:'THE CONTROL FREAK',line:'결과만큼 다이얼을 돌리고 렌즈를 바꾸는 과정도 중요한 사람.',weights:{control:1.35,swapLens:1.15,planned:.4}},
  {id:'hybrid',name:'THE HYBRID CREATOR',line:'사진도 영상도 포기하지 않고 한 대로 모두 하고 싶은 사람.',weights:{video:1.35,af:.75,performance:.75}},
  {id:'traveler',name:'THE LIGHT TRAVELER',line:'좋은 카메라는 결국 자주 들고 나가는 카메라라고 생각하는 사람.',weights:{travel:1.25,portable:1.25,simple:.75}},
  {id:'people',name:'THE PEOPLE STORYTELLER',line:'풍경보다 사람의 표정과 움직임에서 이야기를 찾는 사람.',weights:{af:.55,snapshot:.25},anyOf:[{keys:['portrait','family'],weight:1.15}]},
  {id:'minimalist',name:'THE ONE-LENS MINIMALIST',line:'장비를 늘리기보다 한 조합을 오래 익혀 빠르게 찍는 사람.',weights:{oneLens:1.35,simple:1.15,snapshot:.65}}
];
