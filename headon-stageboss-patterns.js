import {ParisSearchlightFortress,ParisStaakenRVI} from './paris-night-bosses.js?v=lc1';
import {GallipoliFortress} from './gallipoli-boss.js?v=lc1';
import {Wustenpanzer,SinaiLandship,RollsRoyceEscort} from './maan-boss.js?v=lc1';
import {RuralRailBoss} from './rural-rail-combat.js?v=lc1&rail=1';
import {FortDouaumont,FortSouville} from './verdun-fortresses.js?v=lc1';
import {treffasPoint,treffasGunPivot,treffasGunMuzzle} from './cambrai-layout.js?v=lc1';
import {Mark1Landship,SchwabenFortress} from './somme-boss-combat.js?v=lc1';
import {createJutlandEncounter} from './jutland-boss.js?v=lc1';
export {Mark1Landship as Mark4Wedge,SchwabenFortress as MorserBattery};
import {sommeScale} from './somme-boss-layout.js?v=lc1';
import {ZUBIAN_LAYOUT,navalPoint,navalSweptEllipse,zubianSize,zubianSplitPose,steerNaval} from './adriatic-boss-layout.js?v=lc1';
import {initArmorDrive,stepArmorDrive} from './trench-armor-drive.js?v=lc1';
import {TRENCH_ARMOR_LAYOUT,armorRotate,armorAngleDelta,armorGunMuzzle} from './trench-armor-layout.js?v=lc1';
import {applyRegionalLayout,locateRegionalHit,regionalMuzzle,intersectsEllipse,railLocalPose,RAIL_CAR_SIZE} from './regional-boss-layout352.js?v=lc1';
import {RailAdapter,StuttgartAdapter} from './boss-adapters129.js?v=lc1';
import {BaseBoss, BossPart, BossEncounter} from './headon-stageboss-core.js?v=lc1';
import {LondonApron,DrachenMineNet} from './city-airship-combat378.js?v=lc1';
import {GIK,Ca4} from './alps-bomber-combat.js?v=lc1';
import {FlakTowerNet} from './city-flak-combat.js?v=lc1';

export {GIK,Ca4};
import {HARBOR_PARTS,harborScale,harborPoint,harborCranePose,harborMuzzle,harborLaunchPoint,harborSegmentHit} from './harbor-crane-layout.js?v=lc1';

// Trench II is an independent battlefield between the original trenches and
// later theaters. Stable stage IDs keep both trench maps in the endless loop.
export const STAGES = Object.freeze(['rural', 'sea', 'trenches', 'trenches-hell', 'city', 'sky', 'alps', 'zeebrugge', 'cambrai', 'arras', 'somme', 'london', 'verdun', 'maan', 'gallipoli', 'paris-night', 'jutland']);
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
  'london-apron-raid': {name:'런던 에이프런 방공망', faction:'entente', stage:11},
  'flak-tower': {name:'QF 13파운드 방공탑', faction:'entente', stage:4},
  'zeppelin-l70': {name:'슈퍼 체펠린 L 70', faction:'central', stage:5},
  hma23: {name:'공중 항모 · HMA 23급', faction:'entente', stage:5},
  gik: {name:'한자-브란덴부르크 G.IK', faction:'central', stage:6},
  ca4: {name:'카프로니 Ca.4', faction:'entente', stage:6}
  ,'armored-harbor-fortress': {name:'장갑 크레인 항구요새', faction:'neutral', stage:7}
  ,'fliegerzug': {name:'무인폭탄기 모함열차 · 플리거주크', faction:'entente', stage:8}
  ,'treffas-wagen': {name:'대공개조형 트레파스바겐 · 거륜 육상전함', faction:'central', stage:8}
  ,'jasta11-circus': {name:'야스타 11 플라잉 서커스', faction:'central', stage:9, pilot:'baron', formationSize:5}
  ,'naval10-black-flight': {name:'네이벌 10 — 블랙 플라이트', faction:'entente', stage:9, pilot:'collishaw', formationSize:5}
  ,'mark4-wedge': {name:'마크 I 최초 랜드십 돌파대', faction:'entente', stage:10}
  ,'morser-battery': {name:'슈바벤 보루 · 지하 방어요새', faction:'central', stage:10}
  ,'gotha-squadron': {name:'고타 야간 폭격전대', faction:'central', stage:11}
  ,'fort-douaumont': {name:'두오몽 요새 · Fort Douaumont', faction:'central', stage:12}
  ,'fort-souville': {name:'수빌 요새 · Fort de Souville', faction:'entente', stage:12}
  ,'wustenpanzer': {name:'사막 육상순양함 · Wüstenpanzer', faction:'central', stage:13}
  ,'jutland-grand-fleet': {name:'유틀란트 전투전대 · 북해 함대전', faction:'neutral', stage:16}
  ,'gallipoli-fortress': {name:'갈리폴리 대요새 · 다르다넬스 점령전', faction:'neutral', stage:14}
  ,'paris-staaken-rvi': {name:'Zeppelin-Staaken R.VI · 파리 폭격', faction:'central', stage:15}
  ,'paris-searchlight-fortress': {name:'파리 탐조등 방공요새', faction:'entente', stage:15}
  ,'sinai-landship': {name:'시나이 육상함 · Sinai Landship', faction:'entente', stage:13}
  
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

// Only the requested regional bosses opt into shared measured geometry.
class RegionalPatternBoss extends PatternBoss {
  constructor(options){super(options);applyRegionalLayout(this);}
  locateHit(attack){return locateRegionalHit(this,attack);}
  hitAt(attack){const hit=this.locateHit(attack);return hit?this.hit({...hit,damage:attack.damage}):{damage:0,miss:true};}
}

export class ParisGun extends RuralRailBoss {constructor(o){super(o,'paris-gun')}}
export class LIncomparable extends RuralRailBoss {constructor(o){super(o,'lincomparable')}}
export class Stuttgart extends StuttgartAdapter {}

