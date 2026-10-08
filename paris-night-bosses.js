import {broadsideBreak,shellMarch} from './boss-raid-strikes.js?v=raid2&rail=19';
import {fireFanSalvo} from './boss-salvo-geometry.js';
import {BaseBoss, BossPart} from './headon-stageboss-core.js?v=raid2';

// These mounts are also the sprite atlas contract: source art faces north.
export const PARIS_FORTRESS_PARTS = Object.freeze([
  {id:'light-nw',x:-350,y:-210,radius:51,kind:'searchlight'},
  {id:'light-ne',x:350,y:-210,radius:51,kind:'searchlight'},
  {id:'light-sw',x:-350,y:120,radius:51,kind:'searchlight'},
  {id:'light-se',x:350,y:120,radius:51,kind:'searchlight'},
  {id:'light-main',x:0,y:-135,radius:64,kind:'searchlight'},
  {id:'generator-left',x:-175,y:-35,radius:52,kind:'power'},
  {id:'generator-right',x:175,y:-35,radius:52,kind:'power'},
  {id:'aa-left',x:-486,y:-220,radius:46,kind:'gun'},
  {id:'aa-right',x:486,y:-220,radius:46,kind:'gun'},
  {id:'mg-left',x:-510,y:35,radius:32,kind:'gun'},
  {id:'mg-right',x:510,y:35,radius:32,kind:'gun'},
  {id:'command',x:0,y:190,radius:55,kind:'command'}
].map(Object.freeze));
export const PARIS_STAAKEN_PARTS = Object.freeze([
  {id:'engine-0',x:-279,y:-142,radius:35,kind:'engine'},
  {id:'engine-1',x:-147,y:-142,radius:35,kind:'engine'},
  {id:'engine-2',x:149,y:-142,radius:35,kind:'engine'},
  {id:'engine-3',x:283,y:-142,radius:35,kind:'engine'},
  {id:'gun-front',x:2,y:-218,radius:26,kind:'gun'},
  {id:'gun-top',x:2,y:-75,radius:27,kind:'gun'},
  {id:'gun-rear',x:2,y:148,radius:26,kind:'gun'},
  {id:'gun-left',x:-49,y:-7,radius:18,kind:'gun'},
  {id:'gun-right',x:52,y:-7,radius:18,kind:'gun'},
  {id:'bomb-bay-left',x:-81,y:-3,radius:30,kind:'payload'},
  {id:'bomb-bay-right',x:82,y:-3,radius:30,kind:'payload'}
].map(Object.freeze));
// Source-art coordinates are shared by intact/wreck clips and hit testing.
export const PARIS_FORTRESS_LAYOUT=Object.freeze({width:1180,height:879,core:Object.freeze({x:0,y:190,radius:55}),parts:PARIS_FORTRESS_PARTS});
export const PARIS_STAAKEN_LAYOUT=Object.freeze({width:1120,height:630,core:Object.freeze({x:2,y:30,radius:45}),parts:PARIS_STAAKEN_PARTS,
  hull:Object.freeze([{x:0,y:-132,width:1120,height:156},{x:0,y:-5,width:1050,height:90},{x:2,y:-5,width:90,height:530},{x:2,y:228,width:396,height:90}].map(Object.freeze))});
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const live=players=>(players||[]).filter(p=>p.alive);

