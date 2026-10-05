import {BaseBoss, BossPart} from './headon-stageboss-core.js?v=484';

// These mounts are also the sprite atlas contract: source art faces north.
export const PARIS_FORTRESS_PARTS = Object.freeze([
  {id:'light-nw',x:-143,y:-85,radius:27,kind:'searchlight'},
  {id:'light-ne',x:143,y:-85,radius:27,kind:'searchlight'},
  {id:'light-sw',x:-143,y:92,radius:27,kind:'searchlight'},
  {id:'light-se',x:143,y:92,radius:27,kind:'searchlight'},
  {id:'light-main',x:0,y:-25,radius:31,kind:'searchlight'},
  {id:'generator',x:0,y:71,radius:28,kind:'power'},
  {id:'aa-left',x:-207,y:-20,radius:25,kind:'gun'},
  {id:'aa-right',x:207,y:-20,radius:25,kind:'gun'},
  {id:'mg-left',x:-184,y:127,radius:19,kind:'gun'},
  {id:'mg-right',x:184,y:127,radius:19,kind:'gun'},
  {id:'command',x:0,y:145,radius:27,kind:'command'}
].map(Object.freeze));
export const PARIS_STAAKEN_PARTS = Object.freeze([
  {id:'engine-0',x:-135,y:-83,radius:19,kind:'engine'},
  {id:'engine-1',x:-70,y:-83,radius:19,kind:'engine'},
  {id:'engine-2',x:70,y:-83,radius:19,kind:'engine'},
  {id:'engine-3',x:135,y:-83,radius:19,kind:'engine'},
  {id:'gun-front',x:0,y:-123,radius:14,kind:'gun'},
  {id:'gun-top',x:0,y:-52,radius:16,kind:'gun'},
  {id:'gun-rear',x:0,y:88,radius:14,kind:'gun'},
  {id:'gun-left',x:-31,y:15,radius:14,kind:'gun'},
  {id:'gun-right',x:31,y:15,radius:14,kind:'gun'},
  {id:'bomb-bay',x:0,y:16,radius:23,kind:'payload'}
].map(Object.freeze));
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const live=players=>(players||[]).filter(p=>p.alive);

class ParisBoss extends BaseBoss {
  constructor({tuning,kind,parts,faction,...base}) {
    for(const key of ['maxHp','partHp','damage','bulletSpeed'])if(!Number.isFinite(tuning?.[key])||tuning[key]<=0)throw new Error('Current boss tuning required: '+key);
    const scale=tuning.geometryScale||1;
    super({...base,coreRadius:base.coreRadius*scale,maxHp:tuning.maxHp,parts:parts.map(p=>new BossPart({...p,maxHp:tuning.partHp,...tuning.parts?.[p.id],x:p.x*scale,y:p.y*scale,radius:p.radius*scale}))});
    this.t=tuning;this.kind=kind;this.faction=faction;this.ownsMotion129=true;
    for(const p of this.parts.values()){p.localX=p.x;p.localY=p.y;}
  }
  command(type,spec={}){this.emit({...spec,type,bossId:this.id,faction:this.faction});}
  hazard(kind,spec){this.command('hazard',{kind,damage:this.t.damage,warning:kind==='projectile'?0:.9,duration:kind==='projectile'?4:.4,...spec});}
  fan(part,target,count,spread,tag,damage=this.t.damage*.65){
    if(part.destroyed)return;
    const x=this.x+part.x,y=this.y+part.y,a=Math.atan2(target.y-y,target.x-x);
    this.command('muzzle',{x,y,partId:part.id});
    count=Math.max(1,Math.ceil(count*(this.t.projectileDensity??1)));
    for(let i=0;i<count;i++){const h=a+(count===1?0:(i/(count-1)-.5)*spread),speed=this.t.bulletSpeed;
      this.hazard('projectile',{x,y,vx:Math.cos(h)*speed,vy:Math.sin(h)*speed,radius:4,damage,visual:'staaken-mg',tag});}
  }
  suppressive(){} // Every attack belongs to a visible mount or the rhythm.
}