class NavalPatternBoss extends PatternBoss {
  constructor(options){super(options);this.ownsMotion129=true;this.hullYaw=0;this.driveVelocity=0;for(const p of this.parts.values()){p.localX=p.x;p.localY=p.y;}}
  syncParts(){for(const p of this.parts.values()){const q=navalPoint(this,p.localX,p.localY);p.x=q.x-this.x;p.y=q.y-this.y;}}
  locateHit(shot){
    for(const p of this.parts.values())if(p.hittable&&!p.destroyed){const q=navalPoint(this,p.localX,p.localY);if(navalSweptEllipse({...this,...q},shot,p.radius,p.radius))return{partId:p.id};}
    const size=zubianSize(this);return this.coreVulnerable&&navalSweptEllipse(this,shot,size.width*.48,size.height*.49)?{partId:null}:null;
  }
  hitAt(shot){const hit=this.locateHit(shot);return hit?this.hit({...hit,damage:shot.damage}):{damage:0,miss:true};}
  gun(){return this.parts.get(this.role==='rear'?'rearGun':'frontGun');}
  engine(){return this.parts.get(this.role==='rear'?'rearEngine':'frontEngine');}
  gunPoint(){const p=this.gun();return p?navalPoint(this,p.localX,p.localY):{x:this.x,y:this.y};}
  // These ships telegraph their own turret volleys; generic suppressive fire
  // would fill the deliberately open escape lanes during a charge warning.
  suppressive(){}
  warningVolley(players,side=1){
    const p=this.target(players),gun=this.gun();if(!p||gun?.destroyed)return;
    const q=this.gunPoint(),angle=Math.atan2(p.y-q.y,p.x-q.x);
    this.gunVolley={left:.85,angle,partId:gun.id};
    this.command('charge-warning',{...q,targetX:q.x+Math.cos(angle)*460,targetY:q.y+Math.sin(angle)*460,seconds:.85});
  }
  tickVolley(dt){const v=this.gunVolley;if(!v)return;v.left-=dt;if(v.left>0)return;this.gunVolley=null;if(this.parts.get(v.partId)?.destroyed)return;const q=this.gunPoint();this.command('muzzle',{...q,partId:v.partId});this.fan(q.x,q.y,v.angle,3,.56,this.t.bulletSpeed*.88,'zubian-shell');}
  mortar(players,{count=3,tag='zubian-mortar',crossAngle=null}={}){
    if(this.gun()?.destroyed)return;const p=this.target(players);if(!p)return;const velocity=Math.hypot(p.vx||0,p.vy||0),a=crossAngle??(velocity>8?Math.atan2(p.vy,p.vx):this.hullYaw-Math.PI/2),nx=-Math.sin(a),ny=Math.cos(a),tx=p.x+(p.vx||0)*.7,ty=p.y+(p.vy||0)*.7;
    this.command('mortar-launch',{...this.gunPoint()});
    // The barrage occupies ONE side of the locked route. The opposite side
    // stays open for both pilots, rather than boxing in a moving target.
    for(let i=0;i<count;i++){const along=(i-(count-1)/2)*90,x=tx+Math.cos(a)*along+nx*115,y=ty+Math.sin(a)*along+ny*115;this.hazard('circle',{x,y,radius:40,delay:i*.2,warning:1.15,once:true,visual:'zubian-mortar',tag});}
  }

}
class ZubianHalf extends NavalPatternBoss {
  hit(attack){if(this.protection>0)return{damage:0,blocked:true};return super.hit(attack);}
  constructor({role,hullYaw=0,inheritedParts,...options}) {
    const positions=role==='front'?[['frontGun',0,-44,19],['frontEngine',0,56,22]]:[['rearGun',0,34,19],['rearEngine',0,-40,22]];
    super({...options,parts:positions.map(([id,x,y,radius])=>({id,x,y,radius,maxHp:inheritedParts?.get(id)?.maxHp||options.tuning.partHp})),kind:'hms-zubian-'+role});
    this.role=role;this.hullYaw=hullYaw;this.splitYaw=hullYaw;for(const p of this.parts.values()){const inherited=inheritedParts?.get(p.id);if(inherited)p.hp=inherited.hp;}
    this.phase=role==='front'?'front-hunt':'rear-mortar';this.chargeTime=0;this.mortarPattern=0;this.splitAge=0;this.splitX=this.x;this.splitY=this.y;this.lastStand=false;this.finalClock=5.5;this.evasionSide=role==='front'?1:-1;this.syncParts();
  }
  update(dt,{players,bounds}) {
    this.splitAge+=dt;
    this.protection=Math.max(0,(this.protection||0)-dt);
    this.coreVulnerable=this.protection<=0;
    const partner=[...this.encounter?.bodies.values()||[]].find(b=>b!==this&&b.kind?.startsWith('hms-zubian-'));
    if(partner?.dead&&!this.soloEnraged){this.soloEnraged=true;this.finalClock=Math.min(this.finalClock,.4);this.command('phase-change',{phase:this.role+'-last-stand'});}
    if(!this.lastStand&&this.hp<=this.maxHp*.5){this.lastStand=true;this.finalClock=Math.min(this.finalClock,.4);this.command('phase-change',{phase:partner&&!partner.dead?'zubian-pincer':this.role+'-last-stand'});}
    const oldX=this.x,oldY=this.y;
    this.tickVolley(dt);this.updateNaval(dt,players,bounds);
    this.driveVelocity=Math.hypot(this.x-oldX,this.y-oldY)/Math.max(.001,dt);this.syncParts();
  }
  updateNaval(dt,players,bounds){
    const mobility=this.engine()?.destroyed?.28:1;
    if(this.role==='rear') {
      const p=players.find(p=>p.alive),cx=bounds?(bounds.left+bounds.right)/2:this.splitX,cy=bounds?(bounds.top+bounds.bottom)/2:this.splitY;
      if(this.t.mobileBoss){const age=this.splitAge,retreat=this.soloEnraged||this.lastStand;steerNaval(this,dt,cx+Math.sin(age*(retreat?.8:.3))*140,cy-(p&&p.y<cy?-1:1)*120,{bounds,speed:retreat?38:22,turn:retreat?.75:.4,mobility});}
      if(!this.gun()?.destroyed&&this.due('mortar',dt,this.t.mortarInterval||2.4)&&!(this.soloEnraged||this.lastStand&&this.finalClock<1.5))this.mortar(players);
      if((this.soloEnraged||this.lastStand)&&(this.finalClock-=dt)<=0){this.finalClock=6.5;this.command('phase-change',{phase:this.soloEnraged?'zubian-stern-barrage':'zubian-pincer'});this.mortar(players,{count:this.engine()?.destroyed?2:3,tag:'zubian-final-mortar',crossAngle:(p?Math.atan2(p.vy||0,p.vx||0):this.hullYaw)+Math.PI/2});this.timers.set('mortar',3.8);}
      return;
    }
    if(this.phase==='evasive-turn'){const p=players.find(p=>p.alive);if(p)steerNaval(this,dt,p.x+Math.cos(this.hullYaw)*170,p.y+Math.sin(this.hullYaw)*170,{bounds,speed:42,turn:1.05,mobility});this.finalTurn-=dt;if(this.finalTurn<=0)this.phase='stalking';return;}
    if(this.phase==='charging') {
      const nx=this.x+this.vx*mobility*dt,ny=this.y+this.vy*mobility*dt;
      if(!bounds||(nx>=bounds.left&&nx<=bounds.right&&ny>=bounds.top&&ny<=bounds.bottom)){this.x=nx;this.y=ny;}else this.chargeTime=0;
      this.chargeTime-=dt;
      if(this.chargeTime<=0)this.phase='stalking';return;
    }
    if(this.phase==='windup') {
      const delta=Math.atan2(Math.sin(this.chargeAngle+Math.PI/2-this.hullYaw),Math.cos(this.chargeAngle+Math.PI/2-this.hullYaw));this.hullYaw+=Math.max(-dt*.7,Math.min(dt*.7,delta));
      this.chargeTime-=dt;if(this.chargeTime<=0) {
        this.phase='charging';this.chargeTime=1.1;this.chargeGun=0;
        const q=this.chargeOrigin;if(!this.gun()?.destroyed)this.hazard('projectile',{...q,vx:Math.cos(this.chargeAngle)*this.t.bulletSpeed*(this.engine()?.destroyed?.75:1.25),vy:Math.sin(this.chargeAngle)*this.t.bulletSpeed*(this.engine()?.destroyed?.75:1.25),radius:this.engine()?.destroyed?18:24,duration:2.4,piercing:true,visual:'torpedo-charge'});
      }return;
    }
    const stalk=this.target(players);if(stalk&&this.t.mobileBoss){const retreat=this.lastStand||this.soloEnraged,offset=retreat?Math.sin(this.splitAge*1.1)*180:90*this.evasionSide;steerNaval(this,dt,stalk.x+offset,stalk.y-140,{bounds,speed:retreat?42:26,turn:retreat?.72:.32,mobility});}
    if(this.due('bow-gun',dt,3.5)&&!this.gun()?.destroyed)this.warningVolley(players);
    const releasedFinal=!!this.pendingFinal;this.pendingFinal=false;const final=releasedFinal||(this.soloEnraged||this.lastStand)&&(this.finalClock-=dt)<=0;
    if(final&&this.soloEnraged&&!releasedFinal&&!this.engine()?.destroyed){this.finalClock=6.5;this.pendingFinal=true;this.finalTurn=.9;this.phase='evasive-turn';this.command('phase-change',{phase:'zubian-bow-rush'});return;}
    if(final){this.finalClock=6.5;this.command('phase-change',{phase:this.soloEnraged?'zubian-bow-rush':'zubian-pincer'});this.timers.set('charge',0);}
    if(this.due('charge',dt,(this.t.chargeInterval||3.5)+(this.engine()?.destroyed?1.5:0))) {
      const p=stalk||this.target(players);if(!p)return;const aim=Math.atan2(p.y-this.y,p.x-this.x),heading=this.hullYaw-Math.PI/2,delta=Math.atan2(Math.sin(aim-heading),Math.cos(aim-heading)),a=heading+Math.max(-.55,Math.min(.55,delta));
      this.chargeAngle=a;this.vx=Math.cos(a)*(final?86:78);this.vy=Math.sin(a)*(final?86:78);
      this.phase='windup';this.chargeTime=1.1;
      this.chargeOrigin=navalPoint({...this,hullYaw:a+Math.PI/2},0,-zubianSize(this).height*.42);
      this.command('charge-warning',{...this.chargeOrigin,targetX:this.chargeOrigin.x+Math.cos(a)*810,targetY:this.chargeOrigin.y+Math.sin(a)*810,seconds:1.1});
      const rear=[...this.encounter?.bodies.values()||[]].find(b=>b.role==='rear'&&!b.dead);rear?.supportCharge?.(p,a);
    }
  }
  supportCharge(p,chargeAngle){if(this.role!=='rear'||this.gun()?.destroyed)return;this.mortar([p],{crossAngle:chargeAngle,tag:'zubian-crossfire'});}

}
export class Zubian extends NavalPatternBoss {
  constructor(options) {super({...options,parts:[
    {id:'frontEngine',x:0,y:-38,radius:22},{id:'rearEngine',x:0,y:74,radius:22},
    {id:'frontGun',x:0,y:-138,radius:19},{id:'rearGun',x:0,y:148,radius:19},{id:'seam',x:0,y:20,radius:24,kind:'seam'}
  ],kind:'hms-zubian'});this.phase='intact';this.stateAge=0;this.splitGap=0;this.broadsideSide=-1;this.anchorX=this.x;this.anchorY=this.y;this.entryDone=false;this.broadsidePrep=null;}
  beginSplit(){if(this.phase!=='intact')return;this.phase='seam-warning';this.stateAge=0;this.coreVulnerable=false;this.broadsidePrep=null;this.command('seam-warning',{x:this.x,y:this.y,seconds:1.5});}
  hit(attack) {
    if(!Number.isFinite(attack.damage)||attack.damage<0)throw new Error('Invalid damage');
    if(this.dead||this.phase!=='intact')return{damage:0,blocked:true};
    if(attack.partId){const result=super.hit(attack);if(attack.partId==='seam'&&this.parts.get('seam').destroyed)this.beginSplit();return result;}
    const threshold=this.maxHp*.5,allowed=Math.max(0,this.hp-threshold),result=super.hit({...attack,damage:Math.min(attack.damage,allowed)});
    if(this.hp<=threshold)this.beginSplit();return{...result,split:this.phase!=='intact'};
  }
  update(dt,{players,bounds}) {
    this.stateAge+=dt;
    if(this.phase==='intact'){
      if(!this.entryDone){this.entryDone=true;this.command('phase-change',{phase:'zubian-approach'});const gun=['frontGun','rearGun'].map(id=>this.parts.get(id)).find(p=>!p.destroyed);if(gun){const q=navalPoint(this,gun.localX,gun.localY);this.command('muzzle',{...q,partId:gun.id});for(const p of players)if(p.alive)this.hazard('circle',{x:p.x+70,y:p.y-35,radius:38,warning:1.25,delay:.45,once:true,visual:'zubian-mortar',tag:'zubian-entry'});}}
      if(this.t.mobileBoss){const oldX=this.x,oldY=this.y,lost=Number(this.parts.get('frontEngine').destroyed)+Number(this.parts.get('rearEngine').destroyed),mobility=lost===2?.28:lost===1?.65:1,age=this.stateAge,cx=bounds?(bounds.left+bounds.right)/2:this.anchorX,cy=bounds?(bounds.top+bounds.bottom)/2:this.anchorY;
       steerNaval(this,dt,cx+Math.sin(age*.5)*150,cy+Math.cos(age*.35)*110,{bounds,speed:34,turn:.6,mobility});this.driveVelocity=Math.hypot(this.x-oldX,this.y-oldY)/Math.max(.001,dt);this.syncParts();}
      if(this.broadsidePrep){const v=this.broadsidePrep;v.left-=dt;if(v.left<=0){this.broadsidePrep=null;const gun=this.parts.get(v.partId);if(!gun.destroyed){const q=navalPoint(this,0,gun.localY);this.command('muzzle',{...q,partId:gun.id});this.fan(q.x,q.y,v.angle,7,1.15,this.t.bulletSpeed*.78,'zubian-shell');}}}
      if(!this.broadsidePrep&&this.stateAge>1.5&&this.due('broadside',dt,(this.t.broadsideInterval||2.8)+.9)){const side=this.broadsideSide*=-1,gun=this.parts.get(side===1?'frontGun':'rearGun');if(!gun.destroyed){const q=navalPoint(this,0,gun.localY),angle=(side===1?0:Math.PI)+this.hullYaw;this.broadsidePrep={left:.9,partId:gun.id,angle};this.command('charge-warning',{...q,targetX:q.x+Math.cos(angle)*460,targetY:q.y+Math.sin(angle)*460,seconds:.9});}}

      return;
    }
    if(this.phase==='seam-warning'){if(this.stateAge>=1.5){this.phase='splitting';this.stateAge=0;this.command('split-start',{x:this.x,y:this.y});}return;}
    if(this.phase==='splitting'){
      const progress=Math.min(1,this.stateAge/1.2);this.splitGap=ZUBIAN_LAYOUT.splitGap*progress*progress*(3-2*progress);if(this.stateAge<1.2)return;
      if(!this.encounter)throw new Error('Zubian must belong to an encounter before splitting');
      const children=['front','rear'].map(role=>new ZubianHalf({id:this.id+'-'+role,role,tuning:{...this.t,maxHp:this.hp/2},...zubianSplitPose(this,role),hullYaw:this.hullYaw,inheritedParts:this.parts,faction:this.faction,rng:this.rng,emit:this.emit,coreRadius:52*(this.t.geometryScale||1)}));
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
    this._summonTiers=[.75,.5,.3,.15];this._summonCount=0;
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
    if(!this.lastStand&&this.hp<=this.maxHp*.35){this.lastStand=true;this.command('phase-change',{phase:'bomb-surge'});this.timers.set('bombline',Math.min(this.timers.get('bombline')??Infinity,.5));}
    if(this.phase==='cloud') {
      const live=living(players),p=live[this.cursor%Math.max(1,live.length)],c=this.parts.get('capsule');
      if(p){const wx=Math.cos(mt*.9)*48,wy=Math.sin(mt*.66)*34;c.x+=((p.x-this.x+wx)-c.x)*Math.min(1,dt*.9);c.y+=((p.y-this.y+wy)-c.y)*Math.min(1,dt*.9);const dx=c.x,dy=c.y-150,d=Math.hypot(dx,dy),leash=168;if(d>leash){c.x=dx/d*leash;c.y=150+dy/d*leash;}}
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
      // Escort airships arrive as the hull bleeds, not all at once on reveal.
      if(this._summonTiers.length&&this.hp<=this.maxHp*this._summonTiers[0]){this._summonTiers.shift();const ox=[-170,170,0][this._summonCount%3];this.command('spawn-minion',{minion:'airship',faction:this.faction,x:this.x+ox,y:this.y-140-(this._summonCount%2)*40});this._summonCount++;}
      if(this.due('bombline',dt,(this.t.gasInterval||6)*(this.lastStand ? .72 : 1))){
        const p=this.target(players);
        if(p){const horizontal=(this.gasSide*=-1)>0,n=5,tx=p.x+(p.vx||0)*.4,ty=p.y+(p.vy||0)*.4;
          for(let i=0;i<n;i++){const off=(i-2)*78;
            this.hazard('circle',{x:Math.max(bounds.left+40,Math.min(bounds.right-40,tx+(horizontal?off:0))),y:Math.max(bounds.top+40,Math.min(bounds.bottom-40,ty+(horizontal?0:off))),radius:48,delay:i*.16,warning:1.15,once:true,damage:this.t.damage*.7,visual:'carpet-bomb'});}
        }
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
    this._escortTiers??=[.7,.45,.25];this._escortCount??=0;
    if(this._escortTiers.length&&this.hp<=this.maxHp*this._escortTiers[0]){this._escortTiers.shift();const ox=[-170,170,0][this._escortCount%3];this.command('spawn-minion',{minion:'airship',faction:this.faction,x:this.x+ox,y:this.y-150-(this._escortCount%2)*40});this._escortCount++;}
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

// Alpine bombers own their measured flight pose and physical weapon timers.
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
    this.coreRadius=58*scale;this.combatPhase=1;this.finalAge=0;this.pendingVolley=null;this.rotation=null;initArmorDrive(this);
  }
  suppressive(){} // Every shot belongs to a real surviving mount.
  liveGuns(){return this.gunIds.map(id=>this.parts.get(id)).filter(p=>!p.destroyed);}
  trackLoss(){return ['track-left','track-right'].filter(id=>this.parts.get(id).destroyed).length;}
  syncMounts(){for(const p of this.parts.values()){const q=armorRotate(p.localX,p.localY,this.hullYaw);p.x=q.x;p.y=q.y;p.angle=this.hullYaw+p.aimAngle;}}
  drive(dt,speed,turn=0,bounds,brake=false){stepArmorDrive(this,dt,{speed,turn,bounds,brake});this.tickHullShots(dt);}
  updatePhase(){
    const next=this.hp<=this.maxHp*.35?3:this.hp<=this.maxHp*.7?2:1;
    if(next>this.combatPhase){this.combatPhase=next;this.pendingVolley=null;this.rotation=null;this.timers.set('armor-pattern',.15);this.command('phase-change',{phase:(this.kind==='a7v-flak'?'a7v':'markv')+(next===3?'-last-stand':'-tracking')});}
  }
  warnGun(gun,seconds=.85){const point=armorGunMuzzle(this.kind,gun,this.hullYaw,this.t.geometryScale||1);this.command('charge-warning',{partId:gun.id,x:this.x+point.x,y:this.y+point.y,targetX:this.x+point.x+Math.cos(point.angle)*420,targetY:this.y+point.y+Math.sin(point.angle)*420,seconds});}
  scheduleGun(gun,{wait=.85,spread=.3,count=3}={}){if(!gun||gun.destroyed)return;this.warnGun(gun,wait);this.pendingVolley={partId:gun.id,left:wait,spread,count};}
  tickGun(dt){const v=this.pendingVolley;if(!v)return;v.left-=dt;if(v.left>0)return;this.pendingVolley=null;const gun=this.parts.get(v.partId);if(gun.destroyed)return;this.fireGun(gun,v);}
  fireGun(gun,{spread=.3,count=3}={}){
    if(gun.destroyed)return;const m=this.muzzle(gun),arc=this.layout.gunArc;
    count=Math.max(1,Math.ceil(count*(this.t.projectileDensity??1)));
    for(let i=0;i<count;i++){const local=gun.aimAngle+(count===1?0:i/(count-1)-.5)*spread,angle=this.hullYaw+gun.baseAngle+Math.max(-arc,Math.min(arc,armorAngleDelta(local,gun.baseAngle)));
      this.hazard('projectile',{...m,vx:Math.cos(angle)*this.t.bulletSpeed*.82,vy:Math.sin(angle)*this.t.bulletSpeed*.82,radius:5,duration:3,damage:this.t.damage*.7,visual:'aa-shell',tag:this.gunTag(gun)});
    }
  }
  startRotation(final=false){
    const sign=this.patternIndex++%2?-1:1;this.pendingVolley=null;this.rotation={stage:'brake',age:0,sign,clock:.65,index:0,final};this.tacticalState='braking';
    this.command('armor-brake',{});this.command('phase-change',{phase:this.kind==='a7v-flak'?(final?'a7v-hunting-net':'a7v-steel-turret'):(final?'markv-runaway':'markv-steel-waltz')});
  }
  rotatingFire(dt,r){
    // Fire ONE real casemate at a time. The missing mount leaves a full gap.
    if((r.clock-=dt)>0)return;r.clock=.44;const id=this.gunIds[(r.index++%this.gunIds.length+this.gunIds.length)%this.gunIds.length],gun=this.parts.get(id);
    if(!gun.destroyed)this.fireGun(gun,{count:this.kind==='a7v-flak'?3:4,spread:this.kind==='a7v-flak'?.32:.4});
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
    this.kickX=(this.kickX||0)-Math.cos(point.angle)*4;this.kickY=(this.kickY||0)-Math.sin(point.angle)*4;this.command('muzzle',{x,y,partId:gun.id});return{x,y};
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
    if(!attack.partId){const floor=this.combatPhase===1?this.maxHp*.7:this.combatPhase===2?this.maxHp*.35:this.finalAge<1.15?this.maxHp*.08:0;attack={...attack,damage:Math.min(attack.damage*armor,Math.max(0,this.hp-floor))};}
    const result=super.hit(attack);if(!this.dead)this.updatePhase();return result;
  }
  onPartDestroyed(part){
    if(part.id==='searchlight'){this.command('cancel-hazards',{tag:'a7v-lights'});this.command('phase-change',{phase:'a7v-light-lost'});}
    else if(part.kind==='track'){
      if(this.trackLoss()===2){this.driveVelocity=0;this.leftTrack.speed=this.rightTrack.speed=0;}
      this.command('phase-change',{phase:this.trackLoss()===2?'tracks-disabled':'track-disabled'});
    }else if(part.kind==='engine-deck'){
      this.driveVelocity=0;this.leftTrack.speed=this.rightTrack.speed=0;this.hp=Math.max(1,this.hp-this.maxHp*.18);this.coreVulnerable=true;this.phase=this.liveGuns().length?'breached':'exposed';
      this.command('cancel-hazards',{tag:'armor-engine-vent'});
      this.command('ammo-cookoff',{x:this.x+part.x,y:this.y+part.y});
      this.command('phase-change',{phase:'engine-disabled'});
    }else{
      this.command('cancel-hazards',{tag:this.gunTag(part)});
      const left=this.liveGuns().length,threshold=this.kind==='a7v-flak'?2:1;
      if(left<=threshold){this.coreVulnerable=true;this.phase=left?'breached':(this.kind==='mark-v-cruiser'?'final-assault':'exposed');this.command('phase-change',{phase:this.phase});}
    }
    if(this.pendingVolley?.partId===part.id)this.pendingVolley=null;
    if(this.coreVulnerable||this.trackLoss()===2)this.parts.get('engine-deck').hittable=true;
  }
  gunTag(gun){return this.kind==='a7v-flak'?'a7v-'+gun.id:gun.id;}
  tickHullShots(dt){
    for(const shot of this.hullShots||[]){shot.left-=dt;if(shot.left>0)continue;
      const s=this.t.geometryScale||1,m=armorRotate(0,shot.localY*s,this.hullYaw),facing=this.hullYaw+(shot.localY>0?Math.PI/2:-Math.PI/2),angle=facing+Math.max(-.3,Math.min(.3,armorAngleDelta(shot.angle,facing)));
      const x=this.x+m.x,y=this.y+m.y;this.command('muzzle',{x,y});
      this.hazard('projectile',{x,y,vx:Math.cos(angle)*this.t.bulletSpeed,vy:Math.sin(angle)*this.t.bulletSpeed,radius:4,duration:2.8,damage:this.t.damage*.38,visual:'armor-tracer',tag:'armor-hull-gun'});
    }
    this.hullShots=(this.hullShots||[]).filter(s=>s.left>0);
  }
  hullGun(dt,players,interval){
    if(!this.coreVulnerable||!this.due('hull-gun',dt,interval))return;
    const p=this.target(players);if(!p)return;
    const s=this.t.geometryScale||1,relative=armorRotate(p.x-this.x,p.y-this.y,-this.hullYaw),localY=relative.y>0?116:-116;
    const mount=armorRotate(0,localY*s,this.hullYaw),x=this.x+mount.x,y=this.y+mount.y;
    const facing=this.hullYaw+(localY>0?Math.PI/2:-Math.PI/2),angle=facing+Math.max(-.3,Math.min(.3,armorAngleDelta(Math.atan2(p.y-y,p.x-x),facing))),count=this.parts.get('engine-deck').destroyed?3:6;
    this.command('charge-warning',{hullMountY:localY,lockedAngle:angle,x,y,targetX:x+Math.cos(angle)*420,targetY:y+Math.sin(angle)*420,seconds:.75});
    this.hullShots=this.hullShots||[];
    for(let i=0;i<count;i++)this.hullShots.push({localY,angle:angle+(i-(count-1)/2)*.035,left:.75+i*.085});
  }
  engineVent(dt){
    const engine=this.parts.get('engine-deck');
    if(!this.coreVulnerable||engine.destroyed||!this.due('engine-vent',dt,6.2))return;
    this.tacticalState='engine-vent';
    this.hazard('circle',{x:this.x+engine.x,y:this.y+engine.y,radius:68,warning:1.25,duration:2.3,tickInterval:.8,damage:this.t.damage*.45,visual:'livens-leak',tag:'armor-engine-vent'});
  }
  impact(gun,x,y,{delay=0,radius=37,warning=1.22,damage=1,bounds}={}){
    // The target sets the ballistic landing point. Never teleport a fixed
    // casemate's barrel to that point when a volley is emitted.
    if(gun.destroyed)return;const m=this.muzzle(gun),base=this.hullYaw+gun.baseAngle;
    const bearing=Math.atan2(y-m.y,x-m.x),angle=base+Math.max(-this.layout.gunArc,Math.min(this.layout.gunArc,armorAngleDelta(bearing,base)));
    let range=Math.max(60,Math.hypot(x-m.x,y-m.y));
    if(bounds){const dx=Math.cos(angle),dy=Math.sin(angle),edges=[];if(dx>1e-6)edges.push((bounds.right-radius-m.x)/dx);else if(dx< -1e-6)edges.push((bounds.left+radius-m.x)/dx);if(dy>1e-6)edges.push((bounds.bottom-radius-m.y)/dy);else if(dy< -1e-6)edges.push((bounds.top+radius-m.y)/dy);const available=edges.filter(n=>n>0);if(available.length)range=Math.min(range,...available);}
    x=m.x+Math.cos(angle)*range;y=m.y+Math.sin(angle)*range;
    this.hazard('circle',{x,y,radius,delay,warning,duration:.48,once:true,damage:this.t.damage*damage,
      visual:'aa-flak',sourceX:m.x,sourceY:m.y,sourcePartId:gun.id,tag:this.gunTag(gun)});
  }
}

export class A7VFlak extends TrenchArmor {
  constructor(options){
    super(options,'a7v-flak');this.phase='fortress';this.turretCursor=0;this.illumination=new Map();this.routeAge=0;this.entryDuration=2;
    const scale=this.t.geometryScale||1;const lamp=new BossPart({id:'searchlight',kind:'searchlight',x:0,y:-54*scale,radius:15*scale,maxHp:this.t.partHp*.65});Object.assign(lamp,{localX:lamp.x,localY:lamp.y,baseAngle:-Math.PI/2,aimAngle:-Math.PI/2});this.parts.set(lamp.id,lamp);
    this.timers.set('lights',.3);this.timers.set('turret-cycle',.6);this.timers.set('armor-pattern',5.2);
  }
  searchlights(dt,players,bounds,isIlluminated){
    const lamp=this.parts.get('searchlight');
    for(const p of players){const key=p.id??p,age=!lamp.destroyed&&isIlluminated?.(p)?Math.min(.7,(this.illumination.get(key)||0)+dt):0;this.illumination.set(key,age);}
    if(lamp.destroyed)return;
    const target=this.target(players);if(!target)return;const desired=Math.atan2(target.y-this.y-lamp.y,target.x-this.x-lamp.x);
    this.lampAngle=(this.lampAngle??desired)+Math.max(-.42*dt,Math.min(.42*dt,armorAngleDelta(desired,this.lampAngle??desired)));
    if(this.due('lights',dt,5.4))this.hazard('searchlight',{x:this.x+lamp.x,y:this.y+lamp.y,angle:this.lampAngle,halfAngle:.14,radius:Math.max(600,(bounds?.bottom-bounds?.top)||700),duration:5.4,warning:.7,damage:0,tickInterval:.2,visual:'searchlight',tag:'a7v-lights'});
    this.command('armor-light-pose',{x:this.x+lamp.x,y:this.y+lamp.y,angle:this.lampAngle});
  }
  finalFlak(players,bounds){
    const guns=this.liveGuns();if(!guns.length)return;const p=this.target(players);if(!p)return;
    const lamp=this.parts.get('searchlight'),tracked=!lamp.destroyed&&(this.illumination.get(p.id??p)||0)>=.55,lead=tracked?.65:.25;
    // Two brackets, rather than a full wall, leave the predicted centre clear.
    const width=bounds?bounds.right-bounds.left:800,step=Math.min(92,width*.23),radius=Math.min(33,step*.35),tx=bounds?Math.max(bounds.left+step+radius,Math.min(bounds.right-step-radius,p.x+(p.vx||0)*lead)):p.x+(p.vx||0)*lead,ty=bounds?Math.max(bounds.top+radius,Math.min(bounds.bottom-radius,p.y+(p.vy||0)*lead)):p.y+(p.vy||0)*lead;
    for(let i=0;i<Math.min(2,guns.length);i++)this.impact(guns[i],tx+(i?step:-step),ty,{radius,warning:1.2,delay:i*.22,bounds});
  }
  update(dt,{players,bounds,isIlluminated}){
    this.entryAge+=dt;if(this.combatPhase===3)this.finalAge+=dt;this.updatePhase();
    if(this.entryAge<=this.entryDuration){this.tacticalState='entry';this.drive(dt,24,0,bounds);this.aim(dt,players);if(this.entryAge-dt===0){this.command('armor-entry',{});this.command('phase-change',{phase:'a7v-entry'});}return;}
    this.searchlights(dt,players,bounds,isIlluminated);
    const r=this.rotation;
    if(r){r.age+=dt;
      if(r.stage==='brake'){this.drive(dt,0,0,bounds,true);this.tacticalState='braking';if(r.age>=.9){r.stage='spin';r.age=0;this.tacticalState='steel-turret';for(const g of this.liveGuns())this.warnGun(g,1);}}
      else if(r.stage==='spin'){this.drive(dt,0,r.sign*(this.combatPhase===3?.64:.52),bounds);this.aim(dt,players);if(r.age>=1)this.rotatingFire(dt,r);if(r.age>=4.8){r.stage=r.final?'finish':'recover';r.age=0;this.drive(dt,0,0,bounds,true);if(r.final)this.finalFlak(players,bounds);this.command('phase-change',{phase:'a7v-recovery'});}}
      else{this.drive(dt,0,0,bounds,true);this.aim(dt,players);this.tacticalState='recovery';if(r.age>=2){this.rotation=null;this.routeAge=0;this.timers.set('armor-pattern',this.combatPhase===3?5.8:8.2);}}
      return;
    }
    this.routeAge+=dt;const cycle=this.routeAge%7,move=cycle<2.8||cycle>5.8,reverse=cycle>5.8;
    this.tacticalState=move?'reposition':'alternating-fire';this.drive(dt,move?(reverse?-19:24):0,this.combatPhase>=2?Math.sin(this.routeAge*.5)*.22:0,bounds,!move);this.aim(dt,players);this.tickGun(dt);
    if(this.due('armor-pattern',dt,this.combatPhase===3?6.8:this.combatPhase===2?9.4:11.5)){this.startRotation(this.combatPhase===3);return;}
    if(!move&&!this.pendingVolley&&this.due('turret-cycle',dt,.85)){const gun=this.parts.get(this.gunIds[this.turretCursor++%4]);this.scheduleGun(gun);}
    if(this.combatPhase>=2&&this.due('precision',dt,4.7)){if((this.precisionSerial=(this.precisionSerial||0)+1)%2===0)this.finalFlak(players,bounds);else{const guns=this.liveGuns(),p=this.target(players);if(p&&guns.length){const gun=guns.reduce((a,g)=>Math.abs(armorAngleDelta(Math.atan2(p.y-this.y-g.y,p.x-this.x-g.x),this.hullYaw+g.baseAngle))<Math.abs(armorAngleDelta(Math.atan2(p.y-this.y-a.y,p.x-this.x-a.x),this.hullYaw+a.baseAngle))?g:a),locked=(this.illumination.get(p.id??p)||0)>=.55,lead=locked?.48:.2,scatter=locked?12:44;this.impact(gun,p.x+(p.vx||0)*lead+randBetween(this.rng,-scatter,scatter),p.y+(p.vy||0)*lead+randBetween(this.rng,-scatter,scatter),{radius:35,warning:1.22,bounds});}}}
    this.hullGun(dt,players,3.4);this.engineVent(dt);
  }
}

export class MarkVCruiser extends TrenchArmor {
  constructor(options){super(options,'mark-v-cruiser');this.phase='barrage';this.sponsonSide=0;this.routeAge=0;this.entryDuration=2.4;this.timers.set('sponson-cycle',.5);this.timers.set('armor-pattern',6.6);}
  steering(players,bounds){
    const target=players.find(p=>p.alive);let desired=Math.PI;
    if(target){const bearing=Math.atan2(target.y-this.y,target.x-this.x),gun=this.liveGuns()[0];
      // Keep the surviving sponson toward the target: the ruined side faces away.
      desired=this.combatPhase===3&&this.liveGuns().length===1?bearing-gun.baseAngle:bearing+Math.PI/2;
    }
    if(bounds){const margin=Math.min(100,(bounds.right-bounds.left)*.22),cy=(bounds.top+bounds.bottom)/2;
      if(this.x<bounds.left+margin||this.x>bounds.right-margin||this.y<bounds.top+90||this.y>bounds.bottom-90)desired=Math.atan2(cy-this.y,(bounds.left+bounds.right)/2-this.x)+Math.PI/2;
    }
    return Math.max(-.32,Math.min(.32,armorAngleDelta(desired,this.hullYaw)));
  }
  startWaltz(final){
    this.startRotation(final);const r=this.rotation;r.stage=final?'windup':'arc';r.clock=.4;
    const gun=this.liveGuns()[0];if(this.combatPhase===3&&this.liveGuns().length===1)r.sign=gun.id==='sponson-left'?1:-1;
    if(final){const length=180,x=this.x+Math.sin(this.hullYaw)*length,y=this.y-Math.cos(this.hullYaw)*length;
      this.command('charge-warning',{x:this.x,y:this.y,targetX:x,targetY:y,seconds:1.1});}
  }
  runningBroadside(dt,r){
    if((r.clock-=dt)>0)return;r.clock=1.05;
    const gun=this.parts.get(this.gunIds[r.index++%2]);if(!gun.destroyed)this.scheduleGun(gun,{wait:.72,spread:.34,count:3});
  }
  breakthrough(players,bounds){
    // A final short, warned burst from the surviving actual gun arcs. No wall
    // across both pilots, and a destroyed sponson leaves its whole flank open.
    for(const gun of this.liveGuns())this.scheduleBreakthrough(gun);
    this.timers.set('hull-gun',0);this.hullGun(.05,players,3.6);
  }
  scheduleBreakthrough(gun){
    this.warnGun(gun,.9);this.breakthroughPorts=this.breakthroughPorts||[];this.breakthroughPorts.push({partId:gun.id,left:.9});
  }
  tickBreakthrough(dt){
    for(const shot of this.breakthroughPorts||[]){shot.left-=dt;if(shot.left<=0){const gun=this.parts.get(shot.partId);if(!gun.destroyed)this.fireGun(gun,{count:4,spread:.4});}}
    this.breakthroughPorts=(this.breakthroughPorts||[]).filter(s=>s.left>0);
  }
  update(dt,{bounds,players=[]}){
    this.entryAge+=dt;if(this.combatPhase===3)this.finalAge+=dt;this.updatePhase();
    if(this.entryAge<=this.entryDuration){this.tacticalState='entry';this.drive(dt,27,0,bounds);this.aim(dt,players);if(this.entryAge-dt===0){this.command('armor-entry',{});this.command('phase-change',{phase:'markv-entry'});}return;}
    this.tickBreakthrough(dt);const r=this.rotation;
    if(r){r.age+=dt;this.tickGun(dt);
      if(r.stage==='arc'){
        this.tacticalState='wide-turn';this.drive(dt,28,r.sign*.28,bounds);this.aim(dt,players);this.runningBroadside(dt,r);
        if(r.age>=2.5){r.stage='brake';r.age=0;this.pendingVolley=null;this.command('armor-brake',{});}
      }else if(r.stage==='windup'){
        this.tacticalState='runaway-warning';this.drive(dt,0,0,bounds,true);this.aim(dt,players);
        if(r.age>=1.1){r.stage='charge';r.age=0;for(const gun of this.liveGuns())this.warnGun(gun,.75);}
      }else if(r.stage==='charge'){
        this.tacticalState='runaway-advance';this.drive(dt,58,this.steering(players,bounds)*.55,bounds);this.aim(dt,players);this.runningBroadside(dt,r);
        if(r.age>=2.4){r.stage='brake';r.age=0;this.pendingVolley=null;this.command('armor-brake',{});}
      }else if(r.stage==='brake'){
        this.tacticalState='braking';this.drive(dt,0,0,bounds,true);this.aim(dt,players);
        if(r.age>=.85){r.stage='spin';r.age=0;r.clock=.35;for(const gun of this.liveGuns())this.warnGun(gun,1);}
      }else if(r.stage==='spin'){
        this.tacticalState='steel-waltz';this.drive(dt,0,r.sign*.5,bounds);this.aim(dt,players);if(r.age>=1)this.rotatingFire(dt,r);
        if(r.age>=3.8){r.stage=r.final?'breakthrough':'recover';r.age=0;if(r.final)this.breakthrough(players,bounds);else this.command('phase-change',{phase:'markv-recovery'});}
      }else if(r.stage==='breakthrough'){
        this.tacticalState='final-breakthrough';this.drive(dt,42,0,bounds);this.aim(dt,players);
        if(r.age>=1.15){r.stage='recover';r.age=0;this.command('armor-brake',{});this.command('phase-change',{phase:'markv-recovery'});}
      }else{
        this.tacticalState='recovery';this.drive(dt,0,0,bounds,true);this.aim(dt,players);
        if(r.age>=2.1){this.rotation=null;this.routeAge=0;this.timers.set('armor-pattern',this.combatPhase===3?5.5:7.2);}
      }
      return;
    }
    this.routeAge+=dt;const reverse=this.routeAge%11>9.5;
    this.tacticalState=reverse?'reverse-regroup':this.combatPhase===3?'protect-sponson':'forward-pressure';
    this.drive(dt,reverse?-22:this.combatPhase===3?32:26,this.combatPhase>=2?this.steering(players,bounds):0,bounds);this.aim(dt,players);this.tickGun(dt);
    if(this.due('armor-pattern',dt,this.combatPhase===3?6:this.combatPhase===2?8:11.2)){this.startWaltz(this.combatPhase===3);return;}
    if(!this.pendingVolley&&this.due('sponson-cycle',dt,1.6)){const gun=this.parts.get(this.gunIds[this.sponsonSide++%2]);this.scheduleGun(gun,{wait:.9,spread:.4,count:3});}
    this.hullGun(dt,players,3.6);this.engineVent(dt);
  }
}



export class ArmoredHarborFortress extends PatternBoss {
  constructor(options){
    const parts=HARBOR_PARTS.map(p=>({...p,maxHp:options.tuning.maxHp*(p.kind==='crane-arm'?.13:p.kind==='crane-pivot'?.10:p.kind==='harbor-gun'?.08:.12)}));
    super({...options,kind:'armored-harbor-fortress',parts});
    this.ownsMotion129=true;this.anchorX=this.x;this.anchorY=this.y;this.phase='coastal-battery';this.coreVulnerable=false;
    this.craneAngle=-.55;this.craneState='idle';this.craneClock=1.8;this.craneSerial=0;this.gunSide=0;this.elapsed=0;this.gunBursts=[];this.launchRun=null;
    for(const spec of HARBOR_PARTS){const p=this.parts.get(spec.id);Object.assign(p,{localX:spec.x,localY:spec.y,drawWidth:spec.width,drawHeight:spec.height,cell:spec.cell,artAngle:spec.artAngle,launchWarmup:0,recoil:0});if(p.kind==='harbor-gun')p.angle=spec.artAngle;}
    this.externalParts=['crane-arm','ammo-storage','gun-left','gun-right','gun-front-left','gun-front-right','seaplane-facility'];this.syncCrane();
  }
  pose(){return harborCranePose(this);}
  liveGuns(){return [...this.parts.values()].filter(p=>p.kind==='harbor-gun'&&!p.destroyed);}
  syncCrane(){const p=this.parts.get('crane-arm'),q=this.pose().arm;p.x=q.x-this.x;p.y=q.y-this.y;}
  locateHit(shot){
    if(this.dead)return null;const s=harborScale(this),pose=this.pose(),arm=this.parts.get('crane-arm');
    for(const p of this.parts.values())if(p.id!=='crane-arm'&&p.hittable&&!p.destroyed&&harborSegmentHit(shot,{x:this.x+p.x,y:this.y+p.y},{x:this.x+p.x,y:this.y+p.y},p.radius))return{partId:p.id};
    if(!arm.destroyed&&harborSegmentHit(shot,{x:pose.pivot.x+Math.cos(this.craneAngle)*20*s,y:pose.pivot.y+Math.sin(this.craneAngle)*20*s},pose.tip,14*s))return{partId:arm.id};
    const core=harborPoint(this,0,-44);return this.coreVulnerable&&harborSegmentHit(shot,core,core,43*s)?{partId:null}:null;
  }
  hitAt(attack){const h=this.locateHit(attack);return h?this.hit({...h,damage:attack.damage}):{damage:0,miss:true};}
  hit(attack){const result=super.hit(attack);if(attack.partId&&result.damage>0){this.hp=Math.max(this.coreVulnerable?0:this.maxHp*.45,this.hp-result.damage*.35);if(!this.hp&&!this.dead){this.dead=true;this.phase='defeated';this.command('body-defeated');result.bodyDefeated=true;}}return result;}
  suppressive(){/* The crane, individual gun mounts and launch dock own attacks. */}
  onPartDestroyed(p){
    if(p.kind==='harbor-gun'){this.gunBursts=this.gunBursts.filter(b=>b.partId!==p.id);this.command('cancel-hazards',{tag:'harbor-'+p.id});}
    if(p.id==='ammo-storage'&&!this.ammoDetonated){this.ammoDetonated=true;this.hp=Math.max(1,this.hp-this.maxHp*.15);this.command('ammo-detonation',{x:this.x+p.x,y:this.y+p.y});}
    if(p.id==='seaplane-facility'){this.launchRun=null;p.launchWarmup=0;this.command('phase-change',{phase:'harbor-launch-disabled'});}
    if(p.id==='crane-arm'||p.id==='crane-pivot'){this.craneState='collapsed';this.command('cancel-hazards',{tag:'harbor-crane'});}
    const lost=this.externalParts.filter(id=>this.parts.get(id).destroyed).length;
    if(lost>=1&&this.phase==='coastal-battery'){this.phase='seaplane-support';this.command('phase-change',{phase:this.phase});}
    if((this.parts.get('crane-arm').destroyed||lost>=3)&&!this.parts.get('crane-pivot').destroyed){this.parts.get('crane-pivot').hittable=true;if(this.phase!=='breached'){this.phase='breached';this.command('phase-change',{phase:this.phase});}}
    if(p.id==='crane-pivot'){
      const arm=this.parts.get('crane-arm');if(!arm.destroyed){arm.hp=0;arm.destroyedAt=this.motionTime||0;this.command('part-destroyed',{partId:arm.id});}
      this.phase='final-core';this.coreVulnerable=true;this.hp=Math.min(this.hp,this.maxHp*.42);this.command('phase-change',{phase:this.phase});
    }
  }
  startCrane(players){
    const target=this.target(players);if(!target)return;const pivot=this.pose().pivot,heading=Math.atan2(target.y-pivot.y,target.x-pivot.x),side=this.craneSerial++%2?1:-1;
    this.craneStart=this.craneAngle+angleDelta(heading-side*.6,this.craneAngle);this.craneEnd=this.craneStart+side*1.2;
    this.craneWarn=Math.max(1.15,Math.abs(this.craneStart-this.craneAngle)/.55+.04);this.craneClock=this.craneWarn;this.craneState='windup';
    this.craneTarget={x:target.x+(target.vx||0)*.6,y:target.y+(target.vy||0)*.6};
    const supplied=!this.parts.get('ammo-storage').destroyed;
    this.hazard('circle',{...this.pose().load,radius:(supplied?18:9)*harborScale(this),warning:this.craneWarn,duration:2.8,tickInterval:.5,damage:this.t.damage*(supplied?.72:.5),visual:'harbor-swing',tag:'harbor-crane'});
  }
  dropMines(bounds){
    if(this.parts.get('ammo-storage').destroyed||!bounds)return;const source=this.pose().load,target=this.craneTarget,points=[];
    for(const offset of [-110,0,110]){const p={x:Math.max(bounds.left+44,Math.min(bounds.right-44,target.x+offset)),y:Math.max(bounds.top+44,Math.min(bounds.bottom-44,target.y-110))};if(!points.some(q=>Math.hypot(p.x-q.x,p.y-q.y)<50))points.push(p);}
    this.command('spawn-minefield',{points,sourceX:source.x,sourceY:source.y,warning:1.2,life:8.5,maxMines:9});
    this.command('crane-drop',{...source});
  }
  updateCrane(dt,players,bounds){
    if(this.craneState==='collapsed')return;this.craneClock-=dt*((this.craneState==='idle'||this.craneState==='recover')?(this.t.patternMultiplier||1):1);
    if(this.craneState==='idle'){if(this.craneClock<=0)this.startCrane(players);}
    else if(this.craneState==='windup'){
      this.craneAngle=turnToward(this.craneAngle,this.craneStart,.55*dt);
      if(this.craneClock<=0){this.craneState='sweep';this.craneClock=2.8;this.craneAngle=this.craneStart;}
    }else if(this.craneState==='sweep'){
      const t=Math.min(1,Math.max(0,1-this.craneClock/2.8));this.craneAngle=this.craneStart+(this.craneEnd-this.craneStart)*(.5-.5*Math.cos(t*Math.PI));
      if(this.craneClock<=0){this.dropMines(bounds);this.craneState='recover';this.craneClock=this.parts.get('ammo-storage').destroyed?4.1:2.8;this.command('cancel-hazards',{tag:'harbor-crane'});}
    }else if(this.craneState==='recover'&&this.craneClock<=0){this.craneState='idle';this.craneClock=.1;}
    const supplied=!this.parts.get('ammo-storage').destroyed;
    this.syncCrane();this.command('harbor-load-pose',{...this.pose().load,radius:(supplied?18:9)*harborScale(this),damage:this.t.damage*(supplied?.72:.5),tag:'harbor-crane'});
  }
  updateGuns(dt,players){
    const guns=this.liveGuns(),target=players.find(p=>p.alive);for(const gun of guns){gun.recoil=Math.max(0,gun.recoil-dt*3);if(target&&!this.gunBursts.some(b=>b.partId===gun.id))gun.angle=turnToward(gun.angle,Math.atan2(target.y-this.y-gun.y,target.x-this.x-gun.x),.72*dt);}
    const supplied=!this.parts.get('ammo-storage').destroyed;
    if(guns.length&&this.due('harbor-guns',dt,(this.t.coastalInterval||2.5)*(supplied?1:1.6))){const gun=guns[this.gunSide++%guns.length];this.gunBursts.push({partId:gun.id,left:supplied?3:1,clock:0});}
    for(const burst of this.gunBursts){const gun=this.parts.get(burst.partId);if(gun.destroyed){burst.left=0;continue;}burst.clock-=dt;
      if(burst.left>0&&burst.clock<=0){const q=harborMuzzle(this,gun),a=gun.angle;gun.recoil=1;this.command('muzzle',{...q,partId:gun.id});this.hazard('projectile',{...q,vx:Math.cos(a)*this.t.bulletSpeed*.82,vy:Math.sin(a)*this.t.bulletSpeed*.82,radius:6,damage:this.t.damage*.8,visual:'harbor-shell',tag:'harbor-'+gun.id});burst.left--;burst.clock+=.24;}}
    this.gunBursts=this.gunBursts.filter(b=>b.left>0);
  }
  prepareSortie(players){const p=this.target(players);if(!p)return;this.launchRun={clock:1.05,index:0,target:{x:p.x+(p.vx||0)*.7,y:p.y+(p.vy||0)*.7}};this.parts.get('seaplane-facility').launchWarmup=1.05;}
  updateSortie(dt,players){
    const p=this.parts.get('seaplane-facility');if(p.destroyed)return;
    if(!this.launchRun&&this.phase!=='coastal-battery'&&this.due('harbor-seaplanes',dt,this.t.harborLaunchInterval||5.6))this.prepareSortie(players);
    const run=this.launchRun;if(!run)return;run.clock-=dt;p.launchWarmup=Math.max(0,run.clock);
    if(run.clock<=1e-8){const q=harborLaunchPoint(this),i=run.index++;this.command('spawn-minion',{...q,minion:this.faction==='central'?'seaplane-central':'seaplane-entente',a:Math.PI/2,behavior:'attack-pass',formationIndex:i,formationCount:2,passTargetX:run.target.x+(i?90:-90),passTargetY:run.target.y,invulnerableSeconds:.4});run.clock=.24;if(run.index>=2){this.launchRun=null;p.launchWarmup=0;}}
  }
  update(dt,{players,bounds}){
    this.x=this.anchorX;this.y=this.anchorY;this.elapsed+=dt;
    if(this.phase==='coastal-battery'&&this.elapsed>=8){this.phase='seaplane-support';this.command('phase-change',{phase:this.phase});}
    this.updateCrane(dt,players,bounds);this.updateGuns(dt,players);this.updateSortie(dt,players);
  }
}

const angleDelta=(to,from)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));


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
    this.discovered=false;this.nozzleRevealed=false;this.trenchEntry={state:'buried',age:0,revealAge:0};this.raidPhase=1;this.recovery=0;this.flameQueue=[];this.flameGap=0;this.stormTriggered=false;
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
  hit(attack){const result=super.hit(attack);if(this.dead)this.dispose();return result;}
  dispose(){this.flameQueue.length=0;this.lockedFlameAngle=null;this.stormActive=false;this.recovery=0;}
  suppressive(){/* Livens attacks through its persistent flamethrower and fuel leaks. */}
  onPartDestroyed(p){
    if(p.id.startsWith('tank-'))this.hazard('circle',{x:this.x+p.x,y:this.y+p.y,radius:54,warning:.65,duration:2,tickInterval:.35,damage:this.t.damage*.55,visual:'livens-leak',tag:'livens-leak'});
    if(p.id==='pressure'){this.command('cancel-hazards',{tag:'livens-flame'});this.lockedFlameAngle=null;this.flameGap=.6;this.recovery=1.8;}
    if(p.id==='pressure')this.hazard('circle',{x:this.x+p.x,y:this.y+p.y,radius:68,warning:.8,duration:.4,once:true,damage:this.t.damage*.75,visual:'livens-pressure'});
    // The core opens once the fuel/pressure system is wrecked; the nozzle
    // mount keeps fighting until the boss itself is destroyed.
    if(this.allDestroyed(['tank-l1','tank-l2','tank-r1','tank-r2','pressure'])){
      this.phase='core-exposed';this.coreVulnerable=true;this.command('phase-change',{phase:'exposed'});
    }
  }
  beginFlame(mode,target){
    const weak=this.parts.get('pressure').destroyed,dir=this.flameCount%2?-1:1;
    let warn=weak?1.4:1.15,dur=weak?1.2:1.8,speed=0,span=0,range=weak?390:560;
    const desired=target?Math.atan2(target.y-this.y-this.nozzleMount.y,target.x-this.x):this.nozzleAngle;
    if(mode==='sweep'){dur=weak?1.5:2.2;span=dir*1.65;speed=span/dur;}
    if(mode==='pulse'){dur=weak?.65:.95;warn=1.25;}
    if(mode==='rotate'){dur=weak?1.1:1.7;speed=dir*.95;span=speed*dur;}
    if(mode==='storm-spin'){dur=weak?1.55:2.4;warn=1.5;speed=1.05;span=speed*dur;range=weak?390:600;}
    if(mode==='storm-return'){dur=weak?1.15:1.8;warn=1.05;speed=-1.05;span=speed*dur;range=weak?390:600;}
    if(mode==='storm-sweep'){dur=weak?1.55:2.4;warn=1.2;span=1.6;speed=span/dur;range=weak?390:600;}
    // Stop tracking before the visible warning. One mount and one pooled beam
    // share this clock; gaps between bursts contain no flame collision.
    const angle=desired-span/2,n=this.nozzleMount;
    this.flameMode=mode;this.flameAngSpeed=speed;this.flameWarn=warn;this.flameDuration=dur;this.flameAge=this.frameDt||0;this.flameCount++;
    this.lockedFlameAngle=angle;this.nozzleAngle=angle;this.flameLockTime=warn+dur-this.flameAge;this.recovery=0;
    this.hazard('beam',{x:this.x+n.x,y:this.y+n.y,angle,angularSpeed:speed,telegraphHalf:Math.abs(span)/2,
      length:range+n.length,thickness:weak?38:54,muzzleLength:n.length,warning:warn,duration:dur,tickInterval:.22,
      damage:this.t.damage*(weak?.65:1),visual:'livens-flame',tag:'livens-flame'});
    this.command('flame-warning',{x:this.x+n.x,y:this.y+n.y,angle,seconds:warn});
  }
  update(dt,{players=[],bounds,paused=false}){
    if(this.dead||paused)return;dt=Math.min(dt,.25);this.frameDt=dt;this.x=this.anchorX;this.y=this.anchorY;
    const live=players.filter(p=>p.alive&&Number.isFinite(p.x)&&Number.isFinite(p.y)),target=live[this.flameCount%live.length];
    const n=this.nozzleMount,e=this.trenchEntry;
    if(e.state!=='active'){
      const nx=this.x+n.x,ny=this.y+n.y,visible=(!bounds||(nx>=bounds.left+35&&nx<=bounds.right-35&&ny>=bounds.top+35&&ny<=bounds.bottom-35));
      if(!target||!visible||Math.hypot(target.x-nx,target.y-ny)>620)return;
      if(e.state==='buried'){e.state='pressure';e.age=0;this.command('livens-pressure-rise',{x:nx,y:ny});}
      e.age+=dt;
      if(e.state==='pressure'&&e.age>=.9){e.state='revealed';e.revealAge=0;this.nozzleRevealed=true;this.discovered=true;this.command('livens-soil-burst',{x:nx,y:ny});this.command('trench-discovered');}
      if(e.state==='revealed'){e.revealAge+=dt;if(e.revealAge>=.55){e.state='active';this.nozzleAngle=Math.atan2(target.y-ny,target.x-nx);this.beginFlame('track',target);}}
      this.phase='buried-pressure';this.coreVulnerable=this.allDestroyed(['tank-l1','tank-l2','tank-r1','tank-r2','pressure']);return;
    }
    e.revealAge+=dt;
    const next=this.hp<=this.maxHp*.35?3:this.hp<=this.maxHp*.7?2:1;
    if(next!==this.raidPhase){this.raidPhase=next;this.command('phase-change',{phase:next===2?'livens-sweep':'livens-unstable'});}
    if(this._gasTier>0&&this.hp<=this.maxHp*this._gasTier*.25){this._gasTier--;
      for(let i=0;i<3;i++){const a=this.rng()*6.28,d=300+this.rng()*150;this.command('gas-zone',{x:this.x+Math.cos(a)*d,y:this.y+Math.sin(a)*d,radius:120+this.rng()*40,life:8});}}
    const flameDue=this.due('main-flame',dt,this.t.flameInterval||5.8);if(flameDue&&(this.lockedFlameAngle!=null||this.recovery>0))this.timers.set('main-flame',0);
    this.recovery=Math.max(0,this.recovery-dt);this.flameGap=Math.max(0,this.flameGap-dt);
    if(this.lockedFlameAngle!=null){
      this.flameAge+=dt;const burnAge=Math.min(this.flameDuration,Math.max(0,this.flameAge-this.flameWarn));
      this.nozzleAngle=this.lockedFlameAngle+this.flameAngSpeed*burnAge;this.flameLockTime=Math.max(0,this.flameWarn+this.flameDuration-this.flameAge);
      if(!this.flameLockTime){this.lockedFlameAngle=null;this.flameGap=this.flameQueue.length?.65:0;this.recovery=this.flameQueue.length?0:this.stormActive?3:2;
        if(this.stormActive&&!this.flameQueue.length){this.stormActive=false;this.command('phase-change',{phase:'livens-depressurized'});}}
    }else if(!this.flameGap&&!this.recovery){
      if(this.hp<=this.maxHp*.22&&!this.stormTriggered){this.stormTriggered=true;this.stormActive=true;this.flameQueue=['storm-spin','storm-return','storm-sweep'];this.command('livens-firestorm',{x:this.x,y:this.y});}
      if(this.flameQueue.length)this.beginFlame(this.flameQueue.shift(),target);
      else if(flameDue){
        if(this.raidPhase===3){this.flameQueue=['rotate'];this.beginFlame('pulse',target);}
        else this.beginFlame(this.raidPhase===2?'sweep':'track',target);
      }else if(target)this.nozzleAngle=turnToward(this.nozzleAngle,Math.atan2(target.y-this.y-n.y,target.x-this.x),.92*dt);
    }
    this.coreVulnerable=this.recovery>0||this.allDestroyed(['tank-l1','tank-l2','tank-r1','tank-r2','pressure']);
    this.phase=this.stormActive?'livens-firestorm':this.recovery>0?'livens-recovery':this.raidPhase===3?'livens-unstable':this.raidPhase===2?'livens-sweep':'livens-track';
    const leaking=[...this.parts.values()].filter(p=>p.id.startsWith('tank-')&&(p.destroyed||this.raidPhase>=2&&p.hp<=p.maxHp*.5));
    if(leaking.length&&this.due('leak-fire',dt,Math.max(2.2,5-leaking.length*.55))){const p=leaking[Math.floor(this.rng()*leaking.length)];this.hazard('circle',{x:this.x+p.x,y:this.y+p.y,radius:p.destroyed?54:40,warning:.8,duration:2.2,tickInterval:.35,damage:this.t.damage*.55,visual:'livens-leak',tag:'livens-leak'});}
  }
}
export class MinenwerferBattery extends PatternBoss {
  constructor(options){
    const originalHp=options.tuning.maxHp,gunHp=originalHp*.4,tuning={...options.tuning,maxHp:gunHp*3};
    super({...options,tuning,coreRadius:64,kind:'minenwerfer-battery',parts:[
      {id:'gun-left',x:-540,y:-40,radius:105,maxHp:gunHp},{id:'main-gun',x:-15,y:-190,radius:110,maxHp:gunHp},{id:'gun-right',x:525,y:80,radius:105,maxHp:gunHp}
    ]});
    this.phase='cross-barrage';this.coreVulnerable=true;this.ownsMotion129=true;this.anchorX=this.x;this.anchorY=this.y;
    this.shotSerial=0;this.baseVolleyCount=0;this.specialWave=0;this.specialClock=4.2;this._gasTier=3;
    this.discovered=false;this.discoveryClock=0;this.raidPhase=1;this.cycleClock=.3;this.recovery=0;this.finalGrace=2.8;this.finalCounts=new Set();this.mortarPlan=null;
    for(const gun of this.parts.values()){gun.discovered=false;gun.mortarMouth=gun.id==='main-gun'?{x:2,y:-69}:gun.id==='gun-left'?{x:7,y:-33}:{x:-12,y:-33};gun.mortarFlash=0;gun.mortarSmoke=0;}
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
    if(this.mortarPlan)this.mortarPlan.shots=this.mortarPlan.shots.filter(s=>s.partId!==p.id);
    const alive=this.liveGuns().length;this.finalGrace=2.8;this.cycleClock=1.4;if(!alive)this.dispose();
    if(alive){this.phase=alive===1?'final-assault':'weakened';this.command('phase-change',{phase:this.phase});}
  }
  muzzle(gun){return{x:this.x+gun.x+gun.mortarMouth.x,y:this.y+gun.y+gun.mortarMouth.y};}
  aimPoint(gun,target,serial,bounds,lead=null,margin=70){
    const vx=target.vx||0,vy=target.vy||0,speed=Math.hypot(vx,vy),dx=speed>12?vx/speed:0,dy=speed>12?vy/speed:-1;
    const seconds=lead??(this.raidPhase===1?.12:gun.id==='main-gun'?.78:gun.id==='gun-right'?.38:.22);
    let x=target.x+vx*seconds+(this.rng()-.5)*14,y=target.y+vy*seconds+(this.rng()-.5)*14;
    if(bounds){x=Math.max(bounds.left+margin,Math.min(bounds.right-margin,x));y=Math.max(bounds.top+margin,Math.min(bounds.bottom-margin,y));}
    return{x,y,dx,dy};
  }
  shell(gun,x,y,{warning=1.2,heavy=gun.id==='main-gun',damage=.78}={}){
    if(gun.destroyed||this.dead)return;const source=this.muzzle(gun);
    this.hazard('circle',{x,y,sourceX:source.x,sourceY:source.y,radius:heavy?58:48,warning,duration:.62,once:true,
      damage:this.t.damage*damage,visual:heavy?'minenwerfer-heavy':'minenwerfer-shell',tag:'minenwerfer-'+gun.id});
    gun.mortarFlash=.22;gun.mortarSmoke=1.5;
    this.command('mortar-launch',{...source,partId:gun.id});this.command('muzzle',{...source,partId:gun.id});
  }
  launch(gun,players,bounds){
    const target=this.target(players);if(!gun||gun.destroyed||!target)return;
    const aim=this.aimPoint(gun,target,this.shotSerial++,bounds);this.shell(gun,aim.x,aim.y,{warning:this.discovered?1.2:1.4});
  }
  plan(name,points,{final=false,bounds}={}){
    if(!points.length)return;
    if(bounds)for(const p of points){const margin=p.partId==='main-gun'?72:62;p.x=Math.max(bounds.left+margin,Math.min(bounds.right-margin,p.x));p.y=Math.max(bounds.top+margin,Math.min(bounds.bottom-margin,p.y));}
    this.mortarPlan={name,age:0,final,shots:points.map((p,i)=>({...p,order:i+1,fired:false,radius:p.partId==='main-gun'?58:48,warning:p.warning||1.25})),end:Math.max(...points.map(p=>p.at+(p.warning||1.25)+.62))};
    this.command(final?'minenwerfer-final-order':'phase-change',{phase:final?'minenwerfer-final-order':name,count:this.liveGuns().length});
  }
  cooperative(players,bounds,guns){
    const target=this.target(players),sides=guns.filter(p=>p.id!=='main-gun');if(!target||sides.length!==2)return;
    const aim=this.aimPoint(sides[0],target,this.shotSerial++,bounds,0),heading=Math.atan2(aim.dy,aim.dx),points=[];
    // Two adjacent omitted slots open a wide corridor in the flight direction.
    // Omit off-screen centers instead of squeezing a ring against a screen edge.
    for(let slot=1;slot<=4;slot++){const a=heading+slot*Math.PI/3,x=target.x+Math.cos(a)*140,y=target.y+Math.sin(a)*140;
      if(bounds&&(x<bounds.left+60||x>bounds.right-60||y<bounds.top+60||y>bounds.bottom-60))continue;
      points.push({partId:sides[(slot-1)%2].id,x,y,at:.35+points.length*.4});}
    this.plan('minenwerfer-encirclement',points,{bounds});
  }
  focused(players,bounds,guns){
    const target=this.target(players);if(!target)return;const points=[],count=guns.length===1?3:4;
    for(let i=0;i<count;i++){const gun=guns[i%guns.length],lead=guns.length===1?[.2,.85,.38][i]:[.25,.7,.35,.85][i],aim=this.aimPoint(gun,target,this.shotSerial++,bounds,lead);
      // A committed prediction is a landing point, never a homing warning.
      points.push({partId:gun.id,x:aim.x-aim.dy*(i%2?72:-72),y:aim.y+aim.dx*(i%2?72:-72),at:.3+i*.5});}
    this.plan(guns.length===1?'minenwerfer-last-prediction':'minenwerfer-focused',points,{bounds});
  }
  cross(players,bounds,guns){
    const target=this.target(players);if(!target)return;const points=[];
    for(let i=0;i<4;i++){const gun=guns[i%guns.length],aim=this.aimPoint(gun,target,this.shotSerial++,bounds,.55),along=(i-1.5)*65,side=i%2?82:-82;
      points.push({partId:gun.id,x:aim.x+aim.dx*along-aim.dy*side,y:aim.y+aim.dy*along+aim.dx*side,at:.35+i*.45});}
    this.plan('minenwerfer-crossing',points,{bounds});
  }
  finalOrder(players,bounds,guns){
    const target=this.target(players);if(!target)return;
    const count=guns.length===3?6:guns.length===2?5:4,points=[];
    for(let i=0;i<count;i++){const gun=guns[i%guns.length],aim=this.aimPoint(gun,target,this.shotSerial++,bounds,i===count-1?1.05:.18+i*.16),side=i===count-1?0:i%2?82:-82;
      points.push({partId:gun.id,x:aim.x-aim.dy*side,y:aim.y+aim.dx*side,at:.65+i*.55,warning:1.35,retarget:i===count-1});}
    this.finalCounts.add(guns.length);this.plan('minenwerfer-final-order',points,{final:true,bounds});
  }
  update(dt,{players=[],bounds,paused=false}){
    if(this.dead||paused)return;dt=Math.min(dt,.25);this.x=this.anchorX;this.y=this.anchorY;
    const guns=this.liveGuns();if(!guns.length)return;this.discoveryClock=Math.max(0,this.discoveryClock-dt);
    for(const gun of this.parts.values()){gun.mortarFlash=Math.max(0,gun.mortarFlash-dt);gun.mortarSmoke=Math.max(0,gun.mortarSmoke-dt);}
    // Every pit already exists at its authored world pose. Visibility reveals
    // its identity, not its position or an animation that raises the facility.
    if(!this.discoveryClock){const visible=guns.find(p=>!p.discovered&&(!bounds||(this.x+p.x>=bounds.left+55&&this.x+p.x<=bounds.right-55&&this.y+p.y>=bounds.top+55&&this.y+p.y<=bounds.bottom-55))&&players.some(v=>v.alive&&Math.hypot(v.x-this.x-p.x,v.y-this.y-p.y)<600));
      if(visible){visible.discovered=true;this.discoveryClock=.45;this.command('minenwerfer-emplacement-found',{partId:visible.id,x:this.x+visible.x,y:this.y+visible.y});if(!this.discovered){this.discovered=true;this.command('trench-discovered');}}}
    const pilot=players.find(p=>p.alive);if(pilot&&bounds){const unseen=guns.filter(p=>!p.discovered),dest=(unseen.length?unseen:guns).reduce((a,p)=>Math.hypot(pilot.x-this.x-p.x,pilot.y-this.y-p.y)<Math.hypot(pilot.x-this.x-a.x,pilot.y-this.y-a.y)?p:a),m=this.muzzle(dest);
      this.mortarGuide={x:Math.max(bounds.left+34,Math.min(bounds.right-34,m.x)),y:Math.max(bounds.top+90,Math.min(bounds.bottom-45,m.y)),angle:Math.atan2(m.y-pilot.y,m.x-pilot.x),known:[...this.parts.values()].filter(p=>p.discovered).length};}
    const next=this.hp<=this.maxHp*.7?2:1;if(next!==this.raidPhase){this.raidPhase=next;this.command('phase-change',{phase:'minenwerfer-prediction'});}
    if(this._gasTier>0&&this.hp<=this.maxHp*this._gasTier*.25){this._gasTier--;
      for(let i=0;i<3;i++){const a=this.rng()*6.28,d=280+this.rng()*140;this.command('gas-zone',{x:this.x+Math.cos(a)*d,y:this.y+Math.sin(a)*d,radius:120+this.rng()*40,life:8});}}
    this.finalGrace=Math.max(0,this.finalGrace-dt);this.recovery=Math.max(0,this.recovery-dt);
    if(this.mortarPlan){const plan=this.mortarPlan;plan.age+=dt;
      for(const shot of plan.shots)if(!shot.fired&&plan.age>=shot.at){shot.fired=true;const gun=this.parts.get(shot.partId);if(!gun.destroyed){if(shot.retarget){const target=this.target(players);if(target){if(bounds){const tx=(bounds.right-bounds.left)/2-34,ty=(bounds.bottom-bounds.top)/2-34;shot.warning=Math.max(.9,Math.min(1.35,tx/Math.max(1,Math.abs(target.vx||0)),ty/Math.max(1,Math.abs(target.vy||0))));}const aim=this.aimPoint(gun,target,this.shotSerial++,bounds,shot.warning,34);shot.x=aim.x;shot.y=aim.y;}}this.shell(gun,shot.x,shot.y,{warning:shot.warning});}}
      if(plan.age>=plan.end||!plan.shots.length){this.mortarPlan=null;this.recovery=plan.final?3:1.6;this.specialClock=4.2;this.cycleClock=.3;}
    }else if(!this.recovery){
      if(this.discovered&&!this.finalGrace&&!this.finalCounts.has(guns.length)&&(this.hp<=this.maxHp*.25||guns.length===1)){this.finalOrder(players,bounds,guns);}
      else {this.cycleClock-=dt;this.specialClock-=dt;
        if(this.discovered&&(this.raidPhase===2||guns.length<3)&&this.specialClock<=0){
          if(guns.length<3)this.focused(players,bounds,guns);
          else if(this.specialWave++%2)this.cross(players,bounds,guns);else this.cooperative(players,bounds,guns);
          this.specialClock=4.2;
        }else if(this.cycleClock<=0){this.launch(guns[this.baseVolleyCount++%guns.length],players,bounds);this.cycleClock=guns.length===1?.78:Math.max(.9,(this.t.mortarInterval||2.7)/2);}
      }
    }
    this.phase=!this.discovered?'minenwerfer-approach':this.mortarPlan?.final?'minenwerfer-final-order':this.recovery?'minenwerfer-reload':guns.length===1?'final-assault':guns.length===2?'weakened':this.raidPhase===2?(this.mortarPlan?.name||'minenwerfer-prediction'):'minenwerfer-sequence';
  }
  dispose(){this.mortarPlan=null;this.mortarGuide=null;}
}

