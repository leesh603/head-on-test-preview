// A choice belongs to one displayed prompt and one sortie, not to a delayed DOM button.
export function createChoiceTransaction({getGame,schedule=setTimeout,cancel=clearTimeout}={}){
 let current=null,serial=0,executing=null;
 const context=g=>g?.mode==='coop2'?g.activeUpgrade?.id:g?.level;
 const valid=t=>!!t&&t===current&&t.game===getGame()&&t.game?.state==='upgrade'&&t.context===context(t.game);
 function reset(){if(current?.timer!=null)cancel(current.timer);current?.cleanup?.();current=null;serial++;}
 function open(){reset();const game=getGame();return current={id:serial,game,context:context(game),used:false,pending:false,timer:null,cleanup:null};}
 function accept(game){if(executing&&executing.game===game)return true;const t=current;if(!valid(t)||t.used||t.pending)return false;t.used=true;return true;}
 function run(t,action,{delay=0,begin=()=>{},cleanup=()=>{}}={}){
  if(!valid(t)||t.used||t.pending)return false;
  const apply=()=>{if(!valid(t)||t.used){if(t===current&&t.pending){t.pending=false;t.timer=null;t.cleanup?.();t.cleanup=null;}return;}t.pending=false;t.timer=null;t.cleanup?.();t.cleanup=null;t.used=true;executing=t;try{action();}finally{executing=null;}};
  if(delay>0){t.pending=true;t.cleanup=cleanup;begin();t.timer=schedule(apply,delay);}else apply();return true;
 }
 function retry(game){if(current?.game===game&&valid(current)&&!current.pending)current.used=false;}
 return {open,reset,accept,run,retry};
}
