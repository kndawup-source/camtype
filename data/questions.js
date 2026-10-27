export const QUESTIONS = [
  {
    id:'q1', type:'image_choice', title:'둘 중 더 끌리는 사진은?', kicker:'생각하지 말고 먼저 눈이 가는 쪽을 고르세요.',
    options:[
      {id:'a',label:'분위기가 남는 사진',desc:'조금 거칠어도 색과 감정이 먼저 보이는 쪽',image:null,scores:{mood:3,technical:0,film:2}},
      {id:'b',label:'깔끔하게 잘 나온 사진',desc:'선명도와 정돈된 완성도가 먼저 보이는 쪽',image:null,scores:{mood:0,technical:3,clean:2}}
    ]
  },
  {
    id:'q2', type:'choice', title:'사진을 찍으러 나가는 편인가요?', kicker:'당신이 카메라를 꺼내는 순간을 떠올려보세요.',
    options:[
      {id:'a',label:'그냥 걷다가 찍어요',desc:'일상, 골목, 카페, 친구처럼 순간을 발견하는 편',scores:{snapshot:3,portable:2,planned:0}},
      {id:'b',label:'장소를 정하고 찍어요',desc:'풍경, 인물, 여행지처럼 촬영 자체를 계획하는 편',scores:{snapshot:0,portable:0,planned:3}}
    ]
  },
  {
    id:'q3', type:'choice', title:'카메라가 무거우면?', kicker:'성능보다 실제로 자주 들고 나갈지를 생각해보세요.',
    options:[
      {id:'a',label:'결국 안 들고 나가요',desc:'작고 가벼운 게 가장 중요해요',scores:{portable:4,performance:0}},
      {id:'b',label:'좋으면 감수해요',desc:'조금 커도 결과물이 좋다면 괜찮아요',scores:{portable:0,performance:4}}
    ]
  },
  {
    id:'q4', type:'choice', title:'사진 찍는 재미는 어디에 있어요?', kicker:'셔터를 누르기 전과 후, 어느 쪽이 더 즐거운가요?',
    options:[
      {id:'a',label:'바로 꺼내서 바로 찍기',desc:'설정보다 순간을 놓치지 않는 게 중요',scores:{simple:3,snapshot:2,control:0}},
      {id:'b',label:'설정하고 맞춰가는 과정',desc:'다이얼, 렌즈, 노출을 만지는 것도 재미',scores:{simple:0,control:4}}
    ]
  },
  {
    id:'q5', type:'choice', title:'주로 뭘 찍고 싶어요?', kicker:'하나만 고른다면 가장 자주 찍게 될 대상.',
    options:[
      {id:'street',label:'일상 / 거리',desc:'스냅, 카페, 골목, 친구',scores:{street:4}},
      {id:'portrait',label:'인물',desc:'친구, 연인, 가족, 프로필',scores:{portrait:4}},
      {id:'travel',label:'여행 / 풍경',desc:'여행지, 풍경, 건축',scores:{travel:4}},
      {id:'family',label:'가족 / 아이 / 반려동물',desc:'빠르게 움직이는 순간',scores:{family:4,af:2}}
    ]
  },
  {
    id:'q6', type:'choice', title:'영상도 많이 찍을까요?', kicker:'사진과 영상의 비중을 현실적으로 골라보세요.',
    options:[
      {id:'photo',label:'사진이 거의 전부',desc:'영상은 가끔만',scores:{photo:4,video:0}},
      {id:'hybrid',label:'사진도 영상도',desc:'둘 다 꽤 중요',scores:{photo:2,video:3}},
      {id:'video',label:'영상 비중이 높아요',desc:'브이로그, 릴스, 유튜브까지',scores:{photo:0,video:5}}
    ]
  },
  {
    id:'q7', type:'choice', title:'렌즈는 어떻게 쓰고 싶어요?', kicker:'장비를 늘려가는 과정까지 포함한 질문이에요.',
    options:[
      {id:'one',label:'하나로 끝내고 싶어요',desc:'최대한 간단하고 가볍게',scores:{oneLens:4,simple:2}},
      {id:'swap',label:'바꿔가며 쓰고 싶어요',desc:'상황마다 다른 렌즈를 써보고 싶어요',scores:{swapLens:4,control:2}}
    ]
  },
  {
    id:'q8', type:'choice', title:'색감은 어느 쪽?', kicker:'나중에 이미지가 들어갈 대표 문항입니다.',
    options:[
      {id:'a',label:'따뜻하고 필름 같은 색',desc:'완벽한 정확도보다 분위기',scores:{film:4,mood:2}},
      {id:'b',label:'깨끗하고 자연스러운 색',desc:'후보정하기 편하고 무난한 결과',scores:{clean:4,technical:1}}
    ]
  },
  {
    id:'q9', type:'number_wheel', title:'예산은 어느 정도인가요?', kicker:'바디 + 기본 렌즈까지 포함한 총 예산.',
    hardConstraint:'budget', unit:'만원', min:100, max:400, step:10, defaultValue:200
  },
  {
    id:'q10', type:'choice', title:'마지막. 카메라는 어떤 물건이면 좋겠어요?', kicker:'정답보다 당신이 원하는 관계에 가까운 쪽.',
    options:[
      {id:'tool',label:'항상 들고 다니는 도구',desc:'생각 없이 자주 쓰는 것이 중요',scores:{portable:2,simple:2,snapshot:2}},
      {id:'hobby',label:'만지는 재미가 있는 취미',desc:'장비 자체를 알아가는 것도 즐거움',scores:{control:3,swapLens:2,performance:1}}
    ]
  }
];