export {LondonApron,DrachenMineNet};

// Cambrai: the armoured train's five independent wagons each remove a weapon
// or change the launch schedule. The locomotive keeps the shared rail route.
export class Fliegerzug extends RailAdapter {
  constructor(options){
    super(options,'fliegerzug');
    for(const id of this.railCarOrder)this.parts.delete(id);
    // Seventy percent of the encounter budget is carried by the five wagons.
    // The host has already applied time, loop and co-op HP scaling.
    const shares=[.14,.16,.12,.16,.12];
    // Carriages are drawn 1.3x larger; hit volumes and spacing scale together.
    const cars=[
      ['car-flak',226,101],['car-launch-a',452,101],['car-supply',679,101],
      ['car-launch-b',905,101],['car-rear',1131,101]
    ];
    this.railCarOrder=cars.map(([id])=>id);
    for(const [i,[id,y]] of cars.entries()){const p=new BossPart({id,kind:'rail-car',maxHp:Math.round(this.maxHp*shares[i]),x:0,y,radius:61,hittable:true});p.coupledY=y;this.parts.set(id,p);}
    for(const [id,,hitRadiusY] of cars)this.parts.get(id).hitRadiusY=hitRadiusY;
    this.bugSalvo=null;this.launchIndex=0;this.targetIndex=0;this.railCruiseSpeed=this.rail129.c.speed;this.baseReload=this.rail129.c.reloadSeconds;this.launchPrep=[];this.currentPlayers=[];
    this.locomotiveReserve=this.maxHp*.30;
  }
  liveLaunchers(){return ['car-launch-a','car-launch-b'].map(id=>this.parts.get(id)).filter(p=>!p.destroyed);}
  carPoint(car,dx=0,dy=0){const a=car.angle||0;return{x:this.x+car.x+dx*Math.cos(a)-dy*Math.sin(a),y:this.y+car.y+dx*Math.sin(a)+dy*Math.cos(a)};}
  selectTarget(players){const live=players.filter(p=>p.alive!==false&&Number.isFinite(p.x)&&Number.isFinite(p.y));return live.length?live[this.targetIndex++%live.length]:null;}
  prepareBug(car,players=this.currentPlayers){
    if(this.dead||car.destroyed||car.reloadVisual>0||this.launchPrep.some(q=>q.car===car))return false;
    const p=this.selectTarget(players);if(!p)return false;
    const target={x:p.x+(p.vx||0)*.65,y:p.y+(p.vy||0)*.65,id:p.id};
    car.launchTarget=target;car.launchWarmup=1.15;this.launchPrep.push({car,left:1.15,target});return true;
  }
  hit(spec){
    if(!Number.isFinite(spec.damage)||spec.damage<0)throw new Error('Invalid damage');
    if(this.dead)return{damage:0,blocked:true};
    const p=spec.partId?this.parts.get(spec.partId):null;
    // Hull hits before the locomotive is exposed still land — the armoured
    // cab reserves its last 30 percent until its armour is exposed.
    if(!spec.partId&&!this.coreVulnerable){
      const dealt=Math.min(spec.damage*.22,Math.max(0,this.hp-this.locomotiveReserve));this.hp-=dealt;
      return{damage:dealt,blocked:dealt<=0};
    }
    const r=super.hit(spec);
    if(this.phase==='runaway')this.rail129.direction=-1;
    // Wagon damage counts once toward the shared gauge. The locomotive
    // reserve remains a separate, finishable final target.
    if(p&&p.kind==='rail-car'&&r.damage>0&&!this.dead){
      this.hp=Math.max(Math.min(this.hp,this.locomotiveReserve),this.hp-r.damage);
    }
    return r;
  }
  onPartDestroyed(p){
    if(p.kind!=='rail-car')return;
    p.launchWarmup=0;p.launchTarget=null;this.launchPrep=this.launchPrep.filter(q=>q.car!==p);
    // Coupling failure strands the trailing section at its WORLD position.
    const index=this.railCarOrder.indexOf(p.id);
    for(let i=index;i<this.railCarOrder.length;i++){const q=this.parts.get(this.railCarOrder[i]);if(q.detachedPose)continue;
      const side=(index%2?-1:1);q.detachedPose={x:this.x+q.x,y:this.y+q.y,age:0,vx:side*(10+(i-index)*4),vy:this.rail129.velocity*this.rail129.direction*.65,spin:side*(.1+(i-index)*.025),angle:0};}
    this.emit({type:'rail-car-detached',bossId:this.id,partId:p.id,x:this.x+p.x,y:this.y+p.y});
    if(this.railCarOrder.filter(id=>this.parts.get(id).destroyed).length>=3&&!this.coreVulnerable){
      this.coreVulnerable=true;this.phase='locomotive';this.emit({type:'phase-change',bossId:this.id,phase:'locomotive'});
    }
  }
  railEvent(e){
    if(e.type==='fire'){
      const ports=this.liveLaunchers();
      if(ports.length){this.bugSalvo={ports,clock:0};this.emit({type:'bug-salvo',bossId:this.id,x:this.x,y:this.y});}
      return;
    }
    if(e.type==='aim')return;
    super.railEvent(e);
  }
  launchBug(car,target){
    if(this.dead||car.destroyed||!target)return false;
    const center=this.carPoint(car),distance=Math.hypot(target.x-center.x,target.y-center.y),heading=Math.atan2(target.y-center.y,target.x-center.x),run=Math.min(64,distance*.35);
    const x=center.x+Math.cos(heading)*run,y=center.y+Math.sin(heading)*run;
    car.reloadVisual=2.4;this.emit({type:'muzzle',bossId:this.id,x,y,partId:car.id});
    const tx=target.x,ty=target.y;
    this.emit({type:'spawn-minion',bossId:this.id,faction:this.faction,minion:'bug',x,y,
      behavior:'bug-strike',a:Math.atan2(ty-y,tx-x),passTargetX:tx,passTargetY:ty,
      launchPortId:car.id,targetId:target.id,launchSeconds:.6,speed:186,life:Math.max(9.5,Math.hypot(tx-x,ty-y)/186+.5),contactDamage:Math.min(22,Math.round(this.t.damage*.78))});
    car.launchTarget=null;return true;
  }
  locateHit(s){
    if(this.dead)return null;
    const r=this.rail129.railTarget;
    const x0=s.previousX??s.x,y0=s.previousY??s.y,dx=s.x-x0,dy=s.y-y0;
    const ellipse=(cx,cy,rx,ry)=>{
      const ax=dx/rx,ay=dy/ry,bx=(x0-cx)/rx,by=(y0-cy)/ry,d=ax*ax+ay*ay;
      const t=d?Math.max(0,Math.min(1,-(bx*ax+by*ay)/d)):0;
      const pad=(s.radius||0)/Math.min(rx,ry);
      return (bx+ax*t)**2+(by+ay*t)**2<=(1+pad)**2;
    };
    for(const id of this.railCarOrder){const p=this.parts.get(id);
      if(!p.destroyed&&this.carHit(s,p))return{partId:id};}
    if(!this.rail129.broken&&r&&ellipse(r.x,r.y,r.radius,r.radius))return{partId:'rail'};
    return ellipse(this.x,this.y,61,107)?{partId:null}:null;
  }
  carHit(s,p){
    const a=-(p.angle||0),ca=Math.cos(a),sa=Math.sin(a),cx=this.x+p.x,cy=this.y+p.y;
    const local=(x,y)=>({x:(x-cx)*ca-(y-cy)*sa,y:(x-cx)*sa+(y-cy)*ca});
    const q=local(s.previousX??s.x,s.previousY??s.y),r=local(s.x,s.y),rx=p.radius+(s.radius||0),ry=p.hitRadiusY+(s.radius||0);
    const dx=(r.x-q.x)/rx,dy=(r.y-q.y)/ry,x=q.x/rx,y=q.y/ry,d=dx*dx+dy*dy,t=d?Math.max(0,Math.min(1,-(x*dx+y*dy)/d)):0;
    return (x+dx*t)**2+(y+dy*t)**2<=1;
  }
  update(dt,ctx){
    if(this.dead)return;
    this.currentPlayers=ctx.players||[];
    const previous={x:this.x,y:this.y,s:this.rail129.s};
    if(this.pullAwayDirection&&this.rail129.phase==='move'){this.rail129.direction=this.pullAwayDirection;this.pullAwayDirection=0;}
    if(this.rail129.phase==='move')this.rail129.c.speed=this.railCruiseSpeed*(.36+.64*Math.min(1,this.rail129.time/.85));
    super.update(dt,ctx);
    if(this.dead)return;
    for(const id of this.railCarOrder){const p=this.parts.get(id),q=p.detachedPose;p.reloadVisual=Math.max(0,(p.reloadVisual||0)-dt);
      if(q){q.age+=dt;const decay=Math.exp(-1.1*dt);q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=decay;q.vy*=decay;
        q.angle+=q.spin*Math.exp(-q.age*1.2)*dt;p.angle=q.angle+Math.sin(q.age*7)*.035*Math.exp(-q.age*.6);p.x=q.x-this.x;p.y=q.y-this.y;}
    }
    // A live front section cannot back through the stationary trailing wrecks.
    const attached=[{x:0,y:0},...this.railCarOrder.map(id=>this.parts.get(id)).filter(p=>!p.detachedPose)];
    const blocked=this.railCarOrder.map(id=>this.parts.get(id)).some(p=>p.detachedPose&&attached.some(q=>Math.abs(this.x+q.x-p.detachedPose.x)<112&&Math.abs(this.y+q.y-p.detachedPose.y)<218));
    if(blocked&&this.rail129.phase!=='runaway'&&this.rail129.phase!=='derailed'){
      this.x=previous.x;this.y=previous.y;this.rail129.s=previous.s;this.pullAwayDirection=-this.rail129.direction;
      if(this.rail129.phase==='move'){this.rail129.brakeStart=0;this.rail129.velocity=0;this.rail129.enter('brake');}
      else if(this.rail129.phase==='brake'){this.rail129.brakeStart=0;this.rail129.velocity=0;}
      for(const id of this.railCarOrder){const p=this.parts.get(id),q=p.detachedPose;if(q){p.x=q.x-this.x;p.y=q.y-this.y;}}
    }
    const players=ctx.players||[],car=id=>this.parts.get(id),ports=this.liveLaunchers();
    this.rail129.c.reloadSeconds=this.baseReload*(car('car-supply').destroyed?1.7:1);
    for(const q of this.launchPrep){q.left-=dt;q.car.launchWarmup=Math.max(0,q.left);if(q.left<=0){if(!q.car.destroyed&&(!this.countMinions129||this.countMinions129()<5))this.launchBug(q.car,q.target);q.car.launchTarget=null;}}
    this.launchPrep=this.launchPrep.filter(q=>q.left>0&&!q.car.destroyed);
    const salvo=this.bugSalvo;
    if(salvo){
      salvo.clock-=dt;
      while(salvo.ports.length&&salvo.clock<=0){const port=salvo.ports.shift();salvo.clock+=.5;
        if(!port.destroyed&&(!this.countMinions129||this.countMinions129()<5))this.prepareBug(port);}
      if(!salvo.ports.length)this.bugSalvo=null;
    }
    const supply=car('car-supply'),reload=(supply.destroyed?1.55:1);
    if(ports.length&&this.due('bug-trickle',dt,(ports.length===2?4.2:6.0)*reload)){
      const port=ports[this.launchIndex++%ports.length];
      if(!this.countMinions129||this.countMinions129()<5)this.prepareBug(port);
    }
    const flak=car('car-flak');
    if(flak&&!flak.destroyed&&this.due('flak-car',dt,2.1)){
      const p=this.selectTarget(players);
      if(p){const {x,y}=this.carPoint(flak,0,-38);
        this.emit({type:'muzzle',bossId:this.id,x,y,partId:flak.id});
        this.emit({type:'hazard',bossId:this.id,kind:'circle',x:p.x+(p.vx||0)*.45,y:p.y+(p.vy||0)*.45,
          radius:49,warning:1.05,duration:.35,once:true,damage:this.t.damage*.78,visual:'black-flak',sourceX:x,sourceY:y});}
    }
    const rear=car('car-rear');
    if(!rear.destroyed&&this.due('rear-mg',dt,2.7)){
      const p=this.selectTarget(players),{x,y}=this.carPoint(rear,0,-33);
      if(p){const a=Math.atan2(p.y-y,p.x-x);this.emit({type:'muzzle',bossId:this.id,x,y,partId:rear.id});
        for(const offset of [-.16,0,.16])this.emit({type:'hazard',bossId:this.id,kind:'projectile',x,y,
          vx:Math.cos(a+offset)*this.t.bulletSpeed*.83,vy:Math.sin(a+offset)*this.t.bulletSpeed*.83,
          radius:5,duration:4,damage:this.t.damage*.52,visual:'rail-mg'});}
    }
  }
}

