import {armorGunMuzzle,armorAngleDelta} from './trench-armor-layout.js?v=tame3';
import {alpsMuzzle} from './alps-bomber-layout.js?v=tame3';
import {harborMuzzle} from './harbor-crane-layout.js?v=tame3';
import {sommeMuzzle,sponsonAim} from './somme-boss-layout.js?v=tame3';
import {treffasPoint} from './cambrai-layout.js?v=tame3';

// Ordinary fire is separate from the raid controller. Only authored weapons
// fire; destroying one removes its lane. No new HP or difficulty multipliers.
const profile=(ports,visual,spread=1.05,count=7,interval=1.65)=>({ports,visual,spread,count,interval});
export const BASIC_BARRAGES=Object.freeze({
 'paris-gun':profile(['car-rear'],'rail-mg',.9,7,1.55),
 lincomparable:profile(['car-rear'],'rail-mg',1.1,7,1.8),
 'sms-stuttgart':profile(['gun0','gun1','gun2','gun3'],'stuttgart-flak',1.1),
 'hms-zubian':profile(['frontGun','rearGun'],'zubian-shell',1.15),
 'hms-zubian-front':profile(['frontGun'],'zubian-shell',1.15),
 'hms-zubian-rear':profile(['rearGun'],'zubian-shell',1.15),
 'a7v-flak':profile(['front','right','rear','left'],'aa-shell',1.05,7,1.1),
 'mark-v-cruiser':profile(['sponson-left','sponson-right'],'aa-shell',1.1,7,1.3),
 'livens-flame-projector':profile([],'livens-ember',.95,5,1.6),
 'minenwerfer-battery':profile(['gun-left','main-gun','gun-right'],'aa-shell',1.3,7,1.8),
 'drachen-net':profile(['airship-0','airship-1','airship-2'],'city-mg',1.2,7,1.6),
 'london-apron-raid':profile(['airship-0','airship-1','airship-2'],'city-mg',1.05,7,1.7),
 'flak-tower-cell':profile(['gun-bl','gun-br'],'city-mg',1.2,7,2.1),
 'zeppelin-l70':profile(['engine-0','engine-2','engine-4','engine-6'],'zeppelin-flak',1.2,7,1.55),
 hma23:profile(['port-0','port-1','port-2','port-3'],'airship-flak',1.2,7,1.55),
 gik:profile(['rearGun'],'alps-mg',.9,7,1.5),
 ca4:profile(['frontGun','rearGun'],'alps-mg',1.05,7,1.5),
 'armored-harbor-fortress':profile(['gun-left','gun-right','gun-front-left','gun-front-right'],'harbor-shell',1.15,7,1.5),
 fliegerzug:profile(['car-flak','car-rear'],'rail-mg',1.1,7,1.6),
 'treffas-wagen':profile([],'treffas-mg',.95,7,1.55),
 'jasta11-circus':profile([],'aa-shell',.45,5,1.3),
 'naval10-black-flight':profile([],'aa-shell',.6,5,1.45),
 'mark4-wedge':profile(['sponson-left','sponson-right'],'somme-mg',.85,5,2),
 'morser-battery':profile(['mg-left','mg-right','twin-aa'],'somme-mg',1.2,7,1.6),
 'gotha-raider':profile(['rear-gun'],'gotha-mg',1.05,5,2.1),
 'fort-douaumont':profile(['mg-left','mg-right','aa-left','aa-right'],'verdun-mg',1.25,7,1.65),
 'fort-souville':profile(['bunker-left','bunker-right','aa-left','aa-right'],'verdun-mg',1.25,7,1.65),
 wustenpanzer:profile(['aa-left','aa-right'],'maan-mg',1.05,7,1.6),
 'sinai-landship':profile(['lewis'],'maan-mg',1.2,7,1.5),
 'gallipoli-fortress':profile(['aa-west','aa-east','aa-citadel'],'gallipoli-mg',1.2,7,1.5),
 'paris-searchlight-fortress':profile(['mg-left','mg-right'],'paris-mg',1.1,7,1.8),
 'paris-staaken-rvi':profile(['gun-front','gun-top','gun-rear','gun-left','gun-right'],'staaken-mg',.95,7,1.6),
 'jutland-battleship':profile(['bow-port','bow-starboard','aft-port','aft-starboard'],'zubian-shell',1.2,7,2),
 'jutland-cruiser':profile(['bow','aft'],'zubian-shell',1.05,5,2.2)
});
const quietPhase=/(arrival|entry|buried|lowering|recover|cooldown|reform|service|depressurized|gliding|seam-warning|splitting)/;
export function basicFirePaused(b){
 return b.dead||b.hidden||b.phase==='approach'&&(b.combatTime||0)<4||
  b.kind==='armored-harbor-fortress'&&(b.elapsed<3||b.craneState==='recover')||
  b.kind==='gallipoli-fortress'&&(b.entryAge<5||b.pendingAttack?.kind==='final')||
  b.kind==='paris-searchlight-fortress'&&b.phase==='last-stand'||
  b.kind==='sinai-landship'&&!!b.encirclement||
  b.kind==='livens-flame-projector'&&(b.trenchEntry?.state!=='active'||b.lockedFlameAngle!=null)||
  b.kind==='mark4-wedge'&&(!b.discovered||/mark1-(approach|regroup|counter)/.test(String(b.phase)))||
  b.formationBoss129&&b.finalAge!=null||quietPhase.test(String(b.phase))||
  b.entryAge<(b.entryDuration||0)||b.formationBoss129&&!b.entryComplete||
  b.recovery>0||b.recoveryRemaining>0||b.serviceWindow>0||b.recoverLeft>0||
  b.rotation?.stage==='recover'||b.rotation?.stage==='windup'||b.rotation?.stage==='breakthrough'||
  b.fleet?.phase==='reform'||b.finalAim||b.stormActive||
  (b.basicHoldUntil||0)>(b.combatTime||0);
}
function mount(b,p,target,serial){
 const k=b.kind,aim=Math.atan2(target.y-b.y-(p?.y||0),target.x-b.x-(p?.x||0));
 let q={x:b.x+(p?.x||0),y:b.y+(p?.y||0),angle:aim};
 if(k==='livens-flame-projector'){const n=b.nozzleMount,a=b.nozzleAngle;q={x:b.x+n.x+Math.cos(a)*n.length,y:b.y+n.y+Math.sin(a)*n.length,angle:a};}
 else if(k==='a7v-flak'||k==='mark-v-cruiser'){
  const m=armorGunMuzzle(k,p,b.hullYaw,b.t.geometryScale||1);
  q={x:b.x+m.x,y:b.y+m.y,angle:m.angle,arc:b.layout.gunArc,base:b.hullYaw+p.baseAngle};
 }else if(b.cityArtKind){
  const index=Number(p.id.at(-1)),points=b.cityArtKind==='drachen-net'?[[154,295],[441,292],[641,432]]:[[123,193],[384,199],[646,193]];
  q={...b.point(...points[index],index),angle:aim};
 }else if(b.ruralRailBoss){q.y-=145;}
 else if(k==='fliegerzug'){q.y-=45;}
 else if(k==='gik'||k==='ca4'){
  const base=b.hullYaw+(p.id==='rearGun'?Math.PI/2:-Math.PI/2);
  q={...alpsMuzzle(b,p.id,aim),angle:base+Math.max(-1.2,Math.min(1.2,armorAngleDelta(aim,base))),arc:1.2,base};
 }else if(k==='armored-harbor-fortress'){q={...harborMuzzle(b,p),angle:p.angle};}
 else if(k==='mark4-wedge'||k==='morser-battery'){
  q={...sommeMuzzle(b,p),angle:p.angle};
  if(k==='mark4-wedge'){const a=sponsonAim(b,p,target.x,target.y);if(!a.reachable)return null;q.angle=a.angle;q.arc=.45;q.base=b.hullYaw+(p.id==='sponson-left'?Math.PI:0);}
 }else if(k==='minenwerfer-battery'){
  if(!p.discovered)return null;q={...b.muzzle(p),angle:aim};
 }else if(k==='treffas-wagen'){q={...treffasPoint(b,serial%2?-64:64,-24),angle:aim};}
 else if(b.formationBoss129){q={x:b.x+Math.cos(b.a)*30,y:b.y+Math.sin(b.a)*30,angle:b.a};}
 else if(k==='gotha-raider'){
  const base=b.a+Math.PI;q.angle=base+Math.max(-1.1,Math.min(1.1,armorAngleDelta(aim,base)));q.base=base;q.arc=1.1;
 }else if(k==='flak-tower-cell'){q={...b.muzzle(p),angle:p.angle};}
 else if(k.startsWith('fort-')){
  const length=p.muzzleLength||0;q={x:q.x+Math.cos(p.angle)*length,y:q.y+Math.sin(p.angle)*length,angle:p.angle};
 }else if(k==='gallipoli-fortress'){
  q={x:q.x+Math.cos(p.angle)*(p.muzzle||0),y:q.y+Math.sin(p.angle)*(p.muzzle||0),angle:p.angle};
 }else if(k.startsWith('jutland-')){
  const length=p.row===1?85:128;q={x:q.x+Math.cos(p.angle)*length,y:q.y+Math.sin(p.angle)*length,angle:p.angle};
 }
 return q;
}
function emit(b,e){b.emit({...e,bossId:b.id,faction:b.faction});}
export function updateBasicBarrage(b,dt,ctx){
 const config=BASIC_BARRAGES[b.kind];if(!config)return false;
 if(ctx.paused||dt<=0)return true;
 if(basicFirePaused(b)){if(!b.basicPaused&&b.basicSerial)emit(b,{type:'cancel-hazards',tag:b.id+':basic-fire'});b.basicPaused=true;b.basicClock=.55;return true;}
 b.basicPaused=false;
 b.basicClock=(b.basicClock??(1+(b.slot||b.index||0)*.27))-dt;if(b.basicClock>0)return true;
 const players=ctx.players||[],serial=b.basicSerial||0;let live=0;for(const p of players)if(p.alive)live++;
 if(!live)return true;let cursor=serial%live,target;for(const p of players)if(p.alive&&cursor--===0){target=p;break;}
 // Select the closest physical weapon that can cover the current target. A
 // modest alternation bias prevents one gun monopolising ordinary volleys.
 let selected=null,point=null,score=Infinity;
 for(let i=0;i<Math.max(1,config.ports.length);i++){
  const id=config.ports[(i+serial)%config.ports.length],p=id&&b.parts.get(id);
  if(id&&(!p||p.destroyed||p.active===false||p.revealed===false))continue;
  const q=mount(b,p,target,serial);if(!q)continue;
  const distance=Math.hypot(target.x-q.x,target.y-q.y),angle=Math.atan2(target.y-q.y,target.x-q.x);
  const rank=distance+Math.abs(armorAngleDelta(angle,q.angle))*250+i*24;
  if(distance<1100&&rank<score){score=rank;selected=p;point=q;}
 }
 if(!point){b.basicClock=.25;return true;}
 // A fleet/network shares one ordinary-fire beat rather than multiplying its
 // screen density by the number of bodies. Signature attacks remain native.
 const encounter=b.encounter,now=b.combatTime||0;
 if(encounter&&(encounter.basicNext||0)>now){b.basicClock=.18;return true;}
 if(encounter)encounter.basicNext=now+.72;
 b.basicClock=config.interval;b.basicSerial=serial+1;
 if(ctx.canBasicFire&&!ctx.canBasicFire()){b.basicClock=.35;return true;}
 const q=point,partId=selected?.id,spread=Math.min(config.spread,q.arc?2*q.arc:config.spread);
 let angle=q.angle;
 if(q.arc)angle=q.base+Math.max(-q.arc+spread/2,Math.min(q.arc-spread/2,armorAngleDelta(angle,q.base)));
 const count=b.kind==='livens-flame-projector'&&b.parts.get('pressure').destroyed?3:config.count,speed=Math.max(225,Math.min(330,b.t.bulletSpeed*.85)),warning=.6;
 const tag=b.id+':basic-fire';
 emit(b,{type:'charge-warning',x:q.x,y:q.y,targetX:q.x+Math.cos(angle)*420,targetY:q.y+Math.sin(angle)*420,seconds:warning,partId,basicFire:true});
 for(let i=0;i<count;i++){
  // Alternating off-centre openings; the central round still punishes camping.
  if(count>=7&&i===(serial%2?count-2:1))continue;
  const a=angle+(i/(count-1)-.5)*spread;
  emit(b,{type:'hazard',kind:'projectile',x:q.x,y:q.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,
   partId,sourceX:q.x,sourceY:q.y,sourcePartId:partId,sourceOffsetX:partId?q.x-b.x-selected.x:0,sourceOffsetY:partId?q.y-b.y-selected.y:0,
   basicSerial:serial,basicMuzzle:i===0,radius:4,damage:b.t.damage*.45,delay:warning,warning:0,duration:Math.min(4.2,Math.max(2.3,Math.hypot(target.x-q.x,target.y-q.y)/speed+.8)),visual:config.visual,tag});
 }
 return true;
}

export function basicBarrageMuzzle(b,h){
 const p=h.sourcePartId?b.parts.get(h.sourcePartId):null,a=Math.atan2(h.vy,h.vx);
 return mount(b,p,{x:b.x+Math.cos(a)*800,y:b.y+Math.sin(a)*800},h.basicSerial||0);
}