class ParisBoss extends BaseBoss {
  constructor({tuning,kind,layout,faction,...base}) {
    for(const key of ['maxHp','partHp','damage','bulletSpeed'])if(!Number.isFinite(tuning?.[key])||tuning[key]<=0)throw new Error('Current boss tuning required: '+key);
    const scale=tuning.geometryScale||1;
    const parts=layout.parts;
    super({...base,coreRadius:base.coreRadius*scale,maxHp:tuning.maxHp,parts:parts.map(p=>new BossPart({...p,maxHp:tuning.partHp,...tuning.parts?.[p.id],x:p.x*scale,y:p.y*scale,radius:p.radius*scale}))});
    this.t=tuning;this.kind=kind;this.layout=layout;this.faction=faction;this.ownsMotion129=true;
    this.coreLocalX=(layout.core?.x||0)*scale;this.coreLocalY=(layout.core?.y||0)*scale;
    for(const p of this.parts.values()){p.localX=p.x;p.localY=p.y;}
  }
  command(type,spec={}){this.emit({...spec,type,bossId:this.id,faction:this.faction});}
  hazard(kind,spec){this.command('hazard',{kind,damage:this.t.damage,warning:kind==='projectile'?0:.9,duration:kind==='projectile'?4:.4,...spec});}
  fan(part,target,count,spread,tag,damage=this.t.damage*.65,speedMultiplier=1){
    if(part.destroyed)return;
    const x=this.x+part.x,y=this.y+part.y,a=Math.atan2(target.y-y,target.x-x);
    this.command('muzzle',{x,y,partId:part.id});
    count=Math.max(1,Math.ceil(count*(this.t.projectileDensity??1)));
    for(let i=0;i<count;i++){const h=a+(count===1?0:(i/(count-1)-.5)*spread),speed=this.t.bulletSpeed*speedMultiplier;
      this.hazard('projectile',{x,y,vx:Math.cos(h)*speed,vy:Math.sin(h)*speed,radius:4,damage,visual:'staaken-mg',tag});}
  }
  nearestPart({x,y,radius=0}){
    let nearest=null,distance=Infinity;
    for(const p of this.parts.values()){
      if(!p.hittable||p.destroyed)continue;
      const d=Math.hypot(x-this.x-p.x,y-this.y-p.y);
      if(d<=p.radius+radius&&(d<distance||d===distance&&p.id<(nearest?.id||''))){nearest=p;distance=d;}
    }
    return nearest?{partId:nearest.id}:null;
  }
  coreOffset(){return{x:this.coreLocalX,y:this.coreLocalY};}
  locateHit(attack){
    const part=this.nearestPart(attack);if(part)return part;
    const c=this.coreOffset();return this.coreVulnerable&&Math.hypot(attack.x-this.x-c.x,attack.y-this.y-c.y)<=this.coreRadius+(attack.radius||0)?{partId:null}:null;
  }
  hitAt(attack){const route=this.locateHit(attack);return route?this.hit({...route,damage:attack.damage}):{damage:0,miss:true};}
  suppressive(){} // Every attack belongs to a visible mount or the rhythm.
}

