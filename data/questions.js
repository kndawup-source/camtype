export const QUESTIONS = [
  {id:'budget',order:1,type:'number_wheel',title:'예산은 어느 정도인가요?',kicker:'바디 + 기본 렌즈까지 포함한 총 예산.',hardConstraint:'budget',unit:'만원',min:100,max:500,step:10,defaultValue:250,importance:0,active:true},
  {id:'subject',order:2,type:'choice',title:'가장 많이 찍고 싶은 건?',kicker:'가장 자주 찍게 될 대상을 하나만 골라보세요.',importance:1.3,active:true,options:[
    {id:'street',label:'일상 / 거리',desc:'스냅, 카페, 골목, 친구',image:null,weights:{street:5,snapshot:3,portable:1}},
    {id:'portrait',label:'인물',desc:'친구, 연인, 가족, 프로필',image:null,weights:{portrait:5,performance:2}},
    {id:'travel',label:'여행 / 풍경',desc:'여행지, 풍경, 건축',image:null,weights:{travel:5,portable:2,planned:1}},
    {id:'family',label:'가족 / 아이 / 반려동물',desc:'빠르게 움직이는 순간',image:null,weights:{family:5,af:4,snapshot:2}}
  ]},
  {id:'photo_video',order:3,type:'choice',title:'사진과 영상 중 어디에 더 가까워요?',kicker:'실제로 가장 많이 쓸 비중을 골라보세요.',importance:1.3,active:true,options:[
    {id:'photo',label:'사진 위주',desc:'영상은 가끔만',image:null,weights:{photo:5}},
    {id:'hybrid',label:'둘 다',desc:'사진과 영상이 비슷하게 중요',image:null,weights:{photo:3,video:3}},
    {id:'video',label:'영상 위주',desc:'브이로그, 릴스, 유튜브까지',image:null,weights:{video:5,af:2,performance:2}}
  ]},
  {id:'carry_weight',order:4,type:'number_wheel',title:'장비 무게는 어디까지 괜찮아요?',kicker:'바디와 기본 렌즈를 합친 무게 기준.',hardConstraint:'maxWeight',unit:'g',min:350,max:1200,step:50,defaultValue:700,importance:0,active:true},
  {id:'portable',order:5,type:'image_choice',title:'그래도 둘 중 더 중요한 건?',kicker:'무게 숫자와 별개로 실제 사용 습관을 봅니다.',importance:.7,active:true,options:[
    {id:'light',label:'자주 들고 나가는 것',desc:'결국 손이 가는 카메라가 중요',image:null,weights:{portable:5,simple:2,snapshot:1}},
    {id:'quality',label:'결과와 성능',desc:'조금 번거로워도 결과가 우선',image:null,weights:{performance:5,technical:3,planned:1}}
  ]},
  {id:'lens_style',order:6,type:'image_choice',title:'렌즈는 어떻게 쓰고 싶어요?',kicker:'렌즈 하나를 오래 쓸지, 바꿔가며 쓸지.',importance:1.15,active:true,options:[
    {id:'one',label:'하나로 간편하게',desc:'렌즈 고민 없이 바로 쓰고 싶어요',image:null,weights:{oneLens:5,simple:3,portable:1}},
    {id:'swap',label:'바꿔가며 쓰기',desc:'상황마다 다른 렌즈도 써보고 싶어요',image:null,weights:{swapLens:5,control:3,performance:1},constraints:{interchangeable:true}}
  ]},
  {id:'control',order:7,type:'choice',title:'사진 찍는 재미는 어디에 있어요?',kicker:'순간인지, 만지는 과정까지인지.',importance:.9,active:true,options:[
    {id:'instant',label:'바로 꺼내서 바로 찍기',desc:'설정보다 순간을 놓치지 않는 게 중요',image:null,weights:{simple:4,snapshot:3}},
    {id:'manual',label:'설정하고 맞춰가는 과정',desc:'다이얼, 렌즈, 노출을 만지는 것도 재미',image:null,weights:{control:5,swapLens:2,planned:1}}
  ]},
  {id:'visual_mood',order:8,type:'image_choice',title:'어떤 사진이 더 마음에 드나요?',kicker:'생각하지 말고 먼저 눈이 가는 쪽.',importance:.75,active:true,options:[
    {id:'mood',label:'분위기가 남는 사진',desc:'색과 감정이 먼저 보이는 쪽',image:null,weights:{mood:5,film:3}},
    {id:'clean',label:'깔끔하게 잘 나온 사진',desc:'선명도와 정돈된 완성도가 먼저 보이는 쪽',image:null,weights:{clean:5,technical:3}}
  ]},
  {id:'color',order:9,type:'image_choice',title:'어느 쪽 색감이 더 끌리나요?',kicker:'이미지가 들어오면 비교해서 고르게 됩니다.',importance:.75,active:true,options:[
    {id:'film',label:'따뜻하고 필름 같은 색',desc:'정확도보다 분위기와 개성',image:null,weights:{film:5,mood:3}},
    {id:'natural',label:'깨끗하고 자연스러운 색',desc:'무난하고 후보정하기 편한 결과',image:null,weights:{clean:5,technical:2}}
  ]},
  {id:'output',order:10,type:'choice',title:'결과물은 어느 쪽이 더 중요해요?',kicker:'카메라를 쓰고 난 뒤를 떠올려보세요.',importance:.85,active:true,options:[
    {id:'ready',label:'찍자마자 마음에 들기',desc:'후보정을 많이 하지 않아도 좋은 결과',image:null,weights:{mood:2,film:2,simple:3}},
    {id:'edit',label:'후보정해서 완성하기',desc:'RAW와 편집으로 결과를 더 다듬는 편',image:null,weights:{technical:4,performance:2,control:2}}
  ]},
  {id:'relation',order:11,type:'choice',title:'마지막. 카메라는 어떤 물건이면 좋겠어요?',kicker:'원하는 관계에 가까운 쪽.',importance:.7,active:true,options:[
    {id:'tool',label:'항상 들고 다니는 도구',desc:'생각 없이 자주 쓰는 것이 중요',image:null,weights:{portable:3,simple:3,snapshot:2}},
    {id:'hobby',label:'만지는 재미가 있는 취미',desc:'장비 자체를 알아가는 것도 즐거움',image:null,weights:{control:4,swapLens:2,performance:2}}
  ]}
];
