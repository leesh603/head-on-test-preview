import {drawHeadOnEngagement} from './engagement-hud410.js?v=465';
// Presentation only: no damage, steering, or target-lock changes.
export function headOnTarget(player,enemies){
 if(!player||player.hp<=0||player.status&&player.status!=='alive')return null;
 const px=Math.cos(player.a),py=Math.sin(player.a);let nearest=null,best=420;
 for(const e of enemies||[]){
  if(e.hp<=0||e.expired||e.surface||e.stationary||e.fieldUnit||e.navalVessel||e.heavyBomber||e.type==='zeppelin')continue;
  const dx=e.x-player.x,dy=e.y-player.y,d=Math.hypot(dx,dy);
  if(d<70||d>=best)continue;
  // Both noses must point at each other, not merely share the forward screen.
  if((px*dx+py*dy)/d<.94||(-Math.cos(e.a)*dx-Math.sin(e.a)*dy)/d<.9)continue;
  best=d;nearest=e;
 }
 return nearest;
}
const states=new WeakMap();
export function headOnFeedback(player,enemies,time){
 let state=states.get(player);
 if(!state||time<state.lastTime){state={lastTime:time,since:null,until:0,next:0};states.set(player,state)}
 state.lastTime=time;let cue=false;
 if(headOnTarget(player,enemies)){
  state.since??=time;
  if(time-state.since>=.09&&time>=state.next){state.until=time+.85;state.next=time+4;cue=true}
 }else state.since=null;
 return{visible:time<state.until,cue,age:time-(state.until-.85),left:state.until-time};
}
export function drawHeadOnFeedback(ctx,game,width,height,play){
 if(!game||game.state!=='playing')return;
 const coop=game.mode==='coop2',zoom=coop?(game.camera?.zoom||1):1;
 for(const p of coop?game.players:[game]){
  if(p.hp<=0||p.status&&p.status!=='alive')continue;
  const feedback=headOnFeedback(p,game.enemies,game.t||0);
  if(feedback.cue)play('headOn');
  if(!feedback.visible)continue;
  // Mark the enemy nose-on, in the same bracket + pill grammar as the tail marker.
  const target=headOnTarget(p,game.enemies),anchor=target||p;
  const x=(anchor.x-game.x)*zoom+width/2,y=(anchor.y-game.y)*zoom+height/2;
  const label=coop?(p.id?.toUpperCase()||'')+' · HEAD-ON':'HEAD-ON';
  drawHeadOnEngagement(ctx,x,target?y:y-10,label,feedback.age,Math.min(1,feedback.left/.2),!!target);
 }
}
