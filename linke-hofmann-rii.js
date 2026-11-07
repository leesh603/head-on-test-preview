import {BaseBoss,BossPart} from './headon-stageboss-core.js?v=09c75d146ae4289d';
// QA-only game tactics. External rack bombs become warned fixed ground danger
// areas; this is not a claim that falling bombs directly strike flying aircraft.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
export const RII_LAYOUT=Object.freeze({width:1800,height:900,core:{x:0,y:0,radius:85},parts:[
 {id:'engine-1',x:-30,y:-325,radius:27,kind:'engine'},{id:'engine-2',x:30,y:-325,radius:27,kind:'engine'},
 {id:'engine-3',x:-30,y:-230,radius:27,kind:'engine'},{id:'engine-4',x:30,y:-230,radius:27,kind:'engine'},
 {id:'gun-left',x:-36,y:-3,radius:32,kind:'gun'},{id:'gun-right',x:38,y:-3,radius:32,kind:'gun'},
 {id:'rack-left',x:-250,y:40,radius:30,kind:'payload'},{id:'rack-right',x:250,y:40,radius:30,kind:'payload'},
 {id:'rudder',x:0,y:345,radius:45,kind:'control'}],
 hull:[{x:0,y:0,rx:65,ry:390},{x:0,y:-110,rx:890,ry:155},{x:0,y:330,rx:195,ry:80}],propeller:{x:0,y:-399,radius:150,blades:2},gunBarrelLength:65.6});
