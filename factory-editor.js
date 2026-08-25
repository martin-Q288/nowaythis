(()=>{
const META={kr:'KR',jp:'JP',en:'EN'};
let ffmpegLoader=null,previewState=null;
function lang(){const l=window.getFactoryLanguage?.()||localStorage.getItem('nwf-active-language-v1')||'kr';return META[l]?l:'kr'}
function media(){const x=current(),l=lang(),id=x?.reels?.[l]?.image;return x?.images?.find(i=>i.id===id)||null}
function isVideo(im){return !!im&&(im.type==='video-upload'||String(im.mime||'').startsWith('video/'))}
function E(x=current(),l=lang()){
  x.reels=x.reels||{};x.reels[l]=x.reels[l]||{};
  const r=x.reels[l];r.edit=r.edit||{markIn:0,markOut:0,segments:[]};
  const e=r.edit,d=Number(media()?.duration||0);
  if(!Number.isFinite(+e.markIn))e.markIn=0;
  if(!Number.isFinite(+e.markOut)||+e.markOut<=0)e.markOut=d||0;
  e.markIn=Math.max(0,Math.min(+e.markIn,d||+e.markIn));
  e.markOut=Math.max(e.markIn,Math.min(+e.markOut,d||+e.markOut));
  e.segments=Array.isArray(e.segments)?e.segments.filter(s=>Number.isFinite(+s.start)&&Number.isFinite(+s.end)&&+s.end>+s.start):[];
  return e;
}
function fmt(s){s=Math.max(0,+s||0);const m=Math.floor(s/60),sec=s-m*60;return `${m}:${sec.toFixed(2).padStart(5,'0')}`}
function total(e=E()){return e.segments.reduce((n,s)=>n+(+s.end-+s.start),0)}
function esc2(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function player(){return document.getElementById('reelVideoPlayer')}
function rerender(){persist();renderStudio();renderPublish()}
function syncInputs(){
  const e=E(),a=document.getElementById('cutInRange'),b=document.getElementById('cutOutRange'),ia=document.getElementById('cutInText'),ib=document.getElementById('cutOutText');
  if(a)a.value=e.markIn;if(b)b.value=e.markOut;if(ia)ia.textContent=fmt(e.markIn);if(ib)ib.textContent=fmt(e.markOut);
  const dur=document.getElementById('cutSelectedDuration');if(dur)dur.textContent=fmt(Math.max(0,e.markOut-e.markIn));
}
window.cutSetIn=v=>{const e=E(),d=+media()?.duration||0;e.markIn=Math.min(Math.max(0,+v||0),Math.max(0,e.markOut-.05),d||Infinity);persist();syncInputs()};
window.cutSetOut=v=>{const e=E(),d=+media()?.duration||0;e.markOut=Math.max(e.markIn+.05,Math.min(+v||0,d||Infinity));persist();syncInputs()};
window.cutMarkIn=()=>{const v=player();if(!v)return;cutSetIn(v.currentTime);toast(`IN ${fmt(v.currentTime)}`)};
window.cutMarkOut=()=>{const v=player();if(!v)return;cutSetOut(v.currentTime);toast(`OUT ${fmt(v.currentTime)}`)};
window.cutSeekMark=which=>{const v=player(),e=E();if(!v)return;v.currentTime=which==='in'?e.markIn:e.markOut};
window.cutAddSegment=()=>{const e=E();if(e.markOut-e.markIn<.15)return toast('0.15초 이상 구간을 선택해주세요');e.segments.push({id:'seg'+Date.now()+Math.random().toString(36).slice(2,5),start:+e.markIn,end:+e.markOut});e.segments.sort((a,b)=>a.start-b.start);persist();mountEditor();toast('살릴 구간을 추가했습니다')};
window.cutRemoveSegment=id=>{const e=E();e.segments=e.segments.filter(s=>s.id!==id);persist();mountEditor()};
window.cutMoveSegment=(id,dir)=>{const e=E(),i=e.segments.findIndex(s=>s.id===id),j=i+dir;if(i<0||j<0||j>=e.segments.length)return;[e.segments[i],e.segments[j]]=[e.segments[j],e.segments[i]];persist();mountEditor()};
window.cutClearSegments=()=>{E().segments=[];persist();mountEditor();toast('편집 구간을 모두 비웠습니다')};
function playSegments(segs){
  const v=player();if(!v||!segs.length)return;
  previewState={segs:segs.map(s=>({...s})),i:0};
  v.currentTime=previewState.segs[0].start;
  const p=v.play();if(p?.catch)p.catch(()=>{});
}
window.cutPreviewRange=()=>{const e=E();playSegments([{start:e.markIn,end:e.markOut}])};
window.cutPreviewAll=()=>{const e=E();if(!e.segments.length)return toast('먼저 살릴 구간을 추가해주세요');playSegments(e.segments)};
function attachPreviewWatcher(){
  const v=player();if(!v||v.dataset.cutWatcher)return;v.dataset.cutWatcher='1';
  v.addEventListener('timeupdate',()=>{
    const t=document.getElementById('cutPlayhead');if(t)t.textContent=fmt(v.currentTime);
    if(!previewState)return;const s=previewState.segs[previewState.i];if(!s)return;
    if(v.currentTime>=s.end-.025){previewState.i++;const n=previewState.segs[previewState.i];if(n){v.currentTime=n.start;const p=v.play();if(p?.catch)p.catch(()=>{})}else{previewState=null;v.pause()}}
  });
  v.addEventListener('pause',()=>{if(previewState&&v.currentTime+0.08<previewState.segs[previewState.i]?.end)previewState=null});
}
function editorHtml(im){
  const e=E(),d=Math.max(.1,+im.duration||.1),segs=e.segments;
  return `<div class="cut-editor" id="cutEditor"><div class="cut-head"><div><b>CUT EDITOR</b><span>앞뒤 자르기 · 중간 삭제 · 여러 구간 연결</span></div><small>원본 ${fmt(d)} · 편집본 ${fmt(total(e))}</small></div>
  <div class="cut-playhead">현재 재생 위치 <b id="cutPlayhead">0:00.00</b></div>
  <div class="cut-range-row"><div class="cut-range-label"><b>IN</b><button onclick="cutSeekMark('in')" id="cutInText">${fmt(e.markIn)}</button></div><input id="cutInRange" type="range" min="0" max="${d}" step="0.05" value="${e.markIn}" oninput="cutSetIn(this.value)"><button class="cut-mark" onclick="cutMarkIn()">현재 위치를 IN</button></div>
  <div class="cut-range-row"><div class="cut-range-label"><b>OUT</b><button onclick="cutSeekMark('out')" id="cutOutText">${fmt(e.markOut)}</button></div><input id="cutOutRange" type="range" min="0" max="${d}" step="0.05" value="${e.markOut}" oninput="cutSetOut(this.value)"><button class="cut-mark" onclick="cutMarkOut()">현재 위치를 OUT</button></div>
  <div class="cut-selection"><span>선택 구간 <b id="cutSelectedDuration">${fmt(e.markOut-e.markIn)}</b></span><div><button class="soft" onclick="cutPreviewRange()">선택 구간 재생</button><button class="primary" onclick="cutAddSegment()">+ 살릴 구간 추가</button></div></div>
  <div class="cut-segments">${segs.length?segs.map((s,i)=>`<div class="cut-segment"><span class="cut-index">${i+1}</span><div><b>${fmt(s.start)} → ${fmt(s.end)}</b><small>${fmt(s.end-s.start)}</small></div><div class="cut-seg-actions"><button onclick="cutMoveSegment('${s.id}',-1)" ${i===0?'disabled':''}>↑</button><button onclick="cutMoveSegment('${s.id}',1)" ${i===segs.length-1?'disabled':''}>↓</button><button onclick="cutRemoveSegment('${s.id}')">×</button></div></div>`).join(''):'<div class="cut-empty">예: 0~3초와 6~10초만 남기려면 각각 IN/OUT을 잡고 두 번 추가하세요.</div>'}</div>
  <div class="cut-footer"><div><button class="soft" onclick="cutPreviewAll()" ${segs.length?'':'disabled'}>편집본 미리보기</button><button class="soft danger" onclick="cutClearSegments()" ${segs.length?'':'disabled'}>구간 비우기</button></div><button class="export-cut" id="cutExportBtn" onclick="exportCutMp4()" ${segs.length?'':'disabled'}>편집본 MP4 저장</button></div>
  <div class="cut-export-status" id="cutExportStatus"><i></i><span>브라우저 안에서 처리합니다. 첫 실행은 편집 엔진 로딩 때문에 시간이 조금 걸릴 수 있습니다.</span></div></div>`
}
function mountEditor(){
  const old=document.getElementById('cutEditor');if(old)old.remove();
  if(window.getContentFormat?.()!=='reels')return;
  const im=media();if(!isVideo(im))return;
  const box=document.querySelector('.video-player-box');if(!box)return;
  box.insertAdjacentHTML('afterend',editorHtml(im));attachPreviewWatcher();syncInputs();
}
async function loadFFmpeg(){
  if(ffmpegLoader)return ffmpegLoader;
  ffmpegLoader=(async()=>{
    setExportStatus('편집 엔진 불러오는 중…',5);
    const [{FFmpeg},{fetchFile,toBlobURL}]=await Promise.all([
      import('https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/esm/index.js'),
      import('https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.2/dist/esm/index.js')
    ]);
    const f=new FFmpeg();
    f.on('progress',({progress})=>{if(Number.isFinite(progress))setExportStatus(`영상 처리 중… ${Math.round(progress*100)}%`,20+Math.round(progress*65))});
    const base='https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';
    await f.load({coreURL:await toBlobURL(`${base}/ffmpeg-core.js`,'text/javascript'),wasmURL:await toBlobURL(`${base}/ffmpeg-core.wasm`,'application/wasm')});
    return {f,fetchFile};
  })();
  try{return await ffmpegLoader}catch(e){ffmpegLoader=null;throw e}
}
function setExportStatus(text,pct=0){const s=document.getElementById('cutExportStatus');if(!s)return;s.classList.add('working');const i=s.querySelector('i'),t=s.querySelector('span');if(i)i.style.width=Math.max(0,Math.min(100,pct))+'%';if(t)t.textContent=text}
function extFor(im){const n=String(im?.name||'').toLowerCase(),m=n.match(/\.([a-z0-9]{2,5})$/);if(m)return m[1];if(String(im?.mime||'').includes('webm'))return 'webm';if(String(im?.mime||'').includes('quicktime'))return 'mov';return 'mp4'}
window.exportCutMp4=async()=>{
  const im=media(),e=E(),btn=document.getElementById('cutExportBtn');if(!isVideo(im)||!im.mediaKey)return toast('업로드한 영상을 선택해주세요');if(!e.segments.length)return toast('살릴 구간을 먼저 추가해주세요');
  if(btn){btn.disabled=true;btn.textContent='MP4 만드는 중…'}
  try{
    const blob=await window.NWVideoStore?.getVideo(im.mediaKey);if(!blob)throw new Error('원본 영상이 브라우저 저장소에 없습니다');
    const {f,fetchFile}=await loadFFmpeg(),input=`input.${extFor(im)}`;setExportStatus('원본 영상 준비 중…',12);await f.writeFile(input,await fetchFile(blob));
    const names=[];
    for(let i=0;i<e.segments.length;i++){
      const s=e.segments[i],name=`cut_${i}.mp4`,dur=Math.max(.05,s.end-s.start);names.push(name);setExportStatus(`구간 ${i+1}/${e.segments.length} 처리 중…`,15+Math.round(i/e.segments.length*65));
      await f.exec(['-ss',(+s.start).toFixed(3),'-i',input,'-t',dur.toFixed(3),'-map','0:v:0','-map','0:a?','-c:v','libx264','-preset','ultrafast','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-movflags','+faststart',name]);
    }
    setExportStatus('구간 연결 중…',84);const list=names.map(n=>`file '${n}'`).join('\n');await f.writeFile('cuts.txt',new TextEncoder().encode(list));await f.exec(['-f','concat','-safe','0','-i','cuts.txt','-c','copy','-movflags','+faststart','edited.mp4']);
    const out=await f.readFile('edited.mp4'),url=URL.createObjectURL(new Blob([out.buffer],{type:'video/mp4'})),a=document.createElement('a');a.href=url;a.download=`noway_${current().id}_reels_cut_${lang()}.mp4`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);setExportStatus(`완료 · ${fmt(total(e))} MP4`,100);toast('컷편집 MP4 저장 완료');
    for(const n of [input,'cuts.txt','edited.mp4',...names]){try{await f.deleteFile(n)}catch{}}
  }catch(err){console.error('cut export',err);setExportStatus('MP4 생성 실패 · Chrome 최신 버전에서 다시 시도해주세요',0);toast('편집본 생성에 실패했습니다')}
  finally{if(btn){btn.disabled=false;btn.textContent='편집본 MP4 저장'}}
};
const baseStudio=renderStudio;renderStudio=function(){baseStudio();setTimeout(mountEditor,40);setTimeout(mountEditor,300)};
const oldSet=window.setReelImage;if(oldSet)window.setReelImage=function(l,id){oldSet(l,id);setTimeout(mountEditor,200)};
window.addEventListener('load',()=>setTimeout(mountEditor,500));
})();