// Treffas-Wagen rolls forward on its twin drum wheels, crushing terrain into debris
// sprays. Wheels are mobility, the turret is the gun: break wheels to halt the
// advance (it digs in and fires harder), break everything to expose the hull.
export class TreffasWagen extends PatternBoss {
  suppressive(){/* Only the visible main gun and two hull gun ports fire. */}
  constructor(options){
    const tuning={...options.tuning,geometryScale:1};
    super({...options,tuning,kind:'treffas-wagen',coreRadius:53,parts:[
      {id:'wheel-left',x:-112,y:-8,radius:31,maxHp:tuning.maxHp*.16},
      {id:'wheel-right',x:112,y:-8,radius:31,maxHp:tuning.maxHp*.16},
      {id:'turret',x:0,y:-96,radius:37,maxHp:tuning.maxHp*.18},
      {id:'rudder',x:0,y:124,radius:29,maxHp:tuning.maxHp*.10}
    ]});
    this.phase='advance';this.coreVulnerable=false;this.ownsMotion129=true;
    this.startY=this.y;this.driveAge=0;this.wheelRoll=0;this.driveDirection=1;this.driveVelocity=0;this.heading=0;this.gunAngle=-Math.PI/2;
    for(const p of this.parts.values()){p.mountX=p.x;p.mountY=p.y;}
    this.flakPattern=0;this.flakLock=null;this._churn=[];
    this.timers.set('treffas-flak',2.1);this.timers.set('treffas-mg',1.5);
  }
  wheelsAlive(){return ['wheel-left','wheel-right'].filter(id=>!this.parts.get(id).destroyed).length;}
  wheelBias(){const l=this.parts.get('wheel-left'),r=this.parts.get('wheel-right');return l.destroyed&&!r.destroyed?-1:!l.destroyed&&r.destroyed?1:0;}
  hit(spec){
    const result=super.hit(spec),p=spec.partId&&this.parts.get(spec.partId);
    if(p&&result.damage>0&&!this.dead)this.hp=Math.max(Math.min(this.hp,this.maxHp*.25),this.hp-result.damage);
    if(this.dead)this.flakLock=null;
    return result;
  }
  onPartDestroyed(p){
    if(p.id==='turret'){this.flakLock=null;this.command('phase-change',{phase:'flak-disabled'});}
    if(this.wheelsAlive()===0){this.driveVelocity=0;this.phase='emplacement';this.command('phase-change',{phase:'emplacement'});}
    const lost=[...this.parts.values()].filter(p=>p.destroyed).length;
    if(lost>=2&&!this.coreVulnerable){this.coreVulnerable=true;this.command('phase-change',{phase:'hull-exposed'});}
  }
  locateHit(s){
    if(this.dead)return null;
    const ca=Math.cos(-this.heading),sa=Math.sin(-this.heading),local=(x,y)=>({x:(x-this.x)*ca-(y-this.y)*sa,y:(x-this.x)*sa+(y-this.y)*ca});
    const q=local(s.previousX??s.x,s.previousY??s.y),r=local(s.x,s.y);
    const ellipse=(cx,cy,rx,ry)=>{rx+=s.radius||0;ry+=s.radius||0;const x=(q.x-cx)/rx,y=(q.y-cy)/ry,dx=(r.x-q.x)/rx,dy=(r.y-q.y)/ry,d=dx*dx+dy*dy,t=d?Math.max(0,Math.min(1,-(x*dx+y*dy)/d)):0;return(x+dx*t)**2+(y+dy*t)**2<=1;};
    for(const id of ['turret','wheel-left','wheel-right','rudder']){const p=this.parts.get(id);if(p.destroyed)continue;const [rx,ry]=id.startsWith('wheel')?[30,129]:id==='turret'?[38,40]:[33,29];if(ellipse(p.mountX,p.mountY,rx,ry))return{partId:id};}
    return this.coreVulnerable&&ellipse(0,0,43,105)?{partId:null}:null;
  }
  hitAt(s){const p=this.locateHit(s);return p?this.hit({...p,damage:s.damage}):{damage:0,miss:true};}
  planFlak(p){
    if(this.dead||this.parts.get('turret').destroyed||this.flakLock||!p)return false;
    const x=p.x+(p.vx||0)*.55,y=p.y+(p.vy||0)*.55,pivot=treffasGunPivot(this);
    const a=Math.atan2(y-pivot.y,x-pivot.x),bracket=this.wheelsAlive()===0&&this.flakPattern++%2===0;
    const lateralX=-Math.sin(a),lateralY=Math.cos(a),forwardX=Math.cos(a),forwardY=Math.sin(a);
    const points=bracket?[-1,1].flatMap(side=>[-1,1].map(row=>({x:x+lateralX*side*90+forwardX*row*65,y:y+lateralY*side*90+forwardY*row*65}))):[-1,0,1].map(i=>({x:x+lateralX*i*102,y:y+lateralY*i*102}));
    this.flakLock={x,y,angle:a,points,mode:bracket?'bracket':'line',remaining:.9,aligned:false};
    return true;
  }
  updateFlak(dt,players){
    const turret=this.parts.get('turret');turret.recoil=Math.max(0,(turret.recoil||0)-dt*3);
    if(turret.destroyed)return;
    const lock=this.flakLock;
    if(!lock){if(this.due('treffas-flak',dt,this.wheelsAlive()?2.6:1.75))this.planFlak(this.target(players));return;}
    const pivot=treffasGunPivot(this),wanted=Math.atan2(lock.y-pivot.y,lock.x-pivot.x),delta=Math.atan2(Math.sin(wanted-this.gunAngle),Math.cos(wanted-this.gunAngle));
    this.gunAngle+=Math.max(-1.3*dt,Math.min(1.3*dt,delta));
    if(Math.abs(delta)<.05){lock.aligned=true;lock.remaining-=dt;}
    if(lock.remaining>0)return;
    const muzzle=treffasGunMuzzle(this);this.command('muzzle',{...muzzle,partId:'turret'});turret.recoil=1;
    for(const [i,p]of lock.points.entries())this.hazard('circle',{...p,radius:lock.mode==='bracket'?34:32,delay:i*.16,warning:1.05,duration:.34,once:true,damage:this.t.damage*.82,visual:'black-flak',sourceX:muzzle.x,sourceY:muzzle.y});
    this.flakLock=null;
  }
  update(dt,{players=[],bounds}){
    if(this.dead)return;
    const wheels=this.wheelsAlive(),speed=wheels===2?44:wheels===1?23:0;this.driveAge+=dt;
    if(wheels){
      const upper=this.startY-65,lower=this.startY+140;
      const distance=this.driveDirection>0?lower-this.y:this.y-upper;
      if(distance<3&&Math.abs(this.driveVelocity)<8)this.driveDirection*=-1;
      const brake=Math.min(1,Math.max(.1,distance/38)),desired=speed*this.driveDirection*brake;
      this.driveVelocity+=Math.max(-28*dt,Math.min(28*dt,desired-this.driveVelocity));
      const rudderLost=this.parts.get('rudder').destroyed,wanted=(this.wheelBias()*(rudderLost?.13:.07)+(rudderLost?.035:0))*(1+.18*Math.sin(this.driveAge*2.2));
      this.heading+=Math.max(-.11*dt,Math.min(.11*dt,wanted-this.heading));
      const travel=this.driveVelocity*dt,dx=-Math.sin(this.heading)*travel,dy=Math.cos(this.heading)*travel;
      const margin=bounds?Math.min(155,(bounds.right-bounds.left)/2):0;
      if(bounds&&(this.x+dx<bounds.left+margin||this.x+dx>bounds.right-margin)){this.driveDirection*=-1;this.driveVelocity=0;}
      else{this.x+=dx;this.y+=dy;this.wheelRoll+=travel/34;}
    }else this.driveVelocity=0;
    for(const p of this.parts.values()){const q=treffasPoint(this,p.mountX,p.mountY);p.x=q.x-this.x;p.y=q.y-this.y;}
    for(const p of this._churn)p.age+=dt;this._churn=this._churn.filter(p=>p.age<12);
    const last=this._churn.at(-1);
    if(Math.abs(this.driveVelocity)>3&&(!last||Math.hypot(this.x-last.x,this.y-last.y)>24))this._churn.push({x:this.x,y:this.y,heading:this.heading,age:0});
    if(this._churn.length>48)this._churn.shift();
    if(Math.abs(this.driveVelocity)>8&&this.due('treffas-debris',dt,.75))for(const id of ['wheel-left','wheel-right']){
      const w=this.parts.get(id);if(w.destroyed)continue;const side=id==='wheel-left'?-1:1,q=treffasPoint(this,w.mountX,w.mountY+60);
      this.hazard('projectile',{...q,vx:side*(115+this.rng()*40),vy:Math.sign(this.driveVelocity)*50,radius:6,duration:1.1,once:true,damage:this.t.damage*.25,visual:'treffas-debris'});
    }
    this.updateFlak(dt,players);
    if(this.due('treffas-mg',dt,this.parts.get('turret').destroyed?2.2:3.0)){
      const p=this.target(players),side=this.cursor%2?-1:1,m=treffasPoint(this,side*64,-24);
      if(p){this.command('muzzle',{...m,partId:'hull-mg'});this.fan(m.x,m.y,Math.atan2(p.y-m.y,p.x-m.x),2,.18,this.t.bulletSpeed*.8,'treffas-mg');}
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
      {role:'left-outer',side:-1,rank:1,plane:'jasta11a_albatros',callSign:'Kurt Wolff',nameKo:'쿠르트 볼프',behavior:'jasta-formation',maxSpeed:235},
      {role:'left-inner',side:-1,rank:0,plane:'jasta11b_albatros',callSign:'Karl Allmenröder',nameKo:'카를 알멘뢰더',behavior:'jasta-formation',maxSpeed:232},
      {role:'right-inner',side:1,rank:0,plane:'jasta11c_albatros',callSign:'Karl Emil Schaefer',nameKo:'카를 에밀 셰퍼',behavior:'jasta-formation',maxSpeed:232},
      {role:'right-outer',side:1,rank:1,plane:'jasta11d_albatros',callSign:'Lothar von Richthofen',nameKo:'로타어 폰 리히트호펜',behavior:'jasta-formation',maxSpeed:235}
    ]});
    this.leaderPilot='baron';this.callSign='Manfred von Richthofen';this.callSignKo='만프레트 폰 리히트호펜';this.speed=196;this.aceCycle=0;
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
      {role:'a-bait',pairId:'a',side:-1,rank:0,plane:'collishaw_sopwith',callSign:'Black Prince',nameKo:'블랙 프린스',behavior:'black-flight-formation',maxSpeed:238},
      {role:'a-hunter',pairId:'a',side:-1,rank:1,plane:'collishaw_sopwith',callSign:'Black Death',nameKo:'블랙 데스',behavior:'black-flight-formation',maxSpeed:242},
      {role:'b-bait',pairId:'b',side:1,rank:0,plane:'collishaw_sopwith',callSign:'Black Roger',nameKo:'블랙 로저',behavior:'black-flight-formation',maxSpeed:238},
      {role:'b-hunter',pairId:'b',side:1,rank:1,plane:'collishaw_sopwith',callSign:'Black Sheep',nameKo:'블랙 쉽',behavior:'black-flight-formation',maxSpeed:242}
    ]});
    this.leaderPilot='collishaw';this.callSign='Black Maria';this.callSignKo='블랙 마리아';this.speed=202;this.aceCycle=0;
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

