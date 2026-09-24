import {RailAdapter,StuttgartAdapter} from './boss-adapters129.js?v=297&b=297';
import {BaseBoss, BossPart, BossEncounter} from './headon-stageboss-core.js?v=297&b=297';

// Trench II is an independent battlefield between the original trenches and
// later theaters. Stable stage IDs keep both trench maps in the endless loop.
export const STAGES = Object.freeze(['rural', 'sea', 'trenches', 'trenches-hell', 'city', 'sky', 'alps', 'zeebrugge']);
export const BOSS_CATALOG = Object.freeze({
  'paris-gun': {name:'브루노 열차포', faction:'central', stage:0},
  lincomparable: {name:'520mm 열차포 · 랑콩파라블', faction:'entente', stage:0},
  'sms-stuttgart': {name:'수상기 모함 · SMS 슈투트가르트', faction:'central', stage:1},
  'hms-zubian': {name:'분열 구축함 · HMS 쥬비안', faction:'entente', stage:1},
  'a7v-flak': {name:'A7V 플라크판처', faction:'central', stage:2},
  'mark-v-cruiser': {name:'대공 육상 전함 · 마크 V 크루이저', faction:'entente', stage:2},
  'livens-flame-projector': {name:'리벤스 대형 화염방사기', faction:'entente', stage:3},
  'minenwerfer-battery': {name:'미넨베르퍼 중박격포 진지', faction:'central', stage:3},
  'drachen-net': {name:'드라헨 공중 기뢰 방어망', faction:'central', stage:4},
  'london-apron': {name:'런던 에이프런 방공망', faction:'entente', stage:4},
  'zeppelin-l70': {name:'슈퍼 체펠린 L 70', faction:'central', stage:5},
  hma23: {name:'공중 항모 · HMA 23급', faction:'entente', stage:5},
  gik: {name:'한자-브란덴부르크 G.IK', faction:'central', stage:6},
  ca4: {name:'카프로니 Ca.4', faction:'entente', stage:6}
  ,'armored-harbor-fortress': {name:'장갑 크레인 항구요새', faction:'neutral', stage:7}
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
    this.broadside=0;
  }
  hit(attack) {
    if(!attack.partId&&this.phase==='exposed'){
      const engines=[...this.parts.values()].filter(p=>p.kind==='engine'&&!p.destroyed).length;
      return super.hit({...attack,damage:attack.damage*(engines>=5?.6:engines>=3?.8:1)});
    }
    return super.hit(attack);
  }
  onPartDestroyed(p) {if(p.id==='capsule'&&this.phase==='cloud'){this.phase='reveal';this.phaseTime=this.t.revealSeconds||1;this.command('phase-change',{phase:this.phase});}}
  update(dt,{players,bounds}) {
    if(this.phase==='cloud') {
      const live=living(players),p=live[this.cursor%Math.max(1,live.length)],c=this.parts.get('capsule');
      if(p){c.x+=(p.x-this.x-c.x)*Math.min(1,dt*1.2);c.y+=(p.y-this.y-c.y)*Math.min(1,dt*1.2);}
      if(this.due('carpet',dt,this.t.bombInterval||4)) {
        const target=this.target(players);if(target)for(let i=0;i<5;i++)this.hazard('circle',{x:target.x+(i-2)*55,y:target.y,delay:i*.15,radius:45,warning:1.2,once:true,visual:'carpet-bomb'});
      }
    } else if(this.phase==='reveal') {
      this.phaseTime-=dt;if(this.phaseTime<=0){this.phase='exposed';this.coreVulnerable=true;for(const p of this.parts.values())if(p.kind==='engine')p.hittable=true;this.command('phase-change',{phase:this.phase});}
    } else if(this.phase==='exposed') {
      if(this.due('broadside',dt,this.t.engineInterval||2.6)){
        const side=this.broadside++%2,live=[...this.parts.values()].filter(p=>p.kind==='engine'&&!p.destroyed&&(+p.id.slice(7)%2)===side);
        const p=this.target(players);
        if(p&&live.length){const engine=live[Math.floor(this.broadside/2)%live.length],x=this.x+engine.x,y=this.y+engine.y;
          this.fan(x,y,Math.atan2(p.y-y,p.x-x),this.t.engineShotCount||3,.55);}
      }
      if(this.due('gas',dt,this.t.gasInterval||6))this.hazard('rect',{x:(bounds.left+bounds.right)/2,y:bounds.bottom-45,
        width:bounds.right-bounds.left,height:90,warning:1.3,duration:5,tickInterval:.5,visual:'gas-fire'});
    }
  }
}

