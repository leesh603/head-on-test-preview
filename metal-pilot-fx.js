// Sachsenberg and Schleich: presentation observes existing combat; no new hits.
import {signatureCue,signatureState,activatePilotSignature,signatureInterval} from './pilot-signature-state.js';
export const METAL_PILOTS=new Set(['sachsenberg','schleich']);
export const METAL_FX_LIMITS=Object.freeze({wake:12,wakeLife:.42,sampleInterval:.04,shotInterval:.045});
export const METAL_FX_PALETTES=Object.freeze({sachsenberg:Object.freeze({edge:'#8ec8e7',core:'#e6f2fa',smoke:'#a1b3c2',spark:'#ccecff'}),schleich:Object.freeze({edge:'#bd7861',core:'#c3c6cb',smoke:'#606773',spark:'#f1b17b'})});
const clamp=n=>Math.max(0,Math.min(1,n));
const alive=p=>p.state==='playing'&&p.hp>0&&p.status!=='downed';
const state=p=>p.metalFlightFx??={clock:0,wake:[],muzzles:[],lastX:p.x,lastY:p.y,sampleAt:-Infinity,phase:null};
const personalGun=(p,b)=>b&&Number.isInteger(b.gun)&&(b.ownerId===undefined||b.ownerId===p.id)&&!['enemy','ally','patrol','formation','rocket','motorCannon','cow37','actualExplosion','blast','mauserRound'].some(k=>b[k]);
function advance(p,dt){
 if(!alive(p)||!(dt>0))return;
 const f=state(p);f.clock+=Math.min(.05,dt);
 let kept=0;for(const v of f.wake)if(f.clock-v.at<METAL_FX_LIMITS.wakeLife)f.wake[kept++]=v;f.wake.length=kept;
 const phase=p.skillTime>0?(p.pilot==='sachsenberg'?p.aceSkillPhase:'advance'):null;
 if(phase!==f.phase){if(phase==='dive')signatureCue(p,'metalDive',{life:.55,signatureStart:true});f.phase=phase;}
 const moved=Math.hypot(p.x-f.lastX,p.y-f.lastY);f.lastX=p.x;f.lastY=p.y;
 if(moved>100){f.wake.length=0;f.sampleAt=-Infinity;}
 if(phase&&moved>.5&&f.clock-f.sampleAt>=METAL_FX_LIMITS.sampleInterval){
  f.sampleAt=f.clock;if(f.wake.length===METAL_FX_LIMITS.wake)f.wake.shift();
  f.wake.push({x:p.x,y:p.y,a:p.a,at:f.clock,phase});
 }
}
export function installMetalPilotFx(Game){
 const q=Game.prototype,frame=q.beginRevisionFrame;
 q.beginRevisionFrame=function(dt,input={}){const prior=frame.call(this,dt,input);if(METAL_PILOTS.has(this.pilot))advance(this,dt);return prior;};
 const skill=q.skill;
 q.skill=function(){const used=skill.call(this);if(used&&METAL_PILOTS.has(this.pilot)){const f=state(this);f.phase=null;activatePilotSignature(this);}return used;};
 const round=q.applySpecialRound;
 q.applySpecialRound=function(b,type){const result=round.call(this,b,type);
  if(METAL_PILOTS.has(this.pilot)&&alive(this)&&this.skillTime>0&&this.reloadTime<=0&&!this.cow37&&personalGun(this,b)){
   const f=state(this),prior=f.muzzles[b.gun];if(!prior||f.clock-prior.at>=METAL_FX_LIMITS.shotInterval){f.muzzles[b.gun]={at:f.clock};signatureCue(this,'metalBrass',{x:b.x-Math.cos(this.a)*11,y:b.y-Math.sin(this.a)*11,a:Math.atan2(b.vy,b.vx),side:b.gun%2?1:-1,life:.34});}
  }return result;
 };
 const received=q.buildReceivedDamage;
 q.buildReceivedDamage=function(before){const result=received.call(this,before);const source=this.damageSource;
  if(METAL_PILOTS.has(this.pilot)&&alive(this)&&this.hp<before&&source?.bullet&&signatureInterval(this,'metalArmor',.10)){
   signatureCue(this,'metalArmor',{x:source.impactX??this.x,y:source.impactY??this.y,a:Math.atan2(source.bullet.vy,source.bullet.vx),life:.36});
  }return result;
 };
 q.metalDeflectionFx=function(x,y,a){if(this.pilot==='schleich'&&alive(this)&&signatureInterval(this,'metalDeflection',.045))signatureCue(this,'metalDeflect',{x,y,a,life:.30});};
 q.resetMetalPilotFx=function(){if(METAL_PILOTS.has(this.pilot)){delete this.metalFlightFx;delete this.pilotSignatureState;}};
}
export function drawMetalWake(c,p,tex){const f=p.metalFlightFx;if(!f)return;const colors=METAL_FX_PALETTES[p.pilot];
 for(let i=0;i<f.wake.length;i++){const v=f.wake[i],q=clamp((f.clock-v.at)/METAL_FX_LIMITS.wakeLife),ca=Math.cos(v.a),sa=Math.sin(v.a),x=v.x-p.x,y=v.y-p.y,black=p.pilot==='schleich';
  if(black){if(i%2===0)tex(c,'smokeDark',x-ca*(25+q*18),y-sa*(25+q*18),46+q*23,18+q*10,v.a+Math.PI,.33*(1-q),colors.smoke);}
  for(const side of [-1,1])tex(c,'vaporTrail',x-ca*(20+q*18)-sa*side*25,y-sa*(20+q*18)+ca*side*25,black?44:58,black?5:8,v.a,(black?.30:.44)*(1-q),side<0?colors.edge:colors.core);
 }
}
export function drawMetalLocal(c,p,tex){const f=p.metalFlightFx;if(!f||!(p.skillTime>0))return;const colors=METAL_FX_PALETTES[p.pilot],time=f.clock;
 if(p.pilot==='sachsenberg'){
  const climbing=p.aceSkillPhase==='climb';
  for(const side of [-1,1]){const q=(time*2+side*.2+1)%1;tex(c,climbing?'mist':'windStreak',climbing?-5:-37-q*20,side*(climbing?18:25),climbing?43+q*10:82,climbing?18:9,side*(climbing?.2:.05),(climbing?.28:.46)*(1-q*.45),side<0?colors.edge:colors.core);}
 }else for(const side of [-1,1]){
  tex(c,'windStreak',22,side*22,74,13,-side*.52,.72,colors.edge);
  tex(c,'smokeDark',-36,side*16,56,18,Math.PI+side*.1,.28,colors.smoke);
 }
}
export function drawMetalGuns(c,p,tex){const f=p.metalFlightFx;if(!f||p.reloadTime>0||p.cow37||!(p.skillTime>0))return;const colors=METAL_FX_PALETTES[p.pilot],count=Math.min(8,p.weapon?.guns||1),ca=Math.cos(p.a),sa=Math.sin(p.a);
 for(let gun=0;gun<count;gun++){const shot=f.muzzles[gun],age=shot?f.clock-shot.at:Infinity;if(age<0||age>.055)continue;const a=p.gunDirection?.(gun)??p.a,offset=p.weapon?.bidirectional?0:(gun-(count-1)/2)*8,m=p.bomberGunMount(gun,a,offset),dx=m.x-p.x,dy=m.y-p.y,x=dx*ca+dy*sa,y=-dx*sa+dy*ca,heading=a-p.a;
  tex(c,'muzzle',x+Math.cos(heading)*10,y+Math.sin(heading)*10,34,14,heading,.92*(1-age/.055),p.pilot==='schleich'?colors.spark:colors.core);
 }
}
export function drawMetalCue(c,p,e,tex,front){if(!e.kind.startsWith('metal'))return false;const colors=METAL_FX_PALETTES[p.pilot],q=clamp(e.age/e.maxLife),fade=1-q,a=e.a-p.a;
 if(e.kind==='metalBrass'){if(front){const x=-e.age*45,y=e.side*(4+e.age*65);tex(c,'bulletBrass',Math.cos(a)*x-Math.sin(a)*y,Math.sin(a)*x+Math.cos(a)*y,6,2.6,a+e.age*12,.8*fade,colors.spark);}return true;}
 if(e.kind==='metalArmor'||e.kind==='metalDeflect'){if(front){tex(c,'ricochet',0,0,48+q*20,25,a,.95*fade,colors.spark);tex(c,'spark',0,0,20,14,a,.92*fade,colors.core);for(let i=0;i<3;i++){const angle=a+(i-1)*.75;tex(c,'metalShard'+i,Math.cos(angle)*(4+q*24),Math.sin(angle)*(4+q*24),7-q*2,4,angle+q*3,.78*fade,colors.core);}tex(c,'gunSmoke',0,0,29+q*15,16,a,.24*fade,colors.smoke);}return true;}
 if(front)return true;
 if(e.kind==='metalClimb'||e.kind==='metalDive'){
  const diving=e.kind==='metalDive';for(const side of [-1,1]){tex(c,'windStreak',diving?-18-q*48:-6,side*(22+q*(diving?8:18)),diving?100:60,diving?11:17,side*(diving?.08:.5),.65*fade,colors.edge);tex(c,'vaporTrail',-34-q*24,side*24,80,8,0,.38*fade,colors.core);}
 }else if(e.kind==='metalAdvance')for(const side of [-1,1]){tex(c,'smokeDark',-18-q*28,side*(14+q*16),50+q*24,24,Math.PI+side*.24,.40*fade,colors.smoke);tex(c,'windStreak',26-q*20,side*24,76,10,-side*.5,.72*fade,colors.edge);}
 return true;
}