// The Staaken R.VI giant bomber: its four engine nacelles are the hittable
// parts. Each dead engine sags the bomber lower on its patrol; when the last
// engine dies the fuselage core opens and the giant goes into its death glide.
export class StaakenRVI extends RegionalPatternBoss {
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
        for(let i=0;i<5;i++)this.hazard('circle',{x:this.x+ux*(70+i*58)+randBetween(this.rng,-16,16),y:this.y+uy*(70+i*58),delay:i*.15,radius:54,warning:1.05,duration:.42,once:true,damage:Math.round(this.t.damage*1.35),visual:'carpet-bomb',sourceX:this.x,sourceY:this.y+38*(this.regionalScale||1),tag:'staaken-stick'});
        this.command('muzzle',{x:this.x,y:this.y+60});}
    }
    // Nose and ventral gunners alternate streams at close attackers.
    if(this.due('para',dt,(this.t.suppressiveInterval||2.7)*.88)){
      const p=this.target(players);
      if(p&&Math.hypot(p.x-this.x,p.y-this.y)<780){const gy=((this.gunSide*=-1)>0?58:-83)*(this.regionalScale||1),mx=this.x,my=this.y+gy,a=Math.atan2(p.y-my,p.x-mx);
        this.command('muzzle',{x:mx,y:my});this.fan(mx,my,a,3,.24,this.t.bulletSpeed*.92,'staaken-mg');}
    }
    if(doomed&&this.due('dump',dt,9)){
      const p=this.target(players),cx=p?p.x:this.x,cy=p?p.y:this.y+200;
      for(let i=0;i<7;i++)this.hazard('circle',{x:cx+(i-3)*62+randBetween(this.rng,-20,20),y:cy+randBetween(this.rng,-30,60),delay:.1+i*.09,radius:58,warning:1.15,duration:.45,once:true,damage:Math.round(this.t.damage*1.3),visual:'carpet-bomb',sourceX:this.x,sourceY:this.y+38*(this.regionalScale||1),tag:'staaken-dump'});
    }
    if(!doomed&&!live&&!this.coreVulnerable){this.coreVulnerable=true;this.phase='doomed';}
  }
  suppressive(){/* defence comes from the gunner fans, not a generic spray */}
}