export class HMA23 extends PatternBoss {
  constructor(options) {
    super({...options,kind:'hma23',parts:Array.from({length:4},(_,i)=>({id:'port-'+i,x:(i-1.5)*60,y:50,radius:25}))});
    this.phase='launching';this.coreVulnerable=false;this.launchSide=0;
  }
  onPartDestroyed() {if(this.allDestroyed([...this.parts.keys()])){this.phase='exposed';this.coreVulnerable=true;this.command('phase-change',{phase:this.phase});}}
  carrierFan(players) {
    const p=this.target(players);if(!p)return;
    const count=Math.max(3,Math.ceil(5*(this.t.projectileDensity??1))),a=Math.atan2(p.y-this.y,p.x-this.x);
    // The carrier is a sustained area-denial boss.  Its individual flak
    // rounds stay survivable even after long-run scaling instead of becoming
    // 40–50 damage one-shots.
    for(let i=0;i<count;i++){const heading=a+(count===1?0:(i/(count-1)-.5)*.9);this.hazard('projectile',{x:this.x,y:this.y,vx:Math.cos(heading)*this.t.bulletSpeed*.78,vy:Math.sin(heading)*this.t.bulletSpeed*.78,radius:5,damage:Math.min(30,Math.round(this.t.damage*.7)),visual:'carrier-flak'});}
  }
  suppressive(){/* carrier fire is handled by the capped carrierFan pattern */}
  update(dt,{players}) {
    if(this.phase==='launching') {
      if(this.due('launch-wave',dt,this.t.launchInterval||3)){
        const ports=[...this.parts.values()].filter(p=>!p.destroyed),target=this.target(players);
        const count=Math.min(ports.length,ports.length>=3?3:2);
        for(let i=0;i<count;i++){const port=ports[(this.launchSide+i)%ports.length];
          this.command('spawn-minion',{minion:'sopwith-camel',x:this.x+port.x,y:this.y+port.y,behavior:'attack-pass',
            formationIndex:i,formationCount:count,passTargetX:target?.x??this.x,passTargetY:target?.y??this.y+300});}
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
  ]});this.phase=1;}
  hit(attack){
    if(attack.partId)return super.hit(attack);
    const floor=this.phase===1?.7:this.phase===2?.32:0;
    return super.hit({...attack,damage:Math.min(attack.damage,Math.max(0,this.hp-this.maxHp*floor))});
  }
  update(dt,{players,bounds}){
    const cannon=this.part('cannon'),engines=[this.part('leftEngine'),this.part('rightEngine')].filter(p=>p.destroyed).length;
    const imbalance=(this.part('leftEngine').destroyed?1:0)-(this.part('rightEngine').destroyed?1:0);this.cruise(dt,{kind:'gik',engineLoss:engines,imbalance});
    if(this.phase===1&&(this.hp<=this.maxHp*.70||engines||cannon.destroyed))this.setPhase(2);
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
    if(this.hidden){this.reentry=Math.max(0,this.reentry-dt);if(this.reentry>0)return;this.hidden=false;this.resetRoute(this.entryX,this.entryY);this.bayExpose=2.4;this.part('bombBay').hittable=true;const target=this.target(players),cx=target?.x??(bounds.left+bounds.right)/2;for(let row=0;row<6;row++)this.hazard('circle',{x:cx+(row-2.5)*62+randBetween(this.rng,-22,22),y:bounds.top+(bounds.bottom-bounds.top)*(.32+row*.085)+randBetween(this.rng,-20,18),radius:44+randBetween(this.rng,-6,14),delay:row*.13+randBetween(this.rng,0,.1),warning:.95,duration:.28,once:true,damage:this.t.damage,visual:'carpet-bomb'});this.command('phase-change',{phase:'bomb-bay-exposed'});}
    if(this.phase===2&&this.bayExpose>0){this.bayExpose=Math.max(0,this.bayExpose-dt);if(this.bayExpose===0)this.part('bombBay').hittable=false;}
    const w=bounds.right-bounds.left;
    if(this.due('ca4-bombs',dt,this.phase===3?2.8:4.6)){const open=[-1,0,1][(this.bombLane=(this.bombLane??-1)+1)%3];
      for(let lane=-1;lane<=1;lane++)if(lane!==open)for(let row=0;row<4;row++)this.hazard('circle',{x:bounds.left+w*(.5+lane*.24)+randBetween(this.rng,-w*.05,w*.05),y:bounds.top+(bounds.bottom-bounds.top)*(.42+row*.12)+randBetween(this.rng,-34,26),radius:Math.min(64,w*.062)+randBetween(this.rng,-8,10),delay:row*.16+randBetween(this.rng,0,.12),warning:1.15,duration:.28,once:true,damage:this.t.damage*.85,visual:'alps-flak'});}
    if(this.due('ca4-guns',dt,1.05)){this.aimedFan('frontGun',players,3,.42,.78);this.aimedFan('rearGun',players,3,.42,.78);}
  }
}

