(()=>{
const META={kr:'KR',jp:'JP',en:'EN'};
const MIN_CLIP=.12;
let ffmpegLoader=null,previewState=null,thumbCache={},dragState=null,keyBound=false;
function lang(){const l=window.getFactoryLanguage?.()||localStorage.getItem('nwf-active-language-v1')||'kr';return META[l]?l:'kr'}
function media(){const x=current(),l=lang(),id=x?.reels?.[l]?.image;return x?.images?.find(i=>i.id===id)||null}
function isVideo(im){return !!im&&(im.type==='video-upload'||String(im.mime||'').startsWith('video/'))}
function uid(){return 'clip'+Date.now()+Math.random().toString(36).slice(2,6)}
function E(x=current(),l=lang()){
  x.reels=x.reels||{};x.reels[l]=x.reels[l]||{};
  const r=x.reels[l],im=media(),d=Math.max(0,+im?.duration||0);
  r.edit=r.edit||{};const e=r.edit;
  if(!Array.isArray(e.clips)||!e.clips.length){
    if(Array.isArray(e.segments)&&e.segments.length)e.clips=e.segments.map(s=>({id:s.id||uid(),start:+s.start,end:+s.end}));
    else e.clips=d>0?[{id:uid(),start:0,end:d}]:[];
  }
  e.clips=e.clips.filter(c=>Number.isFinite(+c.start)&&Number.isFinite(+c.end)&&+c.end-+c.start>=MIN_CLIP).map(c=>({id:c.id||uid(),start:Math.max(0,+c.start),end:d?Math.min(d,+c.end):+c.end}));
  if(!e.selectedClipId||!e.clips.some(c=>c.id===e.selectedClipId))e.selectedClipId=e.clips[0]?.id||null;
  if(!Number.isFinite(+e.zoom))e.zoom=1;
  e.zoom=Math.max(.55,Math.min(4,+e.zoom||1));
  if(!Number.isFinite(+e.seqPlayhead))e.seqPlayhead=0;
  e.segments=e.clips.map(c=>({id:c.id,start:c.start,end:c.end}));
  return e;
}
function fmt(s){s=Math.max(0,+s||0);const m=Math.floor(s/60),sec=s-m*60;return `${m}:${sec.toFixed(2).padStart(5,'0')}`}
function clipDur(c){return Math.max(0,+c.end-+c.start)}
function total(e=E()){return e.clips.reduce((n,c)=>n+clipDur(c),0)}
function selected(e=E()){return e.clips.find(c=>c.id===e.selectedClipId)||e.clips[0]||null}
function player(){return document.getElementById('reelVideoPlayer')}
function pxPerSec(e=E()){return 58*e.zoom}
function seqInfo(seq,e=E()){
  const t=Math.max(0,Math.min(+seq||0,total(e)));let acc=0;
  for(let i=0;i<e.clips.length;i++){
    const c=e.clips[i],d=clipDur(c);
    if(t<=acc+d||i===e.clips.length-1)return {clip:c,index:i,local:Math.max(0,Math.min(d,t-acc)),source:c.start+Math.max(0,Math.min(d,t-acc)),seq:acc+Math.max(0,Math.min(d,t-acc))};
    acc+=d;
  }
  return null;
}
function seqStartOf(id,e=E()){let n=0;for(const c of e.clips){if(c.id===id)return n;n+=clipDur(c)}return 0}
function persistEdit(){const e=E();e.segments=e.clips.map(c=>({id:c.id,start:c.start,end:c.end}));persist()}
function seekSeq(seq,autoplay=false){
  const e=E(),info=seqInfo(seq,e),v=player();if(!info||!v)return;
  previewState=null;e.selectedClipId=info.clip.id;e.seqPlayhead=info.seq;v.currentTime=info.source;persistEdit();updateSelectionDom();updatePlayheadDom(info.seq);if(autoplay){const p=v.play();if(p?.catch)p.catch(()=>{})}
}
function playAll(){const e=E(),v=player();if(!v||!e.clips.length)return;const info=seqInfo(e.seqPlayhead>=total(e)-.05?0:e.seqPlayhead,e)||seqInfo(0,e);if(!info)return;previewState={index:info.index,clip:info.clip,seqOffset:seqStartOf(info.clip.id,e)};e.selectedClipId=info.clip.id;v.currentTime=info.source;const p=v.play();if(p?.catch)p.catch(()=>{});updateSelectionDom()}
function togglePlay(){const v=player();if(!v)return;if(!v.paused){v.pause();previewState=null}else playAll()}
window.capTogglePlay=togglePlay;
window.capSplit=()=>{
  const e=E(),v=player();if(!v||!e.clips.length)return;
  let c=selected(e);if(!c||v.currentTime<=c.start||v.currentTime>=c.end)c=e.clips.find(x=>v.currentTime>x.start+MIN_CLIP&&v.currentTime<x.end-MIN_CLIP);
  if(!c)return toast('클립 안쪽에 플레이헤드를 놓고 분할해주세요');
  const t=Math.max(c.start+MIN_CLIP,Math.min(c.end-MIN_CLIP,v.currentTime));if(t<=c.start+MIN_CLIP/2||t>=c.end-MIN_CLIP/2)return toast('클립 끝부분에서는 분할할 수 없습니다');
  const i=e.clips.findIndex(x=>x.id===c.id),a={id:c.id,start:c.start,end:t},b={id:uid(),start:t,end:c.end};e.clips.splice(i,1,a,b);e.selectedClipId=b.id;e.seqPlayhead=seqStartOf(b.id,e);persistEdit();renderTimeline();v.currentTime=t;toast('플레이헤드 위치에서 분할했습니다')
};
window.capDelete=()=>{const e=E(),i=e.clips.findIndex(c=>c.id===e.selectedClipId);if(i<0)return;if(e.clips.length===1)return toast('마지막 클립은 삭제할 수 없습니다');e.clips.splice(i,1);e.selectedClipId=e.clips[Math.min(i,e.clips.length-1)]?.id||null;e.seqPlayhead=Math.min(e.seqPlayhead,total(e));persistEdit();renderTimeline();const c=selected(e),v=player();if(c&&v)v.currentTime=c.start;toast('선택 클립을 삭제했습니다')};
window.capDuplicate=()=>{const e=E(),c=selected(e);if(!c)return;const i=e.clips.findIndex(x=>x.id===c.id),n={id:uid(),start:c.start,end:c.end};e.clips.splice(i+1,0,n);e.selectedClipId=n.id;persistEdit();renderTimeline();toast('클립을 복제했습니다')};
window.capReset=()=>{const e=E(),d=+media()?.duration||0;if(!d)return;e.clips=[{id:uid(),start:0,end:d}];e.selectedClipId=e.clips[0].id;e.seqPlayhead=0;persistEdit();renderTimeline();seekSeq(0);toast('원본 전체 길이로 초기화했습니다')};
window.capZoom=dir=>{const e=E();e.zoom=Math.max(.55,Math.min(4,e.zoom+(dir>0?.25:-.25)));persistEdit();renderTimeline()};
window.capSelect=id=>{const e=E(),c=e.clips.find(x=>x.id===id),v=player();if(!c)return;e.selectedClipId=id;e.seqPlayhead=seqStartOf(id,e);persistEdit();updateSelectionDom();updatePlayheadDom(e.seqPlayhead);if(v)v.currentTime=c.start};
window.capMove=(id,dir)=>{const e=E(),i=e.clips.findIndex(c=>c.id===id),j=i+dir;if(i<0||j<0||j>=e.clips.length)return;[e.clips[i],e.clips[j]]=[e.clips[j],e.clips[i]];e.seqPlayhead=seqStartOf(id,e);persistEdit();renderTimeline()};
function frameImgs(c){
  const im=media(),cache=thumbCache[im?.mediaKey];if(!cache?.length)return `<div class="cap-frame fallback" style="background-image:url('${String(im?.display||im?.url||'').replace(/'/g,'%27')}')"></div>`.repeat(Math.max(1,Math.ceil(clipDur(c)/1.2)));
  const count=Math.max(1,Math.min(12,Math.ceil(clipDur(c)/1.1))),out=[];
  for(let i=0;i<count;i++){const t=c.start+(clipDur(c)*(i+.5)/count),best=cache.reduce((a,b)=>Math.abs(b.t-t)<Math.abs(a.t-t)?b:a,cache[0]);out.push(`<img class="cap-frame" src="${best.url}" draggable="false">`)}
  return out.join('')
}
function timelineHtml(){
  const e=E(),d=total(e),pps=pxPerSec(e),width=Math.max(620,d*pps),sel=e.selectedClipId;
  let tick='';const step=d>60?10:d>30?5:d>12?2:1;for(let t=0;t<=d+.001;t+=step)tick+=`<span style="left:${t*pps}px"><i></i>${t<60?t.toFixed(0)+'s':fmt(t)}</span>`;
  return `<div class="capcut-editor" id="capcutEditor">
    <div class="cap-top"><div><b>QUICK CUT</b><span>CapCut 방식 · 분할 / 트림 / 삭제 / 순서 변경</span></div><div class="cap-total">편집본 <b>${fmt(d)}</b></div></div>
    <div class="cap-toolbar">
      <button class="cap-icon" onclick="capTogglePlay()" title="재생/일시정지">▶</button>
      <button onclick="capSplit()"><b>✂</b> 분할</button><button onclick="capDelete()"><b>⌫</b> 삭제</button><button onclick="capDuplicate()">복제</button>
      <span class="cap-sep"></span><button onclick="capZoom(-1)">−</button><span class="cap-zoom">${Math.round(e.zoom*100)}%</span><button onclick="capZoom(1)">＋</button>
      <span class="cap-spacer"></span><button onclick="capReset()">초기화</button>
    </div>
    <div class="cap-current"><span>플레이헤드</span><b id="capCurrentTime">${fmt(e.seqPlayhead)}</b><small>Space 재생 · S 분할 · Delete 삭제</small></div>
    <div class="cap-scroll" id="capScroll">
      <div class="cap-ruler" style="width:${width}px">${tick}</div>
      <div class="cap-track-wrap" id="capTrackWrap" style="width:${width}px">
        <div class="cap-track" id="capTrack">${e.clips.map((c,i)=>`<div class="cap-clip ${c.id===sel?'selected':''}" data-id="${c.id}" draggable="true" style="width:${Math.max(38,clipDur(c)*pps)}px" onclick="capSelect('${c.id}')"><div class="cap-frames">${frameImgs(c)}</div><span class="cap-clip-num">${i+1}</span><span class="cap-clip-time">${fmt(clipDur(c))}</span><button class="cap-handle left" data-side="left" aria-label="왼쪽 트림"></button><button class="cap-handle right" data-side="right" aria-label="오른쪽 트림"></button><div class="cap-mobile-order"><button onclick="event.stopPropagation();capMove('${c.id}',-1)" ${i===0?'disabled':''}>←</button><button onclick="event.stopPropagation();capMove('${c.id}',1)" ${i===e.clips.length-1?'disabled':''}>→</button></div></div>`).join('')}</div>
        <div class="cap-playhead" id="capPlayhead" style="left:${Math.max(0,e.seqPlayhead*pps)}px"><i></i><b></b></div>
      </div>
    </div>
    <div class="cap-bottom"><div class="cap-help">클립을 클릭해 선택 → 양쪽 흰 손잡이를 드래그해 자르기 → 원하는 위치에서 <b>분할</b></div><div class="cap-export"><button class="soft" onclick="capPreviewAll()">전체 미리보기</button><button class="export-cut" id="cutExportBtn" onclick="exportCutMp4()">편집본 MP4 저장</button></div></div>
    <div class="cut-export-status" id="cutExportStatus"><i></i><span>원본 파일은 브라우저 안에서 처리됩니다.</span></div>
  </div>`
}
function renderTimeline(){const root=document.getElementById('capcutEditor');if(root)root.outerHTML=timelineHtml();else mountEditor();requestAnimationFrame(bindTimeline)}
function mountEditor(){
  const old=document.getElementById('capcutEditor');if(old)old.remove();if(window.getContentFormat?.()!=='reels')return;const im=media();if(!isVideo(im))return;const box=document.querySelector('.video-player-box');if(!box)return;box.insertAdjacentHTML('afterend',timelineHtml());attachVideoWatcher();bindTimeline();generateThumbs(im);bindKeys()
}
function updateSelectionDom(){const e=E();document.querySelectorAll('.cap-clip').forEach(el=>el.classList.toggle('selected',el.dataset.id===e.selectedClipId))}
function updatePlayheadDom(seq){const e=E(),t=Math.max(0,Math.min(total(e),+seq||0)),ph=document.getElementById('capPlayhead'),lab=document.getElementById('capCurrentTime');e.seqPlayhead=t;if(ph)ph.style.left=(t*pxPerSec(e))+'px';if(lab)lab.textContent=fmt(t)}
function bindTimeline(){
  const wrap=document.getElementById('capTrackWrap'),scroll=document.getElementById('capScroll');if(!wrap||wrap.dataset.bound)return;wrap.dataset.bound='1';
  wrap.addEventListener('pointerdown',ev=>{
    const h=ev.target.closest('.cap-handle');if(h){ev.preventDefault();ev.stopPropagation();const clipEl=h.closest('.cap-clip'),e=E(),c=e.clips.find(x=>x.id===clipEl.dataset.id);if(!c)return;e.selectedClipId=c.id;dragState={type:'trim',side:h.dataset.side,id:c.id,startX:ev.clientX,origStart:c.start,origEnd:c.end,pps:pxPerSec(e),el:clipEl};h.setPointerCapture?.(ev.pointerId);updateSelectionDom();return}
    if(ev.target.closest('.cap-clip'))return;
    scrubAt(ev)
  });
  wrap.addEventListener('pointermove',ev=>{if(!dragState)return;if(dragState.type==='trim')trimMove(ev)});
  const end=ev=>{if(!dragState)return;if(dragState.type==='trim'){persistEdit();renderTimeline()}dragState=null};wrap.addEventListener('pointerup',end);wrap.addEventListener('pointercancel',end);
  wrap.addEventListener('click',ev=>{if(ev.target===wrap||ev.target.closest('.cap-playhead'))scrubAt(ev)});
  document.querySelectorAll('.cap-clip').forEach(el=>{
    el.addEventListener('dragstart',ev=>{ev.dataTransfer.effectAllowed='move';ev.dataTransfer.setData('text/plain',el.dataset.id);el.classList.add('dragging')});
    el.addEventListener('dragend',()=>el.classList.remove('dragging'));
    el.addEventListener('dragover',ev=>{ev.preventDefault();ev.dataTransfer.dropEffect='move'});
    el.addEventListener('drop',ev=>{ev.preventDefault();const from=ev.dataTransfer.getData('text/plain'),to=el.dataset.id;if(!from||from===to)return;const e=E(),a=e.clips.findIndex(c=>c.id===from),b=e.clips.findIndex(c=>c.id===to);if(a<0||b<0)return;const [c]=e.clips.splice(a,1);e.clips.splice(b,0,c);e.selectedClipId=from;e.seqPlayhead=seqStartOf(from,e);persistEdit();renderTimeline()})
  });
  const ph=document.getElementById('capPlayhead');if(ph){ph.addEventListener('pointerdown',ev=>{ev.preventDefault();dragState={type:'scrub'};ph.setPointerCapture?.(ev.pointerId)});ph.addEventListener('pointermove',ev=>{if(dragState?.type==='scrub')scrubAt(ev)});ph.addEventListener('pointerup',()=>dragState=null)};
  if(scroll){const seq=E().seqPlayhead,px=seq*pxPerSec(E());if(px>scroll.scrollLeft+scroll.clientWidth-80)scroll.scrollLeft=Math.max(0,px-scroll.clientWidth/2)}
}
function scrubAt(ev){const wrap=document.getElementById('capTrackWrap');if(!wrap)return;const rect=wrap.getBoundingClientRect(),x=Math.max(0,Math.min(rect.width,ev.clientX-rect.left)),seq=x/pxPerSec(E());seekSeq(seq)}
function trimMove(ev){const e=E(),c=e.clips.find(x=>x.id===dragState.id);if(!c)return;const delta=(ev.clientX-dragState.startX)/dragState.pps,d=+media()?.duration||Infinity;if(dragState.side==='left')c.start=Math.max(0,Math.min(dragState.origEnd-MIN_CLIP,dragState.origStart+delta));else c.end=Math.min(d,Math.max(dragState.origStart+MIN_CLIP,dragState.origEnd+delta));const w=Math.max(38,clipDur(c)*pxPerSec(e));dragState.el.style.width=w+'px';const lab=dragState.el.querySelector('.cap-clip-time');if(lab)lab.textContent=fmt(clipDur(c));e.seqPlayhead=seqStartOf(c.id,e);updatePlayheadDom(e.seqPlayhead)}
function attachVideoWatcher(){
  const v=player();if(!v||v.dataset.capWatcher)return;v.dataset.capWatcher='1';
  v.addEventListener('timeupdate',()=>{
    const e=E();let seq=e.seqPlayhead;
    if(previewState){const c=previewState.clip;if(v.currentTime>=c.end-.025){const ni=previewState.index+1;if(ni<e.clips.length){const n=e.clips[ni];previewState={index:ni,clip:n,seqOffset:seqStartOf(n.id,e)};e.selectedClipId=n.id;v.currentTime=n.start;const p=v.play();if(p?.catch)p.catch(()=>{});updateSelectionDom();return}else{previewState=null;v.pause();e.seqPlayhead=total(e);updatePlayheadDom(e.seqPlayhead);return}}seq=previewState.seqOffset+Math.max(0,v.currentTime-c.start)}else{const c=selected(e);if(c)seq=seqStartOf(c.id,e)+Math.max(0,Math.min(clipDur(c),v.currentTime-c.start))}
    e.seqPlayhead=Math.min(total(e),seq);updatePlayheadDom(e.seqPlayhead)
  });
  v.addEventListener('play',()=>{const e=E(),c=selected(e);if(!previewState&&c)previewState={index:e.clips.findIndex(x=>x.id===c.id),clip:c,seqOffset:seqStartOf(c.id,e)}});
}
window.capPreviewAll=()=>{E().seqPlayhead=0;playAll()};
async function generateThumbs(im){
  if(!im?.mediaKey||thumbCache[im.mediaKey])return;thumbCache[im.mediaKey]=[];try{const blob=await window.NWVideoStore?.getVideo(im.mediaKey);if(!blob)return;const url=URL.createObjectURL(blob),v=document.createElement('video');v.muted=true;v.playsInline=true;v.preload='auto';v.src=url;await new Promise((res,rej)=>{v.onloadedmetadata=res;v.onerror=rej});const d=Math.max(.1,v.duration||im.duration||.1),n=12,frames=[];for(let i=0;i<n;i++){const t=Math.min(d-.03,d*(i+.5)/n);await new Promise(res=>{const done=()=>{v.removeEventListener('seeked',done);res()};v.addEventListener('seeked',done);v.currentTime=Math.max(0,t)});const c=document.createElement('canvas'),w=160,scale=w/(v.videoWidth||w);c.width=w;c.height=Math.max(90,Math.round((v.videoHeight||90)*scale));c.getContext('2d').drawImage(v,0,0,c.width,c.height);frames.push({t,url:c.toDataURL('image/jpeg',.55)})}URL.revokeObjectURL(url);thumbCache[im.mediaKey]=frames;if(media()?.mediaKey===im.mediaKey)renderTimeline()}catch(err){console.warn('timeline thumbs',err)}}
function bindKeys(){if(keyBound)return;keyBound=true;document.addEventListener('keydown',ev=>{if(window.getContentFormat?.()!=='reels'||!isVideo(media()))return;const tag=document.activeElement?.tagName;if(['INPUT','TEXTAREA','SELECT'].includes(tag))return;if(ev.code==='Space'){ev.preventDefault();togglePlay()}else if(ev.key.toLowerCase()==='s'){ev.preventDefault();capSplit()}else if(ev.key==='Delete'||ev.key==='Backspace'){ev.preventDefault();capDelete()}})}
async function loadFFmpeg(){
  if(ffmpegLoader)return ffmpegLoader;ffmpegLoader=(async()=>{setExportStatus('편집 엔진 불러오는 중…',5);const [{FFmpeg},{fetchFile,toBlobURL}]=await Promise.all([import('https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.15/dist/esm/index.js'),import('https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.2/dist/esm/index.js')]);const f=new FFmpeg();f.on('progress',({progress})=>{if(Number.isFinite(progress))setExportStatus(`영상 처리 중… ${Math.round(progress*100)}%`,20+Math.round(progress*65))});const base='https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/esm';await f.load({coreURL:await toBlobURL(`${base}/ffmpeg-core.js`,'text/javascript'),wasmURL:await toBlobURL(`${base}/ffmpeg-core.wasm`,'application/wasm')});return {f,fetchFile}})();try{return await ffmpegLoader}catch(e){ffmpegLoader=null;throw e}}
function setExportStatus(text,pct=0){const s=document.getElementById('cutExportStatus');if(!s)return;s.classList.add('working');const i=s.querySelector('i'),t=s.querySelector('span');if(i)i.style.width=Math.max(0,Math.min(100,pct))+'%';if(t)t.textContent=text}
function extFor(im){const n=String(im?.name||'').toLowerCase(),m=n.match(/\.([a-z0-9]{2,5})$/);if(m)return m[1];if(String(im?.mime||'').includes('webm'))return 'webm';if(String(im?.mime||'').includes('quicktime'))return 'mov';return 'mp4'}
window.exportCutMp4=async()=>{const im=media(),e=E(),btn=document.getElementById('cutExportBtn');if(!isVideo(im)||!im.mediaKey)return toast('업로드한 영상을 선택해주세요');if(!e.clips.length)return toast('편집 클립이 없습니다');if(btn){btn.disabled=true;btn.textContent='MP4 만드는 중…'}try{const blob=await window.NWVideoStore?.getVideo(im.mediaKey);if(!blob)throw new Error('원본 영상이 브라우저 저장소에 없습니다');const {f,fetchFile}=await loadFFmpeg(),input=`input.${extFor(im)}`;setExportStatus('원본 영상 준비 중…',12);await f.writeFile(input,await fetchFile(blob));const names=[];for(let i=0;i<e.clips.length;i++){const c=e.clips[i],name=`cut_${i}.mp4`,dur=Math.max(MIN_CLIP,clipDur(c));names.push(name);setExportStatus(`클립 ${i+1}/${e.clips.length} 처리 중…`,15+Math.round(i/e.clips.length*65));await f.exec(['-ss',(+c.start).toFixed(3),'-i',input,'-t',dur.toFixed(3),'-map','0:v:0','-map','0:a?','-c:v','libx264','-preset','ultrafast','-crf','23','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-movflags','+faststart',name])}setExportStatus('클립 연결 중…',86);await f.writeFile('cuts.txt',new TextEncoder().encode(names.map(n=>`file '${n}'`).join('\n')));await f.exec(['-f','concat','-safe','0','-i','cuts.txt','-c','copy','-movflags','+faststart','edited.mp4']);const out=await f.readFile('edited.mp4'),url=URL.createObjectURL(new Blob([out.buffer],{type:'video/mp4'})),a=document.createElement('a');a.href=url;a.download=`noway_${current().id}_reels_cut_${lang()}.mp4`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);setExportStatus(`완료 · ${fmt(total(e))}`,100);toast('컷편집 MP4 저장 완료');for(const n of [input,'cuts.txt','edited.mp4',...names]){try{await f.deleteFile(n)}catch{}}}catch(err){console.error('cut export',err);setExportStatus('MP4 생성 실패 · Chrome 최신 버전에서 다시 시도해주세요',0);toast('편집본 생성에 실패했습니다')}finally{if(btn){btn.disabled=false;btn.textContent='편집본 MP4 저장'}}};
const studioBeforeEditor=renderStudio;renderStudio=function(){studioBeforeEditor();setTimeout(mountEditor,80);setTimeout(mountEditor,420)};
const oldSet=window.setReelImage;if(oldSet)window.setReelImage=function(l,id){oldSet(l,id);setTimeout(mountEditor,260)};
window.addEventListener('load',()=>setTimeout(mountEditor,650));
})();