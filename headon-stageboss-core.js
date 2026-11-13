import {updateBasicBarrage,breakSilence} from './boss-basic-barrage.js?v=tame3&ai=1018&sig=1019&boss=20261020b&somme=20261021&cambrai=20261021&harbor=20261021&close=20261107';
import {separateZubianHalves} from './adriatic-boss-layout.js?v=tame3';
// Where a pilot will be after t seconds if it keeps doing what it is doing:
// straight flight, or the turn it is in (omega rad/s, set by the boss runtime).
export function predictPilot(p,t){
  const vx=Number.isFinite(p.vx)?p.vx:0,vy=Number.isFinite(p.vy)?p.vy:0,v=Math.hypot(vx,vy),w=Number.isFinite(p.omega)?p.omega:0;
  if(v<1||Math.abs(w)<.08)return{x:p.x+vx*t,y:p.y+vy*t};
  const a=Math.atan2(vy,vx),r=v/w;return{x:p.x+r*(Math.sin(a+w*t)-Math.sin(a)),y:p.y-r*(Math.cos(a+w*t)-Math.cos(a))};
}
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
      // Re-entrant part destruction may invalidate a queued native order
      // during the same update. Never emit it from an unavailable weapon.
      if(event.type==='hazard'&&event.sourcePartId){const source=this.parts?.get(event.sourcePartId);if(!source||source.destroyed)return;}
      const enc=this.encounter;
      if(enc?.breath&&enc.breathBlocks(event))return;
      if(enc?.breathCfg&&event.type==='hazard')enc.noteHazard(event);
      // When the boss is next dangerous: what it has launched has landed or expired.
      // Searchlights and nets are attacks too (they lock the pilot), and a charge warning is one about to land.
      if(enc&&event.type==='hazard'&&(event.damage>0||event.kind==='searchlight'||event.kind==='net'))enc.threatUntil=Math.max(enc.threatUntil||0,enc.clock+(event.delay||0)+(event.warning||0)+Math.min(event.duration??1,2.2));
      else if(enc&&event.type==='charge-warning')enc.threatUntil=Math.max(enc.threatUntil||0,enc.clock+(event.seconds||0));
      if(event.type==='hazard'&&event.raidHeavy&&this.kind!=='gallipoli-fortress'){this.basicHoldUntil=Math.max(this.basicHoldUntil||0,(this.combatTime||0)+(event.delay||0)+(event.warning||0)+(event.duration||0)+.4);if(this._heavyCancelAt!==this.combatTime){this._heavyCancelAt=this.combatTime;emit({type:'cancel-hazards',bossId:this.id,tag:this.id+':basic-fire',pendingOnly:true});}}
      // While a warned signature attack is being read (its marker or aim line
      // is up), ordinary fire waits rather than layering on top of it. Plain
      // unwarned gunfire does not hold anything.
      if(!event.basicFire&&!String(event.tag||'').endsWith(':basic-fire')){
        const now=this.combatTime||0;
        if(event.type==='hazard'&&!event.raidHeavy&&(event.warning||0)>=.5)this.basicSoftHold=Math.max(this.basicSoftHold||0,now+(event.delay||0)+event.warning+.25);
        else if(event.type==='charge-warning'&&(event.seconds||0)>=.5)this.basicSoftHold=Math.max(this.basicSoftHold||0,now+event.seconds+.25);
      }
      // Learn the native attack timer at telegraph time, but only an activated
      // hazard earns phase credit. Cancelled warnings must never open a gate.
      if(!event.basicFire&&!String(event.tag||'').endsWith(':basic-fire')){
        const now=this.combatTime||0;
        if(event.type==='charge-warning'&&(event.seconds||0)>=.5){this.signatureWarningUntil=now+event.seconds+.4;this.signatureWarningPartId=event.partId||null;}
        if(event.type==='hazard'&&((event.delay||0)+(event.warning||0)>=.5||event.raidHeavy||now<(this.signatureWarningUntil||0)&&(!this.signatureWarningPartId||event.sourcePartId===this.signatureWarningPartId)))event.signatureAttack=true;
        if(event.signatureAttack||event.type==='charge-warning'){
          const d=this._dueFired;if(d&&d.t===now)(this.signatureKeys??=new Set).add(d.key);
        }
      }
      if(event.type==='body-defeated'||event.type==='part-destroyed'){emit({type:'cancel-hazards',bossId:this.id,tag:this.id+':basic-fire',pendingOnly:event.type==='part-destroyed'});this.basicClock=Math.max(this.basicClock||0,.65);}
      return emit(event);
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
  noteAttackActivated(h){
    if(this.dead||!h.signatureAttack||!(h.damage>0))return;
    // Keep the boss alive through the dodge, not merely until a projectile
    // appears. Long-lived rounds are bounded so this cannot stall the fight.
    const resolve=h.kind==='projectile'?Math.min(h.duration,1.4):Math.min(h.duration,2.2);
    this.shownCount=(this.shownCount||0)+1;
    (this.shownEnds??=[]).push((this.combatTime||0)+resolve+.3);
    this.encounter?.noteShown(resolve,h.signatureStarted);this._hurryTried?.clear();
  }
  onPartDestroyed(){}
  // A shared crew-rest beat (see BREATHERS) doubles pilot damage-in like any
  // other announced counter window. Bosses with their own windows override.
  counterWindow(){return this.encounter?.breathOpen?.()?1.4:1;}
  due(key,dt,interval) {
    if(!Number.isFinite(interval)||interval<=0)throw new Error('Invalid interval');
    interval/=this.t?.patternMultiplier||1;
    const left=(this.timers.get(key)??interval)-dt;
    (this._dueIv??=new Map()).set(key,interval);
    if(left<=0)this._dueFired={key,t:this.combatTime||0};
    this.timers.set(key,left<=0?interval:left);return left<=0;
  }
  // Phase gate reached: bring the next warned attack forward instead of making
  // the pilot wait out its timer. Bosses with their own clocks override this.
  hurry(){
    // Known signature timers first; otherwise long timers. A timer that was
    // pulled forward without producing a warned attack is skipped next time.
    const tried=this._hurryTried??=new Set(),ok=k=>this.timers.has(k)&&!tried.has(k);
    const known=[...(this.signatureKeys||[])].filter(ok);
    const plain=k=>ok(k)&&!/sound|debris|smoke|cue|vent/.test(k),long=[...this.timers.keys()].filter(k=>plain(k)&&(this._dueIv?.get(k)||0)>=2.5);
    const pool=known.length?known:long.length?long:[...this.timers.keys()].filter(plain);
    let best=null;for(const k of pool)if(best==null||this.timers.get(k)<this.timers.get(best))best=k;
    if(best!=null){this.timers.set(best,Math.min(this.timers.get(best),.15));tried.add(best);}
    return best;
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
  'gotha-squadron':{every:11,rest:2.4,phase:'gotha-regroup'}
});
const GUARD_LINES=Object.freeze([.66,.33]);
const BREATH_BLOCKED=new Set(['charge-warning','muzzle','mortar-launch','heavy-gun-fired','spawn-minefield']);
export class BossEncounter {
  constructor({id,bossId,bodies}) {
    if(!id||!bodies?.length||new Set(bodies.map(b=>b.id)).size!==bodies.length)throw new Error('Invalid encounter');
    Object.assign(this,{id,bossId});this.bodies=new Map(bodies.map(b=>[b.id,b]));
    this.clock=0;this.breath=null;this.breathCfg=BREATHERS[bossId]||null;this.breathNext=this.breathCfg?.every||0;
    this.maxHpBudget=bodies.reduce((n,b)=>n+(b.formationBudget??b.maxHp),0);
    for(const b of bodies)b.encounter=this;
  }
  get completed(){return this.bodies.size>0&&[...this.bodies.values()].every(b=>b.dead&&(!b.formationBoss129||!b.liveWingmen().length));}
  noteHazard(e){if(e.kind==='searchlight'||e.kind==='net')return;const life=e.kind==='projectile'?Math.min(e.duration??2.2,2.2):Math.min(e.duration??.5,1.2);this.lastResolve=Math.max(this.lastResolve||0,this.clock+(e.delay||0)+(e.warning||0)+life);}
  // Objective bombing (a raid on a city district) is not gunnery and runs on its own clock.
  breathBlocks(e){const b=this.breath;if(!b||this.clock<b.blockFrom||this.clock>=b.until||e.objective||e.silenceBreak)return false;return e.type==='hazard'?e.kind!=='searchlight'&&e.kind!=='net':BREATH_BLOCKED.has(e.type);}
  breathOpen(){const b=this.breath;return !!b&&this.clock>=b.from&&this.clock<b.until;}
  // Bosses without their own hpFloor hold two shared health lines (66%, 33%).
  // Each line opens once a native warned attack launched since the previous
  // line opened has activated and its dodge window has ended, so a strong build
  // still sees a second phrase instead of melting the boss through its first.
  // The 3 s / 8 s escape limits apply per line. Formations share this guard.
  // Hazards launched within half a second of each other are one attack (a salvo).
  noteShown(lead,start=this.clock){const list=this.shown??=[],end=this.clock+lead+.3,group=list.find(q=>Math.abs(start-q.start)<.5);if(group)group.end=Math.max(group.end,end);else list.push({start,end});}
  pendingAttack(){this.pendingShown=(this.pendingShown||[]).filter(q=>q.h.active&&q.h.generation===q.generation&&!q.h.activated);return this.pendingShown.some(q=>q.start>=(this.gate?.openAt||0));}
  gateBand(){return this.maxHpBudget*.04;}
  // Lines drawn on the boss bar: a rail gun's own schedule, otherwise the shared gates.
  gateLines(){const live=[...this.bodies.values()].filter(b=>!b.dead);if([...this.bodies.values()].some(b=>b.formationBoss129)||live.length===1&&(live[0].ruralRailBoss||live[0].kind==='hma23'))return [];if(live.length===1&&typeof live[0].showSchedule==='function')return [...live[0].showSchedule().hull.map(([,f])=>f),.06];return this.gate?.released?[]:GUARD_LINES.slice(this.gate?.line||0);}
  gateHeld(){return !!this.gateHold&&this.clock<this.gateHold.until;}
  guardFloor(b){
    if(b.dead)return 0;
    const g=this.gate??={at:null,openAt:0,released:false,line:0},now=this.clock,shown=this.shown||[];
    // Each line opens once a warned attack launched since the previous line opened has resolved.
    const advance=()=>{g.line=(g.line||0)+1;g.at=null;g.openAt=now;this.gateHold=null;if(g.line>=GUARD_LINES.length){g.released=true;this.gateLine=null;}};
    for(;;){
      if(g.released)return 0;
      const from=g.openAt||0;
      if(shown.some(q=>q.start>=from&&q.end<=now)){advance();continue;}
      let S=0;for(const x of this.bodies.values())if(!x.dead)S+=Math.max(0,x.hp);
      const line=GUARD_LINES[g.line||0],G=this.maxHpBudget*line;this.gateLine=line;
      if(S<=G+this.gateBand()){
        g.at??=now;
        // A disarmed or unreachable boss cannot hold the fight forever. These
        // are the existing escape limits, applied once per line.
        const started=this.pendingAttack()||shown.some(q=>q.start>=from);
        if(!started&&now-g.at>=3||now-g.at>=8){advance();continue;}
      }
      return Math.max(0,b.hp-(S-G));
    }
  }
  updateBreath(dt){
    this.clock+=dt;const cfg=this.breathCfg;if(!cfg)return;
    const b=this.breath;
    if(b){if(!b.announced&&this.clock>=b.from){b.announced=true;const body=[...this.bodies.values()].find(x=>!x.dead);body?.emit({type:'phase-change',bossId:body.id,phase:cfg.phase});}
      if(this.clock>=b.until){this.breath=null;let hp=0;for(const x of this.bodies.values())hp+=Math.max(0,x.hp);this.breathNext=this.clock+cfg.every*(hp<this.maxHpBudget*.4?.85:1);}return;}
    // Stop launching now; the rest opens once what is already in the air has
    // landed (never more than 3.2 s later, so a long fire field cannot stall it).
    // Native weapons own the attack that earns this pause. Do not insert a
    // generic heavy strike here: it can fire through destroyed weapon gates.
    if(this.clock>=this.breathNext){
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
      const ship=['sms-stuttgart','hms-zubian'].includes(b.kind),rail=['bruno-railway-gun','lincomparable'].includes(b.kind);
      const armor=['a7v-flak','mark-v-cruiser'].includes(b.kind),fixed=['london-apron','drachen-net','armored-harbor-fortress'].includes(b.kind);
      const pace=armor?.18:ship?.42:rail?.55:.32,span=ship?110:rail||armor||fixed?0:65;
      if(rail&&b.railBroken){b.x=b.railStopX??b.x;b.y=b.railStopY??b.y;}
      else{b.x=b.anchorX+Math.sin(b.motionTime*pace)*span;
        b.y=b.anchorY+Math.sin(b.motionTime*pace)*(armor?65:fixed?0:rail?95:ship?55:30);}
    }
    let combat=ctx;
    if(ctx.doverRaid){
      const {faction,bodies}=ctx.doverRaid;
      const foes=bodies.filter(q=>q.faction!==b.faction&&q.alive);
      const bomber=foes.find(q=>q.kind==='siemens-schuckert-r-viii');
      combat={...ctx,players:b.faction===faction?foes:[...foes,...ctx.players],doverConvoy:bomber?[bomber]:[]};
    }
    b.update(dt,combat);
    if(!updateBasicBarrage(b,dt,combat)&&typeof b.suppressive==='function')b.suppressive(dt,combat.players);
  }if(this.bossId==='hms-zubian')separateZubianHalves(this);breakSilence(this,dt,ctx);}
  snapshot() {
    let hp=0,aliveParts=0,totalParts=0,shielded=false,formationAlive=0,formationTotal=0;const phases=[];
    for(const b of this.bodies.values()){
      hp+=Math.max(0,b.hp);shielded||=!b.dead&&!b.coreVulnerable;phases.push(b.phase);
      if(b.formationBoss129){
        const wings=b.liveWingmen(),pending=b.dead?0:b.wingmen.length-b.wingsLaunched;
        formationTotal+=b.formationTotal;formationAlive+=Number(!b.dead)+wings.length;
        hp+=pending*b.formationWingHp;
        for(const wing of wings)hp+=Math.max(0,wing.hp??b.formationWingHp);
      }else if(b.formationTotal){formationTotal+=b.formationTotal;formationAlive+=b.dead?0:1+(b.formationStatus129?.().length||0);}
      for(const p of b.parts.values()){totalParts++;if(!p.destroyed)aliveParts++;}
    }
    return{id:this.id,bossId:this.bossId,hp,maxHp:this.maxHpBudget,shielded,aliveParts,totalParts,formationAlive,formationTotal,phases,completed:this.completed};
  }
}


