import {TRENCH_ARMOR_LAYOUT,armorRotate,armorAngleDelta,armorGunMuzzle} from './trench-armor-layout.js';
import {RailAdapter,StuttgartAdapter} from './boss-adapters129.js?v=477&b=326';
import {BaseBoss, BossPart, BossEncounter} from './headon-stageboss-core.js?v=477&b=326';

// Trench II is an independent battlefield between the original trenches and
// later theaters. Stable stage IDs keep both trench maps in the endless loop.
export const STAGES = Object.freeze(['rural', 'sea', 'trenches', 'trenches-hell', 'city', 'sky', 'alps', 'zeebrugge', 'cambrai', 'arras', 'somme', 'london']);
export const BOSS_CATALOG = Object.freeze({
  'paris-gun': {name:'브루노 열차포', faction:'central', stage:0},
  lincomparable: {name:'520mm 열차포 · 랑콩파라블', faction:'entente', stage:0},
  'sms-stuttgart': {name:'수상기 모함 · SMS 슈투트가르트', faction:'central', stage:1},
  'hms-zubian': {name:'분열 구축함 · HMS 쥬비안', faction:'entente', stage:1},
  'a7v-flak': {name:'A7V 플라크판처', faction:'central', stage:2},
  'mark-v-cruiser': {name:'대공 육상 전함 · 마크 V 크루이저', faction:'entente', stage:2},
  'livens-flame-projector': {name:'리벤스 대형 화염방사기', faction:'entente', stage:3},
  'minenwerfer-battery': {name:'미넨베르퍼 교차 포격 진지', faction:'central', stage:3},
  'drachen-net': {name:'드라헨 공중 기뢰 방어망', faction:'central', stage:4},
  'london-apron': {name:'런던 에이프런 방공망', faction:'entente', stage:4},
  'zeppelin-l70': {name:'슈퍼 체펠린 L 70', faction:'central', stage:5},
  hma23: {name:'공중 항모 · HMA 23급', faction:'entente', stage:5},
  gik: {name:'한자-브란덴부르크 G.IK', faction:'central', stage:6},
  ca4: {name:'카프로니 Ca.4', faction:'entente', stage:6}
  ,'armored-harbor-fortress': {name:'장갑 크레인 항구요새', faction:'neutral', stage:7}
  ,'fliegerzug': {name:'무인기 모함열차 · 플리거주크', faction:'entente', stage:8}
  ,'treffas-wagen': {name:'대공개조형 트레파스바겐 · 거륜 육상전함', faction:'central', stage:8}
  ,'jasta11-circus': {name:'야스타 11 플라잉 서커스', faction:'central', stage:9, pilot:'baron', formationSize:5}
  ,'naval10-black-flight': {name:'네이벌 10 — 블랙 플라이트', faction:'entente', stage:9, pilot:'collishaw', formationSize:5}
  ,'mark4-wedge': {name:'마크 IV 쐐기 전차대', faction:'entente', stage:10}
  ,'morser-battery': {name:'21cm 뫼르저 중박격포대', faction:'central', stage:10}
  ,'gotha-squadron': {name:'고타 야간 폭격전대', faction:'central', stage:11}
  ,'london-apron-raid': {name:'런던 에이프런 방공망', faction:'entente', stage:11}
});
const living = players => players.filter(p => p.alive);
const randBetween = (rng,a,b) => a + (b-a)*rng();

class PatternBoss extends BaseBoss {
  constructor({tuning, parts=[], kind, faction, rng=Math.random, ...base}) {
    for (const key of ['maxHp','partHp','damage','bulletSpeed']) if (!Number.isFinite(tuning?.[key]) || tuning[key] <= 0) throw new Error('Current boss tuning required: '+key);
    const mapped = parts.map(p => new BossPart({...p, maxHp:p.maxHp || tuning.partHp, ...(tuning.parts?.[p.id] || {})}));
    for(const p of mapped){p.x*=tuning.geometryScale||1;p.y*=tuning.geometryScale||1;p.radius*=tuning.geometryScale||1;}
    super({...base, maxHp:tuning.maxHp, parts:mapped});
    this.t=tuning; this.kind=kind; this.faction=faction; this.rng=rng; this.cursor=0;
  }
  target(players) {const list=living(players);return list.length ? list[this.cursor++ % list.length] : null;}
  command(type,spec={}) {if(type==='heavy-gun-fired'||type==='camera-shake'||type==='hazard'&&spec.kind==='projectile')this.recoil=.22;this.emit({...spec,type,bossId:this.id,faction:this.faction});}
  hazard(kind,spec) {this.command('hazard',{kind,damage:this.t.damage,warning:kind==='projectile'?0:.9,duration:kind==='projectile'?7:.5,...spec});}
  fan(x,y,angle,count=5,spread=.45,speed=this.t.bulletSpeed,visual) {
    count=Math.max(1,Math.ceil(count*(this.t.projectileDensity??1)));
    for(let i=0;i<count;i++) {const a=angle+(count===1?0:(i/(count-1)-.5)*spread);
      this.hazard('projectile',{x,y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,radius:5,...(visual?{visual}:null)});}
  }
  radial(count=24,speed=this.t.bulletSpeed) {count=Math.max(1,Math.ceil(count*(this.t.projectileDensity??1)));for(let i=0;i<count;i++)this.fan(this.x,this.y,i*Math.PI*2/count,1,0,speed);}
  suppressive(dt,players) {
    if(!this.due('suppressive',dt,this.t.suppressiveInterval||3.1))return;
    const p=this.target(players);if(!p)return;const a=Math.atan2(p.y-this.y,p.x-this.x);
    this.fan(this.x,this.y,a,this.t.suppressiveCount||7,.82,this.t.bulletSpeed*.88);
  }
  allDestroyed(ids) {return ids.every(id=>this.parts.get(id).destroyed);}
}

export class ParisGun extends RailAdapter {constructor(o){super(o,'paris-gun')}}
export class LIncomparable extends RailAdapter {constructor(o){super(o,'lincomparable')}}
export class Stuttgart extends StuttgartAdapter {}

class ZubianHalf extends PatternBoss {
  hit(attack){if(this.protection>0)return{damage:0,blocked:true};return super.hit(attack);}
  constructor({role,...options}) {super({...options,kind:'hms-zubian-'+role});this.role=role;this.phase=role==='front'?'front-hunt':'rear-mortar';this.chargeTime=0;this.mortarPattern=0;this.splitAge=1.2;this.splitX=this.x;this.splitY=this.y;}
  update(dt,{players,bounds}) {
    this.splitAge+=dt;
    this.protection=Math.max(0,(this.protection||0)-dt);
    this.coreVulnerable=this.protection<=0;
    const partner=[...this.encounter?.bodies.values()||[]].find(b=>b!==this&&b.kind?.startsWith('hms-zubian-'));
    if(partner&&!partner.dead){const dx=this.x-partner.x,dy=this.y-partner.y,d=Math.hypot(dx,dy),min=250;if(d>1e-3&&d<min){const push=(min-d)*.55;this.x+=dx/d*push;this.y+=dy/d*push;partner.x-=dx/d*push;partner.y-=dy/d*push;}}
    if(partner?.dead&&!this.soloEnraged){this.soloEnraged=true;this.command('phase-change',{phase:this.role+'-last-stand'});}
    if(this.role==='front'&&this.soloEnraged&&this.due('front-barrage',dt,2.6)){const p=this.target(players);if(p)for(let i=-1;i<=1;i++)this.hazard('circle',{x:p.x+i*54,y:p.y+(p.vy||0)*.55,radius:46,delay:.18+Math.abs(i)*.12,warning:.9,once:true,visual:'zubian-mortar'});}
    if(this.role==='rear') {
      if(this.t.mobileBoss){this.x=this.splitX+Math.sin(this.splitAge*.65)*70;this.y=this.splitY+Math.sin(this.splitAge*.4)*24;}
      if(this.due('mortar',dt,(this.t.mortarInterval||2.4)*(this.soloEnraged?.7:1))) {
        const p=this.target(players);if(p){const lead=.7,tx=p.x+(p.vx||0)*lead,ty=p.y+(p.vy||0)*lead;
         if(this.mortarPattern++%2===0)for(let i=-1;i<=1;i++)this.hazard('circle',{x:tx+i*78,y:ty,radius:58,delay:.18+Math.abs(i)*.12,warning:1.05,once:true,visual:'zubian-mortar'});
         else for(let i=0;i<5;i++)this.hazard('circle',{x:tx+(p.vx||0)*i*.16,y:ty+(p.vy||0)*i*.16,radius:52,delay:.12+i*.2,warning:1.05,once:true,visual:'zubian-mortar'});}
      }
      if(this.soloEnraged&&this.due('rear-pass',dt,2.5)){const p=this.target(players);if(p)this.fan(this.x,this.y,Math.atan2(p.y-this.y,p.x-this.x),3,.28,this.t.bulletSpeed*.9,'zubian-shell');}return;
    }
    if(this.phase==='charging') {
      this.x=Math.max(bounds.left+35,Math.min(bounds.right-35,this.x+this.vx*dt));
      this.y=Math.max(bounds.top+35,Math.min(bounds.bottom-35,this.y+this.vy*dt));
      this.chargeTime-=dt;this.chargeGun=(this.chargeGun||0)-dt;if(this.chargeGun<=0){this.chargeGun=.24;const p=this.target(players);if(p)this.fan(this.x,this.y,Math.atan2(p.y-this.y,p.x-this.x),1,0,this.t.bulletSpeed*.9,'zubian-shell');}
      if(this.chargeTime<=0)this.phase='stalking';return;
    }
    if(this.phase==='windup') {
      this.chargeTime-=dt;if(this.chargeTime<=0) {
        this.phase='charging';this.chargeTime=1.1;this.chargeGun=0;
        this.hazard('projectile',{x:this.x,y:this.y,vx:this.vx,vy:this.vy,radius:35,duration:1.1,piercing:true,visual:'torpedo-charge'});
      }return;
    }
    const stalk=this.target(players);if(stalk){this.x+=Math.sign(stalk.x-this.x)*Math.min(Math.abs(stalk.x-this.x),dt*42);this.y+=Math.sin(this.splitAge*.75)*dt*12;}
    if(this.due('charge',dt,(this.t.chargeInterval||3.5)*(this.soloEnraged?.8:1))) {
      const p=stalk||this.target(players);if(!p)return;const a=Math.atan2(p.y-this.y,p.x-this.x);
      this.vx=Math.cos(a)*this.t.bulletSpeed*1.6;this.vy=Math.sin(a)*this.t.bulletSpeed*1.6;
      this.phase='windup';this.chargeTime=1.1;
      this.command('charge-warning',{x:this.x,y:this.y,targetX:this.x+Math.cos(a)*1400,targetY:this.y+Math.sin(a)*1400,seconds:1.1});
      const rear=[...this.encounter?.bodies.values()||[]].find(b=>b.role==='rear'&&!b.dead);rear?.supportCharge?.(p,a);
    }
  }
  supportCharge(p,chargeAngle){if(this.role!=='rear')return;const side=Math.sin(chargeAngle)>=0?1:-1,forwardX=Math.cos(chargeAngle),forwardY=Math.sin(chargeAngle),acrossX=-forwardY*side,acrossY=forwardX*side;
    const x=p.x+(p.vx||0)*.8+acrossX*135,y=p.y+(p.vy||0)*.8+acrossY*135;
    for(let i=0;i<3;i++)this.hazard('circle',{x:x+forwardX*(i-1)*58,y:y+forwardY*(i-1)*58,radius:42,delay:.35+i*.16,warning:1.05,once:true,visual:'zubian-mortar',tag:'zubian-crossfire'});}
}
export class Zubian extends PatternBoss {
  constructor(options) {super({...options,parts:[
    {id:'frontEngine',x:-25,y:-48,radius:18},{id:'rearEngine',x:25,y:48,radius:18},
    {id:'frontGun',x:0,y:-82,radius:17},{id:'rearGun',x:0,y:82,radius:17},{id:'seam',x:0,y:0,radius:20,kind:'seam'}
  ],kind:'hms-zubian'});this.phase='intact';this.stateAge=0;this.splitGap=0;this.broadsideSide=-1;}
  beginSplit(){if(this.phase!=='intact')return;this.phase='seam-warning';this.stateAge=0;this.coreVulnerable=false;this.command('seam-warning',{x:this.x,y:this.y,seconds:1.5});}
  hit(attack) {
    if(!Number.isFinite(attack.damage)||attack.damage<0)throw new Error('Invalid damage');
    if(this.dead||this.phase!=='intact')return{damage:0,blocked:true};
    if(attack.partId){const result=super.hit(attack);if(attack.partId==='seam'&&this.parts.get('seam').destroyed)this.beginSplit();return result;}
    const threshold=this.maxHp*.5,allowed=Math.max(0,this.hp-threshold),result=super.hit({...attack,damage:Math.min(attack.damage,allowed)});
    if(this.hp<=threshold)this.beginSplit();return{...result,split:this.phase!=='intact'};
  }
  update(dt,{players}) {
    this.stateAge+=dt;
    if(this.phase==='intact'){
      if(this.due('broadside',dt,this.t.broadsideInterval||2.8)){const side=this.broadsideSide*=-1;this.command('muzzle',{x:this.x+side*65,y:this.y,side});this.fan(this.x+side*65,this.y,side===1?0:Math.PI,7,1.15,this.t.bulletSpeed*.78,'zubian-shell');}
      return;
    }
    if(this.phase==='seam-warning'){if(this.stateAge>=1.5){this.phase='splitting';this.stateAge=0;this.command('split-start',{x:this.x,y:this.y});}return;}
    if(this.phase==='splitting'){
      this.splitGap=Math.min(92,this.stateAge/1.2*92);if(this.stateAge<1.2)return;
      if(!this.encounter)throw new Error('Zubian must belong to an encounter before splitting');
      const children=['front','rear'].map((role,i)=>new ZubianHalf({id:this.id+'-'+role,role,tuning:{...this.t,maxHp:this.hp/2},x:this.x,y:this.y+(i?1:-1)*92,faction:this.faction,rng:this.rng,emit:this.emit,coreRadius:52*(this.t.geometryScale||1)}));
      this.encounter.replaceBody(this.id,children);for(const child of children){child.protection=this.t.splitProtection||0;child.coreVulnerable=!child.protection;}
      this.command('split',{children:children.map(b=>b.id),x:this.x,y:this.y});
    }
  }
}

