// Lock only an active sortie. Hangar zoom and scrolling remain available.
export function installFlightViewport(doc,win){
 let locked=false,scrollY=0,frame=null,syncedHeight=null;
 const supportsDvh=win.CSS?.supports?.('height','100dvh')||win.CSS?.supports?.('height:100dvh');
 const sync=()=>{
  if(!locked)return;
  const view=win.visualViewport;
  if(view&&Math.abs(view.scale-1)>.01)return;
  if(supportsDvh){
   if(syncedHeight!==''){doc.documentElement.style.removeProperty('--flight-height');syncedHeight='';}
   return;
  }
  const height=view?.height||win.innerHeight;
  if(height>0){
   const next=Math.round(height)+'px';
   if(next!==syncedHeight){doc.documentElement.style.setProperty('--flight-height',next);syncedHeight=next;}
  }
 };
 const onFrame=()=>{frame=null;sync()};
 // Address-bar / orientation events often arrive in bursts. One pending update
 // is sufficient, and hangar events must not schedule sortie callbacks at all.
 const resync=()=>{
  if(!locked||frame!==null)return;
  if(win.requestAnimationFrame)frame=win.requestAnimationFrame(onFrame);else sync();
 };
 const block=e=>{if(locked&&e.cancelable)e.preventDefault()};
 doc.addEventListener('touchmove',e=>{if(!locked)return;const inDialog=e.target?.closest?.('#modal:not(.hidden)');if(!inDialog||e.touches?.length>1)block(e)},{passive:false});
 for(const type of ['gesturestart','gesturechange','gestureend'])doc.addEventListener(type,block,{passive:false});
 win.addEventListener('resize',resync);win.addEventListener('orientationchange',resync);win.visualViewport?.addEventListener('resize',resync);win.visualViewport?.addEventListener('scroll',resync);doc.addEventListener('fullscreenchange',resync);
 const coarse=()=>{try{return win.matchMedia?.('(pointer:coarse)')?.matches}catch(_){return false}};
 const enterFs=force=>{try{if(!doc.fullscreenElement&&(force||coarse()))doc.documentElement.requestFullscreen?.({navigationUI:'hide'})?.catch?.(()=>{})}catch(_){}};
 const exitFs=()=>{try{if(doc.fullscreenElement)doc.exitFullscreen?.()?.catch?.(()=>{})}catch(_){}};
 return {
  lock(){if(!locked){scrollY=win.scrollY||0;syncedHeight=null;}locked=true;sync();enterFs();win.scrollTo?.({top:0,left:0,behavior:'instant'})},
  unlock(){
   locked=false;
   if(frame!==null){win.cancelAnimationFrame?.(frame);frame=null;}
   exitFs();doc.documentElement.style.removeProperty('--flight-height');syncedHeight=null;
   win.scrollTo?.({top:scrollY,left:0,behavior:'instant'});
  },
  fullscreen(){enterFs(true)}
 };
}
