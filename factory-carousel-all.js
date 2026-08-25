(()=>{
const CFG={
  kr:{short:'KR',selected:'krSelected',active:'krActive',frames:'krFrames',headline:'headlineKr'},
  jp:{short:'JP',selected:'jpSelected',active:'jpActive',frames:'jpFrames',headline:'headlineJp'},
  en:{short:'EN',selected:'enSelected',active:'enActive',frames:'enFrames',headline:'headlineEn'}
};
let rafs=new Map();
function L(){const l=window.getFactoryLanguage?.()||localStorage.getItem('nwf-active-language-v1')||'kr';return CFG[l]?l:'kr'}
function c(l=L()){return CFG[l]||CFG.kr}
function x(){return typeof current==='function'?current():null}
function esc2(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function selected(l=L()){const q=x(),k=c(l).selected;return q&&Array.isArray(q[k])?q[k]:[]}
function map(l=L()){const q=x();q.carouselSlideText=q.carouselSlideText||{};q.carouselSlideText[l]=q.carouselSlideText[l]||{};return q.carouselSlideText[l]}
function frame(l,id){const q=x(),k=c(l).frames;q[k]=q[k]&&typeof q[k]==='object'?q[k]:{};q[k][id]=q[k][id]||{z:1,x:0,y:0};return q[k][id]}
function im(id){return x()?.images?.find(v=>v.id===id)||null}
function ensureTexts(l){const q=x(),ids=selected(l),m=map(l),h=q?.[c(l).headline]||q?.title||'';ids.forEach((id,i)=>{if(!Object.prototype.hasOwnProperty.call(m,id))m[id]=i===0?h:''})}
function card(id){return [...document.querySelectorAll('.carousel-slide-editor')].find(el=>el.dataset.mediaId===String(id))||null}
function safe(s='slide'){return String(s).replace(/[^a-z0-9가-힣_-]+/gi,'_').replace(/^_+|_+$/g,'').slice(0,60)||'slide'}
function mediaType(v){if(!v)return 'IMAGE';if(v.type==='video-upload'||v.type==='video-poster'||v.type==='youtube'||String(v.mime||'').startsWith('video/'))return 'VIDEO FRAME';return 'IMAGE'}
function editorHtml(l){
  const q=x(),ids=selected(l),m=map(l),cfg=c(l);
  if(!ids.length)return `<div class="carousel-all-editor"><div class="carousel-all-head"><div><b>SELECTED SLIDES</b><span>선택한 이미지가 모두 이곳에 표시됩니다.</span></div><div class="carousel-all-count"><strong>0</strong><small>slides</small></div></div><div class="carousel-all-empty">위 이미지 후보에서 캐러셀에 사용할 사진을 선택해주세요.<br>선택하는 즉시 각 이미지별 편집 카드가 아래에 생성됩니다.</div></div>`;
  return `<div class="carousel-all-editor"><div class="carousel-all-head"><div><b>SELECTED SLIDES · ${cfg.short}</b><span>선택한 이미지 ${ids.length}장을 전부 표시합니다. 각 장의 문구와 이미지 위치를 따로 수정하세요.</span></div><div class="carousel-all-count"><strong>${ids.length}</strong><small>slides</small></div></div><div class="carousel-slide-list">${ids.map((id,i)=>{
    const v=im(id),txt=m[id]??'',active=q?.[cfg.active]===id;
    return `<section class="carousel-slide-editor ${active?'active':''}" data-media-id="${esc2(id)}">
      <div class="carousel-slide-top"><div class="carousel-slide-title"><span class="carousel-slide-num">${i+1}</span><div><b>SLIDE ${i+1}</b><small>${mediaType(v)} · 게시 순서 ${i+1}</small></div></div><div class="carousel-slide-actions"><button onclick="carouselAllMove('${l}','${esc2(id)}',-1)" ${i===0?'disabled':''} title="앞으로">↑</button><button onclick="carouselAllMove('${l}','${esc2(id)}',1)" ${i===ids.length-1?'disabled':''} title="뒤로">↓</button><button class="remove" onclick="carouselAllRemove('${l}','${esc2(id)}')">선택 해제</button></div></div>
      <div class="carousel-slide-body"><div class="carousel-slide-preview"><div class="carousel-slide-canvas-wrap"><canvas data-slide-canvas="1"></canvas><span class="carousel-slide-badge">${cfg.short} · ${i+1}/${ids.length}</span></div></div>
      <div class="carousel-slide-edit"><label>이 이미지에 들어갈 문구<textarea class="carousel-slide-text" placeholder="이 슬라이드에만 표시할 문구를 입력하세요" oninput="carouselAllText('${l}','${esc2(id)}',this.value)">${esc2(txt)}</textarea></label><div class="carousel-crop-row"><button onclick="carouselAllZoom('${l}','${esc2(id)}',-.12)">− 축소</button><button onclick="carouselAllZoom('${l}','${esc2(id)}',.12)">＋ 확대</button><button onclick="carouselAllReset('${l}','${esc2(id)}')">위치 초기화</button><span>이미지를 직접 드래그해서 위치 조정 · 마우스 휠로 확대/축소</span></div><div class="carousel-slide-save"><button onclick="carouselAllDownload('${l}','${esc2(id)}',${i+1})">이 슬라이드 PNG 저장</button></div></div></div>
    </section>`}).join('')}</div></div>`
}
async function drawOne(l,id){const el=card(id),cv=el?.querySelector('canvas[data-slide-canvas]');if(!cv||typeof draw!=='function')return;try{await draw(l,id,cv)}catch(e){console.warn('carousel slide draw',id,e)}}
async function drawAll(l){for(const id of selected(l))await drawOne(l,id)}
function queueDraw(l,id){const k=l+'|'+id;if(rafs.has(k))cancelAnimationFrame(rafs.get(k));rafs.set(k,requestAnimationFrame(async()=>{rafs.delete(k);await drawOne(l,id)}))}
function bindCanvas(l,id){const el=card(id),cv=el?.querySelector('canvas[data-slide-canvas]');if(!cv||cv.dataset.carouselBound)return;cv.dataset.carouselBound='1';let drag=null;
  cv.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY};cv.setPointerCapture?.(e.pointerId);const q=x();if(q){q[c(l).active]=id;persist();document.querySelectorAll('.carousel-slide-editor').forEach(n=>n.classList.toggle('active',n.dataset.mediaId===String(id)))}});
  cv.addEventListener('pointermove',e=>{if(!drag)return;const f=frame(l,id),sx=(cv.width||1080)/Math.max(1,cv.clientWidth),sy=(cv.height||1350)/Math.max(1,cv.clientHeight);f.x+=(e.clientX-drag.x)*sx;f.y+=(e.clientY-drag.y)*sy;drag={x:e.clientX,y:e.clientY};queueDraw(l,id)});
  const done=()=>{if(drag){drag=null;persist()}};cv.addEventListener('pointerup',done);cv.addEventListener('pointercancel',done);
  cv.addEventListener('wheel',e=>{e.preventDefault();const f=frame(l,id);f.z=Math.max(.7,Math.min(4,(+f.z||1)+(e.deltaY<0?.08:-.08)));persist();queueDraw(l,id)},{passive:false});
}
function bindAll(l){selected(l).forEach(id=>bindCanvas(l,id))}
function mount(){const studio=document.getElementById('studio');if(!studio)return;studio.classList.toggle('carousel-all-mode',window.getContentFormat?.()==='carousel');const old=studio.querySelector('.carousel-all-editor');if(old)old.remove();if(window.getContentFormat?.()!=='carousel')return;const q=x();if(!q)return;const l=L();ensureTexts(l);persist();const host=document.createElement('div');host.innerHTML=editorHtml(l);const node=host.firstElementChild;const workflow=studio.querySelector('.carousel-workflow');if(workflow)workflow.insertAdjacentElement('beforebegin',node);else studio.appendChild(node);requestAnimationFrame(()=>{bindAll(l);drawAll(l)})}
window.carouselAllText=(l,id,v)=>{ensureTexts(l);map(l)[id]=v;persist();queueDraw(l,id)};
window.carouselAllZoom=(l,id,d)=>{const f=frame(l,id);f.z=Math.max(.7,Math.min(4,(+f.z||1)+(+d||0)));persist();queueDraw(l,id)};
window.carouselAllReset=(l,id)=>{const q=x(),k=c(l).frames;q[k]=q[k]||{};q[k][id]={z:1,x:0,y:0};persist();queueDraw(l,id);if(typeof toast==='function')toast('이 슬라이드 이미지 위치를 초기화했습니다')};
window.carouselAllMove=(l,id,dir)=>{const q=x(),arr=q?.[c(l).selected];if(!Array.isArray(arr))return;const i=arr.indexOf(id),j=i+(+dir||0);if(i<0||j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]];q[c(l).active]=id;persist();renderStudio();renderPublish()};
window.carouselAllRemove=(l,id)=>{if(typeof toggleSelect==='function')return toggleSelect(l,id);const q=x(),arr=q?.[c(l).selected];if(!Array.isArray(arr))return;const i=arr.indexOf(id);if(i>=0)arr.splice(i,1);if(q[c(l).active]===id)q[c(l).active]=arr[0]||null;persist();renderStudio();renderPublish()};
window.carouselAllDownload=async(l,id,n)=>{await drawOne(l,id);const cv=card(id)?.querySelector('canvas[data-slide-canvas]');if(!cv)return;if(!cv.width)return toast?.('슬라이드 렌더링을 기다려주세요');try{const a=document.createElement('a');a.download=`noway_${safe(x()?.id||'content')}_carousel_${l}_${String(n).padStart(2,'0')}.png`;a.href=cv.toDataURL('image/png');document.body.appendChild(a);a.click();a.remove();if(typeof toast==='function')toast(`SLIDE ${n} PNG 저장 완료`)}catch(e){console.error(e);if(typeof toast==='function')toast('이 이미지 저장에 실패했습니다') }};
const before=renderStudio;renderStudio=function(){before();requestAnimationFrame(mount)};
window.addEventListener('load',()=>setTimeout(mount,250));
setTimeout(mount,400);
})();