export class ZeppelinL70 extends PatternBoss {
  constructor(options) {
    const parts=[{id:'capsule',x:0,y:150,radius:23}];
    for(let i=0;i<7;i++)parts.push({id:'engine-'+i,x:(i-3)*34,y:45,radius:19,hittable:false,kind:'engine'});
    super({...options,parts,kind:'zeppelin-l70'});this.phase='cloud';this.coreVulnerable=false;this.phaseTime=0;
    this.broadside=0;this.gasSide=-1;this.lastStand=false;this.ownsMotion129=true;this.anchorX=this.x;this.anchorY=this.y;
  }
  liveEngines(){return [...this.parts.values()].filter(p=>p.kind==='engine'&&!p.destroyed);}
  hit(attack) {
    if(!attack.partId&&this.phase==='exposed'){
      const engines=this.liveEngines().length;
      return super.hit({...attack,damage:attack.damage*(engines>=5?.6:engines>=3?.8:1)});
    }
    return super.hit(attack);
  }
  onPartDestroyed(p) {if(p.id==='capsule'&&this.phase==='cloud'){this.phase='reveal';this.phaseTime=this.t.revealSeconds||1;this.command('phase-change',{phase:this.phase});}}
  update(dt,{players,bounds}) {
    const engines=this.liveEngines(),mt=this.motionTime||0,span=this.phase==='cloud'?150:72+engines.length*11;
    // A cloud fortress makes long lateral bombing runs. Engine losses visibly
    // shorten that run instead of sharing the generic mobile-boss wobble.
    this.x=this.anchorX+Math.sin(mt*.22)*span;this.y=this.anchorY+Math.sin(mt*.13+1.1)*20;
    if(!this.lastStand&&this.hp<=this.maxHp*.35){this.lastStand=true;this.command('phase-change',{phase:'gas-vent'});this.timers.set('gas',Math.min(this.timers.get('gas')??Infinity,.5));}
    if(this.phase==='cloud') {
      const live=living(players),p=live[this.cursor%Math.max(1,live.length)],c=this.parts.get('capsule');
      if(p){c.x+=(p.x-this.x-c.x)*Math.min(1,dt*1.2);c.y+=(p.y-this.y-c.y)*Math.min(1,dt*1.2);}
      if(this.due('carpet',dt,this.t.bombInterval||4)) {
        const target=this.target(players);if(target)for(let i=0;i<5;i++)this.hazard('circle',{x:target.x+(i-2)*55+randBetween(this.rng,-30,30),y:target.y+randBetween(this.rng,-26,26),delay:this.rng()*.5,radius:45+randBetween(this.rng,-8,10),warning:1.2,once:true,visual:'carpet-bomb'});
      }
    } else if(this.phase==='reveal') {
      this.phaseTime-=dt;if(this.phaseTime<=0){this.phase='exposed';this.coreVulnerable=true;for(const p of this.parts.values())if(p.kind==='engine')p.hittable=true;this.command('phase-change',{phase:this.phase});}
    } else if(this.phase==='exposed') {
      if(this.due('broadside',dt,this.t.engineInterval||2.6)){
        const side=this.broadside++%2,live=engines.filter(p=>(+p.id.slice(7)%2)===side);
        const p=this.target(players);
        if(p)for(const engine of live){const x=this.x+engine.x,y=this.y+engine.y;
          this.command('muzzle',{x,y,partId:engine.id});this.fan(x,y,Math.atan2(p.y-y,p.x-x),this.t.engineShotCount||2,.2,this.t.bulletSpeed,'l70-broadside');}
      }
      if(this.due('gas',dt,(this.t.gasInterval||6)*(this.lastStand ? .72 : 1))){
        const p=this.target(players);
        if(p){const horizontal=(this.gasSide*=-1)>0,pad=34,maxW=Math.max(120,bounds.right-bounds.left-pad*2),maxH=Math.max(120,bounds.bottom-bounds.top-pad*2);
          const width=horizontal?Math.min(520,maxW):86,height=horizontal?86:Math.min(480,maxH);
          const x=Math.max(bounds.left+width/2+pad,Math.min(bounds.right-width/2-pad,p.x+(p.vx||0)*.45));
          const y=Math.max(bounds.top+height/2+pad,Math.min(bounds.bottom-height/2-pad,p.y+(p.vy||0)*.45));
          this.hazard('rect',{x,y,width,height,warning:1.35,duration:2.2,tickInterval:.55,damage:this.t.damage*.7,visual:'gas-fire',tag:'l70-fire-corridor'});}
      }
    }
  }
  suppressive(){/* L70 pressure comes only from visible engines and bombing corridors. */}
}

export class HMA23 extends PatternBoss {
  constructor(options) {
    super({...options,kind:'hma23',parts:Array.from({length:4},(_,i)=>({id:'port-'+i,x:(i-1.5)*60,y:50,radius:25}))});
    this.phase='launching';this.coreVulnerable=false;this.launchSide=0;this.flakSide=-1;this.reserveReady=false;
    this.ownsMotion129=true;this.anchorX=this.x;this.anchorY=this.y;
  }
  onPartDestroyed() {if(this.allDestroyed([...this.parts.keys()])){this.phase='exposed';this.coreVulnerable=true;this.reserveReady=true;this.command('phase-change',{phase:this.phase});}}
  carrierFan(players) {
    const p=this.target(players);if(!p)return;
    const side=this.flakSide*=-1,x=this.x+side*112,y=this.y+48;
    const count=Math.max(3,Math.ceil(5*(this.t.projectileDensity??1))),a=Math.atan2(p.y-y,p.x-x);
    // The carrier is a sustained area-denial boss.  Its individual flak
    // rounds stay survivable even after long-run scaling instead of becoming
    // 40–50 damage one-shots.
    this.command('muzzle',{x,y,side});
    for(let i=0;i<count;i++){const heading=a+(count===1?0:(i/(count-1)-.5)*.9);this.hazard('projectile',{x,y,vx:Math.cos(heading)*this.t.bulletSpeed*.78,vy:Math.sin(heading)*this.t.bulletSpeed*.78,radius:5,damage:Math.min(30,Math.round(this.t.damage*.7)),visual:'carrier-flak'});}
  }
  suppressive(){/* carrier fire is handled by the capped carrierFan pattern */}
  update(dt,{players,bounds}) {
    const mt=this.motionTime||0;this.x=this.anchorX+Math.sin(mt*.31)*42;this.y=this.anchorY+Math.sin(mt*.17+2)*12;
    if(this.reserveReady){this.reserveReady=false;const target=this.target(players);for(let i=0;i<4;i++){const ox=(i-1.5)*60,side=ox<0?-1:1;
      this.command('spawn-minion',{minion:'sopwith-camel',x:this.x+ox,y:this.y+45,behavior:'attack-pass',fullSortie:true,
        formationIndex:i,formationCount:4,passTargetX:(target?.x??this.x)+side*150,passTargetY:(target?.y??this.y+300)+(i-1.5)*24});}
      this.command('phase-change',{phase:'full-sortie'});}
    if(this.phase==='launching') {
      if(this.due('launch-wave',dt,this.t.launchInterval||3)){
        const ports=[...this.parts.values()].filter(p=>!p.destroyed),target=this.target(players);
        const count=Math.min(ports.length,ports.length>=3?3:2);
        for(let i=0;i<count;i++){const port=ports[(this.launchSide+i)%ports.length];
          const side=port.x<0?-1:1;
          this.command('spawn-minion',{minion:'sopwith-camel',x:this.x+port.x,y:this.y+port.y,behavior:'attack-pass',
            launchPortId:port.id,launchSide:side,formationIndex:i,formationCount:count,
            passTargetX:(target?.x??this.x)+side*135,passTargetY:(target?.y??this.y+300)+(i-(count-1)/2)*32});}
        if(ports.length)this.launchSide=(this.launchSide+count)%ports.length;
      }
    } else if(this.due('panic',dt,this.t.panicInterval||2.7)) {
      this.carrierFan(players);
    }
  }
}

// Alps encounter: part damage is transferred once to the shared hull by the
// normal BaseBoss route.  The geometry is intentionally kept in the current
// StageBoss coordinate system so coop/loop tuning is only applied by host.
class AlpsPatternBoss extends PatternBoss {
  constructor(options) {
    super(options);
    this.phase=1;this.hidden=false;
    // Alpine bombers patrol around their spawn anchor. Their route is independent
    // of player/camera coordinates, preventing the old magnetic-follow behavior.
    this.fixedX=this.x;this.fixedY=this.y;this.routeClock=0;this.ownsMotion129=true;
  }
  resetRoute(x,y){this.fixedX=x;this.fixedY=y;this.routeClock=0;this.x=x;this.y=y;}
  cruise(dt,{kind='gik',engineLoss=0,imbalance=0}={}){
    if(this.hidden)return;
    const speedScale=Math.max(.38,1-engineLoss*(kind==='gik' ? .29 : .2)),rate=(kind==='gik' ? .09 : .07)*speedScale;
    this.routeClock+=dt*rate;
    const width=kind==='gik' ? 185 : 235,height=kind==='gik' ? 72 : 105,previousX=this.x,previousY=this.y;
    this.x=this.fixedX+Math.sin(this.routeClock)*width+imbalance*44;
    this.y=this.fixedY+Math.sin(this.routeClock*.53)*height;
    const dx=this.x-previousX,dy=this.y-previousY;if(Math.hypot(dx,dy)>.01)this.a=Math.atan2(dy,dx);
  }
  setPhase(phase) { if(phase<=this.phase)return; this.phase=phase; this.command('phase-change',{phase:'phase-'+phase}); }
  part(id){return this.parts.get(id);}
  aimedFan(id,players,count=5,spread=.6,scale=1){const p=this.part(id),target=this.target(players);if(!p||p.destroyed||!target)return;const x=this.x+p.x,y=this.y+p.y;this.fan(x,y,Math.atan2(target.y-y,target.x-x),count,spread,this.t.bulletSpeed*scale);}
}
export class GIK extends AlpsPatternBoss {
  constructor(options){super({...options,kind:'gik',parts:[
    {id:'leftEngine',x:-68,y:-8,radius:27,maxHp:options.tuning.maxHp*.072,kind:'engine'},
    {id:'rightEngine',x:68,y:-8,radius:27,maxHp:options.tuning.maxHp*.072,kind:'engine'},
    {id:'cannon',x:0,y:-118,radius:25,maxHp:options.tuning.maxHp*.065},
    {id:'rearGun',x:0,y:108,radius:21,maxHp:options.tuning.maxHp*.052}
  ]});this.phase=1;this.reentry=0;}
  locateHit(spec){return this.hidden?null:super.locateHit(spec);}
  hit(attack){
    if(this.hidden)return{damage:0,blocked:true};
    if(attack.partId)return super.hit(attack);
    const floor=this.phase===1?.7:this.phase===2?.32:0;
    return super.hit({...attack,damage:Math.min(attack.damage,Math.max(0,this.hp-this.maxHp*floor))});
  }
  update(dt,{players,bounds,peaks=[]}){
    const cannon=this.part('cannon'),engines=[this.part('leftEngine'),this.part('rightEngine')].filter(p=>p.destroyed).length;
    const imbalance=(this.part('leftEngine').destroyed?1:0)-(this.part('rightEngine').destroyed?1:0);this.cruise(dt,{kind:'gik',engineLoss:engines,imbalance});
    if(this.phase===1&&(this.hp<=this.maxHp*.70||engines||cannon.destroyed)){this.setPhase(2);this.hidden=true;this.reentry=1.9;this.reentrySide=this.rng()<.5?-1:1;this.entryX=this.reentrySide<0?bounds.left+90:bounds.right-90;this.entryY=bounds.top+105;this.command('hide',{peakId:peaks[0]?.id||null});this.command('reentry-warning',{x:this.entryX,y:bounds.top-30,targetX:(bounds.left+bounds.right)/2,targetY:bounds.bottom-80,seconds:this.reentry});}
    if(this.hidden){this.reentry=Math.max(0,this.reentry-dt);if(this.reentry>0)return;this.hidden=false;this.resetRoute(this.entryX,this.entryY);const w=bounds.right-bounds.left,bh=bounds.bottom-bounds.top;
      const open=Math.floor(this.rng()*8);
      for(let i=0;i<16;i++){const col=(i*3+Math.floor(this.rng()*3))%8;if(col===open)continue;
       this.hazard('circle',{x:bounds.left+w*(.12+col*.094)+randBetween(this.rng,-w*.05,w*.05),y:bounds.top+bh*randBetween(this.rng,.28,.72),radius:Math.min(100,w*.078)*randBetween(this.rng,.75,1.25),delay:this.rng()*.85,warning:1.3,duration:.3,once:true,damage:this.t.damage*1.1,visual:'carpet-bomb'});}
      this.command('phase-change',{phase:'carpet-bomb'});}
    if(this.phase===2&&(this.hp<=this.maxHp*.32||cannon.destroyed))this.setPhase(3);
    if(this.phase<3&&cannon&&!cannon.destroyed&&this.due('alps-cannon',dt,this.phase===1?3.6:2.15)){
      const p=this.target(players); if(p){const x=this.x+cannon.x,y=this.y+cannon.y,a=Math.atan2(p.y-y,p.x-x);this.command('cannon-aim',{x,y,angle:a,length:Math.hypot(bounds.right-bounds.left,bounds.bottom-bounds.top)});this.hazard('projectile',{x,y,vx:Math.cos(a)*this.t.bulletSpeed*1.45,vy:Math.sin(a)*this.t.bulletSpeed*1.45,radius:11,damage:this.t.damage*2.4,duration:4,warning:1.7,visual:'alps-cannon'});this.command('heavy-gun-fired');}}
    if(this.due('alps-rear',dt,this.phase===3?Math.max(1.05,this.t.rearFinalInterval||1.05):1.35))this.aimedFan('rearGun',players,this.phase===3?5:3,this.phase===3?.65:.38,.82);
    if(this.due('gik-bomb-run',dt,this.phase===1?7.2:5.4)){const side=Math.sin(this.routeClock)>=0?1:-1;for(let i=0;i<5;i++)this.hazard('circle',{x:this.x+side*(i-2)*32,y:this.y+64+i*58,radius:36,delay:i*.14,warning:1,duration:.3,once:true,damage:this.t.damage*.72,visual:'carpet-bomb'});this.command('phase-change',{phase:'bombing-run'});}
    if(this.phase===3&&this.due('alps-lowrun',dt,.78)){const p=this.target(players);if(p)this.hazard('circle',{x:p.x,y:p.y,radius:34,warning:.72,duration:.24,once:true,damage:this.t.damage*.65,visual:'alps-flak'});}
  }
}
export class Ca4 extends AlpsPatternBoss {
  constructor(options){super({...options,kind:'ca4',parts:[
    {id:'leftEngine',x:-68,y:-25,radius:24,maxHp:options.tuning.maxHp*.063,kind:'engine'},
    {id:'centerEngine',x:0,y:40,radius:21,maxHp:options.tuning.maxHp*.053,kind:'engine'},
    {id:'rightEngine',x:68,y:-25,radius:24,maxHp:options.tuning.maxHp*.063,kind:'engine'},
    {id:'bombBay',x:0,y:0,radius:27,maxHp:options.tuning.maxHp*.07,hittable:false},
    {id:'frontGun',x:0,y:-112,radius:18,maxHp:options.tuning.maxHp*.047},
    {id:'rearGun',x:0,y:112,radius:18,maxHp:options.tuning.maxHp*.047}
  ]});this.phase=1;this.reentry=0;}
  locateHit(spec){return this.hidden?null:super.locateHit(spec);}
  hit(attack){
    if(this.hidden)return{damage:0,blocked:true};
    if(!attack.partId&&this.phase===1)return super.hit({...attack,damage:Math.min(attack.damage,Math.max(0,this.hp-this.maxHp*.67))});
    return super.hit(attack);
  }
  onPartDestroyed(p){super.onPartDestroyed(p);if(p.id==='bombBay'&&!this.bayRuptured){this.bayRuptured=true;const blast=Math.min(this.hp,this.maxHp*.18);this.hp-=blast;this.command('internal-explosion',{x:this.x,y:this.y,damage:blast});this.setPhase(3);}}
  update(dt,{players,bounds,peaks=[]}){
    const engines=['leftEngine','centerEngine','rightEngine'].filter(id=>this.part(id).destroyed).length;
    const imbalance=(this.part('leftEngine').destroyed?1:0)-(this.part('rightEngine').destroyed?1:0);this.cruise(dt,{kind:'ca4',engineLoss:engines,imbalance});
    if(this.phase===1&&(this.hp<=this.maxHp*.67||engines)){this.setPhase(2);this.hidden=true;this.reentry=1.9;this.reentrySide=this.rng()<.5?-1:1;this.entryX=this.reentrySide<0?bounds.left+90:bounds.right-90;this.entryY=bounds.top+105;this.command('hide',{peakId:peaks[0]?.id||null});this.command('reentry-warning',{x:this.entryX,y:bounds.top-30,targetX:(bounds.left+bounds.right)/2,targetY:bounds.bottom-80,seconds:this.reentry});}
    if(this.phase===2&&this.hp<=this.maxHp*.33){this.setPhase(3);this.part('bombBay').hittable=true;}
    if(this.hidden){this.reentry=Math.max(0,this.reentry-dt);if(this.reentry>0)return;this.hidden=false;this.resetRoute(this.entryX,this.entryY);this.bayExpose=2.4;this.part('bombBay').hittable=true;const target=this.target(players),w=bounds.right-bounds.left,bh=bounds.bottom-bounds.top;
      const open=Math.floor(this.rng()*8);
      for(let i=0;i<16;i++){const col=(i*3+Math.floor(this.rng()*3))%8;if(col===open)continue;
       this.hazard('circle',{x:bounds.left+w*(.12+col*.094)+randBetween(this.rng,-w*.05,w*.05),y:bounds.top+bh*randBetween(this.rng,.28,.72),radius:Math.min(100,w*.078)*randBetween(this.rng,.75,1.25),delay:this.rng()*.85,warning:1.3,duration:.3,once:true,damage:this.t.damage*1.1,visual:'carpet-bomb'});}
      this.command('phase-change',{phase:'bomb-bay-exposed'});}
    if(this.phase===2&&this.bayExpose>0){this.bayExpose=Math.max(0,this.bayExpose-dt);if(this.bayExpose===0)this.part('bombBay').hittable=false;}
    const w=bounds.right-bounds.left;
    if(this.due('ca4-bombs',dt,this.phase===3?2.8:4.6)){const open=[-1,0,1][(this.bombLane=(this.bombLane??-1)+1)%3];
      for(let lane=-1;lane<=1;lane++)if(lane!==open)for(let row=0;row<4;row++)this.hazard('circle',{x:bounds.left+w*(.5+lane*.24)+randBetween(this.rng,-w*.05,w*.05),y:bounds.top+(bounds.bottom-bounds.top)*(.42+row*.12)+randBetween(this.rng,-34,26),radius:Math.min(64,w*.062)+randBetween(this.rng,-8,10),delay:row*.16+randBetween(this.rng,0,.12),warning:1.15,duration:.28,once:true,damage:this.t.damage*.85,visual:'alps-flak'});}
    if(this.due('ca4-guns',dt,1.05)){this.aimedFan('frontGun',players,3,.42,.78);this.aimedFan('rearGun',players,3,.42,.78);}
  }
}

