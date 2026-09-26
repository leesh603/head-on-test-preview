// Region 4 searchlight network + ground fire net; region 5 wind streams.
// Buildings stay scenery: no collision structures. Guns fire only while player is ILLUMINATED.
export const CITY_BALANCE=Object.freeze({
 lightHp:130,lightR:40,pitHp:95,pitR:38,lockTime:1.2,lockDecay:1.6,illumTail:2.5,
 beamRange:520,beamHalf:.16,sweepRate:.5,fireGap:.9,patternTime:3.6,burstSpeed:250,
 windMax:3,windLen:760,windWidth:130,windLife:45,windPush:.18,windDrag:.10,windCone:.6
});
export function installCityAir(Game){
 const P=Game.prototype,B=CITY_BALANCE;
 P.spawnCityNet=function(){
  if(this.worldRegion()!==4||this._citySpawned)return;
  this._citySpawned=true;
  const a=this.a,hx=Math.cos(a),hy=Math.sin(a),nx=-hy,ny=hx;
  const ahead=520+this.rng()*180,lateral=(this.rng()-.5)*380;
  const bx=this.x+hx*ahead+nx*lateral,by=this.y+hy*ahead+ny*lateral;
  const defs=[
   {kind:'light',name:'탐조등 진지',hp:B.lightHp,r:B.lightR,sprite:'fx-city-searchlight',size:86,at:[-150,-60]},
   {kind:'light',name:'탐조등 진지',hp:B.lightHp,r:B.lightR,sprite:'fx-city-searchlight',size:86,at:[150,40]},
   {kind:'pit',name:'대공기관총 진지',hp:B.pitHp,r:B.pitR,sprite:'fx-city-aagun',size:80,at:[-60,140]},
   {kind:'pit',name:'쌍기관총 진지',hp:B.pitHp,r:B.pitR,sprite:'fx-city-twinmg',size:72,at:[60,-150]},
   {kind:'pit',name:'대공기관총 진지',hp:B.pitHp,r:B.pitR,sprite:'fx-city-aagun',size:80,at:[230,150]}
  ];
  for(const d of defs){
   const e=this.spawnEnemy('bomber');if(!e)break;
   Object.assign(e,{type:'installation',cityUnit:d.kind,facSprite:d.sprite,facSize:d.size,name:d.name,x:bx+nx*d.at[0]+hx*d.at[1],y:by+ny*d.at[0]+hy*d.at[1],a:0,speed:0,stationary:true,surface:true,hitRadius:d.r,hp:d.hp,maxHp:d.hp,fire:2+this.rng(),ace:false,escortPlane:undefined,hazardRegion:4,xpValue:10,scanA:hx?a:this.rng()*6.28,lockT:0,fireT:0});
  }
  this.event('flak','도심 방공망 — 탐조등에 잡히면 집중 화망이 올라옵니다');
 };
 P.inWind=function(x,y){
  if(!this.windStreams)return null;
  for(const w of this.windStreams){
   if(w.expired)continue;
   const sx=Math.cos(w.dir),sy=Math.sin(w.dir),nx=-sy,ny=sx;
   const along=sx*(x-w.x)+sy*(y-w.y),lat=nx*(x-w.x)+ny*(y-w.y);
   if(along>0&&along<w.len&&Math.abs(lat)<B.windWidth)return w;
  }
  return null;
 };
 const _caFire=Game.prototype.fireEnemy;
 Game.prototype.fireEnemy=function(e){
  if(e.cityUnit){e.fire=e.cityUnit==='pit'?B.fireGap*1.4:3;return}
  return _caFire.call(this,e);
 };
 const _caUpdate=Game.prototype.update;
 Game.prototype.update=function(dt,input={}){
  _caUpdate.call(this,dt,input);
  if(this.state!=='playing')return;
  const step=Math.min(.04,Math.max(0,dt)),region=this.worldRegion();
  if(region===4){
   if(!this._citySpawned)this.spawnCityNet();
   let lit=false,lightsAlive=0;
   const concealed=(this.cloudConceal||0)>=.9;
   for(const e of this.enemies){
    if(!e.cityUnit)continue;
    if(Math.hypot(e.x-this.x,e.y-this.y)>2400){e.expired=true;continue}
    if(e.hp<=0)continue;
    if(e.cityUnit==='light'){
     lightsAlive++;
     const toP=Math.atan2(this.y-e.y,this.x-e.x),d=Math.hypot(this.x-e.x,this.y-e.y);
     const base=toP+Math.sin(this.t*.4+e.x*.01)*.9;
     e.scanA+=((base-e.scanA+Math.PI*3)%(Math.PI*2)-Math.PI)*Math.min(1,B.sweepRate*step*2);
     const off=Math.abs(((toP-e.scanA+Math.PI*3)%(Math.PI*2))-Math.PI);
     const inBeam=off<B.beamHalf&&d<B.beamRange&&!concealed;
     e.lockT=Math.max(0,(e.lockT||0)+(inBeam?step:-step*B.lockDecay));
     if(e.lockT>=B.lockTime){this.illuminatedUntil=(this.t||0)+B.illumTail;e.lockT=B.lockTime*.6}
     lit=lit||inBeam;
    }
   }
   const illuminated=(this.illuminatedUntil||0)>(this.t||0);
   if(illuminated){
    for(const e of this.enemies){
     if(e.cityUnit!=='pit'||e.hp<=0)continue;
     e.fireT=(e.fireT||0)-step;
     if(e.fireT<=0){
      e.fireT=B.fireGap;e._pat=(e._pat||0)+1;
      const d=Math.hypot(this.x-e.x,this.y-e.y);if(d>900)continue;
      const lead=d/B.burstSpeed;
      const tx=this.x+Math.cos(this.a||0)*(this.speed||0)*lead,ty=this.y+Math.sin(this.a||0)*(this.speed||0)*lead;
      const aim=Math.atan2(ty-e.y,tx-e.x);
      const n=e._pat%3===0?5:3;
      for(let i=0;i<n;i++){const h=aim+(i-(n-1)/2)*(e._pat%3===0?.16:.09);this.bullets.push({x:e.x,y:e.y,vx:Math.cos(h)*B.burstSpeed,vy:Math.sin(h)*B.burstSpeed,life:3.8,enemy:true,fireZone:true,hazardRegion:4,damage:Math.round(9*(1+this.t/300))})}
      this.burst(e.x,e.y,'#ffd9a0',4);e.muzzleFlash=.14;
     }
    }
   }
   this._litBeam=lit;
  }else{this._citySpawned=false;this.illuminatedUntil=0}
  if(region===5){
   this.windStreams=this.windStreams||[];
   this._windT=(this._windT||5)-step;
   for(const w of this.windStreams){w.life-=step;w.x+=Math.cos(w.dir)*22*step;w.y+=Math.sin(w.dir)*22*step;w.expired=w.life<=0}
   if(this.windStreams.filter(w=>!w.expired).length<B.windMax&&this._windT<=0){
    this._windT=16+this.rng()*10;
    const dir=this.a+(this.rng()-.5)*.6;
    this.windStreams.push({x:this.x+Math.cos(this.a)*(300+this.rng()*400)-Math.cos(dir)*B.windLen*.5,y:this.y+Math.sin(this.a)*(300+this.rng()*400)-Math.sin(dir)*B.windLen*.5,dir,len:B.windLen*(0.8+this.rng()*.4),life:B.windLife,expired:false,seed:this.rng()*100});
   }
   const w=this.inWind(this.x,this.y);
   this.windRiding=null;
   if(w){
    const align=Math.cos(w.dir-this.a);
    if(align>Math.cos(B.windCone)){const push=(this.speed||120)*B.windPush*step;this.x+=Math.cos(w.dir)*push;this.y+=Math.sin(w.dir)*push;this.windRiding='tail'}
    else if(align<-Math.cos(B.windCone)){const push=(this.speed||120)*B.windDrag*step;this.x+=Math.cos(w.dir)*push;this.y+=Math.sin(w.dir)*push;this.windRiding='head'}
    else this.windRiding='cross';
   }
   for(const e of this.enemies){
    if(e.hp<=0||e.surface||e.stationary)continue;
    const ew=this.inWind(e.x,e.y);
    if(ew&&Math.cos(ew.dir-e.a)>Math.cos(B.windCone)){e.x+=Math.cos(ew.dir)*(e.speed||100)*B.windPush*step;e.y+=Math.sin(ew.dir)*(e.speed||100)*B.windPush*step}
   }
  }else this.windStreams=[];
 };
};
export function drawCityAirLayer(c,game,{point}){
 const cw=c.canvas.width,ch=c.canvas.height,B=CITY_BALANCE;
 for(const w of game.windStreams||[]){
  if(w.expired)continue;
  const fade=Math.min(1,w.life/8);
  c.save();c.globalAlpha=.16*fade;c.strokeStyle='#cfe0e8';c.lineWidth=2;
  const sx=Math.cos(w.dir),sy=Math.sin(w.dir),nx=-sy,ny=sx;
  for(let i=0;i<6;i++){
   const l=-B.windWidth+i*(B.windWidth*2/5);
   const ph=((performance.now()/38+i*130+w.seed*7)%w.len);
   const[x0,y0]=point(w.x+sx*ph+nx*l,w.y+sy*ph+ny*l);
   if(x0<-60||x0>cw+60||y0<-60||y0>ch+60)continue;
   c.beginPath();c.moveTo(x0,y0);c.lineTo(x0+sx*46,y0+sy*46);c.stroke();
  }
  c.restore();
 }
 for(const e of game.enemies||[]){
  if(!e.cityUnit||e.hp<=0)continue;
  const[x,y]=point(e.x,e.y),s=e.facSize;
  if(x<-s*2||x>cw+s*2||y<-s*2||y>ch+s*2)continue;
  if(e.cityUnit==='light'){
   const beam=Math.min(1,(e.lockT||0)/B.lockTime);
   c.save();c.translate(x,y);c.rotate(e.scanA);
   const g=c.createLinearGradient(0,0,B.beamRange,0);
   g.addColorStop(0,`rgba(235,225,180,${.2+.16*beam})`);g.addColorStop(1,'rgba(235,225,180,0)');
   c.fillStyle=g;c.beginPath();c.moveTo(0,0);
   c.arc(0,0,B.beamRange,-B.beamHalf,B.beamHalf);c.closePath();c.fill();
   c.restore();
  }
  const img=cityImg(e.facSprite);
  if(img&&img.naturalWidth){c.save();c.translate(x,y);c.drawImage(img,-s/2,-s/2,s,s);c.restore()}
  c.fillStyle='#24332b';c.fillRect(x-16,y+s*.5,32,3);c.fillStyle='#de9b73';c.fillRect(x-16,y+s*.5,32*e.hp/e.maxHp,3);
 }
};
const _cityImgs={};
function cityImg(k){let i=_cityImgs[k];if(!i){i=new Image();i.src=`./${k}.webp?v=339&b=326`;i.onload=()=>{i.naturalWidth=i.naturalWidth||i.width};_cityImgs[k]=i}return i}
