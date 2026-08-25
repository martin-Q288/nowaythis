(()=>{
function lang(){return window.getFactoryLanguage?.()||localStorage.getItem('nwf-active-language-v1')||'kr'}
function meta(l){return ({kr:'KR',jp:'JP',en:'EN'})[l]||'KR'}
function reelState(){const x=current?.();const l=lang();return {x,l,r:x?.reels?.[l]||null}}
function selectedMedia(){const {x,r}=reelState();return x?.images?.find(i=>i.id===r?.image)||null}
function isVideo(im){return !!im&&(im.type==='video-upload'||String(im.mime||'').startsWith('video/'))}
function hasCuts(){const {r}=reelState();return Array.isArray(r?.edit?.clips)?r.edit.clips.length>0:Array.isArray(r?.edit?.segments)&&r.edit.segments.length>0}
function safeName(s='reel'){return String(s).replace(/[^a-z0-9가-힣_-]+/gi,'_').replace(/^_+|_+$/g,'').slice(0,70)||'reel'}
function toast2(msg){if(typeof toast==='function')toast(msg)}
async function saveOriginalVideo(){
  const {x,l}=reelState(),im=selectedMedia();
  if(!isVideo(im)||!im.mediaKey)return toast2('업로드한 영상을 먼저 선택해주세요');
  try{
    const blob=await window.NWVideoStore?.getVideo(im.mediaKey);
    if(!blob)return toast2('브라우저 저장소에서 원본 영상을 찾지 못했습니다');
    const mime=String(blob.type||im.mime||'video/mp4').toLowerCase();
    const srcName=String(im.name||'').toLowerCase();
    const ext=mime.includes('quicktime')||srcName.endsWith('.mov')?'mov':mime.includes('webm')||srcName.endsWith('.webm')?'webm':'mp4';
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`noway_${safeName(x?.id||'content')}_reels_${l}.${ext}`;
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);
    toast2(`${meta(l)} REELS VIDEO 저장 완료 · ${ext.toUpperCase()}`);
  }catch(e){console.error(e);toast2('영상 저장에 실패했습니다')}
}
window.downloadReelVideo=async()=>{
  const im=selectedMedia();
  if(!isVideo(im))return toast2('영상 파일을 선택해야 REELS VIDEO를 저장할 수 있습니다');
  if(hasCuts()&&typeof window.exportCutMp4==='function')return window.exportCutMp4();
  return saveOriginalVideo();
};
function enhance(){
  if(window.getContentFormat?.()!=='reels')return;
  const {l}=reelState(),im=selectedMedia();
  document.querySelectorAll('.download-row').forEach(row=>{
    const cover=[...row.querySelectorAll('button')].find(b=>/REELS COVER|COVER.*저장/i.test(b.textContent||''));
    if(cover){cover.textContent=`${meta(l)} COVER PNG 저장`;cover.title='Instagram 릴스 표지용 9:16 정지 이미지(PNG)';}
    let video=row.querySelector('.reels-video-save');
    if(isVideo(im)){
      if(!video){video=document.createElement('button');video.className='primary reels-video-save';video.onclick=()=>window.downloadReelVideo();row.appendChild(video)}
      video.textContent=hasCuts()?`${meta(l)} 편집본 MP4 저장`:`${meta(l)} REELS VIDEO 저장`;
      video.title=hasCuts()?'컷편집한 릴스 본편을 MP4로 렌더링':'업로드한 원본 영상 파일을 저장';
    }else if(video)video.remove();
  });
  document.querySelectorAll('.source-hint').forEach(el=>{
    if(/실제 영상 편집은 기존 릴스 제작 방식/.test(el.textContent||''))el.textContent='릴스용 영상은 업로드 후 타임라인에서 컷편집할 수 있습니다. COVER PNG는 표지 이미지이고, REELS VIDEO/편집본 MP4가 실제 업로드할 본편입니다.';
  });
}
const mo=new MutationObserver(()=>enhance());
window.addEventListener('load',()=>{enhance();mo.observe(document.body,{childList:true,subtree:true});});
document.addEventListener('nwf-force-rerender',()=>setTimeout(enhance,80));
setTimeout(enhance,300);
})();