// London night defence: a rotating searchlight beam marks whoever it catches
// (the hazard pool lights them), and the AA gun spends its flak on lit targets
// first. The command bunker core opens once the gun, the lamp and the shell
// racks are all knocked out.
export class LondonSearchlight extends RegionalPatternBoss {
  constructor(options){
    super({...options,kind:'london-searchlight',coreRadius:options.tuning.coreRadius||70,parts:[
      {id:'light',x:-55,y:-70,radius:46,maxHp:options.tuning.partHp*1.6},
      {id:'gun',x:56,y:-27,radius:50,maxHp:options.tuning.partHp*2},
      {id:'ammo',x:-70,y:55,radius:42,maxHp:options.tuning.partHp*1.2}
    ]});
    this.coreVulnerable=false;this.ownsMotion129=true;this.phase='watch';this.lampAngle=Math.PI/2;this.beamRemaining=0;this.lockProgress=0;this.lockSpent=false;this.trackId=null;
    this.parts.get('gun').angle=Math.PI/2;this.timers.set('beam',.9);this.timers.set('flak',2.2);
  }
  suppressive(){/* Attacks belong to live gun and ground guard parts only. */}
  liveParts(){return ['light','gun','ammo'].filter(id=>!this.parts.get(id).destroyed);}
  onPartDestroyed(p){
    if(p.id==='light'){this.command('cancel-hazards',{tag:'london-beam'});this.beamRemaining=0;this.lockProgress=0;this.command('phase-change',{phase:'searchlight-disabled'});}
    if(p.id==='gun'){this.command('cancel-hazards',{tag:'london-flak'});this.command('phase-change',{phase:'battery-weakened'});}
    if(p.id==='ammo'&&!this.ammoCooked){const blast=Math.min(this.hp,this.maxHp*.1);this.hp-=blast;this.ammoCooked=true;const x=this.x+p.x,y=this.y+p.y;
      this.command('internal-explosion',{x,y,damage:blast});this.hazard('circle',{x,y,radius:112,warning:.6,duration:.55,once:true,damage:this.t.damage*1.3,visual:'morser-shell',sourceX:x,sourceY:y,tag:'london-ammo'});}
    if(!this.liveParts().length&&!this.coreVulnerable){this.coreVulnerable=true;this.phase='exposed';this.command('phase-change',{phase:'exposed'});}
  }
  volley(target,locked){
    const gun=this.parts.get('gun');if(!target||gun.destroyed)return;
    const muzzle=regionalMuzzle(this,'gun',gun.angle,87.5),lead=locked?.6:.3,spread=locked?28:78,count=locked?3:2;
    const x=target.x+(target.vx||0)*lead,y=target.y+(target.vy||0)*lead;
    for(let i=0;i<count;i++)this.hazard('circle',{x:x+randBetween(this.rng,-spread,spread)+(locked?(i-1)*58:0),y:y+randBetween(this.rng,-spread,spread),delay:i*.22,radius:locked?46:54,warning:locked?.95:1.3,duration:.4,once:true,damage:Math.round(this.t.damage*1.25),visual:'black-flak',sourceX:muzzle.x,sourceY:muzzle.y,tag:'london-flak'});
    this.command('muzzle',{...muzzle,partId:'gun'});
    if(locked)this.command('searchlight-lock',{x:target.x,y:target.y,seconds:.65});
  }
  update(dt,{players,bounds,isIlluminated}){
    if(this.dead)return;const lamp=this.parts.get('light'),gun=this.parts.get('gun'),slow=this.parts.get('ammo').destroyed;
    const live=living(players),target=live.find(p=>p.id===this.trackId)||live[0];if(target)this.trackId=target.id;
    if(target&&!gun.destroyed)gun.angle=turnToward(gun.angle,Math.atan2(target.y-this.y-gun.y,target.x-this.x-gun.x),1.1*dt);
    this.beamRemaining=Math.max(0,this.beamRemaining-dt);
    if(!lamp.destroyed&&target){const sx=this.x+lamp.x,sy=this.y+lamp.y;
      this.lampAngle=turnToward(this.lampAngle,Math.atan2(target.y-sy,target.x-sx),.62*dt);
      if(this.due('beam',dt,slow?13:9.4)){
        this.beamRemaining=6.9;this.lockSpent=false;this.lockProgress=0;
        this.hazard('searchlight',{x:sx,y:sy,angle:this.lampAngle,angularSpeed:0,halfAngle:.16,radius:Math.max(bounds.bottom-bounds.top,520),duration:6.2,warning:.7,damage:0,tickInterval:.2,visual:'searchlight',tag:'london-beam'});
      }
      if(this.beamRemaining>0)this.command('regional-beam-pose',{x:sx,y:sy,angle:this.lampAngle,tag:'london-beam'});
    }
    const illuminated=!lamp.destroyed&&this.beamRemaining>0&&target&&isIlluminated?.(target);
    this.lockProgress=illuminated?Math.min(1,this.lockProgress+dt/.65):Math.max(0,this.lockProgress-dt*3);
    if(!illuminated&&this.lockProgress===0)this.lockSpent=false;
    let fired=false;
    if(this.lockProgress>=1&&!this.lockSpent&&!gun.destroyed){this.lockSpent=true;this.phase='locked';this.volley(target,true);this.timers.set('flak',slow?7.4:3.9);fired=true;}
    if(!gun.destroyed&&!fired&&this.due('flak',dt,slow?7.4:3.9))this.volley(target,!!illuminated);
    if(!illuminated&&this.phase==='locked')this.phase='watch';
    if(this.liveParts().length&&this.due('london-defend',dt,3.4)){
      const p=target;if(p&&Math.hypot(p.x-this.x,p.y-this.y)<480){const k=this.regionalCore,mx=this.x+k.x,my=this.y+k.y+34;this.fan(mx,my,Math.atan2(p.y-my,p.x-mx),3,.3,this.t.bulletSpeed*.85,'london-mg');}
    }
  }
}

