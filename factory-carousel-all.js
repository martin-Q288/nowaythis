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
function styles(l=L()){const q=x();q.carouselSlideStyle=q.carouselSlideStyle||{};q.carouselSlideStyle[l]=q.carouselSlideStyle[l]||{};return q.carouselSlideStyle[l]}
function style(l,id){const m=styles(l);m[id]=Object.assign({fontSize:70,textX:7,textY:72,align:'left',gradientOpacity:88,gradientHeight:52},m[id]||{});return m[id]}
function frame(l,id){const q=x(),k=c(l).frames;q[k]=q[k]&&typeof q[k]==='object'?q[k]:{};q[k][id]=q[k][id]||{z:1,x:0,y:0};return q[k][id]}
function im(id){return x()?.images?.find(v=>v.id===id)||null}
function ensureTexts(l){const q=x(),ids=selected(l),m=map(l),h=q?.[c(l).headline]||q?.title||'';ids.forEach((id,i)=>{if(!Object.prototype.hasOwnProperty.call(m,id))m[id]=i===0?h:'';style(l,id)})}
function card(id){return [...document.querySelectorAll('.carousel-slide-editor')].find(el=>el.dataset.mediaId===String(id))||null}
function safe(s='slide'){return String(s).replace(/[^a-z0-9가-힣_-]+/gi,'_').replace(/^_+|_+$/g,'').slice(0,60)||'slide'}
function mediaType(v){if(!v)return 'IMAGE';if(v.type==='video-upload'||v.type==='video-poster'||v.type==='youtube'||String(v.mime||'').startsWith('video/'))return 'VIDEO FRAME';return 'IMAGE'}
function alignButtons(l,id,a){return `<div class="carousel-align"><button class="${a==='left'?'active':''}" onclick="carouselAllSet('${l}','${esc2(id)}','align','left')">왼쪽</button><button class="${a==='center'?'active':''}" onclick="carouselAllSet('${l}','${esc2(id)}','align','center')">가운데</button><button class="${a==='right'?'active':''}" onclick="carouselAllSet('${l}','${esc2(id)}','align','right')">오른쪽</button></div>`}
function slider(label,l,id,key,min,max,step,value,suffix=''){return `<label class="carousel-control"><span>${label}<output data-out="${key}">${value}${suffix}</output></span><input type="range" min="${min}" max="${max}" step="${step}" value="${value}" oninput="carouselAllRange('${l}','${esc2(id)}','${key}',this.value,'${suffix}',this)"></label>`}
function editorHtml(l){
  const q=x(),ids=selected(l),m=map(l),cfg=c(l);
  if(!ids.length)return `<div class="carousel-all-editor"><div class="carousel-all-head"><div><b>SELECTED SLIDES</b><span>선택한 이미지가 모두 이곳에 표시됩니다.</span></div><div class="carousel-all-count"><strong>0</strong><small>slides</small></div></div><div class="carousel-all-empty">위 이미지 후보에서 캐러셀에 사용할 사진을 선택해주세요.<br>선택하는 즉시 각 이미지별 편집 카드가 아래에 생성됩니다.</div></div>`;
  return `<div class="carousel-all-editor"><div class="carousel-all-head"><div><b>SELECTED SLIDES · ${cfg.short}</b><span>각 슬라이드의 이미지·문구·글자 크기·위치·하단 그라데이션을 독립적으로 수정합니다.</span></div><div class="carousel-all-count"><strong>${ids.length}</strong><small>slides</small></div></div><div class="carousel-slide-list">${ids.map((id,i)=>{
    const v=im(id),txt=m[id]??'',active=q?.[cfg.active]===id,s=style(l,id);
    return `<section class="carousel-slide-editor ${active?'active':''}" data-media-id="${esc2(id)}">
      <div class="carousel-slide-top"><div class="carousel-slide-title"><span class="carousel-slide-num">${i+1}</span><div><b>SLIDE ${i+1}</b><small>${mediaType(v)} · 게시 순서 ${i+1}</small></div></div><div class="carousel-slide-actions"><button onclick="carouselAllMove('${l}','${esc2(id)}',-1)" ${i===0?'disabled':''} title="앞으로">↑</button><button onclick="carouselAllMove('${l}','${esc2(id)}',1)" ${i===ids.length-1?'disabled':''} title="뒤로">↓</button><button class="remove" onclick="carouselAllRemove('${l}','${esc2(id)}')">선택 해제</button></div></div>
      <div class="carousel-slide-body">
        <div class="carousel-slide-preview"><div class="carousel-slide-canvas-wrap"><canvas data-slide-canvas="1"></canvas><span class="carousel-slide-badge">${cfg.short} · ${i+1}/${ids.length}</span></div><div class="carousel-preview-tip">이미지는 미리보기에서 직접 드래그 · 휠 확대/축소</div></div>
        <div class="carousel-slide-edit">
          <label class="carousel-text-label">이 이미지에 들어갈 문구<textarea class="carousel-slide-text" placeholder="이 슬라이드에만 표시할 문구를 입력하세요" oninput="carouselAllText('${l}','${esc2(id)}',this.value)">${esc2(txt)}</textarea></label>
          <div class="carousel-control-group"><div class="carousel-control-title"><b>텍스트</b><span>SLIDE ${i+1} 전용</span></div>${slider('글자 크기',l,id,'fontSize',38,120,2,s.fontSize,'px')}${slider('좌우 위치',l,id,'textX',2,98,1,s.textX,'%')}${slider('상하 위치',l,id,'textY',20,92,1,s.textY,'%')}<div class="carousel-control"><span>문구 정렬</span>${alignButtons(l,id,s.align)}</div></div>
          <div class="carousel-control-group"><div class="carousel-control-title"><b>하단 검정 그라데이션</b><span>0%면 완전히 꺼짐</span></div>${slider('어둡게',l,id,'gradientOpacity',0,100,2,s.gradientOpacity,'%')}${slider('그라데이션 높이',l,id,'gradientHeight',15,85,1,s.gradientHeight,'%')}</div>
          <div class="carousel-control-group"><div class="carousel-control-title"><b>이미지</b><span>슬라이드별 독립 크롭</span></div><div class="carousel-crop-row"><button onclick="carouselAllZoom('${l}','${esc2(id)}',-.12)">− 축소</button><button onclick="carouselAllZoom('${l}','${esc2(id)}',.12)">＋ 확대</button><button onclick="carouselAllReset('${l}','${esc2(id)}')">위치 초기화</button></div></div>
          <div class="carousel-slide-save"><button onclick="carouselAllDownload('${l}','${esc2(id)}',${i+1})">이 슬라이드 PNG 저장</button></div>
        </div>
      </div>
    </section>`}).join('')}</div></div>`
}
function wrapLines(ctx,text,maxW,maxLines){const lines=[];String(text||'').split('\n').forEach(p=>{if(lines.length>=maxLines)return;if(!p.trim()){lines.push('');return}const words=p.includes(' ')?p.split(' '):[...p];let line='';for(const w of words){const t=line?(p.includes(' ')?line+' '+w:line+w):w;if(ctx.measureText(t).width>maxW&&line){lines.push(line);if(lines.length>=maxLines)return;line=w}else line=t}if(line&&lines.length<maxLines)lines.push(line)});return lines.slice(0,maxLines)}
async function drawOne(l,id,externalCanvas=null){
  const el=card(id),cv=externalCanvas||el?.querySelector('canvas[data-slide-canvas]');if(!cv)return null;
  const q=x(),v=im(id),s=style(l,id),f=frame(l,id),image=typeof getImage==='function'?await getImage(id):null;
  cv.width=1080;cv.height=1350;const ctx=cv.getContext('2d');ctx.fillStyle='#111315';ctx.fillRect(0,0,1080,1350);
  if(image&&typeof cover==='function')cover(ctx,image,1080,1350,f);else if(image){const scale=Math.max(1080/image.width,1350/image.height)*(+f.z||1),w=image.width*scale,h=image.height*scale;ctx.drawImage(image,(1080-w)/2+(+f.x||0),(1350-h)/2+(+f.y||0),w,h)}
  else{ctx.fillStyle='#20252b';ctx.fillRect(0,0,1080,1350);ctx.fillStyle='rgba(255,255,255,.35)';ctx.textAlign='center';ctx.font='600 30px sans-serif';ctx.fillText('이미지를 선택하세요',540,675)}
  const opacity=Math.max(0,Math.min(1,(+s.gradientOpacity||0)/100)),height=Math.max(0.15,Math.min(.85,(+s.gradientHeight||52)/100)),start=1350*(1-height);
  if(opacity>0){const grad=ctx.createLinearGradient(0,start,0,1350);grad.addColorStop(0,'rgba(0,0,0,0)');grad.addColorStop(.45,`rgba(0,0,0,${(opacity*.34).toFixed(3)})`);grad.addColorStop(1,`rgba(0,0,0,${opacity.toFixed(3)})`);ctx.fillStyle=grad;ctx.fillRect(0,start,1080,1350-start)}
  const size=Math.max(38,Math.min(120,+s.fontSize||70)),lh=size*1.16,align=['left','center','right'].includes(s.align)?s.align:'left';ctx.fillStyle='#fff';ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.shadowColor='rgba(0,0,0,.62)';ctx.shadowBlur=18;ctx.font=`900 ${size}px -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif`;
  const xPos=1080*Math.max(.02,Math.min(.98,(+s.textX||7)/100)),yPos=1350*Math.max(.2,Math.min(.92,(+s.textY||72)/100));const maxW=930;const lines=wrapLines(ctx,map(l)[id]??'',maxW,5);lines.forEach((line,i)=>ctx.fillText(line,xPos,yPos+i*lh));
  ctx.shadowBlur=0;ctx.textAlign='left';ctx.font='800 27px -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif';ctx.fillText('NO WAY THIS',72,1250);return cv
}
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
window.carouselAllRange=(l,id,key,v,suffix,input)=>{const s=style(l,id);s[key]=+v;const out=input?.closest('.carousel-control')?.querySelector(`output[data-out="${key}"]`);if(out)out.textContent=`${v}${suffix||''}`;persist();queueDraw(l,id)};
window.carouselAllSet=(l,id,key,v)=>{style(l,id)[key]=v;persist();const el=card(id);if(key==='align'&&el){el.querySelectorAll('.carousel-align button').forEach(b=>b.classList.toggle('active',b.textContent===(v==='left'?'왼쪽':v==='center'?'가운데':'오른쪽')))}queueDraw(l,id)};
window.carouselAllZoom=(l,id,d)=>{const f=frame(l,id);f.z=Math.max(.7,Math.min(4,(+f.z||1)+(+d||0)));persist();queueDraw(l,id)};
window.carouselAllReset=(l,id)=>{const q=x(),k=c(l).frames;q[k]=q[k]||{};q[k][id]={z:1,x:0,y:0};persist();queueDraw(l,id);if(typeof toast==='function')toast('이 슬라이드 이미지 위치를 초기화했습니다')};
window.carouselAllMove=(l,id,dir)=>{const q=x(),arr=q?.[c(l).selected];if(!Array.isArray(arr))return;const i=arr.indexOf(id),j=i+(+dir||0);if(i<0||j<0||j>=arr.length)return;[arr[i],arr[j]]=[arr[j],arr[i]];q[c(l).active]=id;persist();renderStudio();renderPublish()};
window.carouselAllRemove=(l,id)=>{if(typeof toggleSelect==='function')return toggleSelect(l,id);const q=x(),arr=q?.[c(l).selected];if(!Array.isArray(arr))return;const i=arr.indexOf(id);if(i>=0)arr.splice(i,1);if(q[c(l).active]===id)q[c(l).active]=arr[0]||null;persist();renderStudio();renderPublish()};
window.carouselAllDownload=async(l,id,n)=>{const cv=document.createElement('canvas');await drawOne(l,id,cv);if(!cv.width)return toast?.('슬라이드 렌더링을 기다려주세요');try{const a=document.createElement('a');a.download=`noway_${safe(x()?.id||'content')}_carousel_${l}_${String(n).padStart(2,'0')}.png`;a.href=cv.toDataURL('image/png');document.body.appendChild(a);a.click();a.remove();if(typeof toast==='function')toast(`SLIDE ${n} PNG 저장 완료`)}catch(e){console.error(e);if(typeof toast==='function')toast('이 이미지 저장에 실패했습니다')}};
async function downloadAll(l){const ids=selected(l);if(!ids.length)return toast?.(`${c(l).short} 이미지를 먼저 선택하세요`);toast?.(`${ids.length}장 생성 중...`);for(let i=0;i<ids.length;i++){const cv=document.createElement('canvas');await drawOne(l,ids[i],cv);const a=document.createElement('a');a.download=`noway_${safe(x()?.id||'content')}_carousel_${l}_${String(i+1).padStart(2,'0')}.png`;a.href=cv.toDataURL('image/png');document.body.appendChild(a);a.click();a.remove();await new Promise(r=>setTimeout(r,260))}toast?.(`${c(l).short} ${ids.length}장 저장 완료`)}
try{downloadSelected=async l=>window.getContentFormat?.()==='carousel'?downloadAll(l):downloadSelected(l)}catch{}
const before=renderStudio;renderStudio=function(){before();requestAnimationFrame(mount)};
window.addEventListener('load',()=>setTimeout(mount,250));
setTimeout(mount,400);
})();