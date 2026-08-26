(()=>{
const PATTERNS={
  'RESULT FIRST':{label:'결과 먼저',mode:'VISUAL-FIRST',format:'REELS 우선',why:'장면 자체가 사건의 결론이나 반응을 즉시 보여줄 때 강한 구조입니다.',first:'가장 강한 결과·반응 장면을 첫 화면/첫 1초에 바로 보여주세요.',reel:'0~2초 결과 장면 → 2~6초 무슨 일인지 → 6~10초 맥락·결과.',carousel:'1 결과 장면 → 2 사건 시작 → 3 핵심 맥락 → 4 결과/반응.'},
  'RECOGNITION + CHANGE':{label:'인지도 + 변화',mode:'HEADLINE-FIRST',format:'REELS + CAROUSEL',why:'대중이 아는 인물에 변화·숫자·최초·관계가 붙을 때 확장성이 커집니다.',first:'인물 이름을 숨기지 말고 변화·숫자·기록을 같은 화면에서 완결하세요.',reel:'0~2초 인물+변화 공개 → 2~7초 증거 장면 → 7~11초 과거/현재 맥락.',carousel:'1 인물+핵심 변화 → 2 증거 → 3 과거/숫자 → 4 현재 상태.'},
  'ARCHIVE + CURRENT PEG':{label:'과거 장면 + 현재 맥락',mode:'HEADLINE-FIRST',format:'REELS + CAROUSEL',why:'과거 영상·발언이 현재 사건 때문에 새로운 의미를 얻을 때 작은 계정도 큰 초과 도달이 가능했습니다.',first:'과거 영상임을 숨기지 말고 “당시 장면 + 지금 다시 화제인 이유”를 같은 첫 화면에서 연결하세요.',reel:'0~2초 과거 장면임을 명시 → 2~6초 당시 발언/행동 → 6~11초 지금 왜 다시 주목받는지.',carousel:'1 과거 장면+현재 연결 → 2 당시 맥락 → 3 지금 벌어진 변화 → 4 왜 다시 의미가 생겼는지.'},
  'DANGER → PAYOFF':{label:'위기 → 보상',mode:'VISUAL-FIRST',format:'REELS 우선',why:'동물·휴먼 구조물에서 위기와 해결의 감정 곡선이 반복적으로 강했습니다.',first:'위험한 상황을 애매하게 숨기지 말고 실제 위기 장면부터 보여주세요.',reel:'0~2초 위기 → 2~6초 발견/행동 → 6~10초 구조 → 마지막 결과.',carousel:'1 위기 → 2 발견 → 3 구조 행동 → 4 결과/현재.'},
  'WEIRD BUT TRUE':{label:'기묘하지만 실제',mode:'HEADLINE-FIRST',format:'REELS + CAROUSEL',why:'상황 자체가 비현실적으로 느껴지면서 실제 사진·영상으로 증명될 때 강합니다.',first:'“정체는?”만 남기지 말고 이상한 사실의 핵심을 60~70% 공개하세요.',reel:'0~2초 이상한 장면 → 2~6초 정체/사실 → 6~10초 왜 벌어졌는지.',carousel:'1 기묘한 사실 → 2 실제 증거 → 3 배경 → 4 확인된 결론.'},
  'WHAT + WHY WOW':{label:'무엇 + 왜 놀라운가',mode:'VISUAL-FIRST',format:'REELS + CAROUSEL',why:'기술·과학은 설명부터 시작하기보다 눈에 보이는 결과를 먼저 주는 편이 강했습니다.',first:'첫 화면에서 “이게 무엇인지”를 보여주고 전문 용어는 뒤로 보내세요.',reel:'0~2초 결과물 → 2~5초 무엇인지 → 5~10초 왜 놀라운지.',carousel:'1 결과물 → 2 무엇인지 → 3 원리 → 4 왜 중요한지.'},
  'VISUAL FIRST':{label:'장면 우선',mode:'VISUAL-FIRST',format:'REELS 우선',why:'사진·영상만으로 이미 이해되는 소재는 큰 텍스트가 오히려 장면을 가립니다.',first:'텍스트 0~1줄. 화면의 80% 이상을 실제 장면에 양보하세요.',reel:'첫 1초 최고 장면 → 짧은 맥락 → 반복 시청이 가능한 마무리.',carousel:'1 강한 비주얼 → 2~4 장소·숫자·세부정보. 텍스트 최소.'},
  'COMPLETE FACT':{label:'완결형 사실',mode:'HEADLINE-FIRST',format:'CAROUSEL 강함',why:'첫 카드에서 핵심 사실을 상당 부분 공개하고 뒤에서 근거를 보완하는 구조입니다.',first:'누가·무엇을·무슨 일이 있었는지 한 문장으로 완결하세요.',reel:'0~2초 핵심 사실 → 2~7초 증거 → 7~11초 맥락.',carousel:'1 완결형 사실 → 2 사건 → 3 근거/숫자 → 4 현재/결론.'}
};
const KNOWN=/(테일러|스위프트|호날두|메시|비버|셀레나|젠데이아|시드니 스위니|톰 크루즈|브래드 피트|디카프리오|카다시안|제너|홀란|음바페|배드 버니|비욘세|아리아나|레이디 가가|브루노 마스|빌리 아일리시|두아 리파|BTS|BLACKPINK|KATSEYE|Taylor Swift|Ronaldo|Messi|Bieber|Zendaya|Sydney Sweeney|Tom Cruise|Brad Pitt|Haaland|Bad Bunny|Beyonce|Ariana Grande|Lady Gaga|Billie Eilish)/i;
const CHANGE=/(최초|기록|번째|년 만|년째|생일|결혼|약혼|열애|이별|복귀|변신|헤어|삭발|금발|공개|출연|캐스팅|우승|수상|팔로워|증가|은퇴|first|record|birthday|wedding|engag|dating|breakup|returns?|debut|wins?|award|retir|million|billion|%|\d)/i;
const ARCHIVE=/(과거|예전|당시|재조명|재소환|다시 화제|몇 년 전|옛 영상|옛날 영상|과거 영상|과거 발언|old (video|clip|interview|comments?)|throwback|resurfac|years ago|from 20\d\d)/i;
const DANGER=/(구조|구했다|구해|갇힌|불길|화재|익사|물에 빠|추락|생존|실종|위기|rescue|saved?|trapped|fire|drown|surviv|stuck)/i;
const ANIMAL=/(강아지|개 |고양이|곰|뱀|고래|상어|기린|코끼리|동물|반려견|puppy|dog|cat|bear|snake|whale|shark|giraffe|elephant|animal)/i;
const WEIRD=/(기묘|정체불명|희귀|이상한|괴상|미스터리|처음 보는|발견|실제로|바이럴|bizarre|weird|strange|mysterious|rare|odd|viral|found)/i;
const TECH=/(AI|로봇|기술|과학|우주|세포|유전자|엔지니어|발명|3D|인공지능|robot|science|space|cell|gene|engineer|technology|invention)/i;
const VISUALCAT=/(여행|푸드|음식|자연|동물|UGC|여행지|travel|food|nature)/i;
const RESULT=/(순간|장면|영상|결국|직접|점프|올라탄|뛰어|무너|폭발|실수|웃긴|moment|video|jumps?|falls?|crash|caught|watch)/i;
function txt(x){return [x?.title,x?.headlineKr,x?.captionKr,x?.cat].filter(Boolean).join(' ')}
function infer(x){
  const t=txt(x),override=x?.benchmarkPatternOverride,meta=x?.radarMeta?.patternCode;
  if(override&&PATTERNS[override])return {code:override,confidence:100,source:'수동 선택'};
  if(meta&&PATTERNS[meta])return {code:meta,confidence:Number(x?.radarMeta?.patternConfidence)||90,source:'Radar 패턴 분류'};
  if(ARCHIVE.test(t)&&(KNOWN.test(t)||CHANGE.test(t)))return {code:'ARCHIVE + CURRENT PEG',confidence:93,source:'과거 장면 + 현재 변화 신호'};
  if(DANGER.test(t)&&(ANIMAL.test(t)||/사람|남성|여성|아이|아버지|어머니|student|man|woman|child/i.test(t)))return {code:'DANGER → PAYOFF',confidence:92,source:'위기·구조 신호'};
  if(KNOWN.test(t)&&CHANGE.test(t))return {code:'RECOGNITION + CHANGE',confidence:91,source:'인지도 높은 인물 + 변화/숫자'};
  if(TECH.test(t))return {code:'WHAT + WHY WOW',confidence:84,source:'기술·과학 신호'};
  if(WEIRD.test(t))return {code:'WEIRD BUT TRUE',confidence:82,source:'기묘함·희귀성 신호'};
  if(VISUALCAT.test(t)&&!KNOWN.test(t))return {code:'VISUAL FIRST',confidence:78,source:'장면 중심 카테고리'};
  if(RESULT.test(t))return {code:'RESULT FIRST',confidence:74,source:'행동·결과 장면 신호'};
  return {code:'COMPLETE FACT',confidence:68,source:'기본 사실 전달형'};
}
function awareness(x){if(Number.isFinite(+x?.koreaAwareness))return Math.max(1,Math.min(5,+x.koreaAwareness));return KNOWN.test(txt(x))?5:3}
function escB(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function panel(){
  if(typeof current!=='function')return '';
  const x=current();if(!x)return '';
  const inf=infer(x),p=PATTERNS[inf.code],aw=awareness(x),visual=Number(x.visualScore||x.radarMeta?.visualScore||4);
  const patternButtons=Object.keys(PATTERNS).map(k=>`<button class="bm-pattern ${k===inf.code?'active':''}" onclick="benchmarkSetPattern('${escB(k)}')">${escB(PATTERNS[k].label)}</button>`).join('');
  const awarenessButtons=[1,2,3,4,5].map(n=>`<button class="bm-aware ${n===aw?'active':''}" onclick="benchmarkSetAwareness(${n})">${n}</button>`).join('');
  const archiveNote=inf.code==='ARCHIVE + CURRENT PEG'?'<div class="bm-archive-warning"><b>시점 표시 필수</b><span>과거 촬영·발언 시점과 현재 다시 화제가 된 이유를 분리해 적으세요. 과거 영상을 오늘 영상처럼 보이게 만들면 안 됩니다.</span></div>':'';
  return `<section class="benchmark-advisor" data-benchmark-advisor="1">
    <div class="bm-head"><div><span>BENCHMARK LEARNING</span><strong>${escB(p.label)}</strong></div><div class="bm-badges"><b>${escB(p.mode)}</b><b>${escB(p.format)}</b><em>${inf.confidence}%</em></div></div>
    <p class="bm-why"><b>왜 이 패턴인가</b>${escB(p.why)} <small>· ${escB(inf.source)}</small></p>
    ${archiveNote}
    <div class="bm-rules"><div><span>첫 화면</span><p>${escB(p.first)}</p></div><div><span>REELS</span><p>${escB(p.reel)}</p></div><div><span>CAROUSEL</span><p>${escB(p.carousel)}</p></div></div>
    <div class="bm-control"><div><span>패턴 직접 변경</span><div class="bm-patterns">${patternButtons}</div></div><div class="bm-awareness"><span>한국 인지도 <small>· ${aw}/5</small></span><div>${awarenessButtons}</div></div></div>
    <div class="bm-foot"><span>시각 신호 ${visual}/5</span><span>500채널 + 실제 포스트 학습 규칙</span><span>출처·권리 확인은 별도 Hard Gate</span></div>
  </section>`;
}
function mount(){
  const studio=document.getElementById('studio');if(!studio)return;
  studio.querySelectorAll('[data-benchmark-advisor]').forEach(n=>n.remove());
  const hero=studio.querySelector('.hero');if(!hero)return;
  const box=document.createElement('div');box.innerHTML=panel();const node=box.firstElementChild;if(node)hero.insertAdjacentElement('afterend',node);
}
window.benchmarkSetPattern=(code)=>{const x=typeof current==='function'?current():null;if(!x||!PATTERNS[code])return;x.benchmarkPatternOverride=code;x.radarMeta=x.radarMeta||{};x.radarMeta.patternCode=code;try{persist()}catch{};try{renderStudio()}catch{};try{toast(`패턴을 ${PATTERNS[code].label}로 변경했습니다`)}catch{}};
window.benchmarkSetAwareness=(n)=>{const x=typeof current==='function'?current():null;if(!x)return;x.koreaAwareness=Math.max(1,Math.min(5,+n||3));x.radarMeta=x.radarMeta||{};x.radarMeta.koreaAwareness=x.koreaAwareness;try{persist()}catch{};try{renderStudio()}catch{};};
window.NWBenchmarkLearning={infer,PATTERNS,awareness};
try{const before=renderStudio;renderStudio=function(){before();requestAnimationFrame(mount)}}catch(e){console.warn('benchmark advisor mount',e)}
window.addEventListener('load',()=>setTimeout(mount,420));
})();