// Tracked armor owns its ground route. It accelerates along its nose, brakes
// for heavy volleys and reverses; camera/player motion never drags the chassis.
class TrenchArmor extends PatternBoss {
  constructor(options,kind){
    const layout=TRENCH_ARMOR_LAYOUT[kind],tuning={...options.tuning,parts:{}};
    super({...options,kind,tuning,parts:[
      ...layout.guns.map(p=>({...p,radius:kind==='a7v-flak'?18:26,kind:'armor-gun'})),
      ...[-1,1].map(side=>({id:side<0?'track-left':'track-right',kind:'track',x:side*layout.trackX,y:layout.trackY,radius:13,maxHp:tuning.partHp*.7})),
      {id:'engine-deck',kind:'engine-deck',x:0,y:layout.engineY,radius:24,maxHp:tuning.partHp*1.1,hittable:false}
    ]});
    this.layout=layout;this.gunIds=layout.gunIds;this.ownsMotion129=true;this.anchorX=this.x;this.anchorY=this.y;
    this.hullYaw=0;this.driveVelocity=0;this.driveDirection=-1;this.drivePause=0;this.driveDistance=0;
    this.tacticalState='advance';this.patternIndex=0;this.coreVulnerable=false;
    const scale=tuning.geometryScale||1;
    for(const p of this.parts.values()){p.localX=p.x;p.localY=p.y;p.baseAngle=layout.guns.find(g=>g.id===p.id)?.baseAngle??0;p.aimAngle=p.baseAngle;p.angle=p.baseAngle;p.recoil=0;}
    this.coreRadius=58*scale;
  }
  suppressive(){} // Every shot belongs to a real surviving mount.
  liveGuns(){return this.gunIds.map(id=>this.parts.get(id)).filter(p=>!p.destroyed);}
  trackLoss(){return ['track-left','track-right'].filter(id=>this.parts.get(id).destroyed).length;}
  syncMounts(){for(const p of this.parts.values()){const q=armorRotate(p.localX,p.localY,this.hullYaw);p.x=q.x;p.y=q.y;p.angle=this.hullYaw+p.aimAngle;}}
  drive(dt,speed){
    const loss=this.trackLoss(),engine=this.parts.get('engine-deck');
    this.drivePause=Math.max(0,this.drivePause-dt);
    if(loss===2||engine.destroyed){this.driveVelocity=0;return;}
    const target=this.drivePause>0?0:speed*(loss?.42:1)*this.driveDirection;
    this.driveVelocity+=Math.max(-32*dt,Math.min(32*dt,target-this.driveVelocity));
    const bias=loss?(this.parts.get('track-left').destroyed?-.14:.14):0;
    this.hullYaw+=Math.max(-.06*dt,Math.min(.06*dt,bias-this.hullYaw));this.syncMounts();
    const dy=Math.cos(this.hullYaw)*this.driveVelocity*dt,dx=-Math.sin(this.hullYaw)*this.driveVelocity*dt;
    this.y+=dy;this.x+=dx;this.driveDistance+=Math.abs(dy);
    const end=this.anchorY+(this.driveDirection<0?-76:72);
    if(this.driveDirection<0?this.y<=end:this.y>=end){this.y=end;this.driveVelocity=0;this.driveDirection*=-1;this.drivePause=1.65;}
  }
  aim(dt,players){
    const p=players.find(p=>p.alive);if(!p)return;
    for(const gun of this.liveGuns()){
      const desired=Math.atan2(p.y-this.y-gun.y,p.x-this.x-gun.x)-this.hullYaw;
      const arc=this.layout.gunArc;
      const a=gun.baseAngle+Math.max(-arc,Math.min(arc,armorAngleDelta(desired,gun.baseAngle)));
      const step=this.layout.gunTurnSpeed*dt;
      gun.aimAngle+=Math.max(-step,Math.min(step,armorAngleDelta(a,gun.aimAngle)));
      gun.angle=this.hullYaw+gun.aimAngle;gun.recoil=Math.max(0,gun.recoil-dt);
    }
  }
  muzzle(gun){
    gun.recoil=.18;
    const point=armorGunMuzzle(this.kind,gun,this.hullYaw,this.t.geometryScale||1);
    const x=this.x+point.x,y=this.y+point.y;
    this.command('muzzle',{x,y,partId:gun.id});return{x,y};
  }
  locateHit({x,y,radius=0}){
    const s=this.t.geometryScale||1,q=armorRotate(x-this.x,y-this.y,-this.hullYaw);
    for(const p of this.parts.values()){
      if(!p.hittable||p.destroyed)continue;
      if(p.kind==='track'){
        // Full visible tread length, not a single circular dot at its end.
        if(Math.abs(q.x-p.localX)<=this.layout.trackWidth*s/2+radius&&Math.abs(q.y)<=this.layout.trackHalfLength*s+radius)return{partId:p.id};
      }else if(Math.hypot(q.x-p.localX,q.y-p.localY)<=p.radius+radius)return{partId:p.id};
    }
    return this.coreVulnerable&&Math.abs(q.x)<=57*s+radius&&Math.abs(q.y)<=119*s+radius?{partId:null}:null;
  }
  hitAt(attack){const at=this.locateHit(attack);return at?this.hit({...attack,...at}):{damage:0,miss:true};}
  hit(attack){
    const armor=this.liveGuns().length?(this.kind==='a7v-flak'?.5:.6):1;
    return super.hit(!attack.partId?{...attack,damage:attack.damage*armor}:attack);
  }
  onPartDestroyed(part){
    if(part.kind==='track'){
      if(this.trackLoss()===2)this.driveVelocity=0;
      this.command('phase-change',{phase:this.trackLoss()===2?'tracks-disabled':'track-disabled'});
    }else if(part.kind==='engine-deck'){
      this.driveVelocity=0;this.hp=Math.max(1,this.hp-this.maxHp*.18);this.coreVulnerable=true;this.phase=this.liveGuns().length?'breached':'exposed';
      this.command('cancel-hazards',{tag:'armor-engine-vent'});
      this.command('ammo-cookoff',{x:this.x+part.x,y:this.y+part.y});
      this.command('phase-change',{phase:'engine-disabled'});
    }else{
      this.command('cancel-hazards',{tag:this.gunTag(part)});
      const left=this.liveGuns().length,threshold=this.kind==='a7v-flak'?2:1;
      if(left<=threshold){this.coreVulnerable=true;this.phase=left?'breached':(this.kind==='mark-v-cruiser'?'final-assault':'exposed');this.command('phase-change',{phase:this.phase});}
      if(part.id==='front'&&this.kind==='a7v-flak')this.command('cancel-hazards',{tag:'a7v-lights'});
    }
    if(this.coreVulnerable||this.trackLoss()===2)this.parts.get('engine-deck').hittable=true;
  }
  gunTag(gun){return this.kind==='a7v-flak'?'a7v-'+gun.id:gun.id;}
  hullGun(dt,players,interval){
    if(!this.coreVulnerable||!this.due('hull-gun',dt,interval))return;
    const p=this.target(players);if(!p)return;
    const s=this.t.geometryScale||1,relative=armorRotate(p.x-this.x,p.y-this.y,-this.hullYaw);
    const mount=armorRotate(0,relative.y>0?116:-116,this.hullYaw),x=this.x+mount.x*s,y=this.y+mount.y*s;
    const angle=Math.atan2(p.y-y,p.x-x),count=this.parts.get('engine-deck').destroyed?3:6;
    this.command('muzzle',{x,y});
    for(let i=0;i<count;i++){
      // A short locked burst leaves space to evade; it cannot turn after launch.
      const a=angle+(i-(count-1)/2)*.035;
      this.hazard('projectile',{x,y,delay:i*.085,vx:Math.cos(a)*this.t.bulletSpeed,vy:Math.sin(a)*this.t.bulletSpeed,
        radius:4,duration:2.8,damage:this.t.damage*.38,visual:'armor-tracer',tag:'armor-hull-gun'});
    }
  }
  engineVent(dt){
    const engine=this.parts.get('engine-deck');
    if(!this.coreVulnerable||engine.destroyed||!this.due('engine-vent',dt,6.2))return;
    this.tacticalState='engine-vent';
    this.hazard('circle',{x:this.x+engine.x,y:this.y+engine.y,radius:68,warning:1.25,duration:2.3,tickInterval:.8,damage:this.t.damage*.45,visual:'livens-leak',tag:'armor-engine-vent'});
  }
  impact(gun,x,y,{delay=0,radius=37,warning=1.22,damage=1}={}){
    // The target sets the ballistic landing point. Never teleport a fixed
    // casemate's barrel to that point when a volley is emitted.
    const m=this.muzzle(gun);
    this.hazard('circle',{x,y,radius,delay,warning,duration:.48,once:true,damage:this.t.damage*damage,
      visual:'aa-flak',sourceX:m.x,sourceY:m.y,sourcePartId:gun.id,tag:this.gunTag(gun)});
  }
}

export class A7VFlak extends TrenchArmor {
  constructor(options){
    super(options,'a7v-flak');this.phase='fortress';this.turretCursor=0;this.illumination=new Map();
    this.timers.set('lights',.5);this.timers.set('turret-cycle',.85);this.timers.set('armor-pattern',3.4);
  }
  update(dt,{players,bounds,isIlluminated}){
    this.drive(dt,this.phase==='exposed'?26:20);this.aim(dt,players);
    for(const p of players){const key=p.id??p,age=isIlluminated?.(p)?Math.min(.7,(this.illumination.get(key)||0)+dt):0;this.illumination.set(key,age);}
    const front=this.parts.get('front'),guns=this.liveGuns();
    if(!front.destroyed&&this.due('lights',dt,this.t.lightInterval||8))for(let i=0;i<2;i++)this.hazard('searchlight',{
      x:this.x+front.x+(i?22:-22),y:this.y+front.y,angle:Math.PI/2+(i?-.28:.28),angularSpeed:i?.19:-.19,
      halfAngle:.13,radius:(bounds.bottom-bounds.top)*1.2,duration:5.8,warning:.8,damage:0,tickInterval:.2,visual:'searchlight',tag:'a7v-lights'});
    if(guns.length&&this.due('armor-pattern',dt,guns.length>2?5.9:6.7)){
      const p=this.target(players);if(p){
        this.drivePause=1.8;this.timers.set('turret-cycle',2.5);const width=bounds.right-bounds.left;
        const columns=width<620?3:5,step=Math.min(93,(width-64)/(columns+1)),radius=Math.min(35,step*.34);
        const margin=step*(columns-1)/2+radius+14;
        const cx=Math.max(bounds.left+margin,Math.min(bounds.right-margin,p.x+(p.vx||0)*.24));
        const cy=Math.max(bounds.top+50,Math.min(bounds.bottom-50,p.y+(p.vy||0)*.24));
        if(this.patternIndex++%2===0){
          this.tacticalState='cross-barrage';const gap=Math.floor(columns/2);
          for(let i=0;i<columns;i++)if(i!==gap)this.impact(guns[i%guns.length],cx+(i-gap)*step,cy,{delay:Math.abs(i-gap)*.12,radius,warning:1.25});
        }else{
          this.tacticalState='creeping-barrage';
          // Advance down one line; the other side remains clear. Warnings are
          // locked once and never follow the aircraft after the first shot.
          const side=p.x<this.x?-1:1,tx=Math.max(bounds.left+48,Math.min(bounds.right-48,p.x+side*68));
          for(let i=0;i<3;i++)this.impact(guns[i%guns.length],tx,Math.max(bounds.top+42,Math.min(bounds.bottom-42,cy+(i-1)*78)),{delay:i*.32,radius:35,warning:1.28});
        }
      }
    }
    if(guns.length&&this.due('turret-cycle',dt,(this.t.flakInterval||3.8)/Math.max(1,guns.length))){
      const p=this.target(players);if(p){
        const gun=guns.reduce((best,g)=>Math.abs(armorAngleDelta(Math.atan2(p.y-this.y-g.y,p.x-this.x-g.x),g.baseAngle+this.hullYaw))<Math.abs(armorAngleDelta(Math.atan2(p.y-this.y-best.y,p.x-this.x-best.x),best.baseAngle+this.hullYaw))?g:best,guns[0]);
        const locked=(this.illumination.get(p.id??p)||0)>=.55,lead=locked?.48:.2,scatter=locked?12:44;
        this.impact(gun,p.x+(p.vx||0)*lead+randBetween(this.rng,-scatter,scatter),p.y+(p.vy||0)*lead+randBetween(this.rng,-scatter,scatter),{radius:locked?43:49,warning:locked?.96:1.22,damage:locked?1.18:1});
      }
    }
    this.hullGun(dt,players,guns.length?3.4:2.2);this.engineVent(dt);
  }
}