export const RII_WEAPON_ARCS=Object.freeze({'gun-left':{offset:Math.PI+.65,half:.46},'gun-right':{offset:Math.PI-.65,half:.46}});
function ellipseEntry(a,b,rx,ry){const x=a.x/rx,y=a.y/ry,dx=(b.x-a.x)/rx,dy=(b.y-a.y)/ry,A=dx*dx+dy*dy,B=2*(x*dx+y*dy),C=x*x+y*y-1;if(C<=0)return 0;if(!A)return Infinity;const d=B*B-4*A*C;if(d<0)return Infinity;const t=(-B-Math.sqrt(d))/(2*A);return t>=0&&t<=1?t:Infinity;}
export class LinkeHofmannRII extends BaseBoss{
 constructor({tuning,layout=RII_LAYOUT,...options}){
  for(const k of ['maxHp','partHp','damage','bulletSpeed'])if(!(tuning?.[k]>0))throw Error('Current boss tuning required: '+k);
  const scale=tuning.geometryScale||1,parts=layout.parts.map(p=>new BossPart({...p,maxHp:tuning.parts?.[p.id]?.maxHp||tuning.partHp,x:p.x*scale,y:p.y*scale,radius:p.radius*scale}));
  super({...options,maxHp:tuning.maxHp,coreRadius:layout.core.radius*scale,parts});
  Object.assign(this,{kind:'linke-hofmann-r-ii',faction:'central',layout,t:tuning,geometryScale:scale,a:-Math.PI/2,hullYaw:0,flightSpeed:55,rpm:1,propellerPhase:0,phase:'defence',phaseClock:0,cycle:0,dropIndex:0,dropClock:0,visualBombs:[],visualBombSerial:0,bombHeading:null,finishClock:null,ownsMotion129:true,ownsBasicBarrage:true,hidden:false});
  this.rackAmmo={'rack-left':2,'rack-right':2};
  this.gunCadence=0;this.nextGun='gun-left';
  this.turretStates={};for(const [id,arc]of Object.entries(RII_WEAPON_ARCS))this.turretStates[id]={angle:this.a+arc.offset,cooldown:id==='gun-left'?.6:1.2,warningLeft:0,recoil:0,flash:0};
  for(const p of this.parts.values()){p.localX=p.x;p.localY=p.y;}this.rotateParts();
 }
 noteAttackActivated(h){super.noteAttackActivated(h);const s=this.turretStates[h.sourcePartId];if(!this.dead&&s&&this.alivePart(h.sourcePartId)){s.recoil=4;s.flash=.07;if(Number.isFinite(h.angle))s.angle=h.angle;}}
 command(type,spec={}){this.emit({...spec,type,bossId:this.id,faction:this.faction});}
 alivePart(id){return !!this.parts.get(id)&&!this.parts.get(id).destroyed;}
 engines(){return [...this.parts.values()].filter(p=>p.kind==='engine'&&!p.destroyed).length;}
 engineRatio(){const engines=[...this.parts.values()].filter(p=>p.kind==='engine');return engines.reduce((n,p)=>n+clamp(p.hp/p.maxHp,0,1),0)/4;}
 driveRatio(){return .25+.75*this.engineRatio();}
 rotateParts(){this.hullYaw=this.a+Math.PI/2;const c=Math.cos(this.hullYaw),s=Math.sin(this.hullYaw);for(const p of this.parts.values()){p.x=p.localX*c-p.localY*s;p.y=p.localX*s+p.localY*c;p.angle=this.turretStates[p.id]?.angle??this.a;}}
 localPoint(x,y){const c=Math.cos(this.hullYaw),s=Math.sin(this.hullYaw),dx=(x-this.x)/this.geometryScale,dy=(y-this.y)/this.geometryScale;return{x:dx*c+dy*s,y:-dx*s+dy*c};}
 locateHit(h){if(this.hidden||this.dead)return null;let part=null,first=Infinity;const a={x:h.previousX??h.x,y:h.previousY??h.y},b=h;
  for(const p of this.parts.values())if(!p.destroyed&&p.hittable){const t=ellipseEntry({x:a.x-this.x-p.x,y:a.y-this.y-p.y},{x:b.x-this.x-p.x,y:b.y-this.y-p.y},p.radius+(h.radius||0),p.radius+(h.radius||0));if(t<first){first=t;part=p.id;}}
  if(part)return{partId:part};if(!this.coreVulnerable)return null;const q=this.localPoint(a.x,a.y),z=this.localPoint(b.x,b.y),pad=(h.radius||0)/this.geometryScale;
  return this.layout.hull.some(v=>Number.isFinite(ellipseEntry({x:q.x-v.x,y:q.y-v.y},{x:z.x-v.x,y:z.y-v.y},v.rx+pad,v.ry+pad)))?{partId:null}:null;
 }
 hitAt(h){const p=this.locateHit(h);return p?this.hit({...p,damage:h.damage}):{damage:0,miss:true};}
 cancelPart(id){this.command('cancel-hazards',{tag:this.id+':'+id,sourcePartId:id});}
 cancelAll(){for(const p of this.parts.values())this.cancelPart(p.id);}
 // Arrival and defeat are presentation clocks, never combat/attack updates.
 updateArrival(dt){this.propellerPhase=(this.propellerPhase+dt*42*this.rpm)%(Math.PI*2);}
 arrivalProgress(q,path,duration){
  const end=Math.min(1,this.flightSpeed*duration/Math.max(1,Math.hypot(path.dx,path.dy)));
  return (-2*q*q*q+3*q*q)+.65*(q*q*q-2*q*q+q)+end*(q*q*q-q*q);
 }
 beginCrash(){
  if(this.crash)return;
  const damage=side=>[...this.parts.values()].filter(p=>Math.sign(p.localX)===side).reduce((n,p)=>n+1-clamp(p.hp/p.maxHp,0,1),0);
  this.crash={x:this.x,y:this.y,a:this.a,rpm:this.rpm,speed:Math.max(38,this.flightSpeed),side:damage(-1)>damage(1)?-1:1,age:0};
  for(const s of Object.values(this.turretStates)){s.warningLeft=0;s.flash=0;s.recoil=0;}
  this.cancelAll();
 }
 updateCrash(dt,age,duration){
  this.beginCrash();const c=this.crash,q=clamp(age/duration,0,1),old=c.age;c.age=age;
  // A damaged-wing turn builds gradually; forward travel never stops at HP zero.
  this.a=c.a+c.side*(.10*age+.11*age*age);
  const mid=c.a+c.side*(.10*(old+age)/2+.11*((old+age)/2)**2),speed=c.speed*(1+.28*q);
  this.x+=Math.cos(mid)*speed*(age-old);this.y+=Math.sin(mid)*speed*(age-old)+24*q*(age-old);
  this.rpm=c.rpm*Math.exp(-1.35*age);
  this.propellerPhase=(this.propellerPhase+42*c.rpm*(Math.exp(-1.35*old)-Math.exp(-1.35*age))/1.35)%(Math.PI*2);
  this.defeatAge=age;this.defeatProgress=q;this.rotateParts();
  for(const b of this.visualBombs)b.age+=dt;this.visualBombs=this.visualBombs.filter(b=>b.age<b.maxlife);
 }
 hit(h){const r=super.hit(h);if(r.bodyDefeated)this.cancelAll();return r;}
 onPartDestroyed(p){this.cancelPart(p.id);if(this.turretStates[p.id])this.turretStates[p.id].warningLeft=0;
  if(p.kind==='payload'&&!this.alivePart('rack-left')&&!this.alivePart('rack-right')&&this.phase.startsWith('bomb'))this.setPhase('recovery');
  const weapons=['gun-left','gun-right','rack-left','rack-right'].some(id=>this.alivePart(id));
  if((!this.engines()&&!this.alivePart('rudder'))||!weapons){this.finishClock??=5;this.setPhase('exposed');this.cancelAll();}
 }
 setPhase(phase){if(this.phase===phase)return;if(phase==='defence')for(const id of ['rack-left','rack-right'])this.rackAmmo[id]=this.alivePart(id)?2:0;this.phase=phase;this.phaseClock=0;this.command('phase-change',{phase:'rii-'+phase});}
 counterWindow(){return ['recovery','exposed'].includes(this.phase)?1.4:super.counterWindow();}
 hurry(){if(this.phase==='defence')this.phaseClock=Math.max(this.phaseClock,5.7);return 'rii-cycle';}
 gunMuzzle(id,angle=this.turretStates[id]?.angle??this.a){const p=this.parts.get(id),length=this.layout.gunBarrelLength*this.geometryScale;return{x:this.x+p.x+Math.cos(angle)*length,y:this.y+p.y+Math.sin(angle)*length,offsetX:Math.cos(angle)*length,offsetY:Math.sin(angle)*length};}
 gunSolution(id,target){const p=this.parts.get(id),arc=RII_WEAPON_ARCS[id];if(!p||p.destroyed||!target)return null;const x=this.x+p.x,y=this.y+p.y,current=Math.atan2(target.y-y,target.x-x),off=wrap(current-this.a-arc.offset);if(Math.abs(off)>arc.half)return null;
  // Predict once at warning admission, never chase the player after commitment.
  // Include the wind-up and middle of the sweep; retain the mount's safe sectors.
  const vx=Number.isFinite(target.vx)?target.vx:0,vy=Number.isFinite(target.vy)?target.vy:0;
  const mx=x+Math.cos(this.a)*this.flightSpeed*1.03,my=y+Math.sin(this.a)*this.flightSpeed*1.03;let travel=Math.min(1.4,Math.hypot(target.x-mx,target.y-my)/this.t.bulletSpeed);
  for(let i=0;i<3;i++)travel=Math.min(1.4,Math.hypot(target.x+vx*(1.03+travel)-mx,target.y+vy*(1.03+travel)-my)/this.t.bulletSpeed);
  const aim=Math.atan2(target.y+vy*(1.03+travel)-my,target.x+vx*(1.03+travel)-mx),angle=this.a+arc.offset+clamp(wrap(aim-this.a-arc.offset),-arc.half+.14,arc.half-.14);
  return{x,y,angle,targetId:target.id};
 }
 updateGuns(dt,players,bounds){
  this.gunCadence=Math.max(0,this.gunCadence-dt);
  const ids=[this.nextGun,this.nextGun==='gun-left'?'gun-right':'gun-left'];
  for(const id of ids){const s=this.turretStates[id];s.cooldown=Math.max(0,s.cooldown-dt);s.warningLeft=Math.max(0,s.warningLeft-dt);if(!this.alivePart(id)||this.phase==='bomb-run'||this.phase==='recovery'||this.phase==='exposed')continue;
   if(s.warningLeft>0)continue;const solution=players.map(p=>this.gunSolution(id,p)).find(Boolean);if(!solution)continue;
   s.angle+=clamp(wrap(solution.angle-s.angle),-.9*dt,.9*dt);const arc=RII_WEAPON_ARCS[id];s.angle=this.a+arc.offset+clamp(wrap(s.angle-this.a-arc.offset),-arc.half,arc.half);
   if(s.cooldown>0||this.gunCadence>0||Math.abs(wrap(solution.angle-s.angle))>.12)continue;
   if(bounds&&(solution.x<bounds.left||solution.x>bounds.right||solution.y<bounds.top||solution.y>bounds.bottom))continue;
   s.warningLeft=1.31;s.cooldown=3.5;this.gunCadence=1.65;this.nextGun=id==='gun-left'?'gun-right':'gun-left';
   const centre=this.a+arc.offset+clamp(wrap(s.angle-this.a-arc.offset),-arc.half+.14,arc.half-.14),direction=id==='gun-left'?1:-1;
   // Both edges advertise the committed sweep. Keep the existing per-hit
   // damage: splitting it across more rounds would weaken hits under i-frames.
   for(const offset of [-.14,.14]){const angle=centre+offset,m=this.gunMuzzle(id,angle);this.command('charge-warning',{partId:id,seconds:.75,angle,x:m.x,y:m.y,targetX:m.x+Math.cos(angle)*this.t.bulletSpeed*2.2,targetY:m.y+Math.sin(angle)*this.t.bulletSpeed*2.2});}
   for(let i=0;i<5;i++){const angle=centre+direction*(i-2)*.07,speed=this.t.bulletSpeed,m=this.gunMuzzle(id,angle);this.command('hazard',{kind:'projectile',x:m.x,y:m.y,sourceOffsetX:m.offsetX,sourceOffsetY:m.offsetY,sourcePartId:id,tag:this.id+':'+id,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,radius:4,warning:.75,delay:i*.14,duration:2.2,damage:this.t.damage*.55,angle,targetId:solution.targetId,visual:'rviii-gun',lockedAim:true});}
  }}
 dropBomb(){const ids=['rack-left','rack-right'],id=ids[this.dropIndex%2],p=this.parts.get(id);this.dropIndex++;if(!p||p.destroyed)return;this.rackAmmo[id]=Math.max(0,this.rackAmmo[id]-1);
  const x=this.x+p.x+Math.cos(this.a)*this.flightSpeed*.6,y=this.y+p.y+Math.sin(this.a)*this.flightSpeed*.6;
  this.visualBombs.push({id:++this.visualBombSerial,rack:id,age:0,maxlife:1.6,x:this.x+p.x,y:this.y+p.y,targetX:x,targetY:y,angle:this.a});
  this.command('hazard',{kind:'circle',x,y,sourceX:this.x+p.x,sourceY:this.y+p.y,sourcePartId:id,tag:this.id+':'+id,warning:1.6,duration:.3,radius:32,once:true,damage:this.t.damage*.8,airborneBomb:true,visual:'rviii-bomb',groundOnlyInterpretation:true});
 }
 update(dt,{players=[],bounds,paused=false}={}){if(this.dead||paused||!(dt>0)||!Number.isFinite(dt))return;let left=Math.min(dt,1);while(left>1e-8){const step=Math.min(.025,left);left-=step;this.advance(step,players.filter(p=>p.alive!==false&&p.hp!==0),bounds);}}
 advance(dt,players,bounds){for(const s of Object.values(this.turretStates)){s.recoil=Math.max(0,s.recoil-30*dt);s.flash=Math.max(0,s.flash-dt);}for(const b of this.visualBombs)b.age+=dt;this.visualBombs=this.visualBombs.filter(b=>b.age<b.maxlife);this.phaseClock+=dt;const ratio=this.driveRatio();this.rpm+=clamp(this.engineRatio()-this.rpm,-.4*dt,.4*dt);this.propellerPhase=(this.propellerPhase+dt*42*this.rpm)%(Math.PI*2);
  const mobile=bounds&&bounds.right-bounds.left<650,targetSpeed=(this.flightControl?.speed??(mobile?48:78))*ratio;this.flightSpeed+=clamp(targetSpeed-this.flightSpeed,-85*dt,85*dt);
  let heading=this.flightControl?.heading??this.a;if(this.phase==='bomb-run')heading=this.bombHeading;else if(bounds&&!this.flightControl){const cx=(bounds.left+bounds.right)/2,cy=(bounds.top+bounds.bottom)/2;const dx=this.x-cx,dy=this.y-cy,edge=Math.abs(dx)>(bounds.right-bounds.left)*.26||Math.abs(dy)>(bounds.bottom-bounds.top)*.28;heading=edge?Math.atan2(-dy,-dx):this.a+(this.cycle%2?-.35:.35);}
  const rudder=this.parts.get('rudder'),rudderRatio=.38+.62*clamp(rudder.hp/rudder.maxHp,0,1),turn=(this.flightControl?.turnRate??.65)*ratio*rudderRatio;if(Object.values(this.turretStates).some(s=>s.warningLeft>0))heading=this.a;const yawStep=clamp(wrap(heading-this.a),-turn*dt,turn*dt);this.a+=yawStep;if(this.flightControl)for(const s of Object.values(this.turretStates))s.angle+=yawStep;this.x+=Math.cos(this.a)*this.flightSpeed*dt;this.y+=Math.sin(this.a)*this.flightSpeed*dt;this.rotateParts();
  if(this.finishClock!=null){this.finishClock-=dt;if(this.finishClock<=0&&!this.dead)this.hit({damage:this.hp});return;}
  this.updateGuns(dt,players,bounds);
  if(this.phase==='defence'&&this.phaseClock>=6){this.setPhase('bomb-prepare');this.command('charge-warning',{partId:this.alivePart('rack-left')?'rack-left':'rack-right',seconds:1.8,angle:this.a,x:this.x,y:this.y,targetX:this.x+Math.cos(this.a)*this.flightSpeed*2,targetY:this.y+Math.sin(this.a)*this.flightSpeed*2});}
  else if(this.phase==='bomb-prepare'&&this.phaseClock>=1.8&&(!this.flightControl||Math.abs(wrap(this.flightControl.heading-this.a))<.35)){this.bombHeading=this.a;this.dropClock=0;this.dropIndex=0;this.setPhase('bomb-run');}
  else if(this.phase==='bomb-run'){this.dropClock-=dt;if(this.dropClock<=0&&this.dropIndex<4){this.dropBomb();this.dropClock=.65+(1-ratio)*.4;}if(this.phaseClock>=3.2)this.setPhase('recovery');}
  else if(this.phase==='recovery'&&this.phaseClock>=3.2){this.cycle++;this.setPhase('defence');}
 }
}