// Stage 4 entente: four flak towers hold the map corners. Every tower is a
// self-contained emplacement — siege howitzer, acoustic horns and two AA
// platforms surround a cupola core — and all four must fall to clear the stage.
export class LondonRaidApron extends LondonApron {
 constructor(options){super(options);this.kind='london-apron-raid';this.ownsMotion129=true;
  for(const [id,x,y,radius] of [['light',-94,92,26],['gun',94,92,29]])this.parts.set(id,new BossPart({id,x,y,radius,maxHp:this.t.maxHp*.13}));
  this.timers.set('raid-light',1.5);this.timers.set('raid-flak',3.2);this.timers.set('raid-mines',4.2);}
 onPartDestroyed(p){if(p.id.startsWith('airship-'))super.onPartDestroyed(p);else this.command('cancel-hazards',{tag:'raid-'+p.id});
  if(p.id==='light'||p.id==='gun')this.command('phase-change',{phase:p.id==='light'?'blackout':'battery-silenced'});}
 update(dt,ctx){super.update(dt,ctx);const {players,bounds,isIlluminated}=ctx,light=this.parts.get('light'),gun=this.parts.get('gun');
  if(!light.destroyed&&this.due('raid-light',dt,8.8))this.hazard('searchlight',{x:this.x+light.x,y:this.y+light.y,angle:Math.PI/2-.65,angularSpeed:.27,halfAngle:.14,radius:Math.max(560,bounds.bottom-bounds.top),duration:5.2,warning:.75,damage:0,visual:'searchlight',tag:'raid-light'});
  if(!gun.destroyed&&this.due('raid-flak',dt,4.3)){const p=players.find(p=>p.alive&&!p.londonRiver&&isIlluminated?.(p))||players.find(p=>p.alive);if(p){
   const lit=!p.londonRiver&&!!isIlluminated?.(p),x=p.x+(p.vx||0)*(lit?.5:.2),y=p.y+(p.vy||0)*(lit?.5:.2);
   this.command('muzzle',{x:this.x+gun.x,y:this.y+gun.y,partId:'gun'});
   for(let i=0;i<(lit?3:2);i++)this.hazard('circle',{x:x+(i-.5)*66,y,delay:i*.25,radius:40,warning:lit?1.05:1.4,duration:.35,once:true,damage:this.t.damage,visual:'black-flak',sourceX:this.x+gun.x,sourceY:this.y+gun.y,tag:'raid-gun'});}}
  if(this.due('raid-mines',dt,7.4)){const w=bounds.right-bounds.left;
   const pts=[0,1,2,3,4,5].map(()=>({x:Math.min(bounds.right-30,Math.max(bounds.left+30,bounds.left+30+this.rng()*(w-60))),y:this.y+120+this.rng()*Math.max(120,bounds.bottom-this.y-160)}));
   this.command('spawn-minefield',{points:pts,warning:1.15,life:11,maxMines:14,sourceX:this.x,sourceY:this.y+60});}
  if(this.coreVulnerable&&this.due('raid-final',dt,2.8)){const p=players.find(p=>p.alive);if(p){const x=this.x,y=this.y+75,a=Math.atan2(p.y-y,p.x-x),speed=this.t.bulletSpeed*.8;for(let i=-1;i<=1;i++)this.hazard('projectile',{x,y,vx:Math.cos(a+i*.15)*speed,vy:Math.sin(a+i*.15)*speed,radius:5,visual:'london-mg'});}}
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
  if(!this.engines()){this.abortRun();this.phase='gliding';this.glideAge=0;this.command('phase-change',{phase:this.phase});this.command('aa-effect',{x:this.x,y:this.y,kind:'aaBalloonBurst',size:100,life:.55});}
  else if(p.id.startsWith('engine-'))this.command('phase-change',{phase:'engine-damaged'});}
 fly(dt,tx,ty,speed,turn=1.05){const goal=Math.atan2(ty-this.y,tx-this.x);let ux=Math.cos(goal),uy=Math.sin(goal);
  for(const b of this.encounter?.bodies.values()||[]){if(b===this||b.dead||b.kind!=='gotha-raider')continue;const dx=this.x-b.x,dy=this.y-b.y,d=Math.hypot(dx,dy);if(d>0&&d<210){const w=(210-d)/120;ux+=dx/d*w;uy+=dy/d*w;}}
  const want=Math.atan2(uy,ux),d=Math.atan2(Math.sin(want-this.a),Math.cos(want-this.a));this.a+=Math.max(-turn*dt,Math.min(turn*dt,d));this.x+=Math.cos(this.a)*speed*dt;this.y+=Math.sin(this.a)*speed*dt;this.rotateMounts();}
 update(dt,{players,bounds,londonTargets=[]}){const engines=this.engines(),speed=engines===2?78:engines===1?49:38;
  if(!engines){this.glideAge+=dt;
   const spin=(this.slot%2?1:-1)*Math.min(2.2,.55+this.glideAge*.95);
   this.a+=spin*dt;
   const sink=Math.min(170,30+this.glideAge*75),fwd=speed*(1-Math.min(.6,this.glideAge*.2));
   this.x+=Math.cos(this.a)*fwd*dt;this.y+=Math.sin(this.a)*fwd*dt+sink*dt;this.rotateMounts();
   if(this.due('glide-smoke',dt,.32))this.command('aa-effect',{x:this.x,y:this.y-18,kind:'aaWreckSmoke',size:66,life:.95});
   if(this.glideAge>=4.6){super.hit({damage:this.hp});return;}}
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
  'london-apron':LondonApron,'drachen-net':DrachenMineNet,gik:GIK,ca4:Ca4,'armored-harbor-fortress':ArmoredHarborFortress,'flak-tower':FlakTowerNet,
  fliegerzug:Fliegerzug,'treffas-wagen':TreffasWagen,'jasta11-circus':JastaCircus,'naval10-black-flight':Naval10BlackFlight,
  'mark4-wedge':Mark1Landship,'morser-battery':SchwabenFortress,'staaken-rvi':StaakenRVI,'london-searchlight':LondonSearchlight,'london-apron-raid':LondonRaidApron,'gotha-squadron':GothaRaider,'fort-douaumont':FortDouaumont,'fort-souville':FortSouville,'wustenpanzer':Wustenpanzer,'sinai-landship':SinaiLandship,'gallipoli-fortress':GallipoliFortress,'paris-staaken-rvi':ParisStaakenRVI,'paris-searchlight-fortress':ParisSearchlightFortress};
export function createBossEncounter({id,bossId,tuning,x,y,emit,rng,faction}) {
  if(bossId==='jutland-grand-fleet')return createJutlandEncounter({id,bossId,tuning,x,y,emit,rng,faction});
  if(bossId==='mark4-wedge'){const scale=sommeScale(tuning,true),t={...tuning,maxHp:tuning.maxHp/3,sommeScale:scale};return new BossEncounter({id,bossId,bodies:[0,1,2].map(slot=>new Mark1Landship({id:id+':mark1:'+slot,slot,tuning:t,x:x+(slot===1?-155:slot===2?155:0)*scale,y:y+(slot===0?-100:65)*scale,emit,rng,faction:faction||'entente'}))});}
  if(bossId==='gotha-squadron'){const flightTuning={...tuning,maxHp:tuning.maxHp/3,partHp:tuning.partHp/3,geometryScale:1};return new BossEncounter({id,bossId,bodies:[0,1,2].map(slot=>new GothaRaider({id:id+':gotha:'+slot,slot,tuning:flightTuning,x:x+(slot-1)*215,y:y+(slot===1?0:-90),emit,rng,faction:faction||'central'}))});}
  const entry=BOSS_CATALOG[bossId]||{faction:bossId==='staaken-rvi'?'central':'entente'},Ctor=constructors[bossId];if(!Ctor)throw new Error('Unknown boss: '+bossId);
  const body=new Ctor({id:id+':body',tuning,x,y,emit,rng,faction:faction||entry.faction,coreRadius:tuning.coreRadius||100});
  const bodies=[body];
  if(bossId==='sinai-landship')for(const side of [-1,1])bodies.push(new RollsRoyceEscort({id:id+':escort:'+side,leader:body,side,tuning,emit,faction:body.faction,x,y}));
  return new BossEncounter({id,bossId,bodies});
}
