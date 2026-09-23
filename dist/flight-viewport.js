// Lock only an active sortie. Hangar zoom and scrolling remain available.
export function installFlightViewport(doc,win){
 let locked=false,scrollY=0;
 const supportsDvh=win.CSS?.supports?.('height','100dvh')||win.CSS?.supports?.('height:100dvh');
 const sync=()=>{if(!locked)return;const view=win.visualViewport;if(view&&Math.abs(view.scale-1)>.01)return;if(supportsDvh){doc.documentElement.style.removeProperty('--flight-height');return}const height=view?.height||win.innerHeight;if(height>0)doc.documentElement.style.setProperty('--flight-height',Math.round(height)+'px')};
 const resync=()=>{sync();win.requestAnimationFrame?.(sync)};
 const block=e=>{if(locked&&e.cancelable)e.preventDefault()};
 doc.addEventListener('touchmove',e=>{if(!locked)return;const inDialog=e.target?.closest?.('#modal:not(.hidden)');if(!inDialog||e.touches?.length>1)block(e)},{passive:false});
 for(const type of ['gesturestart','gesturechange','gestureend'])doc.addEventListener(type,block,{passive:false});
 win.addEventListener('resize',resync);win.addEventListener('orientationchange',resync);win.visualViewport?.addEventListener('resize',resync);win.visualViewport?.addEventListener('scroll',resync);
 return {lock(){if(!locked)scrollY=win.scrollY||0;locked=true;sync();win.scrollTo?.({top:0,left:0,behavior:'instant'})},unlock(){locked=false;doc.documentElement.style.removeProperty('--flight-height');win.scrollTo?.({top:scrollY,left:0,behavior:'instant'})}};
}
