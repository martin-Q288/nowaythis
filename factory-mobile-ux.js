(()=>{
const CFG={kr:{short:'KR',selected:'krSelected'},jp:{short:'JP',selected:'jpSelected'},en:{short:'EN',selected:'enSelected'}};
const fileCache=new Map();
let primeTimer=0,enhanceTimer=0;
function lang(){const l=window.getFactoryLanguage?.()||localStorage.getItem('nwf-active-language-v1')||'kr';return CFG[l]?l:'kr'}
function content(){return typeof current==='function'?current():null}
function selected(l=lang()){const q=content(),k=CFG[l]?.selected;return q&&k&&Array.isArray(q[k])?q[k]:[]}
function isCarousel(){return window.getContentFormat?.()==='carousel'}
function isMobile(){return matchMedia('(max-width:900px), (pointer:coarse)').matches}
function safe(s='content'){return String(s).replace(/[^a-z0-9가-힣_-]+/gi,'_').replace(/^_+|_+$/g,'').slice(0,64)||'content'}
function key(l,id){return `${content()?.id||'x'}|${l}|${id}`}
function card(id){return [...document.querySelectorAll('.carousel-slide-editor')].find(el=>el.dataset.mediaId===String(id))||null}
function canvasFor(id){return card(id)?.querySelector('canvas[data-slide-canvas]')||null}
function nameFor(l,n){return `noway_${safe(content()?.id||'content')}_carousel_${l}_${String(n).padStart(2,'0')}.png`}
function toast2(t){if(typeof toast==='function')toast(t)}
function blobFromCanvas(cv){return new Promise((resolve,reject)=>{try{cv.toBlob(b=>b?resolve(b):reject(new Error('PNG 생성 실패')),'image/png')}catch(e){reject(e)}})}
async function fileFromCanvas(cv,name){const blob=await blobFromCanvas(cv);return new File([blob],name,{type:'image/png',lastModified:Date.now()})}
function fileFromCanvasSync(cv,name){const data=cv.toDataURL('image/png'),parts=data.split(','),mime=(parts[0].match(/:(.*?);/)||[])[1]||'image/png',bin=atob(parts[1]),u8=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u8[i]=bin.charCodeAt(i);return new File([u8],name,{type:mime,lastModified:Date.now()})}
function invalidate(l,id){if(id)fileCache.delete(key(l,id));else [...fileCache.keys()].filter(k=>k.includes(`|${l}|`)).forEach(k=>fileCache.delete(k))}
async function primeOne(l,id,n){const cv=canvasFor(id);if(!cv||!cv.width)return null;try{const f=await fileFromCanvas(cv,nameFor(l,n));fileCache.set(key(l,id),f);return f}catch{return null}}
async function primeSelected(l=lang()){
 if(!isCarousel())return;
 const ids=selected(l);for(let i=0;i<ids.length;i++){if(!fileCache.has(key(l,ids[i])))await primeOne(l,ids[i],i+1);await new Promise(r=>setTimeout(r,30))}
 updateSaveLabels();
}
function schedulePrime(){clearTimeout(primeTimer);primeTimer=setTimeout(()=>primeSelected().catch(()=>{}),500)}
function getFilesSync(l){
 const ids=selected(l),files=[];
 for(let i=0;i<ids.length;i++){
   const id=ids[i],cached=fileCache.get(key(l,id));if(cached){files.push(cached);continue}
   const cv=canvasFor(id);if(!cv||!cv.width)throw new Error(`SLIDE ${i+1} 렌더링 대기`);
   const f=fileFromCanvasSync(cv,nameFor(l,i+1));fileCache.set(key(l,id),f);files.push(f)
 }
 return files
}
function canShare(files){try{return !!(navigator.share&&navigator.canShare&&navigator.canShare({files}))}catch{return false}}
function downloadFiles(files){files.forEach((f,i)=>setTimeout(()=>{const u=URL.createObjectURL(f),a=document.createElement('a');a.href=u;a.download=f.name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),15000)},i*220))}
function closeFallback(){const s=document.getElementById('nwfPhotoFallback');if(s){(s._urls||[]).forEach(URL.revokeObjectURL);s.remove()}}
window.closePhotoFallback=closeFallback;
function fallbackGallery(files){
 closeFallback();const sheet=document.createElement('div');sheet.id='nwfPhotoFallback';sheet.className='photo-fallback';
 const urls=files.map(f=>URL.createObjectURL(f));sheet.innerHTML=`<div class="photo-fallback-card"><div class="photo-fallback-head"><div><b>사진 앱에 저장</b><span>이미지를 길게 누른 뒤 ‘사진에 저장’을 선택하세요.</span></div><button onclick="closePhotoFallback()">×</button></div><div class="photo-fallback-list">${urls.map((u,i)=>`<div><span>SLIDE ${i+1}</span><img src="${u}" alt="slide ${i+1}"><a href="${u}" download="${files[i].name}">파일로 다운로드</a></div>`).join('')}</div></div>`;
 document.body.appendChild(sheet);sheet.addEventListener('click',e=>{if(e.target===sheet)closeFallback()});sheet._urls=urls;
}
async function shareFiles(files,label){
 if(!files.length)return;
 if(isMobile()&&canShare(files)){
   toast2('공유창에서 ‘이미지 저장’을 선택하세요');
   try{await navigator.share({files,title:`NO WAY THIS ${label}`});return true}catch(e){if(e?.name==='AbortError'){toast2('저장을 취소했습니다');return false}console.warn('share failed',e)}
 }
 if(isMobile()){fallbackGallery(files);toast2('이미지를 길게 눌러 사진 앱에 저장하세요');return false}
 downloadFiles(files);toast2(`${files.length}장 PNG 다운로드를 시작했습니다`);return true
}
async function saveAll(l=lang()){
 if(!isCarousel())return window.downloadReelCover?.(l);
 const ids=selected(l);if(!ids.length)return toast2(`${CFG[l]?.short||l.toUpperCase()} 이미지를 먼저 선택하세요`);
 try{const files=getFilesSync(l);await shareFiles(files,`${CFG[l].short} CAROUSEL`)}catch(e){console.error(e);toast2('슬라이드 준비 중입니다. 잠시 후 다시 눌러주세요');schedulePrime()}
}
async function saveOne(l,id,n){
 try{const cached=fileCache.get(key(l,id)),cv=canvasFor(id),f=cached||(cv?fileFromCanvasSync(cv,nameFor(l,n)):null);if(!f)throw new Error('canvas missing');fileCache.set(key(l,id),f);await shareFiles([f],`SLIDE ${n}`)}catch(e){console.error(e);toast2('이미지를 저장할 수 없습니다. 미리보기가 보이는지 확인해주세요')}
}
window.carouselAllDownload=saveOne;
window.saveCarouselToPhotos=saveAll;
try{downloadSelected=async l=>isCarousel()?saveAll(l):window.downloadReelCover?.(l);window.downloadSelected=downloadSelected}catch{window.downloadSelected=async l=>isCarousel()?saveAll(l):window.downloadReelCover?.(l)}
function wrapInvalidate(name){const old=window[name];if(typeof old!=='function'||old.__nwfMobileWrapped)return;const fn=function(...args){const l=args[0]||lang(),id=args[1];invalidate(l,id);const r=old.apply(this,args);schedulePrime();return r};fn.__nwfMobileWrapped=true;window[name]=fn}
function bindCanvasInvalidation(){document.querySelectorAll('.carousel-slide-editor').forEach(el=>{if(el.dataset.saveBound)return;el.dataset.saveBound='1';const id=el.dataset.mediaId,cv=el.querySelector('canvas');if(!cv)return;const inv=()=>{invalidate(lang(),id);schedulePrime()};cv.addEventListener('pointerup',inv);cv.addEventListener('wheel',inv,{passive:true})})}
function updateSaveLabels(){
 if(!isCarousel())return;
 const l=lang(),count=selected(l).length,mobile=isMobile(),ready=selected(l).every(id=>fileCache.has(key(l,id)));
 document.querySelectorAll('.carousel-slide-save button').forEach(b=>b.textContent=mobile?'사진 앱에 저장':'이 슬라이드 PNG 저장');
 document.querySelectorAll('.download-row button').forEach(b=>{b.textContent=mobile?`${CFG[l].short} ${count}장 사진 앱에 저장`:`${CFG[l].short} ${count}장 PNG 저장`;b.title=mobile?'iPhone/Android 시스템 공유창을 열어 사진 앱에 저장합니다.':'선택한 슬라이드를 PNG 파일로 저장합니다.'});
 const head=document.querySelector('.carousel-all-head');if(head){let actions=head.querySelector('.carousel-all-head-actions');if(!actions){actions=document.createElement('div');actions.className='carousel-all-head-actions';head.appendChild(actions)}actions.innerHTML=`<span class="save-ready ${ready?'ready':''}">${ready?'저장 준비 완료':'이미지 준비 중'}</span><button onclick="saveCarouselToPhotos('${l}')">${mobile?`전체 ${count}장 사진 앱에 저장`:`전체 ${count}장 PNG 저장`}</button>`}
}
function mountFlowGuide(){
 const editor=document.querySelector('.carousel-all-editor');if(!editor||editor.querySelector('.mobile-flow-guide'))return;const g=document.createElement('div');g.className='mobile-flow-guide';g.innerHTML='<span class="done"><b>1</b> 이미지 선택</span><i>›</i><span class="active"><b>2</b> 슬라이드 편집</span><i>›</i><span><b>3</b> 사진 저장</span>';editor.insertBefore(g,editor.firstChild)
}
function mountBottomBar(){
 let bar=document.getElementById('mobileCarouselBar');if(!isMobile()||!isCarousel()){bar?.remove();document.body.classList.remove('has-mobile-carousel-bar');return}
 const l=lang(),count=selected(l).length;if(!bar){bar=document.createElement('div');bar.id='mobileCarouselBar';bar.className='mobile-carousel-bar';document.body.appendChild(bar)}bar.innerHTML=`<div><small>${CFG[l].short} CAROUSEL</small><b>${count}장 선택됨</b></div><button onclick="saveCarouselToPhotos('${l}')">사진 앱에 저장</button>`;document.body.classList.add('has-mobile-carousel-bar')
}
function enhance(){
 document.body.classList.toggle('nwf-mobile',isMobile());
 if(isCarousel()){mountFlowGuide();bindCanvasInvalidation();updateSaveLabels();mountBottomBar();schedulePrime()}else mountBottomBar();
}
function scheduleEnhance(){clearTimeout(enhanceTimer);enhanceTimer=setTimeout(enhance,70)}
['carouselAllText','carouselAllRange','carouselAllSet','carouselAllZoom','carouselAllReset','carouselAllMove','carouselAllRemove'].forEach(wrapInvalidate);
const oldRenderStudio=window.renderStudio;if(typeof oldRenderStudio==='function'){window.renderStudio=function(){const r=oldRenderStudio.apply(this,arguments);requestAnimationFrame(scheduleEnhance);return r}}
const oldSetFormat=window.setContentFormat;if(typeof oldSetFormat==='function'){window.setContentFormat=function(){const r=oldSetFormat.apply(this,arguments);requestAnimationFrame(scheduleEnhance);return r}}
const oldSetLang=window.setFactoryLanguage;if(typeof oldSetLang==='function'){window.setFactoryLanguage=function(){const r=oldSetLang.apply(this,arguments);requestAnimationFrame(scheduleEnhance);return r}}
window.addEventListener('resize',scheduleEnhance,{passive:true});window.addEventListener('orientationchange',scheduleEnhance,{passive:true});window.addEventListener('load',()=>setTimeout(enhance,250));setTimeout(enhance,450);
})();