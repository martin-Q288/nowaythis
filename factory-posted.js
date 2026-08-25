(()=>{
const POST_VERSION='posted-download-20260825-v1';
function migratePostState(){
  let changed=false;
  data.forEach(x=>{
    if(!Array.isArray(x.postLog)){x.postLog=[];changed=true}
    if(x.postedKrAt===undefined){x.postedKrAt=null;changed=true}
    if(x.postedJpAt===undefined){x.postedJpAt=null;changed=true}
    if(x.postedKrSlides===undefined){x.postedKrSlides=0;changed=true}
    if(x.postedJpSlides===undefined){x.postedJpSlides=0;changed=true}
    if(x.postedAt && !x.postedKrAt && !x.postedJpAt && !x.legacyPostedAt){x.legacyPostedAt=x.postedAt;changed=true}
  });
  if(changed) persist();
  localStorage.setItem(POST_VERSION,'1');
}
function postEvents(x){
  const out=[];
  if(x.postedKrAt) out.push({lang:'KR',at:+x.postedKrAt,slides:+x.postedKrSlides||1});
  if(x.postedJpAt) out.push({lang:'JP',at:+x.postedJpAt,slides:+x.postedJpSlides||1});
  if(x.legacyPostedAt && !x.postedKrAt && !x.postedJpAt) out.push({lang:'POST',at:+x.legacyPostedAt,slides:1,legacy:true});
  return out.filter(e=>Number.isFinite(e.at)&&e.at>0);
}
function formatPostedTime(ts){
  if(!ts) return '';
  const d=new Date(+ts),now=new Date();
  const same=d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth()&&d.getDate()===now.getDate();
  return same?`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`:`${d.getMonth()+1}/${d.getDate()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
function hasPosted(x){return postEvents(x).length>0}
window.renderQuota=function(){
  const cutoff=Date.now()-14*864e5;
  const events=data.flatMap(postEvents).filter(e=>e.at>=cutoff);
  const c=events.length;
  $('#count14').textContent=c;
  $('#quotaBar').style.width=Math.min(100,c/150*100)+'%';
  const quota=$('.quota-line');
  if(quota){
    const kr=events.filter(e=>e.lang==='KR').length,jp=events.filter(e=>e.lang==='JP').length;
    quota.title=`최근 14일 · KR ${kr}건 · JP ${jp}건`;
  }
};
window.renderRadar=function(){
  const list=filter==='POSTED'?data.filter(hasPosted):data.filter(x=>filter==='ALL'||x.status===filter);
  $('#radarList').innerHTML=list.length?list.map(x=>{
    const ev=postEvents(x).sort((a,b)=>b.at-a.at);
    const posted=ev.length?`<div class="posted-meta">${ev.map(e=>`<span class="post-chip ${e.lang.toLowerCase()}">${e.lang} · ${e.slides}장 · ${formatPostedTime(e.at)}</span>`).join('')}</div>`:'';
    const displayStatus=ev.length?'POSTED':x.status;
    return `<div class="radar-item ${x.id===selected?'active':''}" onclick="selectItem('${x.id}')"><div class="radar-row"><div class="score">${x.score||28}</div><div class="radar-copy"><div class="radar-title">${esc(x.title)}</div><div class="radar-meta"><span class="dot ${displayStatus}"></span>${displayStatus} · ${esc(x.cat||'해외토픽')}</div>${posted}</div></div></div>`;
  }).join(''):'<div class="empty-list">비어 있습니다</div>';
};
function registerPosted(lang,slides){
  const x=current(),now=Date.now(),upper=lang.toUpperCase();
  const atKey=lang==='kr'?'postedKrAt':'postedJpAt';
  const slidesKey=lang==='kr'?'postedKrSlides':'postedJpSlides';
  const first=!x[atKey];
  if(first){
    x[atKey]=now;
    x[slidesKey]=slides;
    x.postLog=x.postLog||[];
    x.postLog.push({lang:upper,at:now,slides});
  }else{
    x[slidesKey]=Math.max(+x[slidesKey]||0,+slides||0);
  }
  x.status='POSTED';
  x.postedAt=Math.max(+x.postedKrAt||0,+x.postedJpAt||0,+x.legacyPostedAt||0);
  persist();
  renderQuota();renderRadar();renderPublish();
  toast(first?`${upper} 업로드 완료로 기록 · 14 DAY +1`:`${upper}은 이미 카운팅된 작업입니다`);
}
const originalDownload=window.downloadSelected;
window.downloadSelected=async function(lang){
  const x=current(),ids=selectedIds(x,lang);
  if(!ids.length){toast(`${lang.toUpperCase()} 이미지를 먼저 선택하세요`);return}
  await originalDownload(lang);
  registerPosted(lang,ids.length);
};
window.changeStatus=function(v){
  const x=current();
  if(v==='POSTED'&&!hasPosted(x)){
    toast('POSTED는 이미지 저장 시 자동 기록됩니다');
    renderStudio();
    return;
  }
  x.status=v;
  save();
};
const previousRenderPublish=window.renderPublish;
window.renderPublish=function(){
  previousRenderPublish();
  const x=current(),events=postEvents(x).sort((a,b)=>b.at-a.at);
  if(!events.length)return;
  const root=$('#publish');if(!root)return;
  root.insertAdjacentHTML('beforeend',`<div class="section posted-history"><div class="section-head"><b>POSTED HISTORY</b><span class="muted-small">자동 저장</span></div><div class="posted-history-list">${events.map(e=>`<div class="posted-history-row"><span class="post-chip ${e.lang.toLowerCase()}">${e.lang}</span><b>${e.slides}장</b><span>${formatPostedTime(e.at)}</span></div>`).join('')}</div><div class="guide">같은 주제·같은 언어를 다시 다운로드해도 14 DAY 카운터는 중복 증가하지 않습니다. KR과 JP를 각각 다운로드하면 각각 1건으로 기록됩니다.</div></div>`);
};
migratePostState();
render();
})();