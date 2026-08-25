(()=>{
const VERSION='caption-20260825-v1';
const RICH={
  bolt:{
    kr:`세계에서 가장 빠른 남자가 13년 만에 무릎을 꿇었습니다.\n\n우사인 볼트가 오랜 연인 카시 베넷에게 프러포즈했습니다. 두 사람은 2013년부터 교제해 왔고, 오랜 시간 가족을 이루며 함께해 왔습니다.\n\n프러포즈는 볼트의 40번째 생일을 기념한 자리에서 진행됐습니다. 공개된 사진에는 볼트가 한쪽 무릎을 꿇고 반지를 건네는 모습과, 예상하지 못한 순간에 놀란 베넷의 표정이 담겼습니다.\n\n10년이 넘는 시간을 함께한 두 사람인 만큼 팬들 사이에서는 “드디어”라는 반응도 이어졌습니다. 다만 현재 공개된 내용은 약혼 소식이며, 결혼식 날짜나 구체적인 일정은 별도로 알려지지 않았습니다.\n\n13년을 함께한 뒤 받은 프러포즈. 여러분은 이 장면 어떻게 보셨나요?\n\n#NOWAYTHIS #우사인볼트 #해외연예 #프로포즈`,
    jp:`世界最速の男が、13年越しにひざまずきました。\n\nウサイン・ボルトが長年のパートナー、カシ・ベネットにプロポーズ。2人は2013年頃から交際を続け、長い時間を家族として過ごしてきました。\n\nプロポーズが行われたのは、ボルトの40歳の誕生日を祝う場。公開された写真には、片膝をついて指輪を差し出すボルトと、驚いた表情を見せるベネットの姿が写っています。\n\n10年以上を共にしてきた2人だけに、ファンからは「ついに」という反応も。現時点で公表されているのは婚約で、結婚式の日程などは明らかになっていません。\n\n13年を経て迎えたこの瞬間、みなさんはどう思いますか？\n\n#NOWAYTHIS #ウサインボルト #海外エンタメ #プロポーズ`
  },
  kinkajou:{
    kr:`쇼핑센터 한복판에 나타난 이 동물, 처음 본 경찰도 정체를 바로 알아보지 못했습니다.\n\n미국 텍사스의 한 쇼핑센터에서 평소 보기 힘든 동물이 발견돼 신고가 접수됐습니다. 사진만 보면 원숭이처럼 보이기도 하고, 작은 곰이나 라쿤을 떠올리게 하는 생김새였습니다.\n\n확인 결과 정체는 ‘킨카주’였습니다. 킨카주는 중남미 열대우림에 사는 야행성 포유류로, 긴 꼬리와 둥근 얼굴 때문에 원숭이로 오해받기 쉽지만 분류상으로는 라쿤과 더 가까운 동물입니다.\n\n도심 쇼핑센터에서 쉽게 볼 수 있는 종이 아니다 보니 현지에서도 사진과 영상이 빠르게 퍼졌습니다. 다만 사진만으로 소유 관계나 어떻게 현장에 오게 됐는지까지 단정해서는 안 됩니다.\n\n여러분은 첫 사진만 보고 어떤 동물이라고 생각했나요?\n\n#NOWAYTHIS #해외토픽 #희귀동물 #킨카주`,
    jp:`ショッピングセンターに突然現れたこの動物。最初は警察もすぐに正体を判断できませんでした。\n\nアメリカ・テキサス州の商業施設で、普段ほとんど見かけない動物が発見され通報されました。見た目はサルにも、小さなクマやアライグマにも見えます。\n\n正体は「キンカジュー」。中南米の熱帯雨林に生息する夜行性の哺乳類で、長い尾と丸い顔からサルに間違われることがありますが、分類上はアライグマに近い動物です。\n\n街中のショッピングセンターで見つかるのは珍しく、現地でも写真が拡散。ただし、写真だけで飼い主や現場に来た経緯まで断定することはできません。\n\n最初の写真を見て、何の動物だと思いましたか？\n\n#NOWAYTHIS #海外トピック #珍しい動物 #キンカジュー`
  }
};
function migrate(){
  if(localStorage.getItem(VERSION)) return;
  data.forEach(x=>{
    const p=RICH[x.id];
    if(!p) return;
    if((x.captionKr||'').length<260) x.captionKr=p.kr;
    if((x.captionJp||'').length<180) x.captionJp=p.jp;
  });
  localStorage.setItem(VERSION,'1');
  persist();
}
function metrics(lang,text){
  const len=[...String(text||'')].length;
  const first=(String(text||'').split(/\n+/)[0]||'').trim();
  const min=lang==='kr'?350:220,max=lang==='kr'?650:500;
  const state=len<min?'short':len>max?'long':'good';
  const label=state==='short'?'내용 부족':state==='long'?'조금 김':'적정';
  const pct=Math.min(100,Math.round(len/min*100));
  return {len,firstLen:[...first].length,min,max,state,label,pct};
}
function hashtagsFor(lang,x){
  if(lang==='kr'){
    const cat=(x.cat||'').includes('연예')?'#해외연예':(x.cat||'').includes('동물')?'#희귀동물':'#해외토픽';
    return ['#NOWAYTHIS',cat,'#실화'];
  }
  const cat=(x.cat||'').includes('연예')?'#海外エンタメ':(x.cat||'').includes('동물')?'#珍しい動物':'#海外トピック';
  return ['#NOWAYTHIS',cat,'#実話'];
}
function ctaFor(lang,x){
  if(lang==='kr'){
    if((x.cat||'').includes('동물')) return '여러분은 첫 사진만 보고 어떤 동물이라고 생각했나요?';
    if((x.cat||'').includes('연예')) return '여러분은 이 소식 어떻게 보셨나요?';
    if((x.cat||'').includes('생존')) return '여러분이라면 이 상황에서 어떤 선택을 했을까요?';
    return '여러분은 이 사건 어떻게 보셨나요?';
  }
  if((x.cat||'').includes('동물')) return '最初の写真を見て、何の動物だと思いましたか？';
  if((x.cat||'').includes('연예')) return 'みなさんはこのニュースをどう思いますか？';
  return 'みなさんはこの出来事をどう思いますか？';
}
function formatText(lang,text,x){
  let body=String(text||'').replace(/\r/g,'').replace(/\n{3,}/g,'\n\n').trim();
  const tagLines=(body.match(/(?:^|\s)#[^\s#]+/g)||[]).map(s=>s.trim());
  body=body.replace(/(?:^|\s)#[^\s#]+/g,' ').replace(/[ \t]+\n/g,'\n').replace(/\n{3,}/g,'\n\n').trim();
  const hook=(lang==='kr'?x.headlineKr:x.headlineJp||'').replace(/\n/g,' ').trim();
  const first=(body.split(/\n+/)[0]||'').trim();
  if(hook && !first.includes(hook.slice(0,Math.min(12,hook.length)))) body=hook+(lang==='kr'?'.':'。')+'\n\n'+body;
  let paras=body.split(/\n\n+/).map(p=>p.trim()).filter(Boolean);
  const rebuilt=[];
  paras.forEach(p=>{
    if(p.length>(lang==='kr'?150:120)){
      const sent=p.match(lang==='kr'?/[^.!?]+[.!?]?/g:/[^。！？]+[。！？]?/g)||[p];
      for(let i=0;i<sent.length;i+=2){const chunk=sent.slice(i,i+2).join('').trim();if(chunk)rebuilt.push(chunk)}
    }else rebuilt.push(p);
  });
  let joined=rebuilt.join('\n\n');
  if(!/[?？]\s*$/.test(joined)) joined+='\n\n'+ctaFor(lang,x);
  let tags=[...new Set([...tagLines,...hashtagsFor(lang,x)])].slice(0,5);
  return joined+'\n\n'+tags.join(' ');
}
window.updateCaptionMeta=function(lang,text){
  const m=metrics(lang,text),root=document.getElementById('capmeta-'+lang);if(!root)return;
  root.querySelector('.caption-count').textContent=`${m.len}자`;
  const pill=root.querySelector('.quality-pill');pill.className='quality-pill '+m.state;pill.textContent=m.label;
  root.querySelector('.caption-rule').textContent=`권장 ${m.min}~${m.max}자`;
  root.querySelector('.caption-progress i').style.width=m.pct+'%';
  root.querySelector('.caption-firstline').textContent=`첫 줄 ${m.firstLen}자 · 피드에서 약 125자 안쪽에 핵심 훅 배치`;
};
window.applyCaptionStructure=function(lang){
  const x=current(),key=lang==='kr'?'captionKr':'captionJp';
  x[key]=formatText(lang,x[key],x);persist();renderPublish();toast('캡션 구조를 정리했습니다');
};
renderPublish=function(){
  const x=current();if(!x){$('#publish').innerHTML='';return}
  $('#publishState').textContent=x.status;
  const block=(lang,label,copyLabel)=>{const key=lang==='kr'?'captionKr':'captionJp',m=metrics(lang,x[key]);return `<div class="section"><div class="section-head"><b>${label} CAPTION</b><button class="tiny" onclick="copyCaption('${lang}')">${copyLabel}</button></div><div class="caption-toolbar" id="capmeta-${lang}"><div class="caption-quality"><span class="caption-count">${m.len}자</span><span class="quality-pill ${m.state}">${m.label}</span><span class="caption-rule">권장 ${m.min}~${m.max}자</span></div><button class="caption-format" onclick="applyCaptionStructure('${lang}')">구조 정리</button><div class="caption-progress" style="flex-basis:100%"><i style="width:${m.pct}%"></i></div><div class="caption-firstline" style="flex-basis:100%">첫 줄 ${m.firstLen}자 · 피드에서 약 125자 안쪽에 핵심 훅 배치</div></div><textarea class="caption" oninput="editCaption('${lang}',this.value);updateCaptionMeta('${lang}',this.value)">${esc(x[key]||'')}</textarea><div class="caption-tip"><b>실전 구조</b> · 첫줄 훅 → 사건 개요 → 핵심 디테일 → 확인된 맥락/주의점 → CTA → 해시태그 3~5개</div></div>`};
  $('#publish').innerHTML=block('kr','KR','복사')+block('jp','JP','コピー')+`<div class="section"><div class="section-head"><b>INSTAGRAM MUSIC</b><span class="muted-small">앱에서 선택</span></div>${(x.music||[]).map(m=>`<div class="music"><span>${esc(m)}</span><button class="tiny" onclick="copyInline('${esc(m).replace(/'/g,"\\'")}')">복사</button></div>`).join('')}</div><div class="section"><div class="section-head"><b>FACT CHECK</b></div><div class="checks">${(x.fact||[]).map((f,i)=>`<label><input type="checkbox" ${x.done[i]?'checked':''} onchange="toggleFact(${i},this.checked)">${esc(f)}</label>`).join('')}</div></div><div class="section"><div class="section-head"><b>CAPTION STANDARD</b></div><div class="caption-benchmark"><b>NO WAY THIS 기본값</b><br>짧은 한두 문장으로 끝내지 않고, 사진만으로 알 수 없는 ‘왜 이런 장면이 나왔는지’를 본문에서 설명합니다.<div class="caption-structure"><span>HOOK</span><span>WHAT</span><span>DETAIL</span><span>FACT</span><span>CTA</span></div></div></div><div class="section"><div class="section-head"><b>CAROUSEL</b></div><div class="guide">KR ${x.krSelected.length}장 · JP ${x.jpSelected.length}장 선택됨<br>각 언어의 썸네일 스트립을 눌러 사진별 크롭을 수정할 수 있습니다.<br>저장 버튼은 현재 선택된 장수만큼 순서대로 PNG를 생성합니다.</div></div>`;
};
migrate();renderPublish();
})();