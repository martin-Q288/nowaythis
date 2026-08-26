(()=>{
const LANGS={kr:'KR',jp:'JP',en:'EN'};
let enhanceTimer=0;
const slideState=new Map();
function mobile(){return matchMedia('(max-width:900px),(pointer:coarse)').matches}
function lang(){return window.getFactoryLanguage?.()||localStorage.getItem('nwf-active-language-v1')||'kr'}
function item(){return typeof current==='function'?current():null}
function format(){return window.getContentFormat?.()||'reels'}
function carousel(){return format()==='carousel'}
function key(){return `${item()?.id||'x'}|${lang()}`}
function toast2(t){if(typeof toast==='function')toast(t)}
function q(s,r=document){return r.querySelector(s)}
function qa(s,r=document){return [...r.querySelectorAll(s)]}
function scrollToEl(el){if(!el)return;const y=el.getBoundingClientRect().top+scrollY-116;scrollTo({top:Math.max(0,y),behavior:'smooth'})}
function mountQuickNav(){
 const studio=q('#studio');if(!studio||q('.mobile-pro-nav',studio))return;
 const nav=document.createElement('div');nav.className='mobile-pro-nav';nav.innerHTML=`<button data-step="source"><b>1</b>소재</button><button data-step="media"><b>2</b>이미지</button><button data-step="edit" class="active"><b>3</b>편집</button><button data-step="publish"><b>4</b>캡션</button>`;
 nav.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;qa('button',nav).forEach(x=>x.classList.toggle('active',x===b));const step=b.dataset.step;let target=null;if(step==='source')target=q('.source-box',studio);if(step==='media')target=q('.candidate-grid',studio);if(step==='edit')target=q('.carousel-all-editor',studio)||q('.stable-cut-editor',studio)||q('.reels-workflow',studio)||q('.language-accordion',studio);if(step==='publish')target=q('.publish-panel');scrollToEl(target)});
 studio.prepend(nav)
}
function mountAutosave(){const head=q('.studio-panel>.panel-head');if(!head||q('.mobile-autosave',head))return;const e=document.createElement('span');e.className='mobile-autosave';e.textContent='자동저장';const count=q('#imageCount',head);if(count)count.insertAdjacentElement('beforebegin',e);else head.appendChild(e)}
function mountLangTabs(){
 const acc=q('#studio .language-accordion');if(!acc)return;let tabs=q('.mobile-lang-tabs',acc.parentElement);if(!tabs){tabs=document.createElement('div');tabs.className='mobile-lang-tabs';acc.insertAdjacentElement('beforebegin',tabs)}
 const l=lang(),x=item();tabs.innerHTML=Object.entries(LANGS).map(([id,label])=>{const sel=x?.[id+'Selected']?.length||0;return `<button class="${id===l?'active':''}" data-lang="${id}">${label}<span>${sel}장</span></button>`}).join('');
 tabs.onclick=e=>{const b=e.target.closest('button[data-lang]');if(!b||b.dataset.lang===lang())return;window.setFactoryLanguage?.(b.dataset.lang)}
}
function mediaFor(id){return item()?.images?.find(v=>String(v.id)===String(id))||null}
function selectedIds(){const l=lang();return item()?.[l+'Selected']||[]}
function mountSlideTabs(){
 const editor=q('.carousel-all-editor');const list=q('.carousel-slide-list',editor);if(!editor||!list)return;
 const cards=qa('.carousel-slide-editor',list);if(!cards.length)return;
 let tabs=q('.mobile-slide-tabs',editor);if(!tabs){tabs=document.createElement('div');tabs.className='mobile-slide-tabs';list.insertAdjacentElement('beforebegin',tabs)}
 const ids=cards.map(c=>c.dataset.mediaId);let active=slideState.get(key());if(!ids.includes(active)){active=cards.find(c=>c.classList.contains('active'))?.dataset.mediaId||ids[0];slideState.set(key(),active)}
 tabs.innerHTML=ids.map((id,i)=>{const m=mediaFor(id),src=m?.display||m?.url||'';return `<button class="${id===active?'active':''}" data-id="${String(id).replace(/"/g,'&quot;')}">${src?`<img src="${src}" alt="SLIDE ${i+1}">`:''}<span>${i+1}</span></button>`}).join('');
 cards.forEach(c=>c.classList.toggle('mobile-active',c.dataset.mediaId===active));
 tabs.onclick=e=>{const b=e.target.closest('button[data-id]');if(!b)return;setSlide(b.dataset.id,false)}
}
function setSlide(id,doScroll=true){
 const editor=q('.carousel-all-editor');if(!editor)return;const cards=qa('.carousel-slide-editor',editor);if(!cards.some(c=>c.dataset.mediaId===String(id)))return;slideState.set(key(),String(id));cards.forEach(c=>c.classList.toggle('mobile-active',c.dataset.mediaId===String(id)));qa('.mobile-slide-tabs button',editor).forEach(b=>b.classList.toggle('active',b.dataset.id===String(id)));if(doScroll)scrollToEl(editor)
}
function activeSlideIndex(){const ids=selectedIds();const id=slideState.get(key())||ids[0];return {ids,id,index:Math.max(0,ids.indexOf(id))}}
function moveSlide(delta){const {ids,index}=activeSlideIndex();if(!ids.length)return;const n=Math.max(0,Math.min(ids.length-1,index+delta));setSlide(ids[n])}
function mountControlAccordions(){
 const active=q('.carousel-slide-editor.mobile-active');if(!active)return;const groups=qa('.carousel-control-group',active);groups.forEach((g,i)=>{if(g.dataset.mobileAccordion)return;g.dataset.mobileAccordion='1';if(i>0)g.classList.add('mobile-collapsed');const h=q('.carousel-control-title',g);if(h)h.addEventListener('click',e=>{if(e.target.closest('button,input'))return;g.classList.toggle('mobile-collapsed')})})
}
function postingButton(){return q('#studio .posting-btn')}
function posted(){const b=postingButton();return !!(b&&(b.disabled||b.classList.contains('posted')))}
async function saveCurrent(){
 const l=lang();if(carousel()){
   const {ids,id,index}=activeSlideIndex();if(!id)return toast2('이미지를 먼저 선택해주세요');if(typeof window.carouselAllDownload==='function')return window.carouselAllDownload(l,id,index+1);return window.saveCarouselToPhotos?.(l)
 }
 if(typeof window.downloadReelVideo==='function')return window.downloadReelVideo();if(typeof window.downloadReelCover==='function')return window.downloadReelCover(l);toast2('저장할 미디어를 먼저 선택해주세요')
}
function markPosted(){
 if(posted())return toast2('이미 게시 완료 처리된 언어입니다');
 const l=lang();if(!confirm(`${LANGS[l]||l.toUpperCase()} 콘텐츠를 Instagram에 실제로 게시하셨나요?\n게시한 경우에만 확인을 눌러주세요.`))return;
 if(typeof window.markCurrentPosted==='function')window.markCurrentPosted(l);else postingButton()?.click()
}
function mountDock(){
 let dock=q('#mobileProDock');if(!mobile()){dock?.remove();return}if(!dock){dock=document.createElement('div');dock.id='mobileProDock';dock.className='mobile-pro-dock';document.body.appendChild(dock)}
 const l=lang();if(carousel()){
   const {ids,index}=activeSlideIndex(),done=posted();dock.innerHTML=`<button class="navbtn" data-act="prev" ${index<=0?'disabled':''}>‹</button><button class="savebtn" data-act="save">현재 사진 저장<small>${LANGS[l]} · ${ids.length?index+1:0}/${ids.length}</small></button><button class="postbtn ${done?'done':''}" data-act="post">${done?'게시완료':'게시 완료'}<small>${done?'기록됨':'Instagram 후'}</small></button>`
 }else{
   const done=posted();dock.innerHTML=`<button class="navbtn" data-act="preview">▶</button><button class="savebtn" data-act="save">릴스 영상 저장<small>${LANGS[l]} · MP4/원본</small></button><button class="postbtn ${done?'done':''}" data-act="post">${done?'게시완료':'게시 완료'}<small>${done?'기록됨':'Instagram 후'}</small></button>`
 }
 dock.onclick=e=>{const b=e.target.closest('button[data-act]');if(!b||b.disabled)return;const a=b.dataset.act;if(a==='prev')moveSlide(-1);if(a==='save')saveCurrent();if(a==='post')markPosted();if(a==='preview'){const p=q('.stable-cut-preview button,.cut-preview button,[data-action="preview-edited"]');if(p)p.click();else q('video')?.play?.()}}
}
function addNextButton(){
 if(!carousel())return;const dock=q('#mobileProDock');if(!dock)return;const {ids,index}=activeSlideIndex();if(index>=ids.length-1)return;let next=q('[data-mobile-next]',dock);if(next)return;const post=q('.postbtn',dock);if(!post)return;post.dataset.mobilePostLabel=post.innerHTML;post.dataset.act='next';post.setAttribute('data-mobile-next','1');post.classList.remove('done');post.innerHTML=`다음 ›<small>SLIDE ${index+2}</small>`;
 const finish=()=>{const state=activeSlideIndex();if(state.index>=state.ids.length-1)schedule()};
 post.addEventListener('click',()=>setTimeout(finish,80),{once:true})
}
function enhance(){
 if(!mobile()){q('#mobileProDock')?.remove();return}
 document.body.classList.add('nwf-mobile-pro');mountQuickNav();mountAutosave();mountLangTabs();if(carousel()){mountSlideTabs();mountControlAccordions()}mountDock();addNextButton()
}
function schedule(){clearTimeout(enhanceTimer);enhanceTimer=setTimeout(enhance,80)}
function wrap(name){const old=window[name];if(typeof old!=='function'||old.__mobilePro)return;const fn=function(){const r=old.apply(this,arguments);requestAnimationFrame(schedule);return r};fn.__mobilePro=true;window[name]=fn}
['renderStudio','renderPublish','setFactoryLanguage','setContentFormat','toggleSelect','carouselAllMove','carouselAllRemove'].forEach(wrap);
window.addEventListener('load',()=>setTimeout(enhance,260));window.addEventListener('resize',schedule,{passive:true});window.addEventListener('orientationchange',schedule,{passive:true});setTimeout(enhance,520)
})();
