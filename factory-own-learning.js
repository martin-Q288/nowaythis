(()=>{
const MIN_SAMPLES=3;
function num(v){const n=+v;return Number.isFinite(n)&&n>=0?n:0}
function median(a){const x=a.filter(Number.isFinite).sort((a,b)=>a-b);if(!x.length)return 0;const m=Math.floor(x.length/2);return x.length%2?x[m]:(x[m-1]+x[m])/2}
function clamp(a,b,v){return Math.max(a,Math.min(b,v))}
function patternOf(x){
  if(x?.benchmarkPatternOverride)return x.benchmarkPatternOverride;
  if(x?.radarMeta?.patternCode)return x.radarMeta.patternCode;
  try{return window.NWBenchmarkLearning?.infer(x)?.code||'COMPLETE FACT'}catch{return'COMPLETE FACT'}
}
function samples(){
  const out=[];
  try{
    (data||[]).forEach(x=>{
      const code=patternOf(x);
      Object.entries(x.reels||{}).forEach(([lang,r])=>{
        const p=r?.performance||{},views=num(p.views),likes=num(p.likes),shares=num(p.shares),saves=num(p.saves);
        if(!views&&!likes&&!shares&&!saves)return;
        out.push({id:x.id,lang,code,views,likes,shares,saves,postedAt:num(r?.postedAt)});
      });
    });
  }catch{}
  return out;
}
function stats(){
  const all=samples(),viewBase=median(all.map(s=>s.views).filter(Boolean))||1;
  const engBase=median(all.filter(s=>s.views>0).map(s=>(s.shares+s.saves)*1000/s.views))||1;
  const map={};
  all.forEach(s=>(map[s.code]||(map[s.code]=[])).push(s));
  const byPattern={};
  Object.entries(map).forEach(([code,arr])=>{
    const medViews=median(arr.map(s=>s.views).filter(Boolean));
    const perK=median(arr.filter(s=>s.views>0).map(s=>(s.shares+s.saves)*1000/s.views));
    const viewRatio=medViews?medViews/viewBase:1,engRatio=perK?perK/engBase:1;
    const raw=.72*Math.log2(Math.max(.25,viewRatio))+.28*Math.log2(Math.max(.25,engRatio));
    const confidence=clamp(0,1,(arr.length-MIN_SAMPLES+1)/7);
    const bonus=arr.length<MIN_SAMPLES?0:Math.round(clamp(-12,14,raw*7*confidence));
    byPattern[code]={n:arr.length,medViews,perK,viewRatio,engRatio,bonus,confidence};
  });
  return {all,viewBase,engBase,byPattern};
}
function bonusForPattern(code){return stats().byPattern[code]?.bonus||0}
function fmt(n){if(!n)return'0';if(n>=1e6)return(n/1e6).toFixed(n>=1e7?1:2)+'M';if(n>=1e3)return(n/1e3).toFixed(n>=1e4?1:2)+'K';return Math.round(n).toLocaleString('ko-KR')}
function escO(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function currentCode(){try{return patternOf(current())}catch{return'COMPLETE FACT'}}
function html(){
  const s=stats(),code=currentCode(),p=s.byPattern[code],n=p?.n||0;
  const state=n<MIN_SAMPLES?`표본 ${n}/${MIN_SAMPLES} · 아직 자동 가중치 없음`:`표본 ${n}개 · Radar ${p.bonus>=0?'+':''}${p.bonus}점`;
  const detail=n?`중앙 조회수 ${fmt(p.medViews)} · 공유+저장 ${p.perK.toFixed(1)}/1K뷰`:`이 패턴의 실제 성과를 입력하면 학습을 시작합니다.`;
  const all=s.all.length?`전체 ${s.all.length}개 성과 학습 · 전체 중앙 조회수 ${fmt(s.viewBase)}`:'아직 입력된 릴스 성과가 없습니다.';
  return `<section class="own-learning" data-own-learning="1"><div class="ol-head"><div><span>OUR ACCOUNT LEARNING</span><strong>${escO(code)}</strong></div><b class="${n>=MIN_SAMPLES?(p.bonus>=0?'up':'down'):'wait'}">${escO(state)}</b></div><div class="ol-main"><p>${escO(detail)}</p><small>${escO(all)}</small></div><div class="ol-rule">같은 패턴 3개 이상부터만 다음 소재 순위에 반영 · 표본이 쌓일수록 벤치마크보다 대표님 계정 실적의 비중이 커집니다.</div></section>`;
}
function mount(){const studio=document.getElementById('studio');if(!studio)return;studio.querySelectorAll('[data-own-learning]').forEach(n=>n.remove());const bm=studio.querySelector('[data-benchmark-advisor]');if(!bm)return;bm.insertAdjacentHTML('afterend',html())}
window.NWOwnLearning={samples,stats,bonusForPattern,patternOf};
try{const prev=window.saveReelMetric;if(typeof prev==='function')window.saveReelMetric=function(...args){const r=prev(...args);setTimeout(mount,30);return r}}catch{}
try{const before=renderStudio;renderStudio=function(){before();requestAnimationFrame(()=>setTimeout(mount,0))}}catch(e){console.warn('own learning mount',e)}
window.addEventListener('load',()=>setTimeout(mount,650));
})();