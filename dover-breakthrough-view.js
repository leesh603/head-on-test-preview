import {doverPatrolChart,doverCliffRoute} from './dover-patrol-chart.js?v=b3bf991d11fc7798';
import {drawAircraftCrash,enemyCrashVisual} from './aircraft-crash.js?v=b3bf991d11fc7798';
export function doverMissionCard(g,en=false){
 const m=g?.doverMission;if(!m||g.stageBoss?.stages.stageIndex!==17)return null;
 const escort=m.faction==='central',b=m.bossPose;
 return {title:en?'DOVER BREAKTHROUGH':'해협 돌파전',
  objective:m.rewarded?(m.success?(en?'Mission complete':'임무 성공'):(en?'Mission failed':'임무 실패')):
   escort?(en?'Escort R.VIII to the coast':'R.VIII 영국 해안까지 호위'):(en?'Intercept R.VIII before it reaches the coast':'해안 도달 전에 R.VIII 격추'),
  meta:b?`R.VIII ${Math.ceil(b.hp)}/${Math.ceil(b.maxHp)} · ${en?'Route':'항로'} ${Math.round(m.progress*100)}%`:(en?'R.VIII and Nighthawk approaching':'R.VIII · 나이트호크 접근 중')};
}
// Existing Gotha artwork and the game's engine-fire/crash atlas are shared in both modes.
export function drawDoverConvoy(c,g,{point=(x,y)=>[x,y],drawFieldArt,fieldArtImg,fx,en=false}){
 const m=g?.doverMission;if(!m||g.stageBoss?.stages.stageIndex!==17)return;
 const z=g.camera?.zoom||1,halfW=(g.viewWidth||960)/(2*z),halfH=(g.viewHeight||700)/(2*z),chart=doverPatrolChart(g);
 c.save();c.strokeStyle='#ddcfa2';c.lineWidth=2;c.globalAlpha=.52;
 for(let i=1;i<=4;i++){
  const route=doverCliffRoute(chart,g.y-i*145,560,0),q=point(route.x,route.y),x=q[0],y=q[1];
  c.beginPath();c.moveTo(x-7,y+6);c.lineTo(x,y-4);c.lineTo(x+7,y+6);c.stroke();
 }
 c.globalAlpha=1;
 const im=fieldArtImg?.('gotha');
 for(const b of m.bombers){
  if(b.doverResult==='arrived'||b.crashed||Math.abs(b.x-g.x)>halfW+260||Math.abs(b.y-g.y)>halfH+260)continue;
  const q=point(b.x,b.y),x=q[0],y=q[1],scale=b.crashing?enemyCrashVisual(b).scale:1;
  if(im?.naturalWidth)drawFieldArt('gotha',x,y,158*scale,158*scale*im.naturalHeight/im.naturalWidth,b.a+Math.PI/2,b.hitFlash>0?.72:1);
  if(b.crashing){drawAircraftCrash(c,b,x,y,g.t,fx);continue;}
  if(b.engineDamage){
   const side=Number(b.id.split('-').at(-1))%2?1:-1,ex=x-Math.sin(b.a)*side*26,ey=y+Math.cos(b.a)*side*26;
   fx(c,'engineSmoke',ex-Math.cos(b.a)*30,ey-Math.sin(b.a)*30,50,50,b.a,.55);
   if(b.engineDamage===2)fx(c,'fireEngine',ex,ey,27,35,b.a+Math.PI/2,.9);
   c.fillStyle='#282820';c.fillRect(x-24,y+54,48,3);c.fillStyle=m.faction==='central'?'#b7cc9d':'#d7b08c';c.fillRect(x-24,y+54,48*b.hp/b.maxHp,3);
  }
 }
 // A single nearest-convoy arrow keeps late waves discoverable when off screen.
 let nearest=null,best=Infinity;for(const b of m.bombers)if(b.hp>0&&!b.doverResult){const d=(b.x-g.x)**2+(b.y-g.y)**2;if(d<best){best=d;nearest=b;}}
 if(m.bossPose?.hp>0)nearest=m.bossPose;
 if(nearest&&(Math.abs(nearest.x-g.x)>halfW-70||Math.abs(nearest.y-g.y)>halfH-70)){
  const dx=nearest.x-g.x,dy=nearest.y-g.y,a=Math.atan2(dy,dx),edge=Math.min((halfW-30)/Math.max(.001,Math.abs(Math.cos(a))),(halfH-60)/Math.max(.001,Math.abs(Math.sin(a)))),q=point(g.x+Math.cos(a)*edge,g.y+Math.sin(a)*edge),x=q[0],y=q[1];
  c.save();c.translate(x,y);c.rotate(a);c.strokeStyle='#dfcf9a';c.lineWidth=2.5;c.beginPath();c.moveTo(-7,-6);c.lineTo(4,0);c.lineTo(-7,6);c.stroke();c.restore();
  c.font='600 12px sans-serif';c.textAlign='center';c.fillStyle='#eee4c8';c.fillText(nearest===m.bossPose?'R.VIII':en?`Bomber flight ${nearest.wave+1}`:`폭격기 ${nearest.wave+1}편대`,x,y-15);
 }
 if(Math.abs(m.destinationY-g.y)<halfH+60){const route=doverCliffRoute(chart,m.destinationY,560,0),q=point(route.x,m.destinationY);c.strokeStyle='#d9cda9';c.setLineDash([12,10]);c.beginPath();c.moveTo(q[0]-260,q[1]);c.lineTo(q[0]+260,q[1]);c.stroke();c.setLineDash([]);c.fillStyle='#eee4c8';c.font='600 13px sans-serif';c.textAlign='center';c.fillText(en?'British coast · exit':'영국 해안 · 돌파 지점',q[0],q[1]-16);}
 c.restore();
}