export class ParisSearchlightFortress extends ParisBoss {
  constructor(options){
    const layout=options.layout||options.tuning.layout||PARIS_FORTRESS_LAYOUT;
    super({...options,kind:'paris-searchlight-fortress',layout,coreRadius:options.tuning.coreRadius||layout.core.radius});
    this.phase='scan';this.coreVulnerable=false;this.rhythmTime=0;this.rhythmBeat=0;this.rhythmCycle=0;
    this.locks=new Map();this.routeBearings=new Map();this.targetCursor=0;
  }
  livePart(id){return !this.parts.get(id).destroyed;}
  generators(){return ['generator-left','generator-right'].filter(id=>this.livePart(id)).length;}
  functioningLights(){return [...this.parts.values()].filter(p=>p.kind==='searchlight'&&!p.destroyed&&(p.id!=='light-main'||this.generators()>0)).length;}
  openingSeconds(){return [4.8,3.8,2.8][this.generators()];}
  warningSeconds(){return 1.15;}
  beatSeconds(){return this.warningSeconds()+this.activeSeconds()+.15;}
  activeSeconds(){return this.generators()===2?1.6:1.4;}
  scanSeconds(){return this.beatSeconds()*3+this.warningSeconds()+this.activeSeconds()+2;}
  startOpening(){
    if(this.phase==='last-stand')return;
    this.phase='cooldown';this.rhythmTime=0;this.coreVulnerable=true;this.locks.clear();this.routeBearings.clear();
    for(const p of this.parts.values())if(p.kind==='searchlight')this.command('cancel-hazards',{tag:this.id+':'+p.id});
    this.command('cancel-hazards',{tag:this.id+':focus'});
    this.command('phase-change',{phase:'cooldown',seconds:this.openingSeconds()});
  }
  startLastStand(){
    this.phase='last-stand';this.coreVulnerable=true;this.rhythmTime=0;this.locks.clear();this.routeBearings.clear();
    this.lastStandSlot=0;this.lastStandIn=.35;
    for(const p of this.parts.values())if(p.kind==='searchlight')this.command('cancel-hazards',{tag:this.id+':'+p.id});
    this.command('cancel-hazards',{tag:this.id+':focus'});
    this.command('phase-change',{phase:'last-stand'});
  }
  onPartDestroyed(p){
    this.command('cancel-hazards',{tag:this.id+':'+p.id});
    if(!this.functioningLights()){
      if(this.phase!=='last-stand')this.startLastStand();
      return;
    }
    if(p.id.startsWith('generator-')&&!this.generators()&&this.phase!=='last-stand'){
      this.command('cancel-hazards',{tag:this.id+':light-main'});this.startOpening();
    }
  }
  hit(attack){
    const multiplier=!attack.partId&&['cooldown','last-stand'].includes(this.phase)?1.7:1;
    return super.hit({...attack,damage:attack.damage*multiplier});
  }
  corridorOffset(target,mount,escape,direction,halfAngle){
    if(!target)return 0;
    const want=Math.atan2(escape.y,escape.x),aim=Math.atan2(target.y-mount.y,target.x-mount.x);
    let heading=Number.isFinite(target.a)?target.a:Math.hypot(target.vx||0,target.vy||0)>1?Math.atan2(target.vy,target.vx):Math.atan2(this.y-target.y,this.x-target.x);
    let x=target.x,y=target.y,offset=0;
    // Keep a real DrI route clear while it turns, not an instantaneous strafe.
    // This only positions the warned sector; active beams never track it.
    const dt=.025,speed=this.t.escapeSpeed||120,turn=this.t.escapeTurnRate||3.8;
    for(let time=dt;time<=this.warningSeconds()+this.activeSeconds()+dt/2;time+=dt){
      heading+=clamp(wrap(want-heading),-turn*dt,turn*dt);x+=Math.cos(heading)*speed*dt;y+=Math.sin(heading)*speed*dt;
      if(time>=this.warningSeconds())offset=Math.max(offset,direction*wrap(Math.atan2(y-mount.y,x-mount.x)-aim)-.42*(time-this.warningSeconds())+halfAngle+.025);
    }
    return offset;
  }
  beam(id,target,escape,bounds){
    if(!this.livePart(id)||id==='light-main'&&!this.generators())return;
    const p=this.parts.get(id),x=this.x+p.x,y=this.y+p.y;
    // Fix the approach bearing during the readable warning. Every quadrant
    // is searched; flying behind the fortress never disables its mechanics.
    const aim=target?Math.atan2(target.y-y,target.x-x):this.rhythmCycle*Math.PI/2+this.rhythmBeat*Math.PI/2;
    // Paired lamps share one world-space escape corridor. Their angular
    // directions may differ at opposite mounts, but both sweep away from
    // the same route. Never aim again during this warning/active beat.
    const cross=target?(target.x-x)*escape.y-(target.y-y)*escape.x:1;
    const direction=cross>=0?-1:1,halfAngle=id==='light-main'?.12:.10;
    const angle=aim+direction*this.corridorOffset(target,{x,y},escape,direction,halfAngle);
    p.angle=angle;
    this.hazard('searchlight',{x,y,angle,angularSpeed:direction*.42,halfAngle,
      radius:Math.max(1400,Math.hypot(bounds.right-bounds.left,bounds.bottom-bounds.top),target?Math.hypot(target.x-x,target.y-y)+160:0),warning:this.warningSeconds(),
      duration:this.activeSeconds(),damage:0,tickInterval:.1,visual:'searchlight',tag:this.id+':'+id});
  }
  beat(bounds,players){
    const reverse=this.rhythmCycle%2?-1:1,beat=this.rhythmBeat++,targets=live(players);
    const ids=[['light-nw','light-se'],['light-ne','light-sw'],['light-nw','light-ne'],['light-main','light-sw','light-se']][beat];
    const routes=targets.map(target=>{
      if(!this.routeBearings.has(target.id))this.routeBearings.set(target.id,Math.atan2(target.y-this.y,target.x-this.x));
      // A quarter-turn each beat returns the player toward the command post,
      // rather than pushing the approach farther from the attack window.
      const angle=this.routeBearings.get(target.id)+reverse*(Math.PI*.75+beat*Math.PI/2);
      return{targetId:target.id,angle,x:Math.cos(angle),y:Math.sin(angle)};
    });
    for(let i=0;i<ids.length;i++){
      const target=targets.length?targets[(this.targetCursor+i)%targets.length]:null;
      const escape=routes.find(r=>r.targetId===target?.id)||{x:0,y:reverse};
      this.beam(ids[i],target,escape,bounds);
    }
    if(beat===3)for(const id of ['aa-left','aa-right']){const gun=this.parts.get(id),target=targets[this.targetCursor%Math.max(1,targets.length)];if(!gun.destroyed&&target)broadsideBreak(this,{source:{x:this.x+gun.x,y:this.y+gun.y},partId:id,target,visual:'staaken-mg',tag:this.id+':focus',warning:1.2,beats:2,beat:.6,spread:1.5,speed:340});}
    this.targetCursor++;
    this.command('paris-light-beat',{beat,cycle:this.rhythmCycle,seconds:this.beatSeconds(),orbitDirection:reverse,safeRoutes:routes.map(({targetId,angle})=>({targetId,angle}))});
  }
  focus(record){
    const tracking=this.livePart('command')?.22:.06,lead=Math.min(1.2,record.unseen+tracking);
    const target={x:record.x+record.vx*lead,y:record.y+record.vy*lead};
    for(const id of ['aa-left','aa-right'])if(this.livePart(id)){
      const gun=this.parts.get(id),count=this.livePart('command')?3:2;
      this.command('muzzle',{x:this.x+gun.x,y:this.y+gun.y,partId:id});
      for(let i=0;i<count;i++)this.hazard('circle',{x:target.x+(i-(count-1)/2)*34,y:target.y+(i%2)*25,delay:i*.07,radius:38,
        warning:this.livePart('command')?.5:.65,duration:.3,once:true,damage:this.t.damage*1.4,visual:'black-flak',sourceX:this.x+gun.x,sourceY:this.y+gun.y,tag:this.id+':focus'});
    }
    for(const id of ['mg-left','mg-right'])this.fan(this.parts.get(id),target,this.livePart('command')?6:3,.33,this.id+':focus',this.t.damage*.8,1.25);
    this.command('paris-light-lock',{targetId:record.id,seconds:record.remaining,x:target.x,y:target.y});
  }
  lastStand(dt,players){
    const targets=live(players);if(!targets.length)return;
    this.lastStandIn-=dt;if(this.lastStandIn>0)return;
    // Keep destroyed mounts' empty slots: each removed weapon opens a real
    // gap in the four-step battery, rather than accelerating survivors.
    const slot=this.lastStandSlot++,id=['aa-left','mg-left','aa-right','mg-right'][slot%4];
    this.lastStandIn=slot%4===3?3.4:.8;if(!this.livePart(id))return;
    const gun=this.parts.get(id),target=targets[(slot+Math.floor(slot/4))%targets.length];
    const x=this.x+gun.x,y=this.y+gun.y,tag=this.id+':'+id;
    this.command('muzzle',{x,y,partId:id});
    if(id.startsWith('aa-')){
      // Two locked, sequential impacts can be escaped at normal flight
      // speed. No light exposure prediction or continued player tracking.
      for(let i=0;i<2;i++)this.hazard('circle',{x:target.x+(i?42:0),y:target.y,delay:i*.3,radius:32,warning:.8,duration:.25,
        once:true,damage:this.t.damage*.65,visual:'aa-flak',sourceX:x,sourceY:y,partId:id,targetId:target.id,tag});
    }else{
      const aim=Math.atan2(target.y-y,target.x-x),count=clamp(Math.ceil(3*(this.t.projectileDensity??1)),1,3),speed=this.t.bulletSpeed*.85;
      for(let i=0;i<count;i++){
        const angle=aim+(count===1?0:(i/(count-1)-.5)*.38);
        this.hazard('projectile',{x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,radius:4,warning:.65,duration:3.2,
          damage:this.t.damage*.45,visual:'staaken-mg',sourceX:x,sourceY:y,partId:id,targetId:target.id,tag});
      }
    }
  }
  update(dt,{players=[],bounds,isIlluminated,paused=false}){
    if(this.dead||paused||dt<=0)return;
    if(!this.functioningLights()&&this.phase!=='last-stand')this.startLastStand();
    if(this.phase==='last-stand'){this.lastStand(dt,players);return;}
    this.rhythmTime+=dt;
    if(this.phase==='cooldown'){
      if(this.rhythmTime>=this.openingSeconds()&&this.functioningLights()){
        this.phase='scan';this.rhythmTime=0;this.rhythmBeat=0;this.rhythmCycle++;this.coreVulnerable=false;
      }
      return;
    }
    while(this.rhythmBeat<4&&this.rhythmTime>=this.rhythmBeat*this.beatSeconds())this.beat(bounds,players);
    if(this.rhythmTime>=this.scanSeconds()){this.startOpening();return;}
    const targets=live(players),present=new Set(targets.map(p=>p.id));
    for(const key of this.locks.keys())if(!present.has(key))this.locks.delete(key);
    for(const p of targets){
      let record=this.locks.get(p.id);
      if(isIlluminated?.(p)){
        record??={id:p.id,fireIn:0};Object.assign(record,{x:p.x,y:p.y,vx:p.vx||0,vy:p.vy||0,remaining:2,unseen:0});this.locks.set(p.id,record);
      }else if(record){record.remaining-=dt;record.unseen+=dt;}
      if(!record)continue;
      if(record.remaining<=0){this.locks.delete(p.id);continue;}
      record.fireIn-=dt;if(record.fireIn<=0){
        this.focus(record);record.fireIn=this.livePart('command')?.4:.65;
      }
    }
  }
}

