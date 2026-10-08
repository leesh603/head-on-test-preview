import {drawShipWater} from './naval-water.js?v=tame2';
import {ZUBIAN_LAYOUT,zubianSize} from './adriatic-boss-layout.js?v=tame2';
import {fx,fxReady} from './fx-art.js?v=tame2';
import {drawSinkingShip} from './ship-sinking.js?v=tame2';

// Source rectangles in the authored damage sheet; destinations are world units.
export const ZUBIAN_DAMAGE_FRAMES=Object.freeze({
 intact:[82,6,288,751],intactWreck:[82,763,288,753],
 front:[373,145,280,492],frontWreck:[372,893,280,492],
 rear:[641,312,286,446],rearWreck:[646,1073,288,443]
});
function atlasSprite(c,image,frame,x,y,width,height){if(!image?.naturalWidth)return false;c.drawImage(image,...frame,x-width/2,y-height/2,width,height);return true;}
export function drawNavalWake(c,b,width,height){const a=b.hullYaw??b.angle??0,ca=Math.cos(a),sa=Math.sin(a);drawShipWater(c,{...b,x:0,y:0,hullYaw:0,wakeTrail:(b.wakeTrail||[]).map(p=>({...p,x:(p.x-b.x)*ca+(p.y-b.y)*sa,y:-(p.x-b.x)*sa+(p.y-b.y)*ca}))},width,height);}
export function drawZubianShip(c,b,images){
 const role=b.assetKey.endsWith('front')?'front':b.assetKey.endsWith('rear')?'rear':null;
 const size=zubianSize({...b,role,t:{geometryScale:b.geometryScale}}),s=b.geometryScale||1;
 if(b.destroying)return drawSinkingShip(c,{key:b,x:b.x,y:b.y,yaw:b.hullYaw||0,width:size.width,height:size.height,age:b.destructionAge,duration:b.destructionDuration},k=>drawZubianShip(k,{...b,destroying:false,sunkWreck:true},images));
 c.save();c.translate(b.x,b.y);c.rotate(b.hullYaw||0);c.imageSmoothingEnabled=true;
 const wreck=b.sunkWreck?1:0;
 if(!wreck)drawNavalWake(c,b,size.width,size.height);
 const damage=images.damage,frame=key=>ZUBIAN_DAMAGE_FRAMES[key];
 if(role)atlasSprite(c,damage,frame(role+(wreck?'Wreck':'')),0,0,size.width,size.height);
 else if(b.phase==='splitting'){
   const gap=b.splitGap||0;
   atlasSprite(c,damage,frame('front'),0,(ZUBIAN_LAYOUT.frontY-gap/2)*s,size.width,ZUBIAN_LAYOUT.frontHeight*s);
   atlasSprite(c,damage,frame('rear'),0,(ZUBIAN_LAYOUT.rearY+gap/2)*s,size.width,ZUBIAN_LAYOUT.rearHeight*s);
   const alpha=Math.sin(Math.min(1,b.stateAge/1.2)*Math.PI);for(const y of [-1,1])fx(c,'waterColumn',y*size.width*.22,20*s,size.width*.65,size.width*.95,0,alpha*.65);fx(c,'splashShell',0,20*s,size.width*1.25,size.width*.65,0,alpha*.7);
 }else{
   const damaged=b.hp<b.maxHp*.75||b.parts?.some(p=>p.destroyed);
   if(wreck||damaged)atlasSprite(c,damage,frame(wreck?'intactWreck':'intact'),0,0,size.width,size.height);
   else atlasSprite(c,images.atlas,[180,8,370,1000],0,0,size.width,size.height);
   if(b.phase==='seam-warning'){c.save();c.globalAlpha*=.35+.45*Math.abs(Math.sin(b.stateAge*12));c.strokeStyle='#e7bc7e';c.lineWidth=2;c.setLineDash([7*s,5*s]);c.beginPath();c.moveTo(-size.width*.36,20*s);c.lineTo(size.width*.36,20*s);c.stroke();c.restore();}
 }
 if(b.phase!=='splitting')for(const p of b.parts||[]){
   const x=p.localX,y=p.localY;
   if(p.destroyed){const source=frame((role||'intact')+'Wreck'),rx=Math.max(12,p.radius||20),ry=rx;
     const u=(x+size.width/2)/size.width,v=(y+size.height/2)/size.height;
     if(damage?.naturalWidth)c.drawImage(damage,source[0]+(u-rx/size.width)*source[2],source[1]+(v-ry/size.height)*source[3],rx*2/size.width*source[2],ry*2/size.height*source[3],x-rx,y-ry,rx*2,ry*2);
     if(/Engine/.test(p.id)){fx(c,'fireEngine',x,y,rx*2,rx*2,0,.55*(1-wreck));fx(c,'smokeDark',x,y-rx,rx*3,rx*3,0,.35*(1-wreck));}
   }else if(!wreck&&p.hp<p.maxHp){c.fillStyle='#192824';c.fillRect(x-18,y+24,36,3);c.fillStyle='#dab981';c.fillRect(x-18,y+24,36*p.hp/p.maxHp,3);}
 }
 c.restore();
}
