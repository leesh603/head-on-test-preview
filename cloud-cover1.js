// Cloud concealment — shared tactical system across all regions (전장 개성화 패치).
// Dense clouds break enemy tracking; wispy clouds only soften accuracy.
export const CLOUD_TYPES=Object.freeze({
 cumulus:{rx:135,ry:78,dense:1,drift:4,alpha:.88},
 bank:{rx:245,ry:64,dense:1,drift:10,alpha:.9},
 dark:{rx:190,ry:108,dense:1.3,drift:6,alpha:.95,dark:true},
 wispy:{rx:170,ry:64,dense:.35,drift:14,alpha:.5}
});
export const CLOUD_DENSITY=Object.freeze({0:.75,1:.3,2:.55,3:.85,4:.35,5:.95,6:.55,7:.45});
const CLOUD_PICK=Object.freeze({
 0:['cumulus','cumulus','cumulus','bank','wispy','cumulus'],
 1:['cumulus','wispy','wispy','cumulus'],
 2:['bank','bank','cumulus','wispy','bank'],
 3:['bank','dark','bank','dark','cumulus','dark'],
 4:['dark','cumulus','wispy','cumulus'],
 5:['cumulus','cumulus','dark','wispy','bank','cumulus','wispy'],
 6:['cumulus','cumulus','bank','wispy','cumulus'],
 7:['bank','cumulus','wispy','bank']
});
export const CLOUD_CONCEAL=Object.freeze({partial:.7,normal:1.2,elite:1.6,ace:2,boss:1.8,reacquire:1,reacquireAce:.6,reacquireBoss:.45,aimWobble:55,enemyHide:.4,darkRange:250});
const MAX_CLOUDS=9;
const CLOUD_IMGS={cumulus:['fx-cloud-cumulus-0','fx-cloud-cumulus-1','fx-cloud-cumulus-2'],bank:['fx-cloud-bank-0','fx-cloud-bank-1'],dark:['fx-cloud-dark-0','fx-cloud-dark-1'],wispy:['fx-cloud-wispy-0','fx-cloud-wispy-1']};
const _imgCache={};
function cloudImg(type,seed){
 const list=CLOUD_IMGS[type]||CLOUD_IMGS.cumulus;
 const key=list[Math.floor(((seed||0)/6.283)*list.length)%list.length];
 let im=_imgCache[key];
 if(im===undefined){im=new Image();im.src=`./${key}.webp?v=292&b=292`;im.onload=()=>{_imgCache[key]=im};_imgCache[key]=im}
 return im;
}