export class ParisStaakenRVI extends ParisBoss {
  constructor(options){
    const layout=options.layout||options.tuning.layout||PARIS_STAAKEN_LAYOUT;
    super({...options,kind:'paris-staaken-rvi',layout,coreRadius:options.tuning.coreRadius||layout.core.radius});
    this.phase='approach';this.coreVulnerable=false;this.a=Math.PI/2;this.hullYaw=0;
    this.anchorX=this.x;this.anchorY=this.y;this.raidWait=2;this.raidSerial=0;this.runRemaining=0;this.armingWork=0;this.currentSpeed=105;this.glideAge=0;
    this.rotateMounts();
  }
  engines(){return [...this.parts.values()].filter(p=>p.kind==='engine'&&!p.destroyed).length;}
  bays(){return ['bomb-bay-left','bomb-bay-right'].map(id=>this.parts.get(id));}
  payloadStrength(){return this.bays().reduce((n,p)=>n+Math.max(0,p.hp)/p.maxHp,0)/2;}
  speedRatio(){return [.26,.43,.62,.8,1][this.engines()];}
  rotateMounts(){const a=this.a+Math.PI/2,c=Math.cos(a),s=Math.sin(a);
    for(const p of this.parts.values()){p.x=p.localX*c-p.localY*s;p.y=p.localX*s+p.localY*c;p.angle=a;}}
  coreOffset(){const a=this.a+Math.PI/2,c=Math.cos(a),s=Math.sin(a);return{x:this.coreLocalX*c-this.coreLocalY*s,y:this.coreLocalX*s+this.coreLocalY*c};}
  abortRun(){if(this.runTarget)this.command('city-bomb-abort',{runId:this.runId});this.runTarget=null;this.runRemaining=0;this.armingWork=0;}
  updateRunEstimate(){
    // runRemaining is nominal-engine flight work, so dividing by speedRatio
    // gives seconds. A distant district can never show a zero-second drop
    // while the aircraft still has a long approach to fly.
    const distance=Math.max(0,Math.hypot(this.runTarget.x-this.x,this.runTarget.y-this.y)-210);
    this.runRemaining=Math.max(this.armingWork,distance/105);
  }
  onPartDestroyed(p){
    this.command('cancel-hazards',{tag:this.id+':'+p.id});
    if(p.kind==='payload'){
      this.command('city-bomb-rack-abort',{rackId:p.id,partId:p.id,sourceBossId:this.id});
      if(!this.payloadStrength()){this.abortRun();this.phase='payload-lost';this.coreVulnerable=true;}
      else this.phase='payload-damaged';
    }
    if(p.kind==='engine'){
      this.coreVulnerable=this.engines()<=2||!this.payloadStrength();
      if(!this.engines()){this.abortRun();this.phase='gliding';this.glideAge=0;this.coreVulnerable=true;}
    }
    this.command('phase-change',{phase:this.phase,partId:p.id});
  }
  hit(attack){const bay=this.parts.get(attack.partId),before=bay?.hp,result=super.hit(attack);
    if(bay?.kind==='payload'&&this.runTarget&&bay.hp<before)this.command('paris-bomb-weakened',{runId:this.runId,rackId:bay.id,strength:this.payloadStrength()});
    return result;
  }
  locateHit(attack){
    const partHit=super.locateHit(attack);if(partHit)return partHit;
    if(!this.coreVulnerable)return null;
    const a=this.a+Math.PI/2,c=Math.cos(a),s=Math.sin(a),dx=attack.x-this.x,dy=attack.y-this.y,x=dx*c+dy*s,y=-dx*s+dy*c,r=attack.radius||0;
    const scale=this.t.geometryScale||1;
    return (this.layout.hull||PARIS_STAAKEN_LAYOUT.hull).some(h=>Math.abs(x-h.x*scale)<=h.width*scale/2+r&&Math.abs(y-h.y*scale)<=h.height*scale/2+r)?{partId:null}:null;
  }
  fly(dt,tx,ty){
    const left=['engine-0','engine-1'].filter(id=>this.parts.get(id).destroyed).length,right=['engine-2','engine-3'].filter(id=>this.parts.get(id).destroyed).length;
    const asymmetry=(left-right)*.11,want=Math.atan2(ty-this.y,tx-this.x),change=wrap(want-this.a);
    this.hullYaw=asymmetry+Math.sin((this.motionTime||0)*1.8)*Math.abs(left-right)*.045;
    this.a+=clamp(change,-dt*.85,dt*.85)+this.hullYaw*dt;
    this.currentSpeed=105*this.speedRatio();this.x+=Math.cos(this.a)*this.currentSpeed*dt;this.y+=Math.sin(this.a)*this.currentSpeed*dt;this.rotateMounts();
  }
  gunfire(dt,players){
    const arcs={'gun-front':[0,.66,750],'gun-top':[0,1.72,510],'gun-rear':[Math.PI,.8,660],'gun-left':[-Math.PI/2,.7,620],'gun-right':[Math.PI/2,.7,620]};
    for(const [id,[axis,width,range]] of Object.entries(arcs)){
      const gun=this.parts.get(id);if(gun.destroyed||!this.due(id,dt,this.phase==='regroup'?5.8:4.6))continue;
      const p=live(players).find(p=>Math.hypot(p.x-this.x,p.y-this.y)<range&&Math.abs(wrap(Math.atan2(p.y-this.y,p.x-this.x)-this.a-axis))<width);
      if(p){const x=this.x+gun.x,y=this.y+gun.y;broadsideBreak(this,{source:{x,y},partId:id,target:p,visual:'staaken-mg',tag:this.id+':'+id,spread:1.45,beats:3,beat:.5,warning:1.1,speed:330});}
    }
  }
  update(dt,{players=[],bounds,parisTargets=[]}){
    if(this.dead)return;
    const engines=this.engines(),payload=this.payloadStrength();
    if(!engines){
      this.glideAge+=dt;this.currentSpeed=105*this.speedRatio();this.x+=Math.cos(this.a)*this.currentSpeed*dt;this.y+=Math.sin(this.a)*this.currentSpeed*dt;
      if(this.glideAge>=6){super.hit({damage:this.hp});return;}
    }else{
      this.raidWait-=dt;
      const targets=parisTargets.filter(t=>t.hp>0);
      if(!this.runTarget&&payload>0&&this.raidWait<=0&&targets.length){
        this.runTarget=targets[this.raidSerial%targets.length];this.runId=this.id+':run:'+this.raidSerial++;
        this.armingWork=8;this.updateRunEstimate();this.phase='bombing-run';
        this.command('city-bomb-warning',{runId:this.runId,targetId:this.runTarget.id,x:this.runTarget.x,y:this.runTarget.y,seconds:this.runRemaining/this.speedRatio()});
      }
      if(this.runTarget){
        const target=this.runTarget;
        if(target.hp<=0){this.abortRun();this.raidWait=1;}
        else{
          this.armingWork=Math.max(0,this.armingWork-dt*this.speedRatio());this.fly(dt,target.x,target.y);this.updateRunEstimate();
          if(this.runRemaining<=0&&Math.hypot(target.x-this.x,target.y-this.y)<210){
            for(const bay of this.bays())if(!bay.destroyed){
              const strength=bay.hp/bay.maxHp,damage=Math.max(1,Math.round(16*strength)),side=bay.id.endsWith('left')?-1:1;
              this.command('city-bomb',{runId:this.runId,rackId:bay.id,partId:bay.id,targetId:target.id,x:target.x,y:target.y,seconds:1.3,damage});
              const sourceX=this.x+bay.x,sourceY=this.y+bay.y;
              for(let i=0;i<Math.ceil(2*strength);i++)this.hazard('circle',{x:target.x+side*(32+i*45),y:target.y+i*35,radius:39,delay:i*.17,
                warning:1.3,duration:.35,once:true,damage:this.t.damage*strength,visual:'carpet-bomb',airborneBomb:true,sourceX,sourceY,tag:this.id+':'+bay.id});
            }
            this.runTarget=null;this.runRemaining=0;this.phase='regroup';this.raidWait=5+(4-engines)*1.5;
            // Below 40% the crew dumps the remaining racks on the pilot as it
            // turns away: a warned march from the bays behind the bomber.
            const pilot=live(players)[0];if(pilot&&this.hp<=this.maxHp*.4){const bay=this.bays().find(b=>!b.destroyed);if(bay){if(!this.lastRaid){this.lastRaid=true;this.command('phase-change',{phase:'staaken-last-raid'});}
              shellMarch(this,{source:{x:this.x+bay.x,y:this.y+bay.y},partId:bay.id,target:pilot,rows:3,radius:48,step:82,beat:.45,warning:1.3,visual:'carpet-bomb',tag:this.id+':last-raid'});}}
          }
        }
      }else{
        const time=(this.motionTime||0)*.24,span=Math.min(160,(bounds.right-bounds.left)*.25);
        this.fly(dt,this.anchorX+Math.cos(time)*span,this.anchorY+130+Math.sin(time)*90);
      }
    }
    this.gunfire(dt,players);
  }
}