export class A7VFlak extends PatternBoss {
  constructor(options) {
    super({...options,kind:'a7v-flak',parts:[{id:'front',x:-45,y:-78},{id:'rear',x:45,y:32},{id:'left',x:-45,y:32},{id:'right',x:45,y:-78}].map(p=>({...p,radius:24}))});
    this.phase='fortress';this.coreVulnerable=false;this.turretOrder=['front','left','rear','right'];this.turretCursor=0;this.illumination=new Map();this.timers.set('lights',.5);this.timers.set('turret-cycle',.8);
  }
  onPartDestroyed() {const lost=[...this.parts.values()].filter(p=>p.destroyed).length;if(lost===4){this.coreVulnerable=true;this.phase='exposed';this.command('phase-change',{phase:'exposed'});}else if(lost>=2&&this.phase==='fortress'){this.phase='weakened';this.command('phase-change',{phase:'weakened'});}}
  update(dt,{players,bounds,isIlluminated}) {
    for(const p of players){const key=p.id??p,age=isIlluminated(p)?Math.min(.7,(this.illumination.get(key)||0)+dt):0;this.illumination.set(key,age);}
    const lightCount=(this.t.loopIndex||0)>0?3:2;
    if(this.phase!=='exposed'&&this.due('lights',dt,(this.t.lightInterval||9)*(this.phase==='weakened'?.88:1)))for(let i=0;i<lightCount;i++)this.hazard('searchlight',{
      x:this.x+(i-(lightCount-1)/2)*46,y:this.y+30,angle:Math.PI/2+(i-(lightCount-1)/2)*.4,
      angularSpeed:(i%2?-.3:.3),halfAngle:.14,radius:(bounds.bottom-bounds.top)*1.3,
      duration:7.5,warning:.8,damage:0,tickInterval:.2,visual:'searchlight'});
    if(this.phase==='exposed'){if(this.due('exposed-flak',dt,2.4)){const p=this.target(players);if(p)this.hazard('circle',{x:p.x+(p.vx||0)*.45,y:p.y+(p.vy||0)*.45,radius:64,warning:.72,duration:.45,once:true,damage:this.t.damage*1.15,visual:'black-flak'});}return;}
    const interval=(this.t.flakInterval||2.8)*(this.phase==='weakened'?.88:1)/Math.max(1,this.parts.size);
    if(this.due('turret-cycle',dt,interval)){let turret;for(let i=0;i<this.turretOrder.length;i++){const id=this.turretOrder[this.turretCursor++%this.turretOrder.length],candidate=this.parts.get(id);if(!candidate.destroyed){turret=candidate;break;}}
      const p=this.target(players);if(turret&&p){const locked=(this.illumination.get(p.id??p)||0)>=.5,scatter=locked?10:85,lead=locked?.28:0;this.command('muzzle',{x:this.x+turret.x,y:this.y+turret.y,partId:turret.id});this.hazard('circle',{x:p.x+(p.vx||0)*lead+randBetween(this.rng,-scatter,scatter),y:p.y+(p.vy||0)*lead+randBetween(this.rng,-scatter,scatter),radius:55,warning:locked?.78:1,duration:.5,once:true,visual:'black-flak',sourcePartId:turret.id});}}
  }
}