export class ParisSearchlightFortress extends ParisBoss {
  constructor(options){
    super({...options,kind:'paris-searchlight-fortress',parts:PARIS_FORTRESS_PARTS,coreRadius:options.tuning.coreRadius||53});
    this.phase='scan';this.coreVulnerable=false;this.rhythmTime=0;this.rhythmBeat=0;this.rhythmCycle=0;this.focusClock=0;
    this.lockAges=new Map();
  }
  livePart(id){return !this.parts.get(id).destroyed;}
  startOpening(){
    this.phase='cooldown';this.rhythmTime=0;this.coreVulnerable=true;this.lockAges.clear();
    for(const p of this.parts.values())if(p.kind==='searchlight')this.command('cancel-hazards',{tag:this.id+':'+p.id});
    this.command('cancel-hazards',{tag:this.id+':focus'});
    this.command('phase-change',{phase:'cooldown',seconds:this.livePart('generator')?2.4:4});
  }
  onPartDestroyed(p){
    this.command('cancel-hazards',{tag:this.id+':'+p.id});
    if(p.id==='generator'){
      this.command('cancel-hazards',{tag:this.id+':light-main'});this.startOpening();
    }
    if(p.id==='command')this.coreVulnerable=true;
    if(![...this.parts.values()].some(p=>p.kind==='searchlight'&&!p.destroyed)&&this.phase!=='cooldown')this.startOpening();
  }
  hit(attack){
    const multiplier=!attack.partId&&this.phase==='cooldown'?1.45:1;
    return super.hit({...attack,damage:attack.damage*multiplier});
  }
  beam(id,offset,sweep,bounds){
    if(!this.livePart(id)||id==='light-main'&&!this.livePart('generator'))return;
    const p=this.parts.get(id),angle=Math.PI/2+offset;
    p.angle=angle;
    this.hazard('searchlight',{x:this.x+p.x,y:this.y+p.y,angle,angularSpeed:sweep,halfAngle:id==='light-main'?.11:.105,
      radius:Math.max(620,Math.hypot(bounds.right-bounds.left,bounds.bottom-bounds.top)),warning:.65,
      duration:this.livePart('generator')?.78:.5,damage:0,tickInterval:.15,visual:'searchlight',tag:this.id+':'+id});
  }
  beat(bounds){
    // Crossing diagonals, straight lanes, then a central sweep. The same
    // four-beat phrase repeats, followed by a real weapons-off opening.
    const reverse=this.rhythmCycle%2?-1:1,beat=this.rhythmBeat++;
    if(beat===0){this.beam('light-nw',-.65*reverse,.42*reverse,bounds);this.beam('light-se',.65*reverse,-.42*reverse,bounds);}
    if(beat===1){this.beam('light-ne',.42*reverse,-.35*reverse,bounds);this.beam('light-sw',-.42*reverse,.35*reverse,bounds);}
    if(beat===2){this.beam('light-nw',.12*reverse,-.18*reverse,bounds);this.beam('light-ne',-.12*reverse,.18*reverse,bounds);}
    if(beat===3){this.beam('light-main',-.38*reverse,.8*reverse,bounds);this.beam('light-sw',.55*reverse,-.3*reverse,bounds);this.beam('light-se',-.55*reverse,.3*reverse,bounds);}
    this.command('paris-light-beat',{beat,cycle:this.rhythmCycle,seconds:.9});
  }
  update(dt,{players=[],bounds,isIlluminated}){
    if(this.dead)return;
    this.rhythmTime+=dt;
    if(this.phase==='cooldown'){
      if(this.rhythmTime>=(this.livePart('generator')?2.4:4)&&[...this.parts.values()].some(p=>p.kind==='searchlight'&&!p.destroyed)){
        this.phase='scan';this.rhythmTime=0;this.rhythmBeat=0;this.rhythmCycle++;this.coreVulnerable=!this.livePart('command');
      }
      return;
    }
    while(this.rhythmBeat<4&&this.rhythmTime>=this.rhythmBeat*.9)this.beat(bounds);
    if(this.rhythmTime>=4.2){this.startOpening();return;}
    this.focusClock=Math.max(0,this.focusClock-dt);
    const targets=live(players),present=new Set(targets.map(p=>p.id));
    for(const key of this.lockAges.keys())if(!present.has(key))this.lockAges.delete(key);
    for(const p of targets){
      const age=isIlluminated?.(p)?(this.lockAges.get(p.id)||0)+dt:0;this.lockAges.set(p.id,age);
      if(age<.16||this.focusClock>0)continue;
      this.focusClock=this.livePart('command')?.6:1.05;
      const tracking=this.livePart('command')?.5:.15,tx=p.x+(p.vx||0)*tracking,ty=p.y+(p.vy||0)*tracking;
      for(const id of ['aa-left','aa-right'])if(this.livePart(id)){
        const gun=this.parts.get(id),count=this.livePart('command')?3:1;
        this.command('muzzle',{x:this.x+gun.x,y:this.y+gun.y,partId:id});
        for(let i=0;i<count;i++)this.hazard('circle',{x:tx+(i-(count-1)/2)*37,y:ty+i*19,delay:i*.14,radius:36,
          warning:.62,duration:.32,once:true,damage:this.t.damage*1.3,visual:'black-flak',sourceX:this.x+gun.x,sourceY:this.y+gun.y,tag:this.id+':focus'});
      }
      for(const id of ['mg-left','mg-right'])this.fan(this.parts.get(id),p,this.livePart('command')?5:2,.28,this.id+':focus',this.t.damage*.7);
      this.command('paris-light-lock',{targetId:p.id,seconds:.6});
    }
  }
}