export class MarkVCruiser extends TrenchArmor {
  constructor(options){super(options,'mark-v-cruiser');this.phase='barrage';this.sponsonSide=0;this.timers.set('sponson-cycle',1.15);this.timers.set('armor-pattern',3.8);}
  update(dt,{bounds,players=[]}){
    const guns=this.liveGuns();this.drive(dt,guns.length?19:29);this.aim(dt,players);
    if(guns.length&&this.due('armor-pattern',dt,6.8)){
      const p=this.target(players);if(p){this.drivePause=1.8;this.timers.set('sponson-cycle',2.45);
        if(this.patternIndex++%2===0){
          this.tacticalState='flank-bombardment';
          const width=bounds.right-bounds.left,separation=Math.min(105,width*.23),radius=Math.min(38,separation*.4);
          for(const gun of guns){const side=gun.id==='sponson-left'?-1:1;
            for(let row=0;row<2;row++)this.impact(gun,Math.max(bounds.left+radius+12,Math.min(bounds.right-radius-12,p.x+side*separation)),Math.max(bounds.top+48,Math.min(bounds.bottom-48,p.y+(row-.5)*90)),{delay:row*.3,radius,warning:1.3,damage:.95});}
        }else{
          this.tacticalState='sponson-sweep';
          for(const gun of guns){const side=gun.id==='sponson-left'?-1:1,m=this.muzzle(gun),base=gun.angle;
            // A sequential fan can be crossed between rounds; no instant wall.
            const count=Math.max(3,Math.min(7,Math.ceil(6*(this.t.projectileDensity??1))));
            for(let i=0;i<count;i++){const a=base+side*(i/(count-1)-.5)*.82;
              this.hazard('projectile',{x:m.x,y:m.y,delay:.3+i*.18,vx:Math.cos(a)*this.t.bulletSpeed*.8,vy:Math.sin(a)*this.t.bulletSpeed*.8,
                radius:6,duration:3,damage:this.t.damage*.72,visual:'aa-shell',tag:this.gunTag(gun)});}
          }
        }
      }
    }
    if(guns.length&&this.due('sponson-cycle',dt,guns.length===2?2.25:2.9)){
      const gun=guns[this.sponsonSide++%guns.length],m=this.muzzle(gun),a=gun.angle;
      for(let i=0;i<3;i++)this.hazard('projectile',{x:m.x,y:m.y,delay:i*.14,vx:Math.cos(a)*this.t.bulletSpeed*.86,vy:Math.sin(a)*this.t.bulletSpeed*.86,
        radius:6,duration:3.2,damage:this.t.damage*.7,visual:'aa-shell',tag:this.gunTag(gun)});
    }
    this.hullGun(dt,players,guns.length?3.6:2.05);this.engineVent(dt);
  }
}


export class ArmoredHarborFortress extends PatternBoss {
  constructor(options) {
    super({...options,kind:'armored-harbor-fortress',parts:[
      {id:'crane-arm',x:-78,y:13,radius:34,maxHp:options.tuning.partHp*1.05},
      {id:'crane-pivot',x:-78,y:13,radius:29,maxHp:options.tuning.partHp*1.15,hittable:false},
      {id:'ammo-storage',x:58,y:38,radius:34,maxHp:options.tuning.partHp*1.1},
      {id:'gun-left',x:-91,y:62,radius:27},
      {id:'gun-right',x:91,y:62,radius:27},
      {id:'seaplane-facility',x:68,y:-58,radius:37,maxHp:options.tuning.partHp*1.1}
    ]});
    this.phase='coastal-battery';this.coreVulnerable=false;this.craneAngle=-.4;this.elapsed=0;this.gunSide=0;this.craneSwing=0;
    this.externalParts=['crane-arm','ammo-storage','gun-left','gun-right','seaplane-facility'];
  }
  destroyedExternal(){return this.externalParts.filter(id=>this.parts.get(id).destroyed).length;}
  onPartDestroyed(p){
    if(p.id==='ammo-storage'&&!this.ammoDetonated){this.ammoDetonated=true;this.hp=Math.max(1,this.hp-this.maxHp*.15);this.command('ammo-detonation',{x:this.x+p.x,y:this.y+p.y});}
    const lost=this.destroyedExternal();
    if(lost>=1&&this.phase==='coastal-battery'){this.phase='seaplane-support';this.command('phase-change',{phase:this.phase});}
    if(lost>=3&&this.phase!=='breached'&&this.phase!=='final-core'){this.phase='breached';this.parts.get('crane-pivot').hittable=true;this.command('phase-change',{phase:this.phase});}
    if(p.id==='crane-pivot'){this.phase='final-core';this.coreVulnerable=true;this.hp=Math.min(this.hp,this.maxHp*.3);this.command('phase-change',{phase:this.phase});}
  }
  update(dt,{players,bounds}){
    this.elapsed+=dt;const arm=this.parts.get('crane-arm'),pivot=this.parts.get('crane-pivot');
    if(!arm.destroyed&&!pivot.destroyed){
      const p=this.target(players);if(p&&this.craneSwing<=0){const desired=Math.atan2(p.y-(this.y+arm.y),p.x-(this.x+arm.x));this.craneAngle=turnToward(this.craneAngle,desired,.42*dt)}
      this.craneSwing=Math.max(0,this.craneSwing-dt);
    }
    if(this.phase==='coastal-battery'&&this.elapsed>=16){this.phase='seaplane-support';this.command('phase-change',{phase:this.phase});}
    const guns=['gun-left','gun-right'].map(id=>this.parts.get(id)).filter(p=>!p.destroyed);
    if(guns.length&&this.due('harbor-guns',dt,(this.t.coastalInterval||2.5)*(guns.length===1?.88:1))){const gun=guns[this.gunSide++%guns.length],p=this.target(players);if(p){const x=this.x+gun.x,y=this.y+gun.y,a=Math.atan2(p.y-y,p.x-x);this.command('muzzle',{x,y,partId:gun.id});this.fan(x,y,a,5,.72,this.t.bulletSpeed*.82,'harbor-shell');}}
    if(!arm.destroyed&&!pivot.destroyed&&this.due('crane-mines',dt,this.t.craneInterval||4.8)){
      this.craneSwing=1.5;const scale=this.t.geometryScale||1,originX=this.x+arm.x,originY=this.y+arm.y;
      // Drops follow the visible boom, with a fixed warning before impact.
      for(let i=0;i<3;i++){const reach=(125+i*30)*scale,a=this.craneAngle;this.hazard('circle',{x:originX+Math.cos(a)*reach,y:originY+Math.sin(a)*reach,radius:38,delay:i*.18,warning:1.05,duration:.3,once:true,damage:this.t.damage*.75,visual:'harbor-mine'});}
      this.command('crane-drop',{x:originX,y:originY});
    }
    if(bounds&&this.due('harbor-minefield',dt,this.phase==='final-core'?3.2:6.4)){
      const p=this.target(players),w=bounds.right-bounds.left;
      if(p){
        const cx=Math.max(bounds.left+w*.24,Math.min(bounds.right-w*.24,p.x+(p.vx||0)*.7)),gate=[0,2,4][(this._mineFieldWave=(this._mineFieldWave??0)+1)%3],step=Math.max(52,Math.min(72,w/7)),points=[];
        for(let row=0;row<2;row++)for(let col=0;col<5;col++)if(col!==gate)points.push({x:cx+(col-2)*step,y:p.y-100-row*64+(this._mineFieldWave%2?28:0)});
        if(this.phase==='final-core')for(let i=0;i<6;i++){const a=this.rng()*6.28,d=90+this.rng()*110;points.push({x:cx+Math.cos(a)*d,y:p.y+Math.sin(a)*d*.7});}
        this.command('spawn-minefield',{points:points.filter(q=>q.x>bounds.left+25&&q.x<bounds.right-25&&q.y>bounds.top+25&&q.y<bounds.bottom-25&&Math.hypot(q.x-p.x,q.y-p.y)>75),warning:.8,life:9,maxMines:this.phase==='final-core'?20:14});
      }
    }
    if(this.phase!=='coastal-battery'&&!this.parts.get('seaplane-facility').destroyed&&this.due('harbor-seaplanes',dt,this.t.harborLaunchInterval||5.6)){
      const p=this.target(players),count=this.phase==='final-core'?3:2,a=Math.PI/2,q={x:this.x+this.parts.get('seaplane-facility').x,y:this.y+this.parts.get('seaplane-facility').y};
      for(let i=0;i<count;i++)this.command('spawn-minion',{minion:this.faction==='central'?'seaplane-central':'seaplane-entente',faction:this.faction,x:q.x+(i-(count-1)/2)*42,y:q.y-30,a,behavior:'attack-pass',formationIndex:i,formationCount:count,passTargetX:(p?.x??q.x)+(p?.vx||0)*.8,passTargetY:(p?.y??bounds.bottom)+(p?.vy||0)*.8,invulnerableSeconds:.4});
    }
    if(this.phase==='final-core'&&this.due('last-barrage',dt,2.45)){const p=this.target(players);if(p)for(let i=0;i<5;i++)this.hazard('circle',{x:p.x+(i-2)*48,y:p.y+(p.vy||0)*.35,radius:44,delay:i*.12,warning:.76,duration:.3,once:true,damage:this.t.damage,visual:'harbor-shell'});}
  }
}


