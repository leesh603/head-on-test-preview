import {drawGroundEnemy,prepareGroundEnemyArt} from './ground-enemy-art.js?v=sink3';
import {spawnCityDefense,tickCityDefense} from './city-defense.js?v=sink3';
import {fxsHas,fxsDraw,fxsImage} from './fx-sample-preview.js?v=sink3';
// Region 4 searchlight network + ground fire net; region 5 wind streams.
// Buildings stay scenery: no collision structures. Guns fire only while player is ILLUMINATED.
export const CITY_BALANCE=Object.freeze({
 lightHp:130,lightR:40,pitHp:95,pitR:38,lockTime:1.2,lockDecay:1.6,illumTail:2.5,
 beamRange:520,beamHalf:.16,sweepRate:.5,fireGap:.9,patternTime:3.6,burstSpeed:250,
 windMax:3,windLen:760,windWidth:130,windLife:45,windPush:.18,windDrag:.10,windCone:.6
});
export function installCityAir(Game){
 const P=Game.prototype,B=CITY_BALANCE;
 P.spawnCityNet=function(){spawnCityDefense(this)};
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
  tickCityDefense(this,step);
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
 const visible=(x,y,pad)=>{if(game.mode==='coop2'){const z=game.camera?.zoom||1;x=(x-game.x)*z+cw/2;y=(y-game.y)*z+ch/2;pad*=z;}return x>=-pad&&x<=cw+pad&&y>=-pad&&y<=ch+pad;};
 for(const w of game.windStreams||[]){
  if(w.expired)continue;
  const fade=Math.min(1,w.life/8);
  c.save();c.globalAlpha=.16*fade;c.strokeStyle='#cfe0e8';c.lineWidth=2;
  const sx=Math.cos(w.dir),sy=Math.sin(w.dir),nx=-sy,ny=sx;
  for(let i=0;i<6;i++){
   const l=-B.windWidth+i*(B.windWidth*2/5);
   const ph=((performance.now()/38+i*130+w.seed*7)%w.len);
   const[x0,y0]=point(w.x+sx*ph+nx*l,w.y+sy*ph+ny*l);
   if(!visible(x0,y0,60))continue;
   c.beginPath();c.moveTo(x0,y0);c.lineTo(x0+sx*46,y0+sy*46);c.stroke();
  }
  c.restore();
 }
 for(const e of game.enemies||[]){
  if(!e.cityUnit||e.hp<=0)continue;
  const[x,y]=point(e.x,e.y),s=e.facSize;
  if(!visible(x,y,e.cityUnit==='light'?B.beamRange:s*2))continue;
  if(e.cityUnit==='light'){
   const beam=Math.min(1,(e.lockT||0)/B.lockTime);
   c.save();c.translate(x,y);c.rotate(e.scanA);
   if(fxsHas('searchlight'))fxsDraw(c,'searchlight',B.beamRange/2,0,B.beamRange,B.beamRange*Math.tan(B.beamHalf)*2.2,0,.8+.2*beam);
   else{const g=c.createLinearGradient(0,0,B.beamRange,0);
   g.addColorStop(0,`rgba(235,225,180,${.2+.16*beam})`);g.addColorStop(1,'rgba(235,225,180,0)');
   c.fillStyle=g;c.beginPath();c.moveTo(0,0);
   c.arc(0,0,B.beamRange,-B.beamHalf,B.beamHalf);c.closePath();c.fill();}
   c.restore();
  }
  if(e.cityShot){const [tx,ty]=point(e.cityShot.x,e.cityShot.y);c.save();c.strokeStyle='#eeb575';c.lineWidth=2;c.setLineDash([7,6]);c.beginPath();c.moveTo(x,y);c.lineTo(tx,ty);c.stroke();c.setLineDash([]);c.beginPath();c.arc(tx,ty,24,0,Math.PI*2);c.stroke();c.restore();}
  drawGroundEnemy(c,e,x,y,s);
  c.fillStyle='#24332b';c.fillRect(x-16,y+s*.5,32,3);c.fillStyle='#de9b73';c.fillRect(x-16,y+s*.5,32*e.hp/e.maxHp,3);
 }
};
const _cityImgs={};
function cityImg(k){let i=_cityImgs[k];if(!i){i=new Image();i.decoding='async';i.src=`./${k}.webp?v=485&b=345`;_cityImgs[k]=i}return i}

export function prepareCityAirAssets(){return Promise.all([prepareGroundEnemyArt(),Promise.all(['fx-city-searchlight-pit2','fx-city-aagun'].map(k=>new Promise(resolve=>{const im=cityImg(k);if(im.complete){resolve();return}im.addEventListener('load',()=>{(im.decode?im.decode():Promise.resolve()).catch(()=>{}).finally(()=>resolve())},{once:true});im.addEventListener('error',resolve,{once:true})}))) ]);}