export function installCloudCover(Game){
 const P=Game.prototype;
 P.cloudDepthAt=function(x,y){
  let d=0;
  for(const c of this.clouds||[]){const t=CLOUD_TYPES[c.type];const dx=(x-c.x)/t.rx,dy=(y-c.y)/t.ry;if(dx*dx+dy*dy<=1&&t.dense>d)d=t.dense}
  return d;
 };
 P.inCloudType=function(x,y,type){
  for(const c of this.clouds||[]){if(c.type!==type)continue;const t=CLOUD_TYPES[c.type];const dx=(x-c.x)/t.rx,dy=(y-c.y)/t.ry;if(dx*dx+dy*dy<=1)return true}
  return false;
 };
 P.playerConcealed=function(threshold){return (this.cloudConceal||0)>=(threshold??CLOUD_CONCEAL.normal)};
 P._spawnCloud=function(region){
  const pick=CLOUD_PICK[region]||CLOUD_PICK[0],r=this.rng?.()??Math.random();
  const type=pick[Math.floor(r*pick.length)],t=CLOUD_TYPES[type];
  const ahead=this.a||0,d=520+((this.rng?.()??Math.random())*850),side=((this.rng?.()??Math.random())-.5)*900;
  const dr=(this.rng?.()??Math.random())*Math.PI*2;
  return{x:this.x+Math.cos(ahead)*d-Math.sin(ahead)*side,y:this.y+Math.sin(ahead)*d+Math.cos(ahead)*side,type,vx:Math.cos(dr)*t.drift,vy:Math.sin(dr)*t.drift,seed:(this.rng?.()??Math.random())*6.28,mirror:(this.rng?.()??Math.random())<.5};
 };
 P.tickCloudCover=function(step){
  const region=this.worldRegion?.()??0;
  const want=Math.min(MAX_CLOUDS,Math.max(2,Math.round(2+7*(CLOUD_DENSITY[region]??.5))));
  this.clouds??=[];
  for(const c of this.clouds){
   c.x+=c.vx*step;c.y+=c.vy*step;
   if(Math.hypot(c.x-this.x,c.y-this.y)>1700)Object.assign(c,this._spawnCloud(region));
  }
  while(this.clouds.length<want)this.clouds.push(this._spawnCloud(region));
  if(this.clouds.length>want)this.clouds.length=want;
  const players=this.players&&this.players.length?this.players:[this];
  for(const p of players){
   if(!(p.hp>0)){p.cloudConceal=0;p.cloudDepth=0;p.inDarkCloud=false;continue}
   const depth=this.cloudDepthAt(p.x,p.y);
   p.cloudDepth=depth;p.inDarkCloud=this.inCloudType(p.x,p.y,'dark');
   if(depth>=1)p.cloudConceal=(p.cloudConceal||0)+step;else p.cloudConceal=Math.max(0,(p.cloudConceal||0)-step*2.2);
  }
  for(const e of this.enemies||[])e._cloudHide=this.cloudDepthAt(e.x,e.y)>=1?(e._cloudHide||0)+step:0;
 };
 const _ect=P.enemyCombatTarget;
 P.enemyCombatTarget=function(e){
  const c=_ect.call(this,e);
  const isPlayer=c===this||!!(this.players&&this.players.includes(c));
  if(!isPlayer)return c;
  const conceal=Math.max(0,c.cloudConceal||0);
  const boss=e.type==='boss'||e.stageBossBody,ace=!boss&&(e.ace||e.bossPilot),elite=!ace&&(e.elite||e.eventEscort||e.eventCommander||e.formationLeader||e.veteran||e.danger);
  const thr=boss?CLOUD_CONCEAL.boss:ace?CLOUD_CONCEAL.ace:elite?CLOUD_CONCEAL.elite:CLOUD_CONCEAL.normal;
  const reacq=boss?CLOUD_CONCEAL.reacquireBoss:ace?CLOUD_CONCEAL.reacquireAce:elite?.8:CLOUD_CONCEAL.reacquire;
  if(conceal>=thr){
   if(!e._cloudGhost){const lead=620+(e.speed||0)*1.2,ga=c.a||0;
    e._cloudGhost={x:c.x+Math.cos(ga)*lead,y:c.y+Math.sin(ga)*lead,a:ga,fogHidden:true}}
   e._cloudReacq=(this.t||0)+reacq;
   return e._cloudGhost;
  }
  if(e._cloudReacq&&(this.t||0)<e._cloudReacq&&e._cloudGhost)return e._cloudGhost;
  e._cloudGhost=null;e._cloudReacq=0;
  if(conceal>=CLOUD_CONCEAL.partial){
   const j=(e._jit??=((this.rng?.()??Math.random())*6.283));
   return{...c,x:c.x+Math.cos(j+(this.t||0)*.9)*CLOUD_CONCEAL.aimWobble,y:c.y+Math.sin(j+(this.t||0)*.9)*CLOUD_CONCEAL.aimWobble};
  }
  return c;
 };
 const _te=P.tailEligible;
 if(_te)P.tailEligible=function(e){
  if(!_te.call(this,e))return false;
  if((e._cloudHide||0)>CLOUD_CONCEAL.enemyHide)return false;
  if(this.inDarkCloud&&Math.hypot(e.x-this.x,e.y-this.y)>CLOUD_CONCEAL.darkRange)return false;
  return true;
 };
 const _upd=P.update;
 P.update=function(dt,input){
  _upd.call(this,dt,input);
  if(this.state==='playing')this.tickCloudCover(Math.min(.04,Math.max(0,dt||0)));
 };
}

export function drawCloudCover(c,game,{point,scale=1,region}){
 const cw=c.canvas.width,ch=c.canvas.height;
 for(const cl of game.clouds||[]){
  const t=CLOUD_TYPES[cl.type];
  const [sx,sy]=point(cl.x,cl.y);
  const w=t.rx*2*scale,h=t.ry*2*scale;
  if(sx<-w||sx>cw+w||sy<-h||sy>ch+h)continue;
  const img=cloudImg(cl.type,cl.seed);
  if(!img||!img.naturalWidth)continue;
  c.save();
  c.translate(sx,sy);
  if(cl.mirror)c.scale(-1,1);
  c.rotate(Math.sin(cl.seed)*.14);
  c.globalAlpha=t.alpha*(region===6?.62:1);
  c.drawImage(img,-w/2,-h/2,w,h);
  c.restore();
 }
 // Alpine ridge telegraphs: soft shadow marks where a squadron is about to crest.
 for(const m of game._ridgeMarks||[]){
  const [mx,my]=point(m.x,m.y),k=1-m.t/m.max;
  c.save();c.translate(mx,my);
  c.globalAlpha=.5+.3*Math.sin(k*22);
  c.fillStyle='#1a1c18';
  c.beginPath();c.ellipse(0,0,(14+26*k)*scale,(9+13*k)*scale,0,0,Math.PI*2);c.fill();
  c.globalAlpha=.35;
  c.strokeStyle='#d8d2b8';c.lineWidth=1.5*scale;
  c.beginPath();c.ellipse(0,0,(22+34*k)*scale,(13+17*k)*scale,0,0,Math.PI*2);c.stroke();
  c.restore();
 }
}