const turnToward=(from,to,maxStep)=>from+Math.max(-maxStep,Math.min(maxStep,Math.atan2(Math.sin(to-from),Math.cos(to-from))));
export class LivensFlameProjector extends PatternBoss {
  constructor(options){
    super({...options,coreRadius:68,kind:'livens-flame-projector',parts:[
      {id:'tank-l1',x:-155,y:-72,radius:42},{id:'tank-l2',x:-155,y:72,radius:42},
      {id:'tank-r1',x:155,y:-72,radius:42},{id:'tank-r2',x:155,y:72,radius:42},
      {id:'pressure',x:0,y:72,radius:42}
    ]});
    this.phase='sealed';this.coreVulnerable=false;this.ownsMotion129=true;this.anchorX=this.x;this.anchorY=this.y;
    // The armored nozzle is a permanent mount, not a destructible weakpoint.
    this.nozzleMount={x:0,y:-98,length:85};this.nozzleAngle=-Math.PI/2;this.lockedFlameAngle=null;
    this.flameCount=0;this.flameMode='track';this.flameAngSpeed=0;this.flameWarn=0;this.flameAge=0;this.spinRate=1.55;this._gasTier=3;
  }
  locateHit({x,y,radius=0}){
    for(const p of this.parts.values())if(p.hittable&&!p.destroyed){
      const dx=x-this.x-p.x,dy=y-this.y-p.y;
      // The horizontal fuel vessels use their visible atlas footprint.
      const inside=p.id.startsWith('tank-')
        ?(dx/(74+radius))**2+(dy/(45+radius))**2<=1
        :Math.hypot(dx,dy)<=p.radius+radius;
      if(inside)return{partId:p.id};
    }
    return Math.hypot(x-this.x,y-this.y)<=this.coreRadius+radius?{partId:null}:null;
  }
  hitAt({x,y,radius=0,damage}){
    const target=this.locateHit({x,y,radius});
    return target?this.hit({...target,damage}):{damage:0,miss:true};
  }
  suppressive(){/* Livens attacks through its persistent flamethrower and fuel leaks. */}
  onPartDestroyed(p){
    if(p.id.startsWith('tank-'))this.hazard('circle',{x:this.x+p.x,y:this.y+p.y,radius:54,warning:.65,duration:2,tickInterval:.35,damage:this.t.damage*.55,visual:'livens-leak',tag:'livens-leak'});
    if(p.id==='pressure')this.hazard('circle',{x:this.x+p.x,y:this.y+p.y,radius:68,warning:.8,duration:.4,once:true,damage:this.t.damage*.75,visual:'livens-pressure'});
    // The core opens once the fuel/pressure system is wrecked; the nozzle
    // mount keeps fighting until the boss itself is destroyed.
    if(this.allDestroyed(['tank-l1','tank-l2','tank-r1','tank-r2','pressure'])){
      this.phase='core-exposed';this.coreVulnerable=true;this.command('phase-change',{phase:'exposed'});
    }
  }
  update(dt,{players}){
    if(this.dead)return;
    this.x=this.anchorX;this.y=this.anchorY;
    if(this._gasTier>0&&this.hp<=this.maxHp*this._gasTier*.25){this._gasTier--;
      for(let i=0;i<3;i++){const a=this.rng()*6.28,d=60+this.rng()*90;this.command('gas-zone',{x:this.x+Math.cos(a)*d,y:this.y+Math.sin(a)*d,radius:120+this.rng()*40,life:8});}
      this.command('phase-change',{phase:'gas-vent'});}
    const nozzle=this.nozzleMount,target=this.target(players);
    const finalPhase=this.hp<=this.maxHp*.22;
    if(finalPhase){this.nozzleAngle+=this.spinRate*dt;} // 360° rampage
    else if(this.lockedFlameAngle!=null){
      // Burst in flight: frozen during the warning, sweeps during the burn.
      this.flameAge+=dt;
      if(this.flameMode!=='track'&&this.flameAge>this.flameWarn)this.nozzleAngle+=this.flameAngSpeed*dt;
    }
    else if(target){
      const desired=Math.atan2(target.y-(this.y+nozzle.y),target.x-(this.x+nozzle.x));
      this.nozzleAngle=turnToward(this.nozzleAngle,desired,.92*dt);
    }
    if(this.due('main-flame',dt,this.t.flameInterval||5.8)){
      const pressure=this.parts.get('pressure'),weakened=pressure.destroyed;
      const warn=weakened?1.4:1.15;
      let mode='track',angSpeed=0,dur=weakened?1.2:1.8,telegraphHalf=0,startAngle=this.nozzleAngle;
      if(finalPhase){mode='spin';dur=4.4;angSpeed=this.spinRate;startAngle=this.nozzleAngle+angSpeed*warn;telegraphHalf=Math.PI;}
      else if(this.flameCount%3===2){mode='sweep';dur=weakened?1.5:2.2;const span=.9,dir=this.flameCount%2?-1:1;angSpeed=dir*span/dur;startAngle=this.nozzleAngle-Math.sign(angSpeed)*span/2;telegraphHalf=span/2;}
      this.flameMode=mode;this.flameAngSpeed=angSpeed;this.flameWarn=warn;this.flameAge=0;this.flameCount++;
      this.lockedFlameAngle=startAngle;
      // Beam pivots at the turret mount so sweep/spin origins track the nozzle;
      // the flame itself is drawn from the muzzle in the view.
      const muzzleX=this.x+nozzle.x,muzzleY=this.y+nozzle.y;
      this.hazard('beam',{x:muzzleX,y:muzzleY,angle:startAngle,angularSpeed:angSpeed,telegraphHalf,length:(weakened?390:560)+nozzle.length,thickness:weakened?38:54,
        muzzleLength:nozzle.length,warning:warn,duration:dur,tickInterval:.22,damage:this.t.damage*(weakened?.65:1),visual:'livens-flame',tag:'livens-flame'});
      this.command('flame-warning',{x:muzzleX,y:muzzleY,angle:startAngle,seconds:warn});
      this.flameLockTime=warn+dur;
    }
    if(this.flameLockTime>0){this.flameLockTime=Math.max(0,this.flameLockTime-dt);if(!this.flameLockTime){this.lockedFlameAngle=null;this.flameMode='track';}}
    const broken=['tank-l1','tank-l2','tank-r1','tank-r2'].filter(id=>this.parts.get(id).destroyed);
    if(broken.length&&this.due('leak-fire',dt,Math.max(2.2,5-broken.length*.55))){const id=broken[Math.floor(this.rng()*broken.length)],p=this.parts.get(id);this.hazard('circle',{x:this.x+p.x,y:this.y+p.y,radius:54,warning:.8,duration:2.2,tickInterval:.35,damage:this.t.damage*.55,visual:'livens-leak'});}
  }
}
export class MinenwerferBattery extends PatternBoss {
  constructor(options){
    const originalHp=options.tuning.maxHp,gunHp=originalHp*.4,tuning={...options.tuning,maxHp:gunHp*3};
    super({...options,tuning,coreRadius:64,kind:'minenwerfer-battery',parts:[
      {id:'gun-left',x:-220,y:18,radius:105,maxHp:gunHp},{id:'main-gun',x:0,y:-36,radius:110,maxHp:gunHp},{id:'gun-right',x:220,y:18,radius:105,maxHp:gunHp}
    ]});
    this.phase='cross-barrage';this.coreVulnerable=true;this.ownsMotion129=true;this.anchorX=this.x;this.anchorY=this.y;
    this.shotSerial=0;this.baseVolleyCount=0;this.specialWave=0;this.specialClock=8.4;this._gasTier=3;
    for(const [i,id] of ['gun-left','main-gun','gun-right'].entries())this.timers.set('emplacement-'+id,.16+i*.9);
  }
  suppressive(){/* The three emplacements own every Minenwerfer attack. */}
  liveGuns(){return [...this.parts.values()].filter(p=>!p.destroyed);}
  locateHit({x,y,radius=0}){
    for(const p of this.parts.values())if(!p.destroyed&&Math.hypot(x-this.x-p.x,y-this.y-p.y)<=p.radius+radius)return{partId:p.id};
    return null;
  }
  hitAt({x,y,radius=0,damage}){const target=this.locateHit({x,y,radius});return target?this.hit({...target,damage}):{damage:0,miss:true};}
  hit(attack){
    if(!attack.partId||!this.parts.has(attack.partId))return{damage:0,blocked:true};
    const result=super.hit(attack);this.hp=this.liveGuns().reduce((n,p)=>n+p.hp,0);
    if(this.hp<=0&&!this.dead){this.dead=true;this.phase='defeated';this.emit({type:'body-defeated',bossId:this.id});}
    return result;
  }
  onPartDestroyed(p){
    this.command('cancel-hazards',{tag:'minenwerfer-'+p.id});
    this.command('ammo-cookoff',{x:this.x+p.x,y:this.y+p.y,partId:p.id});
    const alive=this.liveGuns().length;
    if(alive===2){this.phase='weakened';this.specialClock=Math.max(this.specialClock,10.5);this.command('phase-change',{phase:'weakened'});}
    else if(alive===1){this.phase='final-assault';this.specialClock=7.5;this.command('phase-change',{phase:'final-assault'});}
  }
  aimPoint(gun,target,serial,bounds){
    const vx=target.vx||0,vy=target.vy||0,speed=Math.hypot(vx,vy),dx=speed>12?vx/speed:0,dy=speed>12?vy/speed:-1;
    let x=target.x,y=target.y;
    if(gun.id==='main-gun'){x+=vx*.78;y+=vy*.78;}
    else if(gun.id==='gun-right'){
      const side=serial%2?1:-1;x+=vx*.38-dy*side*96;y+=vy*.38+dx*side*96;
    }else{x+=vx*.12;y+=vy*.12;}
    x+=(this.rng()-.5)*14;y+=(this.rng()-.5)*14;
    if(bounds){x=Math.max(bounds.left+34,Math.min(bounds.right-34,x));y=Math.max(bounds.top+34,Math.min(bounds.bottom-34,y));}
    return{x,y,dx,dy};
  }
  shell(gun,x,y,{delay=0,warning=1.02,heavy=false,damage=.78}={}){
    this.hazard('circle',{x,y,sourceX:this.x+gun.x,sourceY:this.y+gun.y,radius:heavy?58:48,delay,warning,duration:.62,once:true,
      damage:this.t.damage*damage,visual:heavy?'minenwerfer-heavy':'minenwerfer-shell',tag:'minenwerfer-'+gun.id});
  }
  launch(gun,players,bounds,triple=false){
    const target=this.target(players);if(!gun||gun.destroyed||!target)return;
    const aim=this.aimPoint(gun,target,this.shotSerial++,bounds),count=triple?3:1;
    for(let i=0;i<count;i++){const along=triple?(i-1)*58:0;this.shell(gun,aim.x+aim.dx*along,aim.y+aim.dy*along,{delay:i*.32,heavy:gun.id==='main-gun',damage:gun.id==='main-gun'?.9:.76});}
    this.command('mortar-launch',{x:this.x+gun.x,y:this.y+gun.y,partId:gun.id});
    this.command('muzzle',{x:this.x+gun.x,y:this.y+gun.y,partId:gun.id});
  }
  cooperative(players,bounds,guns){
    const target=this.target(players);if(!target||guns.length!==3)return;
    const speed=Math.hypot(target.vx||0,target.vy||0),heading=speed>12?Math.atan2(target.vy,target.vx):-Math.PI/2;
    const gap=Math.round(((heading+Math.PI)/(Math.PI*2))*6)%6;
    let shot=0;
    for(let slot=0;slot<6;slot++)if(slot!==gap){const gun=guns[shot%guns.length],a=slot*Math.PI/3,r=112;
      let x=target.x+Math.cos(a)*r,y=target.y+Math.sin(a)*r;if(bounds){x=Math.max(bounds.left+34,Math.min(bounds.right-34,x));y=Math.max(bounds.top+34,Math.min(bounds.bottom-34,y));}
      this.shell(gun,x,y,{delay:shot*.1,warning:1.08,heavy:gun.id==='main-gun',damage:.7});shot++;}
    for(const gun of guns)this.command('mortar-launch',{x:this.x+gun.x,y:this.y+gun.y,partId:gun.id});
  }
  focused(players,bounds,guns){
    const target=this.target(players);if(!target)return;const count=guns.length===3?8:6;
    for(let i=0;i<count;i++){const gun=guns[i%guns.length],aim=this.aimPoint(gun,target,this.shotSerial++,bounds),walk=(i-(count-1)/2)*24;
      this.shell(gun,aim.x+aim.dx*walk,aim.y+aim.dy*walk,{delay:i*(2.35/(count-1)),warning:.72,heavy:gun.id==='main-gun',damage:.68});}
    for(const gun of guns)this.command('mortar-launch',{x:this.x+gun.x,y:this.y+gun.y,partId:gun.id});
  }
  update(dt,{players,bounds}){
    if(this.dead)return;
    this.x=this.anchorX;this.y=this.anchorY;
    if(this._gasTier>0&&this.hp<=this.maxHp*this._gasTier*.25){this._gasTier--;
      for(let i=0;i<3;i++){const a=this.rng()*6.28,d=60+this.rng()*90;this.command('gas-zone',{x:this.x+Math.cos(a)*d,y:this.y+Math.sin(a)*d,radius:120+this.rng()*40,life:8});}
      this.command('phase-change',{phase:'gas-vent'});}
    const guns=this.liveGuns(),alive=guns.length,interval=alive===3?(this.t.mortarInterval||2.7):alive===2?2.4:2;
    for(const gun of guns)if(this.due('emplacement-'+gun.id,dt,interval)){
      const cadence=alive===1?4:7,triple=(++this.baseVolleyCount)%cadence===0;this.launch(gun,players,bounds,triple);
    }
    this.specialClock-=dt*(this.t.patternMultiplier||1);
    if(this.specialClock<=0){
      if(alive===3){this.specialWave++%2?this.focused(players,bounds,guns):this.cooperative(players,bounds,guns);this.specialClock=9.6;}
      else if(alive===2){this.focused(players,bounds,guns);this.specialClock=11.4;}
      else this.specialClock=7.5;
    }
  }
}

export class LondonApron extends PatternBoss {
  suppressive(){/* the changing cable wall is the encounter's attack */ }
  constructor(options) {
    super({...options,kind:'london-apron',parts:[-105,0,105].map((x,i)=>({id:'balloon-'+i,x,y:-58,radius:48}))});
    this.phase='barrier';this.coreVulnerable=false;this.apronLane=-1;this.wireWave=0;
  }
  onPartDestroyed(part) {
    this.command('cancel-hazards',{tag:'apron-'+part.id});
    this.command('aa-effect',{x:this.x+part.x,y:this.y+part.y,kind:'aaBalloonBurst',size:132,life:.48});
    if(this.allDestroyed(['balloon-0','balloon-1','balloon-2'])){
      this.phase='winch-exposed';this.coreVulnerable=true;this.command('phase-change',{phase:this.phase});
      this.command('aa-effect',{x:this.x,y:this.y+75,kind:'aaWireSnap',size:160,life:.55});
    }
  }
  update(dt,{players,bounds}) {
    if(this.phase==='barrier'&&this.due('apron',dt,5.4)){
      const width=bounds.right-bounds.left,closing=++this.wireWave%3===0;
      const gapWidth=Math.max(110,Math.min(closing?132:190,width*(closing?.23:.31)));
      const gapX=bounds.left+width*[.28,.5,.72][++this.apronLane%3],gapLeft=gapX-gapWidth/2,gapRight=gapX+gapWidth/2;
      const y=Math.max(bounds.top+110,Math.min(bounds.bottom-135,this.y+155));
      // A balloon owns precisely one third of each wall. Split at the opening,
      // so the visual cable and the collision segments share identical endpoints.
      for(let i=0;i<3;i++){
        const balloon=this.parts.get('balloon-'+i);if(balloon.destroyed)continue;
        const left=bounds.left+20+i*(width-40)/3,right=bounds.left+20+(i+1)*(width-40)/3;
        for(const [start,end] of [[left,Math.min(right,gapLeft)],[Math.max(left,gapRight),right]]){
          if(end-start<16)continue;
          this.hazard('beam',{x:start,y,angle:0,length:end-start,thickness:10,warning:1.15,duration:3.75,
            tickInterval:.55,damage:Math.round(this.t.damage*1.2),sourceX:this.x+balloon.x,sourceY:this.y+balloon.y+balloon.radius*.35,
            visual:'apron-wire',tag:'apron-'+balloon.id});
        }
      }
      this.command('safe-corridor',{x:gapX,y,width:gapWidth,seconds:4.9});
    }
  }
}

export class DrachenMineNet extends PatternBoss {
  suppressive(){/* mine placement and observation artillery own this encounter */ }
  constructor(options) {
    super({...options,kind:'drachen-net',parts:[{id:'balloon',x:0,y:-72,radius:67},{id:'winch',x:0,y:35,radius:39}]});
    this.phase='observed';this.coreVulnerable=false;this.netWave=0;this.timers.set('mine-lay',1.4);
  }
  onPartDestroyed(p) {
    if(p.id==='balloon'){this.command('cancel-hazards',{tag:'observer-artillery'});this.command('phase-change',{phase:'observer-destroyed'});
      this.command('aa-effect',{x:this.x+p.x,y:this.y+p.y,kind:'aaBalloonBurst',size:165,life:.5});}
    if(p.id==='winch'){this.command('phase-change',{phase:'winch-destroyed'});
      this.command('aa-effect',{x:this.x+p.x,y:this.y+p.y,kind:'aaWinchSpark',size:125,life:.5});}
    if(this.parts.get('balloon').destroyed&&this.parts.get('winch').destroyed){this.coreVulnerable=true;this.phase='core-exposed';this.command('phase-change',{phase:'exposed'});}
  }
  update(dt,{players,bounds}) {
    const observer=!this.parts.get('balloon').destroyed,winch=!this.parts.get('winch').destroyed,p=this.target(players);
    if(winch&&p&&this.due('mine-lay',dt,observer?5.5:7.1)){
      const width=bounds.right-bounds.left,columns=Math.max(4,Math.min(8,Math.floor(width/75)));
      const pitch=Math.min(72,(width-80)/(columns-1)),start=Math.max(bounds.left+40,Math.min(bounds.right-40-(columns-1)*pitch,p.x-(columns-1)*pitch/2));
      const opening=(++this.netWave%columns),y=Math.max(bounds.top+95,Math.min(bounds.bottom-95,p.y-70));
      const points=[];for(let i=0;i<columns;i++)if(Math.abs(i-opening)>0)
        points.push({x:start+i*pitch,y:y+(i%2?18:-18)});
      this.command('spawn-minefield',{points,warning:1.25,life:12,maxMines:16});
      this.command('mine-lay',{x:this.x,y:this.y+this.parts.get('winch').y});
    }
    if(observer&&p&&this.due('observer-flak',dt,3.8)){const lead=.4,scatter=winch?24:68;
      this.hazard('circle',{x:p.x+(p.vx||0)*lead+randBetween(this.rng,-scatter,scatter),
        y:p.y+(p.vy||0)*lead+randBetween(this.rng,-scatter,scatter),radius:53,warning:1.25,duration:.38,once:true,
        damage:this.t.damage,visual:'observer-shell',tag:'observer-artillery'});}
  }
}

