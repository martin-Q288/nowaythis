(()=>{
const TKEY='nwf-trash-v1';
const DISCOVERY_COUNT=10;
const DEFAULT_FILTER='READY';
const BM_KNOWN=/(테일러|스위프트|호날두|메시|비버|셀레나|젠데이아|시드니 스위니|톰 크루즈|브래드 피트|디카프리오|카다시안|제너|홀란|음바페|배드 버니|비욘세|아리아나|레이디 가가|브루노 마스|빌리 아일리시|두아 리파|BTS|BLACKPINK|KATSEYE|Taylor Swift|Ronaldo|Messi|Bieber|Zendaya|Sydney Sweeney|Tom Cruise|Brad Pitt|Haaland|Bad Bunny|Beyonce|Ariana Grande|Lady Gaga|Billie Eilish)/i;
const BM_CHANGE=/(최초|기록|번째|년 만|생일|결혼|약혼|열애|이별|복귀|변신|헤어|삭발|금발|공개|출연|캐스팅|우승|수상|팔로워|증가|first|record|birthday|wedding|engag|dating|breakup|return|debut|wins?|award|million|billion|%|\d)/i;
const BM_DANGER=/(구조|구했다|구해|갇힌|불길|화재|익사|물에 빠|추락|생존|실종|위기|rescue|saved?|trapped|fire|drown|surviv|stuck)/i;
const BM_ANIMAL=/(강아지|고양이|곰|뱀|고래|상어|기린|코끼리|동물|반려견|puppy|dog|cat|bear|snake|whale|shark|giraffe|elephant|animal)/i;
const BM_WEIRD=/(기묘|정체불명|희귀|이상한|괴상|미스터리|처음 보는|발견|실제로|bizarre|weird|strange|mysterious|rare|odd|found)/i;
const BM_TECH=/(AI|로봇|기술|과학|우주|세포|유전자|엔지니어|발명|3D|인공지능|robot|science|space|cell|gene|engineer|technology|invention)/i;

function trashItems(){try{return JSON.parse(localStorage.getItem(TKEY))||[]}catch{return []}}
function norm(s=''){return String(s).toLowerCase().replace(/[^a-z0-9가-힣ぁ-んァ-ン一-龥éèêëáàâäíìîïóòôöúùûüçñ]+/g,' ').trim()}
function tokens(s=''){return new Set(norm(s).split(/\s+/).filter(w=>w.length>1))}
function similar(a,b){const A=tokens(a),B=tokens(b);if(!A.size||!B.size)return false;let n=0;A.forEach(x=>{if(B.has(x))n++});return n/Math.min(A.size,B.size)>=.62}
function sourceOf(x){return x?.source||x?.sourceUrl||''}
function benchmarkPattern(r){
  if(r?.patternCode)return r.patternCode;
  const t=[r?.titleKr,r?.title,r?.cat].filter(Boolean).join(' ');
  if(BM_DANGER.test(t)&&(BM_ANIMAL.test(t)||/사람|남성|여성|아이|아버지|어머니|man|woman|child/i.test(t)))return'DANGER → PAYOFF';
  if(BM_KNOWN.test(t)&&BM_CHANGE.test(t))return'RECOGNITION + CHANGE';
  if(BM_TECH.test(t))return'WHAT + WHY WOW';
  if(BM_WEIRD.test(t))return'WEIRD BUT TRUE';
  if(/여행|푸드|음식|자연|travel|food|nature/i.test(t))return'VISUAL FIRST';
  if(/순간|장면|영상|결국|직접|점프|올라탄|뛰어|무너|폭발|실수|moment|video|jumps?|falls?|crash|caught/i.test(t))return'RESULT FIRST';
  return'COMPLETE FACT';
}
function patternBonus(code){return({'RECOGNITION + CHANGE':15,'DANGER → PAYOFF':15,'WEIRD BUT TRUE':12,'WHAT + WHY WOW':10,'RESULT FIRST':10,'VISUAL FIRST':9,'COMPLETE FACT':6})[code]||0}
function patternMode(code){return ['DANGER → PAYOFF','RESULT FIRST','VISUAL FIRST','WHAT + WHY WOW'].includes(code)?'VISUAL-FIRST':'HEADLINE-FIRST'}
function patternFormat(code){if(['DANGER → PAYOFF','RESULT FIRST','VISUAL FIRST'].includes(code))return'REELS 우선';if(code==='COMPLETE FACT')return'CAROUSEL 강함';return'REELS + CAROUSEL'}
function koreaAwareness(r){if(Number.isFinite(+r?.koreaAwareness))return Math.max(1,Math.min(5,+r.koreaAwareness));const t=[r?.titleKr,r?.title].filter(Boolean).join(' ');if(BM_KNOWN.test(t))return 5;if(BM_ANIMAL.test(t)||BM_WEIRD.test(t))return 4;return 3}
function isDuplicate(r){
  const title=r.titleKr||r.title||'';
  const src=sourceOf(r);
  const pool=[...(data||[]),...trashItems()];
  return pool.some(x=>{
    const xt=x.titleKr||x.title||'';
    const xs=sourceOf(x);
    return (src&&xs&&src===xs)||norm(xt)===norm(title)||similar(xt,title);
  });
}
function memoBlocked(r){
  const memo=trashItems().flatMap(t=>[...(t.trashReasons||[]),t.trashMemo||'']).join(' ');
  const title=r.titleKr||r.title||'';
  if(/정치|정책|사회성/.test(memo)&&/(대통령|정부|국회|정책|선거|정당|president|government|election)/i.test(title))return true;
  if(/사진이 약|썸네일/.test(memo)&&Number(r.visualScore||4)<4)return true;
  return false;
}
function hoursOld(pub){const n=Date.parse(pub||'');return Number.isFinite(n)?Math.max(0,(Date.now()-n)/36e5):24}
function rank(r){
  const code=benchmarkPattern(r),aw=koreaAwareness(r),visual=Math.max(1,Math.min(5,Number(r.visualScore||4)));
  return Number(r.score||27)*8-Math.min(48,hoursOld(r.publishedAt||r.pubDate||''))*.8+aw*8+visual*6+patternBonus(code)+(r.curated?50:0);
}
function breakHeadline(t){const s=String(t||'').trim();if(s.length<=22)return s;let cut=s.lastIndexOf(' ',22);if(cut<8)cut=Math.min(22,s.length);return s.slice(0,cut).trim()+'\n'+s.slice(cut).trim()}
function captionKr(r,title){const pub=r.publisher?` 보도 출처는 ${r.publisher}입니다.`:'';return `${title}\n\n현재 한국 뉴스·소셜에서 확인할 가치가 높은 해외 이슈로 발굴된 콘텐츠입니다.${pub}\n\n제목만 보고 단정하지 말고 원문에서 사건이 벌어진 시점, 장소, 당사자 발언과 실제 사진·영상의 맥락을 확인한 뒤 게시해 주세요. 첫 장에서는 가장 놀라운 ‘확인된 사실’ 하나를 강하게 보여주고, 캡션에서는 사진만으로 알 수 없는 배경을 보충하는 방식이 좋습니다.\n\n원문 확인 후 사실관계를 보강해 발행해 주세요.\n\n#NOWAYTHIS #해외토픽 #오늘의이슈 #바이럴`}
function captionJp(title){return `${title}\n\n韓国で今チェックする価値が高い海外トピックとしてピックアップされた内容です。\n\n投稿前に元記事で日時・場所・当事者の発言・画像や動画の文脈を確認してください。1枚目では最も意外な確認済みの事実を見せ、キャプションでは画像だけでは分からない背景を補う構成がおすすめです。\n\n#NOWAYTHIS #海外ニュース #話題`}
function captionEn(title){return `${title}\n\nThis story was surfaced as a timely overseas topic with strong potential interest for a Korean audience.\n\nBefore publishing, verify the date, location, quotes and the context of the original image or video. Lead the first card with one surprising confirmed fact, then use the caption to explain what the visual alone cannot show.\n\n#NOWAYTHIS #ViralNews #Trending`}
function makeReady(r){
  const title=String(r.titleKr||r.title||'').trim();
  const hk=r.hookKr||breakHeadline(title);
  const id='discover-'+(r.id||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7))+'-'+Math.random().toString(36).slice(2,5);
  const code=benchmarkPattern(r),aw=koreaAwareness(r),visual=Math.max(1,Math.min(5,Number(r.visualScore||4)));
  return normalize([{
    id,title,score:Number(r.score)||28,cat:r.cat||'해외토픽',status:'READY',source:sourceOf(r),
    publisher:r.publisher||'',publishedAt:r.publishedAt||'',discoveredAt:Date.now(),discovery:r.curated?'curated':'manual',koreaAwareness:aw,visualScore:visual,
    hooksKr:[hk,r.hookKr2||title,'왜 지금 화제일까?'],headlineKr:hk,hookKr:0,
    hooksJp:[r.hookJp||'海外でいま話題\n何が起きた？',r.hookJp2||'なぜ注目？','現場が話題に'],headlineJp:r.hookJp||'海外でいま話題\n何が起きた？',hookJp:0,
    hooksEn:[r.hookEn||'Why is this\ngoing viral?',r.hookEn2||'What happened?','The moment people noticed'],headlineEn:r.hookEn||'Why is this\ngoing viral?',hookEn:0,
    captionKr:r.captionKr||captionKr(r,title),captionJp:r.captionJp||captionJp(title),captionEn:r.captionEn||captionEn(title),
    music:['original audio','trending audio','news audio'],
    fact:['원문 출처 확인','게시 날짜·사건 시점 확인','사진·영상이 실제 사건 장면인지 확인','핵심 사실 교차 확인'],done:[],images:[],
    krSelected:[],jpSelected:[],enSelected:[],krFrames:{},jpFrames:{},enFrames:{},krFontSize:70,jpFontSize:70,enFontSize:70,postedLangs:{},
    radarMeta:{scoreBreakdown:r.scoreBreakdown||null,thumbnailOptionsKr:r.thumbnailOptionsKr||[],thumbnailFinalKr:r.thumbnailFinalKr||'',photoCandidate:r.photoCandidate||'',photoSource:r.photoSource||'',layoutKr:r.layoutKr||'',ctaKr:r.ctaKr||'',factSources:r.factSources||[],patternCode:code,patternConfidence:r.patternConfidence||null,visualMode:r.visualMode||patternMode(code),formatRecommendation:r.formatRecommendation||patternFormat(code),koreaAwareness:aw,visualScore:visual,benchmarkVersion:'500ch-v3'}
  }])[0];
}
function setReadyFilter(){
  try{filter=DEFAULT_FILTER}catch{}
  document.querySelectorAll('.segments button').forEach(b=>b.classList.toggle('active',b.dataset.filter===DEFAULT_FILTER));
  try{renderRadar()}catch{}
}
function button(){return document.getElementById('discoverBtn')}
function setBusy(v){const b=button();if(!b)return;b.disabled=v;b.innerHTML=v?'<span class="discover-spin"></span>발굴 중…':'발굴 +10'}
async function fetchFeed(path,curated=false){try{const res=await fetch(`${path}?v=${Date.now()}`,{cache:'no-store'});if(!res.ok)return[];const arr=await res.json();return (Array.isArray(arr)?arr:[]).map(x=>curated?{...x,curated:true}:x)}catch{return[]}}
async function discoverTen(){
  const b=button();if(!b||b.disabled)return;
  setBusy(true);
  try{
    const [curated,regular]=await Promise.all([fetchFeed('curated-radar.json',true),fetchFeed('radar-feed.json')]);
    const feed=[...curated,...regular];
    const candidates=feed
      .filter(r=>r?.title&&!isDuplicate(r)&&!memoBlocked(r))
      .sort((a,b)=>rank(b)-rank(a));
    const chosen=[];
    for(const r of candidates){
      if(chosen.length>=DISCOVERY_COUNT)break;
      if(chosen.some(x=>similar(x.titleKr||x.title,r.titleKr||r.title)))continue;
      chosen.push(r);
    }
    if(!chosen.length){toast('새 후보가 없습니다 · 시간당 레이더가 갱신되면 다시 눌러주세요');return}
    const items=chosen.map(makeReady);
    data.unshift(...items);
    selected=items[0].id;
    try{filter='READY'}catch{}
    persist();
    render();
    document.querySelectorAll('.segments button').forEach(x=>x.classList.toggle('active',x.dataset.filter==='READY'));
    toast(items.length===10?'벤치마크 패턴까지 반영해 10개를 READY에 추가했습니다':`신규 후보 ${items.length}개를 READY에 추가했습니다`);
    try{autoFindImages()}catch{}
  }catch(e){
    console.warn('manual discovery',e);
    toast('발굴 데이터를 불러오지 못했습니다 · 잠시 후 다시 눌러주세요');
  }finally{setBusy(false)}
}
window.discoverReadyTen=discoverTen;
window.NWDiscoveryBenchmark={benchmarkPattern,patternBonus,koreaAwareness,rank};
window.addEventListener('load',()=>setTimeout(setReadyFilter,80));
})();