export class MarkVCruiser extends PatternBoss {
  constructor(options) {super({...options,kind:'mark-v-cruiser',parts:[{id:'sponson-left',x:-80,y:0,radius:28},{id:'sponson-right',x:80,y:0,radius:28}]});this.phase='barrage';this.sponsonSide=1;this.barrageDirection=1;this.escortCountdown=0;}
  hit(attack){if(attack.partId)return super.hit(attack);const floor=this.phase==='barrage'?this.maxHp*.5:this.phase==='escort'?this.maxHp*.25:0;
    const result=super.hit({...attack,damage:Math.min(attack.damage,Math.max(0,this.hp-floor))});if(!this.dead&&this.hp<=floor){if(this.phase==='barrage'){this.phase='escort';this.command('phase-change',{phase:'escort'});}else if(this.phase==='escort'){this.phase='final-assault';this.command('phase-change',{phase:'final-assault'});}}return result;}
  onPartDestroyed(){const live=[...this.parts.values()].filter(p=>!p.destroyed);if(!live.length&&this.phase!=='final-assault'){this.phase='final-assault';this.coreVulnerable=true;this.command('phase-change',{phase:this.phase});}else if(live.length&&this.phase==='barrage'){this.phase='escort';this.command('phase-change',{phase:this.phase});}}
  update(dt,{bounds,players=[]}) {
    if(this.hp<=this.maxHp*.25&&this.phase!=='final-assault'){this.phase='final-assault';this.coreVulnerable=true;this.command('phase-change',{phase:this.phase});}
    if(this.hp<=this.maxHp*.5&&this.phase==='barrage'){this.phase='escort';this.command('phase-change',{phase:this.phase});}
    const live=[...this.parts.values()].filter(p=>!p.destroyed);
    if(live.length&&this.due('sponson-cycle',dt,(this.t.beamInterval||4.5)*(live.length===1 ? .88 : 1)/Math.max(1,live.length))){let part;for(let i=0;i<2;i++){const id=this.sponsonSide>0?'sponson-left':'sponson-right';this.sponsonSide*=-1;const candidate=this.parts.get(id);if(!candidate.destroyed){part=candidate;break;}}const p=this.target(players);if(part&&p){const side=part.id==='sponson-left'?-1:1,mx=this.x+part.x+side*42,my=this.y+part.y;this.command('muzzle',{x:mx,y:my,partId:part.id});this.fan(mx,my,Math.atan2(p.y-my,p.x-mx),6,.82);}}
    if(this.due('advance-barrage',dt,this.phase==='final-assault'?2.35:4.6)){const p=this.target(players);if(p){const direction=this.barrageDirection;this.barrageDirection*=-1;const center=p.x+(p.vx||0)*.35;for(let i=0;i<5;i++)this.hazard('circle',{x:Math.max(bounds.left+50,Math.min(bounds.right-50,center+direction*(i-2)*48)),y:p.y+(p.vy||0)*.35-40+i*24,radius:this.phase==='final-assault'?48:42,delay:i*.16,warning:.9,duration:.28,once:true,visual:'mark-v-barrage'});if(this.phase==='escort')this.escortCountdown=Math.max(this.escortCountdown,1.15);}}
    if(this.phase==='escort'&&this.due('escort',dt,this.t.escortInterval||4))this.escortCountdown=Math.max(this.escortCountdown,1.15);
    if(this.escortCountdown>0&&(this.escortCountdown-=dt)<=0)for(const side of [-1,1])if(!this.parts.get(side<0?'sponson-left':'sponson-right').destroyed)this.command('spawn-minion',{minion:'autocannon',x:side<0?bounds.left-20:bounds.right+20,y:bounds.bottom-100,behavior:'side-ambush',vx:-side*this.t.bulletSpeed*.65});
    if(this.phase==='final-assault'){const p=this.target(players);if(p){const a=Math.atan2(p.y-this.y,p.x-this.x),step=Math.min(18*dt,Math.hypot(p.x-this.x,p.y-this.y));this.x+=Math.cos(a)*step;this.y+=Math.sin(a)*step;}}
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
    this.phase='coastal-battery';this.coreVulnerable=false;this.craneAngle=-.4;this.elapsed=0;this.gunSide=0;
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
    this.elapsed+=dt;if(!this.parts.get('crane-arm').destroyed&&!this.parts.get('crane-pivot').destroyed)this.craneAngle=(this.craneAngle+dt*.32)%(Math.PI*2);
    if(this.phase==='coastal-battery'&&this.elapsed>=16){this.phase='seaplane-support';this.command('phase-change',{phase:this.phase});}
    const guns=['gun-left','gun-right'].map(id=>this.parts.get(id)).filter(p=>!p.destroyed);
    if(guns.length&&this.due('harbor-guns',dt,(this.t.coastalInterval||2.5)*(guns.length===1?.88:1))){const gun=guns[this.gunSide++%guns.length],p=this.target(players);if(p){const x=this.x+gun.x,y=this.y+gun.y,a=Math.atan2(p.y-y,p.x-x);this.command('muzzle',{x,y,partId:gun.id});this.fan(x,y,a,5,.72,this.t.bulletSpeed*.82,'harbor-shell');}}
    if(!this.parts.get('crane-arm').destroyed&&this.due('crane-mines',dt,this.t.craneInterval||4.8)){const p=this.target(players);if(p)for(let i=0;i<5;i++){const a=this.craneAngle+(i-2)*.23,d=75+i*28;this.hazard('circle',{x:p.x+Math.cos(a)*d,y:p.y+Math.sin(a)*d,radius:38,delay:i*.14,warning:1.05,duration:.3,once:true,damage:this.t.damage*.75,visual:'harbor-mine'});}}
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
    super({...options,kind:'livens-flame-projector',parts:[
      {id:'tank-l1',x:-155,y:-72,radius:42},{id:'tank-l2',x:-155,y:72,radius:42},
      {id:'tank-r1',x:155,y:-72,radius:42},{id:'tank-r2',x:155,y:72,radius:42},
      {id:'pressure',x:0,y:38,radius:38},{id:'nozzle',x:0,y:-32,radius:40,angle:-Math.PI/2}
    ]});
    this.phase='sealed';this.coreVulnerable=false;this.ownsMotion129=true;this.anchorX=this.x;this.anchorY=this.y;
    this.nozzleAngle=-Math.PI/2;this.lockedFlameAngle=null;
  }
  onPartDestroyed(p){
    if(p.id==='nozzle')this.command('cancel-hazards',{tag:'livens-flame'});
    if(p.id.startsWith('tank-'))this.hazard('circle',{x:this.x+p.x,y:this.y+p.y,radius:54,warning:.65,duration:2,tickInterval:.35,damage:this.t.damage*.55,visual:'livens-leak',tag:'livens-leak'});
    if(this.allDestroyed(['tank-l1','tank-l2','tank-r1','tank-r2','pressure','nozzle'])){
      this.phase='core-exposed';this.coreVulnerable=true;this.command('phase-change',{phase:'exposed'});
    }
  }
  update(dt,{players}){
    this.x=this.anchorX;this.y=this.anchorY;
    if((this._gasTier??4)>0&&this.hp<=this.maxHp*(this._gasTier)*.25){this._gasTier--;
      for(let i=0;i<3;i++){const a=this.rng()*6.28,d=60+this.rng()*90;this.command('gas-zone',{x:this.x+Math.cos(a)*d,y:this.y+Math.sin(a)*d,radius:120+this.rng()*40,life:8});}
      this.command('phase-change',{phase:'gas-vent'});}
    const nozzle=this.parts.get('nozzle'),target=this.target(players);
    if(!nozzle.destroyed&&target&&this.lockedFlameAngle==null){
      const desired=Math.atan2(target.y-(this.y+nozzle.y),target.x-(this.x+nozzle.x));
      const damaged=nozzle.hp<=nozzle.maxHp*.5,rate=damaged?.48:.92;
      this.nozzleAngle=turnToward(this.nozzleAngle,desired,rate*dt);nozzle.angle=this.nozzleAngle;
    }
    if(!nozzle.destroyed&&this.due('main-flame',dt,this.t.flameInterval||5.8)){
      this.lockedFlameAngle=this.nozzleAngle;
      const pressure=this.parts.get('pressure'),weakened=pressure.destroyed;
      this.hazard('beam',{x:this.x+nozzle.x,y:this.y+nozzle.y,angle:this.lockedFlameAngle,length:weakened?390:560,thickness:weakened?38:54,
        warning:weakened?1.4:1.15,duration:weakened?1.2:1.8,tickInterval:.22,damage:this.t.damage*(weakened?.65:1),visual:'livens-flame',tag:'livens-flame'});
      this.command('flame-warning',{x:this.x+nozzle.x,y:this.y+nozzle.y,angle:this.lockedFlameAngle,seconds:weakened?1.4:1.15});
      this.flameLockTime=(weakened?1.4:1.15)+(weakened?1.2:1.8);
    }
    if(this.flameLockTime>0){this.flameLockTime=Math.max(0,this.flameLockTime-dt);if(!this.flameLockTime)this.lockedFlameAngle=null;}
    const broken=['tank-l1','tank-l2','tank-r1','tank-r2'].filter(id=>this.parts.get(id).destroyed);
    if(broken.length&&this.due('leak-fire',dt,Math.max(2.2,5-broken.length*.55))){const id=broken[Math.floor(this.rng()*broken.length)],p=this.parts.get(id);this.hazard('circle',{x:this.x+p.x,y:this.y+p.y,radius:54,warning:.8,duration:2.2,tickInterval:.35,damage:this.t.damage*.55,visual:'livens-leak'});}
  }
}
export class MinenwerferBattery extends PatternBoss {
  constructor(options){
    super({...options,kind:'minenwerfer-battery',parts:[
      {id:'gun-left',x:-150,y:-28,radius:40},{id:'gun-right',x:150,y:-28,radius:40},{id:'main-gun',x:0,y:-25,radius:48},
      {id:'ammo-main',x:0,y:105,radius:38},{id:'crane',x:72,y:-105,radius:32},{id:'command',x:-72,y:-105,radius:30}
    ]});
    this.phase='fortified';this.coreVulnerable=false;this.ownsMotion129=true;this.anchorX=this.x;this.anchorY=this.y;
    this.volleyStep=0;this.volleyClock=1;
  }
  onPartDestroyed(p){
    if(p.id==='ammo-main'){this.hp=Math.max(1,this.hp-this.maxHp*.1);this.command('ammo-cookoff',{x:this.x+p.x,y:this.y+p.y});}
    if(this.allDestroyed(['gun-left','gun-right','main-gun'])){this.phase='core-exposed';this.coreVulnerable=true;this.command('phase-change',{phase:'exposed'});}
  }
  mortar(partId,players,count,spread=58){
    const gun=this.parts.get(partId),target=this.target(players);if(!gun||gun.destroyed||!target)return;
    const command=this.parts.get('command'),ammo=this.parts.get('ammo-main'),warning=command.destroyed?1.45:1.05,scatter=command.destroyed?spread*1.45:spread;
    count=Math.max(1,count-(ammo.destroyed?2:0));
    const side=partId==='gun-left'?-1:partId==='gun-right'?1:0,lead=side===0?1.05:.35;
    for(let i=0;i<count;i++)this.hazard('circle',{x:target.x+(target.vx||0)*lead+(i-(count-1)/2)*scatter+side*35+(this.rng()-.5)*18,y:target.y+(target.vy||0)*lead,
      radius:partId==='main-gun'?62:46,delay:i*.15,warning,duration:.3,once:true,damage:this.t.damage*(partId==='main-gun'?1.15:.72),visual:partId==='main-gun'?'minenwerfer-heavy':'minenwerfer-shell'});
    this.command('muzzle',{x:this.x+gun.x,y:this.y+gun.y,partId});
  }
  update(dt,{players}){
    this.x=this.anchorX;this.y=this.anchorY;
    if((this._gasTier??4)>0&&this.hp<=this.maxHp*(this._gasTier)*.25){this._gasTier--;
      for(let i=0;i<3;i++){const a=this.rng()*6.28,d=60+this.rng()*90;this.command('gas-zone',{x:this.x+Math.cos(a)*d,y:this.y+Math.sin(a)*d,radius:120+this.rng()*40,life:8});}
      this.command('phase-change',{phase:'gas-vent'});}
    this.volleyClock-=dt;
    if(this.volleyClock>0)return;
    const order=['gun-left','gun-right','main-gun'],id=order[this.volleyStep];
    this.mortar(id,players,id==='main-gun'?6:3,id==='main-gun'?52:58);
    this.volleyStep=(this.volleyStep+1)%3;
    const reload=this.parts.get('crane').destroyed?1.45:1;
    this.volleyClock=(this.volleyStep===0?2.3:1.75)*reload;
  }
}

