import {ZUBIAN_LAYOUT,zubianSize} from './adriatic-boss-layout.js?v=469';
import {fx,fxReady} from './fx-art.js?v=469';

// Source rectangles in the authored damage sheet; destinations are world units.
export const ZUBIAN_DAMAGE_FRAMES=Object.freeze({
 intact:[82,6,288,751],intactWreck:[82,763,288,753],
 front:[373,145,280,492],frontWreck:[372,893,280,492],
 rear:[641,312,286,446],rearWreck:[646,1073,288,443]
});
function atlasSprite(c,image,frame,x,y,width,height){if(!image?.naturalWidth)return false;c.drawImage(image,...frame,x-width/2,y-height/2,width,height);return true;}
export function drawNavalWake(c,b,width,height){
 if(!fxReady('foamRing')||b.destroying||!(b.driveVelocity>1))return;
 const age=b.motionTime||b.time||0;c.save();c.globalAlpha*=Math.min(.5,b.driveVelocity/50);
 for(let i=0;i<4;i++){const t=(age*.45+i*.25)%1;fx(c,'foamRing',0,height*.4+t*height*.2,width*(.45+t*.75),width*(.13+t*.23),0,(1-t)*.48);}
 c.restore();
}
export function drawZubianShip(c,b,images){
 const role=b.assetKey.endsWith('front')?'front':b.assetKey.endsWith('rear')?'rear':null;
 const size=zubianSize({...b,role,t:{geometryScale:b.geometryScale}}),s=b.geometryScale||1;
 c.save();c.translate(b.x,b.y);c.rotate(b.hullYaw||0);c.imageSmoothingEnabled=true;
 const wreck=b.destroying?Math.min(1,b.destructionAge/Math.max(.1,b.destructionDuration)):0;
 if(wreck){c.translate(0,wreck*size.height*.25);c.rotate((role==='rear'?-1:1)*wreck*.2);c.globalAlpha*=Math.max(0,1-wreck*.95);}
 drawNavalWake(c,b,size.width,size.height);
 const damage=images.damage,frame=key=>ZUBIAN_DAMAGE_FRAMES[key];
 if(role)atlasSprite(c,damage,frame(role+(wreck?'Wreck':'')),0,0,size.width,size.height);
 else if(b.phase==='splitting'){
   const gap=b.splitGap||0;
   atlasSprite(c,damage,frame('front'),0,(ZUBIAN_LAYOUT.frontY-gap/2)*s,size.width,ZUBIAN_LAYOUT.frontHeight*s);
   atlasSprite(c,damage,frame('rear'),0,(ZUBIAN_LAYOUT.rearY+gap/2)*s,size.width,ZUBIAN_LAYOUT.rearHeight*s);
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
   }else if(p.hp<p.maxHp){c.fillStyle='#192824';c.fillRect(x-18,y+24,36,3);c.fillStyle='#dab981';c.fillRect(x-18,y+24,36*p.hp/p.maxHp,3);}
 }
 c.restore();
}