// Fliegerzug is an armored train whose wagons launch Kettering Bugs and escort
// fighters instead of carrying a heavy gun — the rail chassis, car hit chain,
// runaway and derail all stay on the shared rail controller.
export class Fliegerzug extends RailAdapter {
  constructor(options){super(options,'fliegerzug');this.kind='fliegerzug';this.bugSalvo=null;}
  railEvent(e){
    if(e.type==='fire'){
      // A firing stop becomes a launch cycle: bugs run down the rails and dive.
      this.bugSalvo={count:2+((this.t.loopIndex||0)>0?1:0),clock:0};
      this.emit({type:'heavy-gun-fired',bossId:this.id,x:this.x,y:this.y});
      this.emit({type:'bug-salvo',bossId:this.id,x:this.x,y:this.y});
      return;
    }
    // No gun onboard: do not telegraph a shell target on the rail segment.
    if(e.type==='aim')return;
    super.railEvent(e);
  }
  launchBug(car,players){
    const target=players.find(p=>p.alive!==false),angle=target?Math.atan2(target.y-(this.y+car.y),target.x-(this.x+car.x)):Math.PI/2;
    this.emit({type:'spawn-minion',bossId:this.id,faction:this.faction,minion:'bug',x:this.x+car.x,y:this.y+car.y,behavior:'suicide-dive',a:angle,speed:166,life:13,contactDamage:Math.min(22,Math.round(this.t.damage*.78))});
  }
  update(dt,ctx){
    super.update(dt,ctx);
    if(this.dead)return;
    const players=ctx.players||[],car=id=>this.parts.get(id);
    const launch=car('car-middle'),hangar=car('car-rear'),flak=car('car-front');
    const salvo=this.bugSalvo;
    if(salvo&&launch&&!launch.destroyed){
      salvo.clock-=dt;
      while(salvo.count>0&&salvo.clock<=0){salvo.count--;salvo.clock+=.65;this.launchBug(launch,players);}
      if(salvo.count<=0)this.bugSalvo=null;
    }else this.bugSalvo=null;
    if(launch&&!launch.destroyed&&this.due('bug-trickle',dt,5.4))this.launchBug(launch,players);
    if(hangar&&!hangar.destroyed&&this.due('hangar-launch',dt,this.phase==='derailed'?10.5:7.6)){
      const p=players.find(p=>p.alive!==false);
      this.emit({type:'spawn-minion',bossId:this.id,faction:this.faction,minion:'escort',x:this.x+hangar.x,y:this.y+hangar.y,behavior:'attack-pass',a:Math.PI/2,passTargetX:p?.x??this.x,passTargetY:(p?.y??this.y)+130,invulnerableSeconds:.5});
    }
    if(flak&&!flak.destroyed&&this.due('flak-car',dt,3.2)){
      const p=players.find(p=>p.alive!==false);
      if(p)this.emit({type:'hazard',bossId:this.id,kind:'circle',x:p.x+(p.vx||0)*.4,y:p.y+(p.vy||0)*.4,radius:52,warning:1.1,duration:.4,once:true,damage:this.t.damage*.82,visual:'black-flak',sourcePartId:'car-front'});
    }
  }
}

// Treffas-Wagen rolls forward on its twin drum wheels, crushing terrain into debris
// sprays. Wheels are mobility, the turret is the gun: break wheels to halt the
// advance (it digs in and fires harder), break everything to expose the hull.
export class TreffasWagen extends PatternBoss {
  constructor(options){
    super({...options,kind:'treffas-wagen',coreRadius:options.tuning.coreRadius||86,parts:[
      {id:'wheel-left',x:-60,y:59,radius:52,maxHp:options.tuning.partHp*1.2},
      {id:'wheel-right',x:60,y:59,radius:52,maxHp:options.tuning.partHp*1.2},
      {id:'turret',x:0,y:-88,radius:30,maxHp:options.tuning.partHp*1.3},
      {id:'rudder',x:0,y:81,radius:24}
    ]});
    this.phase='advance';this.coreVulnerable=false;this.ownsMotion129=true;
    this.anchorX=this.x;this.startY=this.y;this.anchorY=this.y;this.wheelRoll=0;this.motionTime=0;
    this.timers.set('treffas-mortar',2.2);this.timers.set('treffas-mg',1.1);this.timers.set('treffas-debris',.5);
  }
  wheelsAlive(){return ['wheel-left','wheel-right'].filter(id=>!this.parts.get(id).destroyed).length;}
  wheelBias(){const l=this.parts.get('wheel-left'),r=this.parts.get('wheel-right');return l.destroyed&&!r.destroyed?-1:!l.destroyed&&r.destroyed?1:0;}
  onPartDestroyed(){
    if(this.allDestroyed(['wheel-left','wheel-right'])&&['advance','enraged'].includes(this.phase)){
      // A halted Treffas-Wagen digs in as a gun platform instead of dying.
      this.phase='crippled';this.command('phase-change',{phase:'crippled'});
    }
    if(this.allDestroyed(['wheel-left','wheel-right','turret','rudder'])&&!this.coreVulnerable){
      this.coreVulnerable=true;this.phase='exposed';this.command('phase-change',{phase:'exposed'});
    }
  }
  debrisBurst(x,y,count,spread,damage){
    for(let i=0;i<count;i++){const a=(this.wheelBias()||1)*.9+(this.rng()-.5)*spread*2+(i-(count-1)/2)*spread/(count/2);
      this.hazard('projectile',{x,y,vx:Math.cos(a)*195,vy:Math.sin(a)*195+40,radius:9,duration:1.5,once:true,damage,visual:'treffas-debris'});}
  }
  update(dt,{players,bounds}){
    if(this.dead)return;
    const wheels=this.wheelsAlive(),crippled=wheels===0;
    if(!crippled&&this.phase==='advance'&&this.hp<=this.maxHp*.3){this.phase='enraged';this.command('phase-change',{phase:'enraged'});}
    const enraged=this.phase==='enraged',speed=crippled?0:30*(enraged?1.6:1)*(this.wheelBias()?.55:1);
    // The motion clock feeds both the churn trail and the wheel rotation art.
    this.wheelRoll+=speed*dt*.05;
    this.anchorY+=speed*dt;
    const limit=this.startY+330;if(this.anchorY>limit)this.anchorY=limit;
    this.y=this.anchorY+Math.sin(this.motionTime*.4)*10;
    this.x=this.anchorX+Math.sin(this.motionTime*.23)*120+this.wheelBias()*55;
    // Wheels leave churned ground behind; the view consumes this trail.
    this._churn??=[];const last=this._churn[this._churn.length-1];
    if(speed>0&&(!last||Math.hypot(this.x-last.x,this.y-last.y)>30))this._churn.push({x:this.x,y:this.y+58});
    if(this._churn.length>110)this._churn.splice(0,this._churn.length-110);
    // Wheels shed dirt and rock sideways as they crush the ground.
    if(speed>0&&this.due('treffas-debris',dt,enraged?.65:.85)){
      for(const id of ['wheel-left','wheel-right']){const w=this.parts.get(id);if(w.destroyed)continue;
        const side=id==='wheel-left'?-1:1,wx=this.x+w.x,wy=this.y+w.y;
        this.hazard('projectile',{x:wx,y:wy+24,vx:side*(135+this.rng()*55),vy:28+this.rng()*62,radius:7,duration:1.35,once:true,damage:this.t.damage*.28,visual:'treffas-debris'});
        if(this.rng()<.25)this.hazard('projectile',{x:wx,y:wy+24,vx:side*(55+this.rng()*45),vy:105+this.rng()*50,radius:7,duration:1.45,once:true,damage:this.t.damage*.28,visual:'treffas-debris'});
      }
    }
    if(crippled&&this.due('treffas-burst',dt,3.2))this.debrisBurst(this.x,this.y-40,8,.58,this.t.damage*.32);
    const turret=this.parts.get('turret');
    if(turret&&!turret.destroyed&&this.due('treffas-mortar',dt,(crippled?3.4:enraged?3.1:4.8))){
      const p=this.target(players);if(p){const shots=enraged||crippled?4:3;
        for(let i=0;i<shots;i++)this.hazard('circle',{x:p.x+(p.vx||0)*.5+(i-(shots-1)/2)*62,y:p.y+(p.vy||0)*.5+randBetween(this.rng,-20,20),radius:52,delay:i*.16,warning:1.05,duration:.4,once:true,damage:this.t.damage*.95,visual:'minenwerfer-shell',sourceX:this.x+turret.x,sourceY:this.y+turret.y});
        this.command('muzzle',{x:this.x+turret.x,y:this.y+turret.y,partId:'turret'});}
    }
    if(this.due('treffas-mg',dt,crippled?2.2:2.9)){
      const p=this.target(players);
      if(p)for(const side of [-1,1]){const mx=this.x+side*64,my=this.y-20,a=Math.atan2(p.y-my,p.x-mx);this.fan(mx,my,a,3,.3,this.t.bulletSpeed*.95,'treffas-mg');}
    }
  }
}

// Bloody April (stage 9): the body is the formation leader.  Its four named
// wingmen are real, destructible aircraft and are launched once only.  Losing
// a member permanently removes that attack lane or pair for the encounter.
class FormationAceBoss extends PatternBoss {
  constructor({wingmen,...options}) {
    super({...options,parts:[]});
    this.coreRadius=30;this.ownsMotion129=true;this.a=-Math.PI/2;this.formationBoss129=true;
    this.phase='intercept';this.wingmen=wingmen;this.formationTotal=wingmen.length+1;this.wingLaunched=false;
  }
  steer(dt,tx,ty,turnRate){
    const a=Math.atan2(ty-this.y,tx-this.x),delta=Math.atan2(Math.sin(a-this.a),Math.cos(a-this.a));
    const tr=turnRate*dt;this.a+=Math.max(-tr,Math.min(tr,delta));
  }
  aimAt(p){const pa=Math.atan2(p.y-this.y,p.x-this.x);return{pa,rel:Math.atan2(Math.sin(pa-this.a),Math.cos(pa-this.a)),dist:Math.hypot(p.x-this.x,p.y-this.y)};}
  move(dt,speed,bounds){
    this.x+=Math.cos(this.a)*speed*dt;this.y+=Math.sin(this.a)*speed*dt;
    this.x=Math.max(bounds.left+36,Math.min(bounds.right-36,this.x));
    this.y=Math.max(bounds.top+36,Math.min(bounds.bottom-36,this.y));
  }
  liveWingmen(){return this.formationStatus129?.()||[];}
  launchWing(bounds){
    if(this.wingLaunched)return;this.wingLaunched=true;
    const span=bounds.right-bounds.left,hp=Math.max(90,Math.round(this.t.maxHp*.072));
    for(let i=0;i<this.wingmen.length;i++){
      const wing=this.wingmen[i],x=bounds.left+span*(i+.5)/this.wingmen.length,y=bounds.top-76-(i%2)*28;
      this.command('spawn-minion',{minion:'formation-fighter',faction:this.faction,plane:wing.plane,behavior:wing.behavior,leaderId:this.id,
        formationIndex:i,formationCount:this.wingmen.length,formationRole:wing.role,formationSide:wing.side,formationRank:wing.rank,
        pairId:wing.pairId,callSign:wing.callSign,name:wing.callSign,x,y,a:Math.PI/2,life:1e9,fire:.45+i*.11,
        maxSpeed:wing.maxSpeed,hp,visualScale:1,persistent:true});
    }
  }
  setFormationPhase(phase,p,age,duration){
    const velocity=Math.hypot(p.vx||0,p.vy||0),heading=velocity>18?Math.atan2(p.vy,p.vx):(Number.isFinite(p.a)?p.a:-Math.PI/2);
    if(this.phase!==phase){this.phase=phase;this.command('phase-change',{phase});
      if(['concentrated-assault','sun-hunt','headon-assault'].includes(phase))this.command('reentry-warning',{x:this.x,y:this.y,targetX:p.x,targetY:p.y,seconds:.75});}
    this.formationOrder={phase,age,duration,playerX:p.x,playerY:p.y,playerHeading:heading};
  }
}
export class JastaCircus extends FormationAceBoss {
  constructor(options) {
    super({...options,kind:'jasta11-circus',wingmen:[
      {role:'left-outer',side:-1,rank:1,plane:'jasta11a_albatros',callSign:'Kurt Wolff',behavior:'jasta-formation',maxSpeed:235},
      {role:'left-inner',side:-1,rank:0,plane:'jasta11b_albatros',callSign:'Karl Allmenröder',behavior:'jasta-formation',maxSpeed:232},
      {role:'right-inner',side:1,rank:0,plane:'jasta11c_albatros',callSign:'Karl Emil Schaefer',behavior:'jasta-formation',maxSpeed:232},
      {role:'right-outer',side:1,rank:1,plane:'jasta11d_albatros',callSign:'Lothar von Richthofen',behavior:'jasta-formation',maxSpeed:235}
    ]});
    this.leaderPilot='baron';this.callSign='Manfred von Richthofen';this.speed=196;this.aceCycle=0;
  }
  update(dt,{players,bounds}) {
    const p=living(players).reduce((m,q)=>!m||Math.hypot(q.x-this.x,q.y-this.y)<Math.hypot(m.x-this.x,m.y-this.y)?q:m,null);if(!p)return;
    this.launchWing(bounds);this.aceCycle+=dt;const cycle=this.aceCycle%24;
    const [phase,age,duration]=cycle<6?['encirclement',cycle,6]:cycle<12.5?['echelon-assault',cycle-6,6.5]:cycle<19?['concentrated-assault',cycle-12.5,6.5]:['sun-hunt',cycle-19,5];
    this.setFormationPhase(phase,p,age,duration);const h=this.formationOrder.playerHeading,hx=Math.cos(h),hy=Math.sin(h),nx=-hy,ny=hx;
    let tx=p.x-hx*260,ty=p.y-hy*260,turn=1.65,mult=.86;
    if(phase==='echelon-assault'){tx=p.x-hx*330+nx*170;ty=p.y-hy*330+ny*170;turn=2.05;mult=1.02;}
    if(phase==='concentrated-assault'){const commit=age>3.25;tx=commit?p.x+(p.vx||0)*.45:p.x-hx*290;ty=commit?p.y+(p.vy||0)*.45:p.y-hy*290;turn=commit?3.15:1.8;mult=commit?1.34:.9;}
    if(phase==='sun-hunt'){tx=age<2?p.x+nx*310-hx*250:p.x+(p.vx||0)*.55;ty=age<2?p.y+ny*310-hy*250:p.y+(p.vy||0)*.55;turn=3.25;mult=age<2?1.05:1.42;}
    this.steer(dt,tx,ty,turn);this.move(dt,this.speed*mult,bounds);
    const {pa,rel,dist}=this.aimAt(p);
    const committed=phase==='concentrated-assault'&&age>3.25||phase==='sun-hunt'&&age>2;
    if(Math.abs(rel)<.48&&dist<640&&this.due('jasta-mg',dt,committed?.62:1.18)){
      const mx=this.x+Math.cos(this.a)*32,my=this.y+Math.sin(this.a)*32;
      this.fan(mx,my,pa,2,.08,this.t.bulletSpeed*1.15,'jasta-mg');this.command('muzzle',{x:mx,y:my});
    }
    this.formationOrder.leaderCommitted=committed;this.formationOrder.liveRoles=this.liveWingmen().map(w=>w.role);
  }
}
export class Naval10BlackFlight extends FormationAceBoss {
  constructor(options) {
    super({...options,kind:'naval10-black-flight',wingmen:[
      {role:'a-bait',pairId:'a',side:-1,rank:0,plane:'collishaw_sopwith',callSign:'Black Prince',behavior:'black-flight-formation',maxSpeed:238},
      {role:'a-hunter',pairId:'a',side:-1,rank:1,plane:'collishaw_sopwith',callSign:'Black Death',behavior:'black-flight-formation',maxSpeed:242},
      {role:'b-bait',pairId:'b',side:1,rank:0,plane:'collishaw_sopwith',callSign:'Black Roger',behavior:'black-flight-formation',maxSpeed:238},
      {role:'b-hunter',pairId:'b',side:1,rank:1,plane:'collishaw_sopwith',callSign:'Black Sheep',behavior:'black-flight-formation',maxSpeed:242}
    ]});
    this.leaderPilot='collishaw';this.callSign='Black Maria';this.speed=202;this.aceCycle=0;
  }
  update(dt,{players,bounds}) {
    const p=living(players).reduce((m,q)=>!m||Math.hypot(q.x-this.x,q.y-this.y)<Math.hypot(m.x-this.x,m.y-this.y)?q:m,null);if(!p)return;
    this.launchWing(bounds);this.aceCycle+=dt;const cycle=this.aceCycle%26;
    const [phase,age,duration]=cycle<6?['pair-split',cycle,6]:cycle<13?['bait-hunter',cycle-6,7]:cycle<20?['cross-attack',cycle-13,7]:['headon-assault',cycle-20,6];
    this.setFormationPhase(phase,p,age,duration);const h=this.formationOrder.playerHeading,hx=Math.cos(h),hy=Math.sin(h),nx=-hy,ny=hx;
    let tx=p.x-hx*300,ty=p.y-hy*300,turn=1.7,mult=.88;
    if(phase==='bait-hunter'){tx=p.x-hx*330+nx*Math.sin(age*.7)*110;ty=p.y-hy*330+ny*Math.sin(age*.7)*110;}
    if(phase==='cross-attack'){tx=p.x-hx*250-nx*190;ty=p.y-hy*250-ny*190;turn=2;mult=1.02;}
    if(phase==='headon-assault'){const commit=age>2.7;tx=commit?p.x+(p.vx||0)*.5:p.x+hx*330;ty=commit?p.y+(p.vy||0)*.5:p.y+hy*330;turn=commit?3.3:2.1;mult=commit?1.42:1.02;}
    this.steer(dt,tx,ty,turn);this.move(dt,this.speed*mult,bounds);
    const {pa,rel,dist}=this.aimAt(p);
    const committed=phase==='headon-assault'&&age>2.7;
    if(Math.abs(rel)<.46&&dist<610&&this.due('black-maria-gun',dt,committed?.56:1.28)){
      const mx=this.x+Math.cos(this.a)*30,my=this.y+Math.sin(this.a)*30;this.fan(mx,my,pa,committed?2:1,.07,this.t.bulletSpeed*1.12,'black-flight-mg');this.command('muzzle',{x:mx,y:my});
    }
    const live=this.liveWingmen();this.formationOrder.liveRoles=live.map(w=>w.role);this.formationOrder.completePairs=['a','b'].filter(id=>live.filter(w=>w.pairId===id).length===2);
  }
}

