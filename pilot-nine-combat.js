// Nine pilot mechanics, installed on the existing firing/frame/impact hooks.
import {signatureCue,activatePilotSignature} from './pilot-signature-state.js?v=tame1';
export const NINE_PILOTS=new Set(['huffzky','mckeever','jacobs','hawker','berthold','udet','goering','nungesser','barker']);
const durations={huffzky:3,mckeever:5,jacobs:4,hawker:5,berthold:5,udet:2.6,goering:5,nungesser:3,barker:6};
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const world=p=>p.combatWorld?.()||p;
const clock=p=>world(p).t||0;
const live=e=>e&&e.hp>0&&!e.crashed&&!e.rivalEscaped&&!e.expired;
const aerial=e=>live(e)&&!e.surface&&!e.fieldUnit&&!e.stageBossBody;
const bearing=(p,e)=>Math.atan2(e.y-p.y,e.x-p.x);
const dist=(p,e)=>Math.hypot(e.x-p.x,e.y-p.y);
const gunRound=b=>!b.enemy&&!b.ally&&!b.patrol&&!b.formation&&!b.rocket&&!b.motorCannon&&!b.cow37&&!b.actualExplosion&&!b.blast&&b.gun!==undefined;
function pick(p,heading,arc,range,exclude){let best=range,target=null;for(const e of world(p).enemies||[]){if(!aerial(e)||e===exclude)continue;const d=dist(p,e);if(d<best&&Math.abs(wrap(bearing(p,e)-heading))<arc){best=d;target=e}}return target;}
function cue(p,kind,data={}){return signatureCue(p,kind,data)}
function suppress(p,e,seconds){if(!aerial(e))return;e.pilotSuppressedUntil=Math.max(e.pilotSuppressedUntil||0,clock(p)+seconds);e.pilotSuppressOwner=p.id;e.pilotSuppressKind=p.pilot;cue(p,'suppressed',{x:e.x,y:e.y,a:e.a||0,life:.45});}
function rearBurst(p,target,strong=false){
 if(!aerial(target)||p.reloadTime>0||!(p.ammo?.[1]>0)||Math.abs(wrap(bearing(p,target)-p.a-Math.PI))>Math.PI*.49)return false;
 const a=p.nineRearAim??bearing(p,target),x=p.x-Math.cos(p.a)*23,y=p.y-Math.sin(p.a)*23;
 if(Math.abs(wrap(a-p.a-Math.PI))>Math.PI*.49||Math.abs(wrap(a-bearing(p,target)))>.18)return false;
 const count=Math.min(Math.max(strong?3:2,p.shots||1),p.ammo[1]);if(!p.unlimitedAmmo)p.ammo[1]-=Math.max(1,count-(p.freeVolleyShots||0));p.roundsFired+=count;
 for(let i=0;i<count;i++){const aa=a+(i-(count-1)/2)*.022;world(p).bullets.push(p.applySpecialRound({x,y,vx:Math.cos(aa)*550,vy:Math.sin(aa)*550,life:1.15,enemy:false,ownerId:p.id,gun:1,damage:p.damage*p.normalGunMultiplier()*(strong?1.45:1.1),hit:new Set(),pilotRear:true,visualType:'normal'},null));}
 p.nineRearFlash=.1;p.nineRearAim=a;cue(p,'rearBurst',{x,y,a,life:.18,strong});p.event('shot','');return true;
}
export function recordNineDamage(p,damage){
 if(!(damage>0)||p.state!=='playing'||p.hp<=0||p.invuln>0)return;
 if(p.pilot==='berthold'){
  const held=damage>=p.maxHp*.09?damage*.3:damage*.12;
  p.heldDamage=Math.min(p.maxHp,(p.heldDamage||0)+held);
  if(p.skillTime>0)p.ironActiveDamage=(p.ironActiveDamage||0)+held;
  cue(p,'ironImpact',{life:.65,damage});
 }else if(p.pilot==='barker'){
  p.barkerDamageStage=Math.min(p.skillTime>0?5:3,(p.barkerDamageStage||0)+1);
  cue(p,'battleDamage',{life:.85,count:p.barkerDamageStage});
 }
}
export function deflectNineRound(p,b,x=b.x,y=b.y){
 if(p.pilot!=='nungesser'||!(p.skillTime>0)||p.hp<=0)return false;
 const a=Math.atan2(b.vy,b.vx);cue(p,'deathDeflect',{x,y,a,life:.48});b.life=0;return true;
}
// Applied only to enemies actually suppressed by these pilots. Other AI is untouched.
export function wobbleSuppressedRounds(w,e,start){
 if(!(e.pilotSuppressedUntil>(w.t||0)))return;
 for(let i=start;i<w.bullets.length;i++){const b=w.bullets[i];if(!b.enemy)continue;const a=Math.atan2(b.vy,b.vx)+Math.sin((w.t||0)*21+i*1.7)*.15,s=Math.hypot(b.vx,b.vy);b.vx=Math.cos(a)*s;b.vy=Math.sin(a)*s;}
}
function advance(p,dt){
 const w=world(p),now=clock(p);p.nineRearFlash=Math.max(0,(p.nineRearFlash||0)-dt);
 if(p.pilot==='huffzky'||p.pilot==='mckeever'){
  const active=p.skillTime>0;
  const rear=pick(p,p.a+Math.PI,Math.PI*.49,active?650:430);
  if(rear!==p.nineRearTarget){p.nineRearTarget=rear;p.rearAcquire=0;p.rearBurstLeft=0;if(rear)cue(p,'rearAcquire',{x:rear.x,y:rear.y,a:bearing(p,rear),life:.24});}
  p.nineRearAim??=p.a+Math.PI;
  p.nineRearAim=rear?p.nineRearAim+clamp(wrap(bearing(p,rear)-p.nineRearAim),-dt*5,dt*5):p.a+Math.PI;
  p.rearAcquire=rear?(p.rearAcquire||0)+dt:0;
  if(p.pilot==='mckeever'&&active){
   const front=p.nineFrontTarget;
   if(!aerial(front)||front===rear||dist(p,front)>650||Math.abs(wrap(bearing(p,front)-p.a))>Math.PI*.49)p.nineFrontTarget=pick(p,p.a,Math.PI*.49,650,rear);
   p.nineFrontAim??=p.a;p.nineFrontAim=p.nineFrontTarget?p.nineFrontAim+clamp(wrap(bearing(p,p.nineFrontTarget)-p.nineFrontAim),-dt*5,dt*5):p.a;
  }else {p.nineFrontTarget=null;p.nineFrontAim=p.a;}
  if(p.pilot==='huffzky'&&active){
   const age=p.nineDuration-p.skillTime;
   if((p.reverseBursts||0)<4&&age>=.35+(p.reverseBursts||0)*.62&&rearBurst(p,rear,true))p.reverseBursts=(p.reverseBursts||0)+1;
  }else if(rear&&p.rearAcquire>=.24){
   p.rearFire=(p.rearFire??0)-dt;
   if(p.rearFire<=0){rearBurst(p,rear,active);p.rearBurstLeft=(p.rearBurstLeft||0)+1;p.rearFire=p.rearBurstLeft%3===0?(active?.34:.8):.13;}
  }
 }
 if(p.pilot==='jacobs'){
  const target=pick(p,p.a,.65,300);
  if(p.roundsFired>(p.jacobsLastRounds??p.roundsFired))p.jacobsLastShot=now;
  p.jacobsLastRounds=p.roundsFired;
  const shooting=p.reloadTime<=0&&p.nineFiring&&now-(p.jacobsLastShot??-Infinity)<.25;
  p.jacobsPressure=target&&shooting?(target===p.jacobsPressureTarget?(p.jacobsPressure||0)+dt:dt):Math.max(0,(p.jacobsPressure||0)-dt*2);
  p.jacobsPressureTarget=target;
  if(target&&p.jacobsPressure>=.65){suppress(p,target,.85);p.jacobsPressure=.3;}
 }
 if(p.pilot==='hawker'){
  if((p.kills||0)>(p.hawkerSeenKills??0)){p.hawkerNext=pick(p,p.a,Math.PI,460);p.hawkerLinkTime=.85;if(p.hawkerNext)cue(p,'hawkerLink',{x:p.hawkerNext.x,y:p.hawkerNext.y,a:bearing(p,p.hawkerNext),life:.75});}
  p.hawkerSeenKills=p.kills;p.hawkerLinkTime=Math.max(0,(p.hawkerLinkTime||0)-dt);
  if(!aerial(p.hawkerNext)||dist(p,p.hawkerNext)>500)p.hawkerNext=null;
 }
 if(p.pilot==='udet'){
  // Existing shot counter supplies the sustained-fire window; reload is its limit.
  const firing=p.roundsFired>(p.udetLastRounds??p.roundsFired);p.udetLastRounds=p.roundsFired;
  if(p.reloadTime>0||p.ammo.every(n=>n<=0)){p.udetRunStart=p.roundsFired;p.fxOverheat=0;p.udetDanger=false;}
  else {p.udetRunStart??=p.roundsFired;if(!firing&&!p.nineFiring)p.udetRunStart=p.roundsFired;const used=p.roundsFired-p.udetRunStart;p.fxOverheat=clamp((used-28)/42,0,1);p.udetDanger=p.fxOverheat>.7;}
 }
 if(p.pilot==='berthold'&&p.skillTime>0){
  p.gustDisorient=0;p.cannonRecoil129=(p.cannonRecoil129||0)*.2;w.shake=Math.min(w.shake||0,2);
  if(p.skillTime<=dt+.16&&!p.ironSalvoDone&&(p.ironActiveDamage||0)>=p.maxHp*.12){
   p.ironSalvoDone=true;p.heldDamage=0;
   for(let i=-2;i<=2;i++){const a=p.a+i*.035;w.bullets.push({x:p.x+Math.cos(p.a)*25,y:p.y+Math.sin(p.a)*25,vx:Math.cos(a)*620,vy:Math.sin(a)*620,life:1.2,enemy:false,ownerId:p.id,damage:p.damage*1.7,pierce:true,hit:new Set(),ironSalvo:true});}
   cue(p,'ironSalvo',{life:.38});p.muzzleFlash=.16;
  }
 }
 p.wingBoost=Math.max(0,(p.wingBoost||0)-dt);if(p.pilot==='goering'&&p.skillTime>0){
  if(!aerial(p.whiteFocus)||dist(p,p.whiteFocus)>800)p.whiteFocus=pick(p,p.a,Math.PI,760);
 }
 if(p.pilot==='nungesser'){
  const active=p.skillTime>0;p.deathFogTear=Math.max(0,(p.deathFogTear||0)-dt);
  if(p.nineWasActive&&!active)cue(p,'deathRelease',{life:1.1});
  for(const b of w.bullets||[]){if(!b.enemy||b.life<=0)continue;const d=dist(p,b);if(d>60)continue;
   if(active&&d<34){deflectNineRound(p,b);continue;}
   if(d<48&&now-(p.deathNearMissAt??-Infinity)>.16){p.deathNearMissAt=now;p.deathFogTear=.32;p.deathTearAngle=bearing(p,b);cue(p,'fogTear',{x:b.x,y:b.y,a:Math.atan2(b.vy,b.vx),life:.35});}
  }
 }
 if(p.pilot==='barker'){
  if(p.nineWasActive&&!(p.skillTime>0))p.barkerScarStage=Math.max(p.barkerScarStage||0,p.barkerDamageStage||0);
  if(!(p.barkerStackTime>0)&&!(p.skillTime>0))p.barkerDamageStage=0;
 }
 p.nineWasActive=p.skillTime>0;
}
export function installNinePilots(Game,PILOTS){
 const q=Game.prototype;
 const labels={
  huffzky:['후방 사수','후방 적을 포착·조준한 뒤 점사. 명중 시 적의 조준이 잠시 흐트러집니다.','Schlasta 15 · 역추격','3초간 좌우 기동으로 추격기를 유도하고 후방 사수가 네 차례 강한 점사를 가합니다.'],
  mckeever:['후방 사수 · 파월','전방은 직접 조준, 후방은 파월이 독립 표적을 견제합니다.','Hawk & Gnat · 교차 화망','5초간 전후방 사수가 서로 다른 적을 독립 추적·사격합니다.'],
  jacobs:['야스타 7의 노련함','가까운 적을 계속 압박하면 적의 조준·추적 반응을 잠시 흔듭니다.','Jasta 7 · 근접 폭풍','4초간 좁은 부채꼴 사격. 초근접 정면에서는 탄도가 다시 수렴합니다.'],
  hawker:['연속 공격','격추 직후 가까운 다음 적을 짧게 강조합니다.','Attack Everything','5초간 격추 후 다음 표적 방향으로 총구가 잠시 이어집니다. 조작권은 유지됩니다.'],
  berthold:['철혈의 에이스','큰 피격 일부를 버틴 피해로 기억합니다.','Iron Knight · 불굴의 의지','5초간 피탄 흔들림을 억누르고 사격을 지속합니다. 버틴 피해가 충분하면 마지막 일제사격.'],
  udet:['공중 곡예사','연속 사격의 위험 구간에서 총열 스파크·정밀도가 상승. 탄약 소진·재장전 시 종료.','Du doch nicht!!','2.6초간 조종 한계의 급선회. 총구가 가까운 적을 짧게 따라 곡선 진입사격합니다.'],
  goering:['백색 편대장','백색 윙맨 1기와 상시 출격합니다.','White Flight · 집중 포화','백색 신호탄 후 윙맨이 좌우로 벌어져 표적에 교차 재진입하고 편대로 복귀합니다.'],
  nungesser:['죽음의 기사','저체력에서 짙어지는 검은 연무. 근접 탄환이 연무를 찢고 빈사 시 촛불이 남습니다.','죽음의 기사','3초간 무적. 접근 탄환은 검은 연무·불씨 속에서 소멸하고 종료 시 연무가 흩어집니다.'],
  barker:['불굴의 각성','피격 중첩에 따라 탄흔·찢긴 천·엔진 불꽃과 사격 반응이 강해집니다.','Last Stand · 새니에트의 기적','6초간 사망 불가. 빈사일수록 손상·총구화염이 최고조에 이르고 생존 후 손상이 남습니다.']
 };
 for(const [id,v] of Object.entries(labels))Object.assign(PILOTS[id],{passive:v[0],passiveDesc:v[1],skill:v[2],desc:v[3]});
 const duration=q.skillDuration;q.skillDuration=function(){return NINE_PILOTS.has(this.pilot)?durations[this.pilot]*(this.skillEnhanced?1.35:1):duration.call(this)};
 const skill=q.skill;q.skill=function(){
  if(!NINE_PILOTS.has(this.pilot))return skill.call(this);
  this.ensureRevisionPilot();if(this.state!=='playing'||this.hp<=0||this.cooldown>0||this.mission?.unarmed)return false;
  this.cooldown=this.skillCooldown();this.skillTime=this.nineDuration=this.skillDuration();this.nineWasActive=true;
  if(this.pilot==='huffzky'){this.reverseBursts=0;this.crossfireTimer=.08;}
  if(this.pilot==='mckeever')this.crossfireTimer=.08;
  if(this.pilot==='udet'){this.udetBoost=0;this.nineTurnSide=1;}
  if(this.pilot==='berthold'){this.ironActiveDamage=0;this.ironSalvoDone=false;}
  if(this.pilot==='nungesser')this.invuln=Math.max(this.invuln,this.skillTime);
  if(this.pilot==='goering'){
   this.wingBoost=this.skillTime;this.whiteFocus=pick(this,this.a,Math.PI,760);
   const w=world(this),owned=(w.allies||[]).filter(a=>a.life>0&&(a.ownerId===undefined||a.ownerId===this.id));
   if(owned.length<2)w.allies.push({x:this.x,y:this.y,a:this.a,plane:'fokkerd7',slot:1,ownerId:this.id,life:this.skillTime+.8,fire:.6,whiteTemporary:true});
   for(let i=0;i<owned.length;i++)owned[i].whiteSide=i%2?-1:1;
  }
  activatePilotSignature(this);this.event('skill',PILOTS[this.pilot].skill);return true;
 };
 const begin=q.beginRevisionFrame;q.beginRevisionFrame=function(dt,input={}){const prior=begin.call(this,dt,input);if(NINE_PILOTS.has(this.pilot)&&this.state==='playing'&&this.hp>0){this.nineFiring=input.inputMode!=='gamepad'||!!input.fireHeld;advance(this,dt);}return prior;};
 // Old caller loops remain harmless; all duo bursts now have rear-angle acquisition.
 const duo=q.duoVolley;q.duoVolley=function(){if(this.pilot==='huffzky'||this.pilot==='mckeever')return;return duo.call(this)};
 const fly=q.flyAirframe;q.flyAirframe=function(dt,input={}){
  const duo=this.pilot==='huffzky'||this.pilot==='mckeever',saved=this.duoSpinStep;if(duo)this.duoSpinStep=0;
  const oldTurn=this.turn;if(this.pilot==='udet'&&this.skillTime>0)this.turn*=2.1;
  try{fly.call(this,dt,input);if(this.pilot==='huffzky'&&this.skillTime>0){const age=this.nineDuration-this.skillTime;this.a+=Math.cos(age*Math.PI*4)*dt*.75;this.nineRoll=Math.sin(age*Math.PI*4)*.12;}}
  finally{this.turn=oldTurn;if(duo)this.duoSpinStep=saved;}
 };
 const direction=q.gunDirection;q.gunDirection=function(gun=0){
  if((this.pilot==='huffzky'||this.pilot==='mckeever')&&gun===1)return this.nineRearTarget?(this.nineRearAim??bearing(this,this.nineRearTarget)):this.a+Math.PI;
  if(this.pilot==='mckeever'&&this.skillTime>0&&gun===0&&aerial(this.nineFrontTarget))return this.nineFrontAim??bearing(this,this.nineFrontTarget);
  let a=direction.call(this,gun);
  if(this.pilot==='hawker'&&this.skillTime>0&&this.hawkerLinkTime>0&&aerial(this.hawkerNext))a+=clamp(wrap(bearing(this,this.hawkerNext)-a),-.65,.65)*clamp(this.hawkerLinkTime/.2,0,1);
  if(this.pilot==='udet'&&this.skillTime>0){const t=pick(this,a,.8,340);if(t)a+=clamp(wrap(bearing(this,t)-a),-.5,.5);}
  return a;
 };
 const round=q.applySpecialRound;q.applySpecialRound=function(b,type){
  const r=round.call(this,b,type);if(!gunRound(b))return r;
  if(['mckeever','hawker','udet'].includes(this.pilot)&&!b.pilotRear){const offset=this.weapon.bidirectional?0:(b.gun-(this.weapon.guns-1)/2)*8;b.x=this.x+Math.cos(this.a)*23-Math.sin(this.a)*offset;b.y=this.y+Math.sin(this.a)*23+Math.cos(this.a)*offset;}
  if(this.pilot==='jacobs'&&this.skillTime>0){
   const near=pick(this,this.a,.25,100),fan=near?.018:.14,a=Math.atan2(b.vy,b.vx),s=Math.hypot(b.vx,b.vy);b.damage/=3;
   for(const side of [-1,1])world(this).bullets.push({...b,vx:Math.cos(a+side*fan)*s,vy:Math.sin(a+side*fan)*s,enemy:false,ownerId:this.id,hit:new Set(),jacobsSuppress:true});b.jacobsSuppress=true;
  }
  if(this.pilot==='udet'&&this.udetDanger&&!(this.reloadTime>0)){const a=this.gunDirection(b.gun),s=Math.hypot(b.vx,b.vy);b.vx=Math.cos(a)*s;b.vy=Math.sin(a)*s;}
  if(this.pilot==='barker'){const stage=Math.min(5,this.barkerStacks||0),a=Math.atan2(b.vy,b.vx)+Math.sin(clock(this)*29+b.gun*1.3)*.008*stage,s=Math.hypot(b.vx,b.vy);b.vx=Math.cos(a)*s;b.vy=Math.sin(a)*s;b.barkerRough=stage;}
  return r;
 };
 const impact=q.specialRoundImpact;q.specialRoundImpact=function(b,e){const r=impact.call(this,b,e);if(b.pilotRear&&b.ownerId===this.id&&this.pilot==='huffzky')suppress(this,e,.65);if(this.pilot==='jacobs'&&b.jacobsSuppress&&gunRound(b)&&dist(this,e)<300)suppress(this,e,.75);return r;};
 const hit=q.hit;q.hit=function(n){recordNineDamage(this,n);if(this.pilot==='nungesser'&&this.skillTime>0&&this.damageSource?.bullet)deflectNineRound(this,this.damageSource.bullet,this.damageSource.impactX,this.damageSource.impactY);return hit.call(this,n)};
 const volley=q.enemyVolley;q.enemyVolley=function(e,...args){const start=this.bullets.length,r=volley.call(this,e,...args);wobbleSuppressedRounds(this,e,start);return r;};
 const steer=q.dogfightSteering;q.dogfightSteering=function(e,contact,dt,baseTurn){const r=steer.call(this,e,contact,dt,baseTurn);if(e.pilotSuppressedUntil>clock(this)&&r){r.turn*=.7;r.delta+=Math.sin(clock(this)*17)*.1;}return r;};
 const wing=q.wingFormationTarget;q.wingFormationTarget=function(a,count){
  if(this.pilot!=='goering'||!(this.skillTime>0))return wing.call(this,a,count);
  const focus=this.whiteFocus,age=this.nineDuration-this.skillTime,side=a.whiteSide??((a.slot||0)%2?-1:1),heading=focus?bearing(this,focus):this.a;
  const splitUntil=this.nineDuration*.18,attackUntil=this.nineDuration-1.2;
  const spread=age<splitUntil?180*age/splitUntil:age<attackUntil?180:180*clamp((this.skillTime-.1)/1.1,0,1),forward=age<splitUntil?-65:age<attackUntil?focus?Math.max(40,dist(this,focus)-130):150:-65;
  return{x:this.x+Math.cos(heading)*forward-Math.sin(heading)*side*spread,y:this.y+Math.sin(heading)*forward+Math.cos(heading)*side*spread};
 };
 const focus=q.goeringFocusTarget;q.goeringFocusTarget=function(){if(this.pilot==='goering'&&this.skillTime>0){if(!aerial(this.whiteFocus))this.whiteFocus=pick(this,this.a,Math.PI,760);return this.whiteFocus;}return focus.call(this)};
}
export function installNineCoop(CoopGame){
 const q=CoopGame.prototype,hit=q.hitPlayer;
 q.hitPlayer=function(p,n,...args){recordNineDamage(p,n);if(p.pilot==='nungesser'&&p.skillTime>0&&p.damageSource?.bullet)deflectNineRound(p,p.damageSource.bullet,p.damageSource.impactX,p.damageSource.impactY);return hit.call(this,p,n,...args)};
 const volley=q.enemyVolley;q.enemyVolley=function(e,...args){const start=this.bullets.length,r=volley.call(this,e,...args);wobbleSuppressedRounds(this,e,start);return r;};
 const revive=q.revive;q.revive=function(p,...args){const result=revive.call(this,p,...args);if(NINE_PILOTS.has(p.pilot)&&p.status==='alive'){for(const k of ['nineRearTarget','nineFrontTarget','whiteFocus','hawkerNext','jacobsPressureTarget'])p[k]=null;for(const k of ['heldDamage','ironActiveDamage','barkerDamageStage','barkerScarStage','fxOverheat','rearAcquire','nineRearFlash','hawkerLinkTime','jacobsPressure'])p[k]=0;p.nineRearAim=p.a+Math.PI;p.nineFrontAim=p.a;p.nineWasActive=false;p.udetRunStart=p.roundsFired;}return result;};
}
