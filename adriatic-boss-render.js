import {drawAdriaticGun} from './adriatic-gun-art.js?v=headon-quality-20261023-7d8a4756';
import {drawShipWater} from './naval-water.js?v=headon-quality-20261023-7d8a4756';
import {ZUBIAN_LAYOUT,zubianSize} from './adriatic-boss-layout.js?v=headon-quality-20261023-7d8a4756';
import {fx,fxReady} from './fx-art.js?v=headon-quality-20261023-7d8a4756';
import {drawSinkingShip} from './ship-sinking.js?v=headon-quality-20261023-7d8a4756';

// Source rectangles in the authored damage sheet; destinations are world units.
export const ZUBIAN_DAMAGE_FRAMES=Object.freeze({
 intact:[82,6,288,751],intactWreck:[82,763,288,753],
 front:[373,145,280,492],frontWreck:[372,893,280,492],
 rear:[641,312,286,446],rearWreck:[646,1073,288,443]
});
function atlasSprite(c,image,frame,x,y,width,height){if(!image?.naturalWidth)return false;c.drawImage(image,...frame,x-width/2,y-height/2,width,height);return true;}
export function drawNavalWake(c,b,width,height){const a=b.hullYaw??b.angle??0,ca=Math.cos(a),sa=Math.sin(a);drawShipWater(c,{...b,x:0,y:0,hullYaw:0,wakeTrail:(b.wakeTrail||[]).map(p=>({...p,x:(p.x-b.x)*ca+(p.y-b.y)*sa,y:-(p.x-b.x)*sa+(p.y-b.y)*ca}))},width,height);}
export function drawZubianShip(c,b,images,detail){
 const role=b.assetKey.endsWith('front')?'front':b.assetKey.endsWith('rear')?'rear':null;
 const size=zubianSize({...b,role,t:{geometryScale:b.geometryScale}}),s=b.geometryScale||1;
 if(b.destroying)return drawSinkingShip(c,{key:b,x:b.x,y:b.y,yaw:b.hullYaw||0,width:size.width,height:size.height,age:b.destructionAge,duration:b.destructionDuration},k=>drawZubianShip(k,{...b,destroying:false,sunkWreck:true},images,detail));
 c.save();c.translate(b.x,b.y);c.rotate(b.hullYaw||0);c.imageSmoothingEnabled=true;
 const wreck=b.sunkWreck?1:0;
 if(!wreck)drawNavalWake(c,b,size.width,size.height);
 const damage=images.damage,frame=key=>ZUBIAN_DAMAGE_FRAMES[key];
 const layered=!wreck&&detail?.zubian?.naturalWidth&&detail?.guns?.naturalWidth;
 const cut=ZUBIAN_LAYOUT.frontHeight/ZUBIAN_LAYOUT.height;
 const cleanHalf=(half,y)=>{
  const front=half==='front',height=(front?ZUBIAN_LAYOUT.frontHeight:ZUBIAN_LAYOUT.rearHeight)*s,source=frame(half);
  // Keep the painted torn cut edge, while the continuous base keeps deck and
  // component positions identical on both sides of the body replacement.
  const edge=14*s;
  c.save();c.beginPath();c.rect(-size.width/2,front?y+height/2-edge:y-height/2,size.width,edge);c.clip();atlasSprite(c,damage,source,0,y,size.width,height);c.restore();
  const sy=front?0:detail.zubian.naturalHeight*cut,sh=detail.zubian.naturalHeight*(front?cut:1-cut);
  const top=y-height/2+(front?0:edge),h=height-edge;
  c.drawImage(detail.zubian,0,sy+(front?0:sh*edge/height),detail.zubian.naturalWidth,sh*h/height,-size.width/2,top,size.width,h);
 };
 if(role){if(layered)cleanHalf(role,0);else atlasSprite(c,damage,frame(role+(wreck?'Wreck':'')),0,0,size.width,size.height);}
 else if(b.phase==='splitting'){
   const gap=b.splitGap||0;
   if(layered){cleanHalf('front',(ZUBIAN_LAYOUT.frontY-gap/2)*s);cleanHalf('rear',(ZUBIAN_LAYOUT.rearY+gap/2)*s);}
   else{atlasSprite(c,damage,frame('front'),0,(ZUBIAN_LAYOUT.frontY-gap/2)*s,size.width,ZUBIAN_LAYOUT.frontHeight*s);
   atlasSprite(c,damage,frame('rear'),0,(ZUBIAN_LAYOUT.rearY+gap/2)*s,size.width,ZUBIAN_LAYOUT.rearHeight*s);}
   const alpha=Math.sin(Math.min(1,b.stateAge/1.2)*Math.PI);for(const y of [-1,1])fx(c,'waterColumn',y*size.width*.22,20*s,size.width*.65,size.width*.95,0,alpha*.65);fx(c,'splashShell',0,20*s,size.width*1.25,size.width*.65,0,alpha*.7);
 }else{
   const damaged=b.hp<b.maxHp*.75||b.parts?.some(p=>p.destroyed);
   if(layered)c.drawImage(detail.zubian,-size.width/2,-size.height/2,size.width,size.height);
   else if(wreck||damaged)atlasSprite(c,damage,frame(wreck?'intactWreck':'intact'),0,0,size.width,size.height);
   else atlasSprite(c,images.atlas,[180,8,370,1000],0,0,size.width,size.height);
   if(b.phase==='seam-warning'){c.save();c.globalAlpha*=.35+.45*Math.abs(Math.sin(b.stateAge*12));c.strokeStyle='#e7bc7e';c.lineWidth=2;c.setLineDash([7*s,5*s]);c.beginPath();c.moveTo(-size.width*.36,20*s);c.lineTo(size.width*.36,20*s);c.stroke();c.restore();}
 }
 if(b.phase!=='splitting')for(const p of b.parts||[]){
   const x=p.localX,y=p.localY;
   if(p.destroyed&&!(layered&&p.id.endsWith('Gun'))){const source=frame((role||'intact')+'Wreck'),rx=Math.max(12,p.radius||20),ry=rx;
     const u=(x+size.width/2)/size.width,v=(y+size.height/2)/size.height;
     c.save();c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.clip();
     if(damage?.naturalWidth)c.drawImage(damage,source[0]+(u-rx/size.width)*source[2],source[1]+(v-ry/size.height)*source[3],rx*2/size.width*source[2],ry*2/size.height*source[3],x-rx,y-ry,rx*2,ry*2);c.restore();
     if(/Engine/.test(p.id)){fx(c,'fireEngine',x,y,rx*2,rx*2,0,.55*(1-wreck));fx(c,'smokeDark',x,y-rx,rx*3,rx*3,0,.35*(1-wreck));}
   }else if(!wreck&&p.hp<p.maxHp){c.fillStyle='#192824';c.fillRect(x-18,y+24,36,3);c.fillStyle='#dab981';c.fillRect(x-18,y+24,36*p.hp/p.maxHp,3);}
 }
 if(layered)for(const p of b.parts||[])if(p.id.endsWith('Gun')){
  const offset=b.phase==='splitting'?(p.localY<20*s?-1:1)*(b.splitGap||0)*s/2:0;
  drawAdriaticGun(c,detail.guns,p,p.localX,p.localY+offset,(p.radius||19*s)*1.45,(p.aimAngle??((b.hullYaw||0)-Math.PI/2))-(b.hullYaw||0),b.motionTime||0);
 }
 c.restore();
}