// Somme (stage 10): the wedge is one body whose three rhomboid tanks are the
// destructible parts. Tanks advance slowly and lay lateral sponson fire plus
// MG bursts; when the last hull dies a weak command core is exposed at the
// wedge centroid for the kill shot.
export class Mark4Wedge extends PatternBoss {
  constructor(options){
    super({...options,kind:'mark4-wedge',coreRadius:options.tuning.coreRadius||70,parts:[
      {id:'tank-lead',x:0,y:-118,radius:62,maxHp:options.tuning.partHp*2.6},
      {id:'tank-left',x:-168,y:64,radius:62,maxHp:options.tuning.partHp*2.6},
      {id:'tank-right',x:168,y:64,radius:62,maxHp:options.tuning.partHp*2.6}
    ]});
    this.coreVulnerable=false;this.ownsMotion129=true;this.phase='advance';
    this.anchorX=this.x;this.anchorY=this.y;this.startY=this.y;
    this.timers.set('mark4-mg',1.4);
  }
  liveTanks(){return ['tank-lead','tank-left','tank-right'].filter(id=>!this.parts.get(id).destroyed);}
  onPartDestroyed(){
    if(!this.liveTanks().length&&!this.coreVulnerable){
      this.coreVulnerable=true;this.phase='exposed';this.command('phase-change',{phase:'exposed'});
    }
  }
  update(dt,{players,bounds}){
    if(this.dead)return;
    const live=this.liveTanks(),enraged=this.hp<=this.maxHp*.35&&live.length===1;
    // The wedge grinds forward; with fewer tanks it speeds up but sways less.
    const speed=(20+ (3-live.length)*6)*(enraged?1.35:1);
    this.anchorY+=speed*dt;const limit=this.startY+310;if(this.anchorY>limit)this.anchorY=limit;
    this.y=this.anchorY+Math.sin(this.motionTime*.33)*8;
    this.x=this.anchorX+Math.sin(this.motionTime*.21)*(40+live.length*24);
    // Each tank has its own gun cadence; destroying a tank removes that lane.
    for(const id of live){
      const tank=this.parts.get(id);
      if(this.due(id+'-sponson',dt,(enraged?3.4:4.6)+this.rng()*1.2)){
        const gx=this.x+tank.x,gy=this.y+tank.y,p=this.target(players);
        if(p){
          // 6-pounder shells land in a short lateral line beside the target.
          const side=id==='tank-left'?-1:id==='tank-right'?1:0;
          for(let i=-1;i<=1;i++)this.hazard('circle',{x:p.x+i*70+side*30,y:p.y+(p.vy||0)*.4,radius:50,warning:1.15,duration:.4,delay:.14+Math.abs(i)*.12,once:true,damage:this.t.damage*.82,visual:'shell',sourceX:gx,sourceY:gy});
          this.command('muzzle',{x:gx,y:gy,partId:id});
        }
      }
    }
    if(live.length&&this.due('mark4-mg',dt,enraged?2.2:3.1)){
      const id=live[Math.floor(this.rng()*live.length)],tank=this.parts.get(id),p=this.target(players);
      if(p){const mx=this.x+tank.x,my=this.y+tank.y+38,a=Math.atan2(p.y-my,p.x-mx);this.fan(mx,my,a,3,.26,this.t.bulletSpeed*.95,'mark4-mg');}
    }
    if(!live.length&&!this.coreVulnerable){this.coreVulnerable=true;this.phase='exposed';}
  }
}

// The Mörser battery is fixed: three gun pits fire arcing heavy shells with a
// long landing warning. Knocking out a pit removes its firing lane; when all
// tubes are dead the shell-store core cooks off and becomes the kill target.
export class MorserBattery extends PatternBoss {
  constructor(options){
    super({...options,kind:'morser-battery',coreRadius:options.tuning.coreRadius||80,parts:[
      {id:'gun-1',x:-150,y:-40,radius:54,maxHp:options.tuning.partHp*2.2},
      {id:'gun-2',x:0,y:-95,radius:54,maxHp:options.tuning.partHp*2.2},
      {id:'gun-3',x:150,y:-40,radius:54,maxHp:options.tuning.partHp*2.2},
      {id:'ammo',x:0,y:96,radius:40,maxHp:options.tuning.partHp*1.4}
    ]});
    this.coreVulnerable=false;this.ownsMotion129=true;
    this.timers.set('morser-defend',2.6);
  }
  liveGuns(){return ['gun-1','gun-2','gun-3'].filter(id=>!this.parts.get(id).destroyed);}
  onPartDestroyed(p){
    if(p.id.startsWith('gun-'))this.command('cancel-hazards',{tag:'morser-'+p.id});
    // Shell store cooks: one big blast under the battery once the ammo pit dies.
    if(p.id==='ammo'&&!this.ammoCooked){
      this.ammoCooked=true;const blast=Math.min(this.hp,this.maxHp*.14);this.hp-=blast;
      const x=this.x+p.x,y=this.y+p.y;
      this.command('internal-explosion',{x,y,damage:blast});
      this.hazard('circle',{x,y,radius:130,warning:.6,duration:.6,once:true,damage:this.t.damage*1.4,visual:'shell',sourceX:x,sourceY:y,tag:'morser-ammo'});
    }
    if(!this.liveGuns().length&&!this.coreVulnerable){
      this.coreVulnerable=true;this.phase='exposed';this.command('phase-change',{phase:'exposed'});
    }
  }
  update(dt,{players,bounds}){
    if(this.dead)return;
    const guns=this.liveGuns(),loop=this.t.loopIndex||0;
    // Arcing fire: each live gun drops a warning circle on a player with lead.
    for(const id of guns){
      if(this.due(id+'-fire',dt,Math.max(4.4,7.2-loop*.5)+this.rng()*1.6)){
        const gun=this.parts.get(id),p=this.target(players);
        if(p){
          const lead=Math.min(.75,.35+loop*.06),tx=p.x+(p.vx||0)*lead,ty=p.y+(p.vy||0)*lead;
          this.hazard('circle',{x:tx,y:ty,radius:86,warning:2.1,duration:.55,once:true,damage:Math.round(this.t.damage*1.5),visual:'morser-shell',sourceX:this.x+gun.x,sourceY:this.y+gun.y,tag:'morser-'+id});
          this.command('muzzle',{x:this.x+gun.x,y:this.y+gun.y,partId:id});
        }
      }
    }
    // Close defence: MG nests sweep anyone diving the pits.
    if(this.due('morser-defend',dt,guns.length?3.4:2.6)){
      const p=this.target(players);
      if(p&&Math.hypot(p.x-this.x,p.y-this.y)<560)for(const id of guns.length?guns:['ammo']){const g=this.parts.get(id);const mx=this.x+g.x,my=this.y+g.y,a=Math.atan2(p.y-my,p.x-mx);this.fan(mx,my,a,3,.3,this.t.bulletSpeed*.85,'morser-mg');}
    }
    if(!guns.length&&!this.coreVulnerable){this.coreVulnerable=true;this.phase='exposed';}
  }
}

// The Staaken R.VI giant bomber: its four engine nacelles are the hittable
// parts. Each dead engine sags the bomber lower on its patrol; when the last
// engine dies the fuselage core opens and the giant goes into its death glide.
export class StaakenRVI extends PatternBoss {
  constructor(options){
    super({...options,kind:'staaken-rvi',coreRadius:options.tuning.coreRadius||62,parts:[
      {id:'eng-0',x:-106,y:-12,radius:23,maxHp:options.tuning.partHp*1.8},
      {id:'eng-1',x:-37,y:-12,radius:23,maxHp:options.tuning.partHp*1.8},
      {id:'eng-2',x:37,y:-12,radius:23,maxHp:options.tuning.partHp*1.8},
      {id:'eng-3',x:106,y:-12,radius:23,maxHp:options.tuning.partHp*1.8}
    ]});
    this.coreVulnerable=false;this.ownsMotion129=true;this.phase='raid';
    this.anchorX=this.x;this.anchorY=this.y;this.gunSide=-1;this.doomedAt=null;
  }
  liveEngines(){return ['eng-0','eng-1','eng-2','eng-3'].filter(id=>!this.parts.get(id).destroyed);}
  onPartDestroyed(p){
    if(p.id.startsWith('eng-')&&!this.liveEngines().length){
      this.phase='doomed';this.coreVulnerable=true;this.doomedAt=this.motionTime||0;
      this.command('phase-change',{phase:'doomed'});this.timers.set('dump',.6);
    }
  }
  update(dt,{players,bounds}){
    if(this.dead)return;
    const live=this.liveEngines().length,mt=this.motionTime||0,doomed=this.phase==='doomed';
    // Long lateral bombing run; dead engines shorten the span and sag her lower.
    const span=(doomed?60:120+live*16)*Math.min(1,(bounds.right-bounds.left)/620);
    this.x=this.anchorX+Math.sin(mt*.14)*span;
    this.y=this.anchorY+(4-live)*(doomed?46:22)+Math.sin(mt*.19+1.3)*14
      +(doomed?Math.min(150,(mt-this.doomedAt)*12):0);
    // Stick bombing: a row of bursts laid along the run toward the target.
    if(!doomed&&this.due('stick',dt,Math.max(4.6,6.4-(this.t.loopIndex||0)*.35))){
      const p=this.target(players);
      if(p){const dx=p.x-this.x,dy=p.y-this.y,d=Math.max(1,Math.hypot(dx,dy)),ux=dx/d,uy=dy/d;
        for(let i=0;i<5;i++)this.hazard('circle',{x:this.x+ux*(70+i*58)+randBetween(this.rng,-16,16),y:this.y+uy*(70+i*58),delay:i*.15,radius:54,warning:1.05,duration:.42,once:true,damage:Math.round(this.t.damage*1.35),visual:'carpet-bomb',tag:'staaken-stick'});
        this.command('muzzle',{x:this.x,y:this.y+60});}
    }
    // Nose and ventral gunners alternate streams at close attackers.
    if(this.due('para',dt,(this.t.suppressiveInterval||2.7)*.88)){
      const p=this.target(players);
      if(p&&Math.hypot(p.x-this.x,p.y-this.y)<780){const gy=(this.gunSide*=-1)>0?88:-120,mx=this.x,my=this.y+gy,a=Math.atan2(p.y-my,p.x-mx);
        this.command('muzzle',{x:mx,y:my});this.fan(mx,my,a,3,.24,this.t.bulletSpeed*.92,'staaken-mg');}
    }
    if(doomed&&this.due('dump',dt,9)){
      const p=this.target(players),cx=p?p.x:this.x,cy=p?p.y:this.y+200;
      for(let i=0;i<7;i++)this.hazard('circle',{x:cx+(i-3)*62+randBetween(this.rng,-20,20),y:cy+randBetween(this.rng,-30,60),delay:.1+i*.09,radius:58,warning:1.15,duration:.45,once:true,damage:Math.round(this.t.damage*1.3),visual:'carpet-bomb',tag:'staaken-dump'});
    }
    if(!doomed&&!live&&!this.coreVulnerable){this.coreVulnerable=true;this.phase='doomed';}
  }
  suppressive(){/* defence comes from the gunner fans, not a generic spray */}
}