export class ParisStaakenRVI extends ParisBoss {
  constructor(options){
    super({...options,kind:'paris-staaken-rvi',parts:PARIS_STAAKEN_PARTS,coreRadius:options.tuning.coreRadius||37});
    this.phase='approach';this.coreVulnerable=false;this.a=Math.PI/2;this.hullYaw=0;
    this.anchorX=this.x;this.anchorY=this.y;this.raidWait=2;this.raidSerial=0;this.runRemaining=0;this.armingWork=0;this.currentSpeed=105;this.glideAge=0;
    this.rotateMounts();
  }
  engines(){return [...this.parts.values()].filter(p=>p.kind==='engine'&&!p.destroyed).length;}
  speedRatio(){return [.26,.43,.62,.8,1][this.engines()];}
  rotateMounts(){const a=this.a+Math.PI/2,c=Math.cos(a),s=Math.sin(a);
    for(const p of this.parts.values()){p.x=p.localX*c-p.localY*s;p.y=p.localX*s+p.localY*c;p.angle=a;}}
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
    if(p.id==='bomb-bay'){this.abortRun();this.phase='payload-lost';this.coreVulnerable=true;}
    if(p.kind==='engine'){
      this.coreVulnerable=this.engines()<=2||this.parts.get('bomb-bay').destroyed;
      if(!this.engines()){this.abortRun();this.phase='gliding';this.glideAge=0;this.coreVulnerable=true;}
    }
    this.command('phase-change',{phase:this.phase,partId:p.id});
  }
  hit(attack){const bay=this.parts.get('bomb-bay'),before=bay.hp,result=super.hit(attack);
    if(attack.partId==='bomb-bay'&&this.runTarget&&bay.hp<before)this.command('paris-bomb-weakened',{runId:this.runId,strength:bay.hp/bay.maxHp});
    return result;
  }
  locateHit(attack){
    const partHit=super.locateHit(attack);if(partHit)return partHit;
    if(!this.coreVulnerable)return null;
    const a=this.a+Math.PI/2,c=Math.cos(a),s=Math.sin(a),dx=attack.x-this.x,dy=attack.y-this.y,x=dx*c+dy*s,y=-dx*s+dy*c,r=attack.radius||0;
    const scale=this.t.geometryScale||1;
    return Math.abs(x)<=270*scale+r&&Math.abs(y+64*scale)<=24*scale+r||Math.abs(x)<=24*scale+r&&Math.abs(y)<=137*scale+r?{partId:null}:null;
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
      const gun=this.parts.get(id);if(gun.destroyed||!this.due(id,dt,1.8))continue;
      const p=live(players).find(p=>Math.hypot(p.x-this.x,p.y-this.y)<range&&Math.abs(wrap(Math.atan2(p.y-this.y,p.x-this.x)-this.a-axis))<width);
      if(p)this.fan(gun,p,3,.18,this.id+':'+id,this.t.damage*.55);
    }
  }
  update(dt,{players=[],bounds,parisTargets=[]}){
    if(this.dead)return;
    const engines=this.engines(),bay=this.parts.get('bomb-bay');
    if(!engines){
      this.glideAge+=dt;this.currentSpeed=105*this.speedRatio();this.x+=Math.cos(this.a)*this.currentSpeed*dt;this.y+=Math.sin(this.a)*this.currentSpeed*dt;
      if(this.glideAge>=6){super.hit({damage:this.hp});return;}
    }else{
      this.raidWait-=dt;
      const targets=parisTargets.filter(t=>t.hp>0);
      if(!this.runTarget&&!bay.destroyed&&this.raidWait<=0&&targets.length){
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
            const strength=bay.hp/bay.maxHp,damage=Math.max(4,Math.round(32*strength));
            this.command('city-bomb',{runId:this.runId,targetId:target.id,x:target.x,y:target.y,seconds:1.3,damage});
            const sourceX=this.x+bay.x,sourceY=this.y+bay.y;
            for(let i=0;i<Math.ceil(4*strength);i++)this.hazard('circle',{x:target.x+(i-1.5)*49,y:target.y+(i%2)*35,radius:39,delay:i*.17,
              warning:1.3,duration:.35,once:true,damage:this.t.damage*strength,visual:'carpet-bomb',airborneBomb:true,sourceX,sourceY,tag:this.id+':bomb-bay'});
            this.runTarget=null;this.runRemaining=0;this.phase='regroup';this.raidWait=5+(4-engines)*1.5;
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