export class LondonApron extends PatternBoss {
  constructor(options) {
    super({...options,kind:'london-apron',parts:[-105,0,105].map((x,i)=>({id:'balloon-'+i,x,y:-58,radius:31}))});
    this.phase='barrier';this.coreVulnerable=false;this.apronLane=-1;this.wireWave=0;
  }
  onPartDestroyed(part) {
    this.command('cancel-hazards',{tag:'apron-'+part.id});
    if(this.allDestroyed(['balloon-0','balloon-1','balloon-2'])){this.phase='winch-exposed';this.coreVulnerable=true;this.command('phase-change',{phase:this.phase});}
  }
  update(dt,{players,bounds}) {
    if(this.phase==='barrier'&&this.due('apron',dt,4.4)){
      const width=bounds.right-bounds.left,gapX=Math.max(bounds.left+width*.24,Math.min(bounds.right-width*.24,this.x+[-.23,0,.23][++this.apronLane%3]*width)),closing=++this.wireWave%3===0;
      for(const balloon of this.parts.values())if(!balloon.destroyed)for(const sign of [-1,1]){
        const startX=this.x+balloon.x+sign*13,startY=this.y+balloon.y+24;
        let endX=startX+sign*(closing?70:105);
        if(Math.abs(endX-gapX)<84)endX=gapX+(endX<gapX?-84:84);
        endX=Math.max(bounds.left+20,Math.min(bounds.right-20,endX));
        const endY=Math.max(startY+130,Math.min(this.y+360,bounds.bottom-25)),dx=endX-startX,dy=endY-startY;
        this.hazard('beam',{x:startX,y:startY,angle:Math.atan2(dy,dx),length:Math.hypot(dx,dy),thickness:9,
          warning:.95,duration:3.35,tickInterval:.55,damage:Math.round(this.t.damage*1.35),
          endX,endY,endVx:closing?Math.sign(gapX-endX)*11:0,visual:'apron-wire',tag:'apron-'+balloon.id});
      }
      this.command('safe-corridor',{x:gapX,y:this.y+200,width:168,seconds:4.3});
    }
    if(this.due('lights',dt,7.2))for(const side of [-1,1])this.hazard('searchlight',{x:this.x+side*210,y:bounds.bottom,angle:-Math.PI/2-side*.24,angularSpeed:side*.28,halfAngle:.13,radius:bounds.bottom-bounds.top,duration:5.8,warning:.65,damage:0,tickInterval:.2,visual:'searchlight'});
  }
}

