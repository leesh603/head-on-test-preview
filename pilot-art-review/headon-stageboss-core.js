import {updateBasicBarrage,fireSignatureStrike} from './boss-basic-barrage.js?v=tame3&ai=1018';
import {separateZubianHalves} from './adriatic-boss-layout.js?v=tame3';
export class BossPart {
  constructor({id,maxHp,x=0,y=0,radius=24,hittable=true,kind='weakpoint',angle=0}) {
    if(!id||!Number.isFinite(maxHp)||maxHp<=0)throw new Error('Invalid part');
    Object.assign(this,{id,maxHp,hp:maxHp,x,y,radius,hittable,kind,angle});
  }
  get destroyed(){return this.hp<=0;}
  hit(damage){if(!Number.isFinite(damage)||damage<0)throw new Error('Invalid part damage');if(!this.hittable||this.destroyed)return 0;const dealt=Math.min(this.hp,damage);this.hp-=dealt;return dealt;}
}
export class BaseBoss {
  constructor({id,maxHp,x=0,y=0,coreRadius=80,parts=[],emit=()=>{}}) {
    if(!id||!Number.isFinite(maxHp)||maxHp<=0)throw new Error('Invalid boss');
    Object.assign(this,{id,maxHp,hp:maxHp,x,y,coreRadius});this.timers=new Map();
    this.emit=event=>{
      const enc=this.encounter;
      if(enc?.breath&&enc.breathBlocks(event))return;
      if(enc?.breathCfg&&event.type==='hazard')enc.noteHazard(event);
      if(event.type==='hazard'&&event.raidHeavy){this.basicHoldUntil=Math.max(this.basicHoldUntil||0,(this.combatTime||0)+(event.delay||0)+(event.warning||0)+(event.duration||0)+.4);if(this._heavyCancelAt!==this.combatTime){this._heavyCancelAt=this.combatTime;emit({type:'cancel-hazards',bossId:this.id,tag:this.id+':basic-fire'});}}
      // While a warned signature attack is being read (its marker or aim line
      // is up), ordinary fire waits rather than layering on top of it. Plain
      // unwarned gunfire does not hold anything.
      if(!event.basicFire&&!String(event.tag||'').endsWith(':basic-fire')){
        const now=this.combatTime||0;
        if(event.type==='hazard'&&!event.raidHeavy&&(event.warning||0)>=.5)this.basicSoftHold=Math.max(this.basicSoftHold||0,now+(event.delay||0)+event.warning+.25);
        else if(event.type==='charge-warning'&&(event.seconds||0)>=.5)this.basicSoftHold=Math.max(this.basicSoftHold||0,now+event.seconds+.25);
      }
      if(event.type==='body-defeated'||event.type==='part-destroyed'){emit({type:'cancel-hazards',bossId:this.id,tag:this.id+':basic-fire'});this.basicClock=Math.max(this.basicClock||0,.65);}
      emit(event);
    };
    if(new Set(parts.map(p=>p.id)).size!==parts.length)throw new Error('Duplicate part ID');
    this.parts=new Map(parts.map(p=>[p.id,p instanceof BossPart?p:new BossPart(p)]));
    this.phase='active';this.coreVulnerable=true;this.dead=false;
  }
  hit({partId=null,damage}) {
    if(!Number.isFinite(damage)||damage<0)throw new Error('Invalid damage');
    if(this.dead)return{damage:0,blocked:true};
    if(partId){const p=this.parts.get(partId);if(!p)return{damage:0,blocked:true};const before=p.destroyed,dealt=p.hit(damage);
      if(!before&&p.destroyed){p.destroyedAt=this.motionTime||0;this.emit({type:'part-destroyed',bossId:this.id,partId});this.onPartDestroyed(p);}
      return{damage:dealt,partId,partDestroyed:!before&&p.destroyed};}
    if(!this.coreVulnerable)return{damage:0,blocked:true};
    const dealt=Math.min(this.hp,damage);this.hp-=dealt;
    if(this.hp<=0){this.dead=true;this.phase='defeated';this.emit({type:'body-defeated',bossId:this.id});}
    return{damage:dealt,bodyDefeated:this.dead};
  }
  onPartDestroyed(){}
  // A shared crew-rest beat (see BREATHERS) doubles pilot damage-in like any
  // other announced counter window. Bosses with their own windows override.
  counterWindow(){return this.encounter?.breathOpen?.()?1.4:1;}
  due(key,dt,interval) {
    if(!Number.isFinite(interval)||interval<=0)throw new Error('Invalid interval');
    interval/=this.t?.patternMultiplier||1;
    const left=(this.timers.get(key)??interval)-dt;
    this.timers.set(key,left<=0?interval:left);return left<=0;
  }
  locateHit({x,y,radius=0}) {
    for(const p of this.parts.values())if(p.hittable&&!p.destroyed&&Math.hypot(x-(this.x+p.x),y-(this.y+p.y))<=p.radius+radius)return{partId:p.id};
    // A protected core is not an opaque collision disc: outer hull overlap
    // must not consume bullets before they reach a required inner weakpoint.
    return this.coreVulnerable&&Math.hypot(x-this.x,y-this.y)<=this.coreRadius+radius?{partId:null}:null;
  }
  hitAt({x,y,radius=0,damage}) {
    // Part-first single route prevents one bullet damaging both a part and hull.
    for(const p of this.parts.values())if(p.hittable&&!p.destroyed&&Math.hypot(x-(this.x+p.x),y-(this.y+p.y))<=p.radius+radius)return this.hit({partId:p.id,damage});
    if(Math.hypot(x-this.x,y-this.y)<=this.coreRadius+radius)return this.hit({damage});
    return{damage:0,miss:true};
  }
  update(){}
}
// Bosses whose gunnery never let up get a crew-rest beat: every `every`
// seconds they stop launching, let what is already in the air land, then hold
// fire for `rest` seconds behind the normal counter-window HUD. Each boss keeps
// its own cadence and wording; bosses with authored recoveries are not listed.
const BREATHERS=Object.freeze({
  'zeppelin-l70':{every:11,rest:2.6,phase:'l70-gun-reload'},
  hma23:{every:10.5,rest:2.4,phase:'hma23-rearm'},
  ca4:{every:9,rest:2.2,phase:'bomber-gunner-reload'},
  gik:{every:9.5,rest:2.2,phase:'bomber-gunner-reload'},
  'treffas-wagen':{every:10,rest:2.5,phase:'treffas-recovery'},
  'drachen-net':{every:9,rest:2.2,phase:'gondola-reload'},
  'london-apron-raid':{every:10,rest:2.3,phase:'gondola-reload'},
  'flak-tower':{every:12,rest:2.4,phase:'flak-resupply'},
  'morser-battery':{every:10.5,rest:2.6,phase:'schwaben-reload'},
  'paris-staaken-rvi':{every:9.5,rest:2.2,phase:'staaken-gunner-reload'},
  'sinai-landship':{every:10,rest:2.4,phase:'sinai-reload'},
  'jutland-grand-fleet':{every:12,rest:2.8,phase:'fleet-reload'},
  'gotha-squadron':{every:11,rest:2.4,phase:'gotha-regroup'}
});
const BREATH_BLOCKED=new Set(['charge-warning','muzzle','mortar-launch','heavy-gun-fired','spawn-minefield']);
export class BossEncounter {
  constructor({id,bossId,bodies}) {
    if(!id||!bodies?.length||new Set(bodies.map(b=>b.id)).size!==bodies.length)throw new Error('Invalid encounter');
    Object.assign(this,{id,bossId});this.bodies=new Map(bodies.map(b=>[b.id,b]));
    this.clock=0;this.breath=null;this.breathCfg=BREATHERS[bossId]||null;this.breathNext=this.breathCfg?.every||0;
    this.maxHpBudget=bodies.reduce((n,b)=>n+b.maxHp,0);
    for(const b of bodies)b.encounter=this;
  }
  get completed(){return this.bodies.size>0&&[...this.bodies.values()].every(b=>b.dead);}
  noteHazard(e){if(e.kind==='searchlight'||e.kind==='net')return;const life=e.kind==='projectile'?Math.min(e.duration??2.2,2.2):Math.min(e.duration??.5,1.2);this.lastResolve=Math.max(this.lastResolve||0,this.clock+(e.delay||0)+(e.warning||0)+life);}
  // Objective bombing (a raid on a city district) is not gunnery and runs on its own clock.
  breathBlocks(e){const b=this.breath;if(!b||this.clock<b.blockFrom||this.clock>=b.until||e.objective)return false;return e.type==='hazard'?e.kind!=='searchlight'&&e.kind!=='net':BREATH_BLOCKED.has(e.type);}
  breathOpen(){const b=this.breath;return !!b&&this.clock>=b.from&&this.clock<b.until;}
  updateBreath(dt){
    this.clock+=dt;const cfg=this.breathCfg;if(!cfg)return;
    const b=this.breath;
    if(b){if(!b.announced&&this.clock>=b.from){b.announced=true;const body=[...this.bodies.values()].find(x=>!x.dead);body?.emit({type:'phase-change',bossId:body.id,phase:cfg.phase});}
      if(this.clock>=b.until){this.breath=null;let hp=0;for(const x of this.bodies.values())hp+=Math.max(0,x.hp);this.breathNext=this.clock+cfg.every*(hp<this.maxHpBudget*.4?.85:1);}return;}
    // Stop launching now; the rest opens once what is already in the air has
    // landed (never more than 3.2 s later, so a long fire field cannot stall it).
    // The rest is earned: the boss opens it with its evade-check strike, and
    // the counter window starts once that has landed.
    if(this.clock>=this.breathNext){if(this.lastCtx){const p=this.lastCtx.players?.find(x=>x.alive),body=[...this.bodies.values()].filter(x=>!x.dead).sort((a,c)=>p?Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(c.x-p.x,c.y-p.y):0);
        let deferred=false;const force=(this.breathWait||0)>=8;for(const x of body){const r=fireSignatureStrike(x,this.lastCtx,{force});if(r>0){deferred=false;break;}if(r<0)deferred=true;}
        // A native heavy attack is still landing: wait for it (up to 3 s) so
        // the strike follows it instead of stacking on top of it.
        if(deferred&&(this.breathWait=(this.breathWait||0)+1)<=10){this.breathNext=this.clock+.3;return;}}
      this.breathWait=0;
      const from=Math.max(this.clock+.3,Math.min(this.lastResolve||0,this.clock+3.2));this.breath={blockFrom:this.clock,from,until:from+cfg.rest,announced:false};}
  }
  replaceBody(id,children) {
    const parent=this.bodies.get(id);if(!parent||!children.length||new Set(children.map(b=>b.id)).size!==children.length)return false;
    if(children.some(b=>b.id===id||this.bodies.has(b.id)))throw new Error('Duplicate split body ID');
    if(Math.abs(children.reduce((n,b)=>n+b.hp,0)-parent.hp)>1e-6)throw new Error('Split must conserve remaining HP');
    // Atomic replacement: never poll completion between parent removal and children insertion.
    this.bodies.delete(id);for(const b of children){b.encounter=this;this.bodies.set(b.id,b);}return true;
  }
  update(dt,ctx){this.lastCtx=ctx;this.updateBreath(dt);for(const b of this.bodies.values())if(!b.dead){
    b.combatTime=(b.combatTime||0)+dt;
    b.motionTime=(b.motionTime||0)+dt*(b.t?.motionMultiplier||1);b.recoil=Math.max(0,(b.recoil||0)-dt);
    if(b.t?.mobileBoss&&!b.role&&!b.ownsMotion129){
      b.anchorX??=b.x;b.anchorY??=b.y;
      const ship=['sms-stuttgart','hms-zubian'].includes(b.kind),rail=['paris-gun','lincomparable'].includes(b.kind);
      const armor=['a7v-flak','mark-v-cruiser'].includes(b.kind),fixed=['london-apron','drachen-net','armored-harbor-fortress'].includes(b.kind);
      const pace=armor?.18:ship?.42:rail?.55:.32,span=ship?110:rail||armor||fixed?0:65;
      if(rail&&b.railBroken){b.x=b.railStopX??b.x;b.y=b.railStopY??b.y;}
      else{b.x=b.anchorX+Math.sin(b.motionTime*pace)*span;
        b.y=b.anchorY+Math.sin(b.motionTime*pace)*(armor?65:fixed?0:rail?95:ship?55:30);}
    }
    b.update(dt,ctx);
    if(!updateBasicBarrage(b,dt,ctx)&&typeof b.suppressive==='function')b.suppressive(dt,ctx.players);
  }if(this.bossId==='hms-zubian')separateZubianHalves(this);}
  snapshot() {
    let hp=0,aliveParts=0,totalParts=0,shielded=false,formationAlive=0,formationTotal=0;const phases=[];
    for(const b of this.bodies.values()){
      hp+=Math.max(0,b.hp);shielded||=!b.dead&&!b.coreVulnerable;phases.push(b.phase);
      if(b.formationTotal){formationTotal+=b.formationTotal;formationAlive+=b.dead?0:1+(b.formationStatus129?.().length||0);}
      for(const p of b.parts.values()){totalParts++;if(!p.destroyed)aliveParts++;}
    }
    return{id:this.id,bossId:this.bossId,hp,maxHp:this.maxHpBudget,shielded,aliveParts,totalParts,formationAlive,formationTotal,phases,completed:this.completed};
  }
}
