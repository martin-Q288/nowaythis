(()=>{
const MIN_KR_AWARENESS=4;
const LOW_AWARENESS_BLOCK=/(serayah|joey bada\$\$|joey badass|annalynne mccord|annalynne|danny cipriani|khadijah haqq|danielle olivera|miranda hope|kaleb winterburn|sydney sweeney|margaret qualley)/i;
function isOverseasCeleb(x){return /해외연예|글로벌팝|celebrity/i.test(String(x?.cat||''));}
function isKoreanKnown(x){
  const t=[x?.title,x?.titleKr,x?.person,x?.celebrity].filter(Boolean).join(' ');
  if(LOW_AWARENESS_BLOCK.test(t))return false;
  const aw=Number(x?.koreaAwareness??x?.radarMeta?.koreaAwareness??0);
  return aw>=MIN_KR_AWARENESS;
}
function purgeAll(){
  if(!Array.isArray(window.data))return;
  const keep=window.data.filter(x=>!(isOverseasCeleb(x)&&!isKoreanKnown(x)));
  if(keep.length!==window.data.length){window.data.splice(0,window.data.length,...keep);try{persist()}catch{}try{render()}catch{}}
}
function purgeNew(before){
  if(!Array.isArray(window.data))return;
  const keep=[];
  for(const x of window.data){
    const isNew=!before.has(x?.id);
    if(isNew&&isOverseasCeleb(x)&&!isKoreanKnown(x))continue;
    keep.push(x);
  }
  if(keep.length!==window.data.length){window.data.splice(0,window.data.length,...keep);try{persist()}catch{}try{render()}catch{}}
}
function install(){
  purgeAll();
  const base=window.discoverReadyTen;
  if(typeof base!=='function'||base.__krCelebGate)return;
  const wrapped=async function(){const before=new Set((window.data||[]).map(x=>x?.id));const out=await base.apply(this,arguments);purgeNew(before);return out;};
  wrapped.__krCelebGate=true;window.discoverReadyTen=wrapped;
}
window.addEventListener('load',()=>setTimeout(install,700));setTimeout(install,1200);
})();