export class DrachenMineNet extends PatternBoss {
  constructor(options) {
    const mines=[-2,-1,0,1,2].map((n,i)=>({id:'mine-'+i,x:n*42,y:55+Math.abs(n)*18,radius:27,maxHp:options.tuning.partHp*.34}));
    super({...options,kind:'drachen-net',parts:[{id:'balloon',x:0,y:-72,radius:38},{id:'winch',x:0,y:112,radius:27},...mines]});
    this.phase='observed';this.coreVulnerable=false;this.mineWave=0;
  }
  onPartDestroyed(p) {
    if(p.id==='balloon'){this.command('cancel-hazards',{tag:'observer-artillery'});this.command('phase-change',{phase:'observer-destroyed'});}
    if(p.id==='winch')this.command('phase-change',{phase:'winch-destroyed'});
    if(this.parts.get('balloon').destroyed&&this.parts.get('winch').destroyed){this.coreVulnerable=true;this.phase='core-exposed';this.command('phase-change',{phase:'exposed'});}
    if(p.id.startsWith('mine-'))this.command('mine-chain',{x:this.x+p.x,y:this.y+p.y,radius:72});
  }
  update(dt,{players,bounds}) {
    if(!this.parts.get('winch').destroyed&&this.due('mine-salvo',dt,5.1)){
      const target=this.target(players),w=bounds.right-bounds.left,h=bounds.bottom-bounds.top,points=[];
      if(target){
        const cx=Math.max(bounds.left+w*.22,Math.min(bounds.right-w*.22,target.x+(target.vx||0)*.65));
        if(this.mineWave++%2===0){
          const angle=Math.atan2((target.vy||-1),(target.vx||0));
          for(let i=0;i<8;i++){const a=angle+(i-3.5)*.27,d=125+(i%2)*55;
            points.push({x:cx+Math.cos(a)*d,y:target.y+Math.sin(a)*d});}
        }else{
          const gate=[0,2,4][Math.floor(this.mineWave/2-1)%3],step=Math.max(52,Math.min(78,w/6));
          for(let row=0;row<2;row++)for(let col=0;col<5;col++)if(col!==gate){
            points.push({x:cx+(col-2+(row?.18:0))*step,y:target.y+(target.vy||-1)*.55-120-row*Math.max(58,h*.075)});}
        }
        this.command('spawn-minefield',{points:points.filter(q=>q.x>bounds.left+25&&q.x<bounds.right-25&&q.y>bounds.top+25&&q.y<bounds.bottom-25&&Math.hypot(q.x-target.x,q.y-target.y)>75),warning:.75,life:9,maxMines:Math.min(22,16+(this.t.loopIndex||0)*2)});
      }
    }
    const observer=!this.parts.get('balloon').destroyed;
    const loop=this.t.loopIndex||0,artilleryInterval=Math.max(.82,1.75-loop*.16);
    if(observer&&this.due('observer-flak',dt,artilleryInterval)){const p=this.target(players);if(p){const lead=Math.min(.62,.3+loop*.07),scatter=Math.max(7,30-loop*6),x=p.x+(p.vx||0)*lead+randBetween(this.rng,-scatter,scatter),y=p.y+(p.vy||0)*lead+randBetween(this.rng,-scatter,scatter);this.hazard('circle',{x,y,radius:62,warning:Math.max(1.05,1.35-loop*.06),duration:.5,once:true,damage:Math.round(this.t.damage*1.35),visual:'observer-shell',tag:'observer-artillery'});}}
    if(observer&&this.due('observer-light',dt,6.5))this.hazard('searchlight',{x:this.x,y:bounds.bottom,angle:-Math.PI/2,angularSpeed:.34,halfAngle:.12,radius:bounds.bottom-bounds.top,duration:5,warning:.6,damage:0,tickInterval:.2,visual:'searchlight'});
  }
}

const constructors={'paris-gun':ParisGun,lincomparable:LIncomparable,'sms-stuttgart':Stuttgart,'hms-zubian':Zubian,
  'zeppelin-l70':ZeppelinL70,hma23:HMA23,'a7v-flak':A7VFlak,'mark-v-cruiser':MarkVCruiser,
  'livens-flame-projector':LivensFlameProjector,'minenwerfer-battery':MinenwerferBattery,
  'london-apron':LondonApron,'drachen-net':DrachenMineNet,gik:GIK,ca4:Ca4,'armored-harbor-fortress':ArmoredHarborFortress};
export function createBossEncounter({id,bossId,tuning,x,y,emit,rng,faction}) {
  const entry=BOSS_CATALOG[bossId],Ctor=constructors[bossId];if(!Ctor)throw new Error('Unknown boss: '+bossId);
  const body=new Ctor({id:id+':body',tuning,x,y,emit,rng,faction:faction||entry.faction,coreRadius:tuning.coreRadius||100});
  return new BossEncounter({id,bossId,bodies:[body]});
}