// London night defence: a rotating searchlight beam marks whoever it catches
// (the hazard pool lights them), and the AA gun spends its flak on lit targets
// first. The command bunker core opens once the gun, the lamp and the shell
// racks are all knocked out.
export class LondonSearchlight extends PatternBoss {
  constructor(options){
    super({...options,kind:'london-searchlight',coreRadius:options.tuning.coreRadius||70,parts:[
      {id:'light',x:-55,y:-70,radius:46,maxHp:options.tuning.partHp*1.6},
      {id:'gun',x:56,y:-27,radius:50,maxHp:options.tuning.partHp*2},
      {id:'ammo',x:-70,y:55,radius:42,maxHp:options.tuning.partHp*1.2}
    ]});
    this.coreVulnerable=false;this.ownsMotion129=true;this.phase='watch';this.beamSide=-1;this.timers.set('flak',2.2);
  }
  liveParts(){return ['light','gun','ammo'].filter(id=>!this.parts.get(id).destroyed);}
  onPartDestroyed(p){
    if(p.id==='light')this.command('cancel-hazards',{tag:'london-beam'});
    if(p.id==='gun')this.command('cancel-hazards',{tag:'london-flak'});
    if(p.id==='ammo'&&!this.ammoCooked){
      this.ammoCooked=true;const blast=Math.min(this.hp,this.maxHp*.1);this.hp-=blast;
      this.command('internal-explosion',{x:this.x-70,y:this.y+55,damage:blast});
      this.hazard('circle',{x:this.x-70,y:this.y+55,radius:112,warning:.6,duration:.55,once:true,damage:this.t.damage*1.3,visual:'shell',sourceX:this.x-70,sourceY:this.y+55});
    }
    if(!this.liveParts().length&&!this.coreVulnerable){
      this.coreVulnerable=true;this.phase='exposed';this.command('phase-change',{phase:'exposed'});
    }
  }
  update(dt,{players,bounds,isIlluminated}){
    if(this.dead)return;
    const light=!this.parts.get('light').destroyed,gun=!this.parts.get('gun').destroyed,slow=this.parts.get('ammo').destroyed;
    // The lamp sweeps a full-height cone back and forth across the field.
    if(light&&this.due('beam',dt,slow?13:9.4)){
      const side=this.beamSide*=-1,span=Math.max(bounds.bottom-bounds.top,520);
      this.hazard('searchlight',{x:this.x-55,y:this.y-70,angle:-Math.PI/2+side*.55,angularSpeed:-side*.3,halfAngle:.16,radius:span,duration:6.2,warning:.7,damage:0,tickInterval:.2,visual:'searchlight',tag:'london-beam'});
    }
    // The 3-inch gun prioritises whoever the beam has lit.
    if(gun&&this.due('flak',dt,(slow?7.4:3.9))){
      const lit=(players||[]).filter(p=>p.alive&&isIlluminated?.(p));
      const p=lit[0]||this.target(players);
      if(p){const gx=this.x+56,gy=this.y-27,lead=lit.length?.6:.3,spread=lit.length?28:78,count=lit.length?3:2;
        const tx=p.x+(p.vx||0)*lead,ty=p.y+(p.vy||0)*lead;
        for(let i=0;i<count;i++)this.hazard('circle',{x:tx+randBetween(this.rng,-spread,spread),y:ty+randBetween(this.rng,-spread,spread),delay:i*.22,radius:lit.length?46:54,warning:lit.length?.95:1.3,duration:.4,once:true,damage:Math.round(this.t.damage*1.25),visual:'black-flak',sourceX:gx,sourceY:gy,tag:'london-flak'});
        this.command('muzzle',{x:gx,y:gy,partId:'gun'});}
    }
    // Sandbag MG nests brush off anyone diving the pit.
    if(this.due('london-defend',dt,this.liveParts().length?3.4:2.7)){
      const p=this.target(players);
      if(p&&Math.hypot(p.x-this.x,p.y-this.y)<480){const a=Math.atan2(p.y-this.y,p.x-this.x);this.fan(this.x,this.y+96,a,3,.3,this.t.bulletSpeed*.85,'london-mg');}
    }
    if(!this.liveParts().length&&!this.coreVulnerable){this.coreVulnerable=true;this.phase='exposed';}
  }
}

export class LondonRaidApron extends LondonApron {
 constructor(options){super(options);this.kind='london-apron-raid';this.ownsMotion129=true;
  for(const [id,x,y,radius] of [['light',-94,92,26],['gun',94,92,29]])this.parts.set(id,new BossPart({id,x,y,radius,maxHp:this.t.maxHp*.13}));
  this.timers.set('raid-light',1.5);this.timers.set('raid-flak',3.2);}
 onPartDestroyed(p){if(p.id.startsWith('balloon-'))super.onPartDestroyed(p);else this.command('cancel-hazards',{tag:'raid-'+p.id});
  if(p.id==='light'||p.id==='gun')this.command('phase-change',{phase:p.id==='light'?'blackout':'battery-silenced'});}
 update(dt,ctx){super.update(dt,ctx);const {players,bounds,isIlluminated}=ctx,light=this.parts.get('light'),gun=this.parts.get('gun');
  if(!light.destroyed&&this.due('raid-light',dt,8.8))this.hazard('searchlight',{x:this.x+light.x,y:this.y+light.y,angle:Math.PI/2-.65,angularSpeed:.27,halfAngle:.14,radius:Math.max(560,bounds.bottom-bounds.top),duration:5.2,warning:.75,damage:0,visual:'searchlight',tag:'raid-light'});
  if(!gun.destroyed&&this.due('raid-flak',dt,4.3)){const p=players.find(p=>p.alive&&!p.londonRiver&&isIlluminated?.(p))||this.target(players);if(p){
   const lit=!p.londonRiver&&!!isIlluminated?.(p),x=p.x+(p.vx||0)*(lit?.5:.2),y=p.y+(p.vy||0)*(lit?.5:.2);
   this.command('muzzle',{x:this.x+gun.x,y:this.y+gun.y,partId:'gun'});
   for(let i=0;i<(lit?3:2);i++)this.hazard('circle',{x:x+(i-.5)*66,y,delay:i*.25,radius:40,warning:lit?1.05:1.4,duration:.35,once:true,damage:this.t.damage,visual:'black-flak',sourceX:this.x+gun.x,sourceY:this.y+gun.y,tag:'raid-gun'});}}
  if(this.coreVulnerable&&this.due('raid-final',dt,2.8)){const p=this.target(players);if(p)this.fan(this.x,this.y+75,Math.atan2(p.y-this.y-75,p.x-this.x),3,.3,this.t.bulletSpeed*.8,'london-mg');}
 }
}

export class GothaRaider extends PatternBoss {
 constructor({slot=0,...options}){super({...options,kind:'gotha-raider',coreRadius:34,parts:[
  {id:'engine-left',x:-23,y:-8,radius:12,maxHp:options.tuning.maxHp*.2},{id:'engine-right',x:23,y:-8,radius:12,maxHp:options.tuning.maxHp*.2},
  {id:'bomb-bay',x:0,y:-14,radius:10,maxHp:options.tuning.maxHp*.24},{id:'rear-gun',x:0,y:9,radius:9,maxHp:options.tuning.maxHp*.14}]});
  this.slot=slot;this.formationTotal=1;this.anchorX=this.x;this.anchorY=this.y;this.a=Math.PI/2;this.ownsMotion129=true;this.coreVulnerable=true;
  this.phase='formation';this.raidSerial=0;this.raidWait=5+slot*4;this.runRemaining=0;this.glideAge=0;
  this.mounts=new Map([...this.parts].map(([id,p])=>[id,{x:p.x,y:p.y}]));this.rotateMounts();}
 suppressive(){}
 engines(){return ['engine-left','engine-right'].filter(id=>!this.parts.get(id).destroyed).length;}
 rotateMounts(){const a=this.a+Math.PI/2,c=Math.cos(a),s=Math.sin(a);for(const [id,m] of this.mounts){const p=this.parts.get(id);p.x=m.x*c-m.y*s;p.y=m.x*s+m.y*c;}}
 locateHit(attack){const hit=super.locateHit(attack);if(hit)return hit;const a=this.a+Math.PI/2,dx=attack.x-this.x,dy=attack.y-this.y,x=dx*Math.cos(a)+dy*Math.sin(a),y=-dx*Math.sin(a)+dy*Math.cos(a),r=attack.radius||0;
  return (x/(103+r))**2+((y+37)/(16+r))**2<=1||(x/(93+r))**2+((y+3)/(11+r))**2<=1||(x/(15+r))**2+(y/(87+r))**2<=1?{partId:null}:null;}
 hit(attack){const part=attack.partId&&this.parts.get(attack.partId),damage=attack.damage*(part?.id==='bomb-bay'&&this.phase!=='bombing-run'?.5:!part&&this.engines()?.7:1),result=super.hit({...attack,damage});
  if(part&&result.damage&&!this.dead){const body=super.hit({damage:result.damage*.75});result.bodyDefeated=body.bodyDefeated;}return result;}
 abortRun(){if(this.runTarget)this.command('city-bomb-abort',{runId:this.runId});this.runTarget=null;this.runRemaining=0;}
 onPartDestroyed(p){if(p.id==='bomb-bay'){this.abortRun();this.phase='payload-lost';this.command('phase-change',{phase:this.phase});}
  if(p.id==='rear-gun')this.command('cancel-hazards',{tag:this.id+'-rear'});
  if(!this.engines()){this.abortRun();this.phase='gliding';this.glideAge=0;this.command('phase-change',{phase:this.phase});}
  else if(p.id.startsWith('engine-'))this.command('phase-change',{phase:'engine-damaged'});}
 fly(dt,tx,ty,speed,turn=1.05){const goal=Math.atan2(ty-this.y,tx-this.x);let ux=Math.cos(goal),uy=Math.sin(goal);
  for(const b of this.encounter?.bodies.values()||[]){if(b===this||b.dead||b.kind!=='gotha-raider')continue;const dx=this.x-b.x,dy=this.y-b.y,d=Math.hypot(dx,dy);if(d>0&&d<210){const w=(210-d)/120;ux+=dx/d*w;uy+=dy/d*w;}}
  const want=Math.atan2(uy,ux),d=Math.atan2(Math.sin(want-this.a),Math.cos(want-this.a));this.a+=Math.max(-turn*dt,Math.min(turn*dt,d));this.x+=Math.cos(this.a)*speed*dt;this.y+=Math.sin(this.a)*speed*dt;this.rotateMounts();}
 update(dt,{players,bounds,londonTargets=[]}){const engines=this.engines(),speed=engines===2?78:engines===1?49:38;
  if(!engines){this.glideAge+=dt;this.fly(dt,this.x+Math.cos(this.a)*200,this.y+Math.sin(this.a)*200,speed);if(this.glideAge>=6){super.hit({damage:this.hp});return;}}
  else{const targets=londonTargets.filter(t=>t.hp>0),bay=!this.parts.get('bomb-bay').destroyed;this.raidWait-=dt;
   if(!this.runTarget&&bay&&this.raidWait<=0){this.runTarget=targets.length?targets[(this.slot+this.raidSerial)%targets.length]:{id:'sector-'+this.slot,x:(bounds.left+bounds.right)/2+(this.slot-1)*120,y:(bounds.top+bounds.bottom)/2+80,hp:100};
    this.runRemaining=7;this.phase='bombing-run';this.runId=this.id+':run:'+this.raidSerial++;this.command('city-bomb-warning',{runId:this.runId,targetId:this.runTarget.id,x:this.runTarget.x,y:this.runTarget.y,seconds:7});}
   if(this.runTarget){const t=this.runTarget;this.runRemaining-=dt*(engines===1?.55:1);this.fly(dt,t.x,t.y,speed,.8);
    if(this.runRemaining<=0){if(t.hp>0){const p=this.parts.get('bomb-bay'),sourceX=this.x+p.x,sourceY=this.y+p.y;
      this.command('city-bomb',{runId:this.runId,targetId:t.id,x:t.x,y:t.y,seconds:1.3,damage:18});
      this.hazard('circle',{x:t.x,y:t.y,radius:54,warning:1.3,duration:.35,once:true,damage:this.t.damage,visual:'carpet-bomb',airborneBomb:true,sourceX,sourceY,tag:this.id+'-payload'});
      for(const side of [-1,1])this.hazard('circle',{x:t.x+side*105,y:t.y-52,delay:side<0?.25:.55,radius:36,warning:1.3,duration:.3,once:true,visual:'carpet-bomb',airborneBomb:true,sourceX,sourceY,tag:this.id+'-payload'});}
     this.runTarget=null;this.phase='regroup';this.raidWait=11.5+(engines===1?4:0);}}
   else{const a=(this.motionTime||0)*.19,span=Math.min(130,(bounds.right-bounds.left)*.24);this.fly(dt,this.anchorX+Math.cos(a)*span,this.anchorY+Math.sin(a)*115,speed);}}
  const p=this.target(players);if(!p)return;const angle=Math.atan2(p.y-this.y,p.x-this.x),rel=Math.atan2(Math.sin(angle-this.a),Math.cos(angle-this.a));
  if(Math.hypot(p.x-this.x,p.y-this.y)<620&&this.due('gotha-guns',dt,2.6)){const gun=this.parts.get('rear-gun');
   if(Math.abs(rel)>2.05&&!gun.destroyed){const x=this.x+gun.x,y=this.y+gun.y;this.command('muzzle',{x,y,partId:'rear-gun'});for(let i=-1;i<=1;i++){const a=angle+i*.09;this.hazard('projectile',{x,y,vx:Math.cos(a)*this.t.bulletSpeed*.8,vy:Math.sin(a)*this.t.bulletSpeed*.8,radius:4,damage:this.t.damage*.55,duration:3.2,visual:'gotha-mg',tag:this.id+'-rear'});}}
   else if(Math.abs(rel)<.6){const x=this.x+Math.cos(this.a)*74,y=this.y+Math.sin(this.a)*74;this.command('muzzle',{x,y});this.fan(x,y,angle,2,.13,this.t.bulletSpeed*.75,'gotha-mg');}}
 }
}

const constructors={'paris-gun':ParisGun,lincomparable:LIncomparable,'sms-stuttgart':Stuttgart,'hms-zubian':Zubian,
  'zeppelin-l70':ZeppelinL70,hma23:HMA23,'a7v-flak':A7VFlak,'mark-v-cruiser':MarkVCruiser,
  'livens-flame-projector':LivensFlameProjector,'minenwerfer-battery':MinenwerferBattery,
  'london-apron':LondonApron,'drachen-net':DrachenMineNet,gik:GIK,ca4:Ca4,'armored-harbor-fortress':ArmoredHarborFortress,
  fliegerzug:Fliegerzug,'treffas-wagen':TreffasWagen,'jasta11-circus':JastaCircus,'naval10-black-flight':Naval10BlackFlight,
  'mark4-wedge':Mark4Wedge,'morser-battery':MorserBattery,'staaken-rvi':StaakenRVI,'london-searchlight':LondonSearchlight,'london-apron-raid':LondonRaidApron,'gotha-squadron':GothaRaider};
export function createBossEncounter({id,bossId,tuning,x,y,emit,rng,faction}) {
  if(bossId==='gotha-squadron'){const flightTuning={...tuning,maxHp:tuning.maxHp/3,partHp:tuning.partHp/3,geometryScale:1};return new BossEncounter({id,bossId,bodies:[0,1,2].map(slot=>new GothaRaider({id:id+':gotha:'+slot,slot,tuning:flightTuning,x:x+(slot-1)*215,y:y+(slot===1?0:-90),emit,rng,faction:faction||'central'}))});}
  const entry=BOSS_CATALOG[bossId]||{faction:bossId==='staaken-rvi'?'central':'entente'},Ctor=constructors[bossId];if(!Ctor)throw new Error('Unknown boss: '+bossId);
  const body=new Ctor({id:id+':body',tuning,x,y,emit,rng,faction:faction||entry.faction,coreRadius:tuning.coreRadius||100});
  return new BossEncounter({id,bossId,bodies:[body]});
}
