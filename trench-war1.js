// Region 2 trench creeping barrage + region 3 smoke-front concealment layer.
// Preserves gasZones/flak systems; adds moving shell barrage and ground haze.
import {TAILING_BALANCE} from './engine.js?v=324&b=324';
export const TRENCH_BALANCE=Object.freeze({
 barrageGapMin:40,barrageGapMax:55,barrageWarn:2.2,barrageHalfWidth:65,barrageSpeed:40,
 barrageTravel:1500,playerHit:.13,hitCooldown:1.35,enemyHit:.3,lullAfter:5,
 smokeMax:3,smokeR:190,smokeLife:50,smokeDrift:14,smokeGap:14,aimCut:.45,tailCut:.65
});
export function installTrenchWar(Game){
 const P=Game.prototype,B=TRENCH_BALANCE;
 P.spawnBarrage=function(){
  const dir=this.a,side=(this.rng()>.5?1:-1);
  this.barrage={dir,side,x:this.x-Math.cos(dir)*420,y:this.y-Math.sin(dir)*420,warn:B.barrageWarn,pos:0,travel:B.barrageTravel,expired:false};
  this.event('flak','포격 예고 — 이동 포격선 접근');
 };
 P._barrageHit=function(x,y){
  const b=this.barrage;if(!b)return false;
  const nx=-Math.sin(b.dir),ny=Math.cos(b.dir);
  const along=Math.cos(b.dir)*(x-b.x)+Math.sin(b.dir)*(y-b.y);
  if(along<b.pos||along>b.pos+B.barrageSpeed*0)return along>=b.pos&&along<=b.pos+1;
  return false;
 };
 P.inBarrageBand=function(x,y){
  const b=this.barrage;if(!b||b.warn>0)return false;
  const nx=-Math.sin(b.dir),ny=Math.cos(b.dir);
  const lateral=nx*(x-b.x)+ny*(y-b.y);
  const along=Math.cos(b.dir)*(x-b.x)+Math.sin(b.dir)*(y-b.y);
  return along>=b.pos-10&&along<=b.pos+10&&Math.abs(lateral)<B.barrageHalfWidth;
 };
 P.inSmoke=function(x,y){
  if(!this.smokeZones)return false;
  for(const z of this.smokeZones)if(Math.hypot(x-z.x,y-z.y)<z.r)return true;
  return false;
 };
 const _twFlak=Game.prototype.spawnFlak;
 Game.prototype.spawnFlak=function(x,y){
  if(this.worldRegion()===2&&(this._flakLullUntil||0)>(this.t||0))return;
  return _twFlak.call(this,x,y);
 };
 const _twTarget=Game.prototype.enemyCombatTarget;
 Game.prototype.enemyCombatTarget=function(e){
  const c=_twTarget.call(this,e);
  if(e&&(e.ace||e.elite||e.bossPilot))return c;
  if(this.inSmoke(c.x,c.y)){const j=(this.t*4.7+(e._jit??=this.rng()*6.28));return{x:c.x+Math.cos(j)*B.aimCut*100,y:c.y+Math.sin(j)*B.aimCut*100,a:Math.atan2(c.y-e.y,c.x-e.x)}}
  return c;
 };
 const _twTail=Game.prototype.tailEligible;
 Game.prototype.tailEligible=function(e){
  if(!_twTail.call(this,e))return false;
  if(this.inSmoke(this.x,this.y)&&Math.hypot(e.x-this.x,e.y-this.y)>TAILING_BALANCE.maxDistance*B.tailCut)return false;
  return true;
 };
 const _twUpdate=Game.prototype.update;
 Game.prototype.update=function(dt,input={}){
  _twUpdate.call(this,dt,input);
  if(this.state!=='playing')return;
  const step=Math.min(.04,Math.max(0,dt)),region=this.worldRegion();
  if(region===2){
   if(!this.barrage){this._barrageT=(this._barrageT||30)-step;if(this._barrageT<=0)this.spawnBarrage()}
   const b=this.barrage;
   if(b){
    if(b.warn>0){b.warn-=step;if(b.warn<=0)this.event('flak','포격 개시')}
    else{
     b.pos+=B.barrageSpeed*step;
     if(this.rng()<step*14){const a=b.pos+this.rng()*40,l=(this.rng()-.5)*2*B.barrageHalfWidth;
      const ix=b.x+Math.cos(b.dir)*a-Math.sin(b.dir)*l,iy=b.y+Math.sin(b.dir)*a+Math.cos(b.dir)*l;
      this.burst(ix,iy,'#7a6248',5);this.smoke(ix,iy,true)}
     if((this._barragePlayerHit||0)<=0&&this.inBarrageBand(this.x,this.y)){
      this._barragePlayerHit=B.hitCooldown;this.hit(Math.max(6,Math.round(this.maxHp*B.playerHit)))}
     this._barragePlayerHit=(this._barragePlayerHit||0)-step;
     for(const e of this.enemies){
      if(e.hp<=0||e.surface||e.stationary)continue;
      e._barrageHit=(e._barrageHit||0)-step;
      if(e._barrageHit<=0&&this.inBarrageBand(e.x,e.y)){e._barrageHit=B.hitCooldown;e.hp-=(e.maxHp||e.hp)*B.enemyHit;e.hitFlash=.25}
     }
     if(b.pos>b.travel){this.barrage=null;this._barrageT=B.barrageGapMin+this.rng()*(B.barrageGapMax-B.barrageGapMin);this._flakLullUntil=(this.t||0)+B.lullAfter}
    }
   }
  }
  if(region===3){
   this.smokeZones=this.smokeZones||[];
   this._smokeT=(this._smokeT||4)-step;
   for(const z of this.smokeZones){z.life-=step;z.x+=Math.cos(z.drift)*B.smokeDrift*step;z.y+=Math.sin(z.drift)*B.smokeDrift*step;z.expired=z.life<=0}
   if(this.smokeZones.filter(z=>!z.expired).length<B.smokeMax&&this._smokeT<=0){
    this._smokeT=B.smokeGap;
    const a=this.a+((this.rng()-.5)*1.2);
    this.smokeZones.push({x:this.x+Math.cos(this.a)*(400+this.rng()*300)+(this.rng()-.5)*300,y:this.y+Math.sin(this.a)*(400+this.rng()*300)+(this.rng()-.5)*300,r:B.smokeR*(0.85+this.rng()*.4),life:B.smokeLife,drift:a+Math.PI/2*(this.rng()>.5?1:-1)*.3,expired:false});
   }
  }else this.smokeZones=[];
 };
};
export function drawTrenchLayer(c,game,{point}){
 const b=game.barrage,cw=c.canvas.width,ch=c.canvas.height;
 for(const z of game.smokeZones||[]){
  if(z.expired)continue;const[x,y]=point(z.x,z.y);
  if(x<-z.r||x>cw+z.r||y<-z.r||y>ch+z.r)continue;
  const fade=Math.min(1,z.life/6);
  const g=c.createRadialGradient(x,y,z.r*.2,x,y,z.r);
  g.addColorStop(0,`rgba(118,112,92,${.4*fade})`);g.addColorStop(1,'rgba(118,112,92,0)');
  c.fillStyle=g;c.beginPath();c.arc(x,y,z.r,0,7);c.fill();
 }
 if(b){
  const nx=-Math.sin(b.dir),ny=Math.cos(b.dir);
  const sx=Math.cos(b.dir),sy=Math.sin(b.dir);
  if(b.warn>0){
   c.save();c.globalAlpha=.5+.3*Math.sin(performance.now()/120);c.strokeStyle='#8a6a3a';c.lineWidth=2;
   for(let l=-TRENCH_BALANCE.barrageHalfWidth;l<=TRENCH_BALANCE.barrageHalfWidth;l+=45){
    const[x0,y0]=point(b.x+nx*l+sx*b.pos*0,b.y+ny*l+sy*0);
    c.beginPath();c.moveTo(x0-6,y0);c.lineTo(x0+6,y0);c.moveTo(x0,y0-6);c.lineTo(x0,y0+6);c.stroke();
   }
   c.restore();
  }else{
   c.save();
   for(let l=-TRENCH_BALANCE.barrageHalfWidth;l<=TRENCH_BALANCE.barrageHalfWidth;l+=34){
    const a=b.pos+((l*37)%40)-20;
    const[x0,y0]=point(b.x+sx*a+nx*l,b.y+sy*a+ny*l);
    if(x0<-40||x0>cw+40||y0<-40||y0>ch+40)continue;
    const g=c.createRadialGradient(x0,y0,2,x0,y0,26);
    g.addColorStop(0,'rgba(96,74,50,.55)');g.addColorStop(.6,'rgba(70,58,40,.28)');g.addColorStop(1,'rgba(70,58,40,0)');
    c.fillStyle=g;c.beginPath();c.arc(x0,y0,26,0,7);c.fill();
   }
   c.restore();
  }
 }
};
