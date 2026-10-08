import {TRENCH_ARMOR_LAYOUT} from './trench-armor-layout.js?v=lc1';
import {fx} from './fx-art.js?v=lc1';
export const TREAD_ATLAS={columns:4,cellWidth:128,cellHeight:256,sourceX:32,sourceY:8,sourceWidth:64,sourceHeight:240,pitch:4.5};
export function treadFrame(roll=0){return ((Math.floor(roll/TREAD_ATLAS.pitch)%4)+4)%4;}
export function drawArmorGround(c,b,wire,crossing){
 for(const p of b.trackMarks||[]){c.save();c.translate(p.x-b.x,p.y-b.y);c.rotate(p.yaw);c.globalAlpha*=Math.max(0,1-p.age/9)*.24;c.fillStyle='#29241a';c.fillRect(-p.width/2,-p.length/2,p.width,p.length);c.fillStyle='#6d5740';c.fillRect(-p.width/2,-p.length/2,p.width,2);c.restore();}
 const art=b.assetKey==='mark-v-cruiser'?crossing:wire,mark=b.assetKey==='mark-v-cruiser';
 if(b.entryAge<3.3&&art?.naturalWidth){const row=b.entryAge>1?1:0,hh=art.naturalHeight/2,s=b.geometryScale||1;c.save();c.translate((b.anchorX??b.x)-b.x,(b.anchorY??b.y)+22*s-b.y);c.globalAlpha*=Math.min(1,(3.3-b.entryAge)*2);c.drawImage(art,0,row*hh,art.naturalWidth,hh,-155*s,-(mark?46:30)*s,310*s,(mark?92:60)*s);c.restore();}
}
export function drawArmorTreads(c,b,atlas){
 if(b.destroying||!atlas?.naturalWidth)return;const layout=TRENCH_ARMOR_LAYOUT[b.assetKey],parts=b.parts||[],mark=b.assetKey==='mark-v-cruiser';
 for(const [side,tread]of [[-1,b.leftTrack],[1,b.rightTrack]]){
  if(parts.find(p=>p.id===(side<0?'track-left':'track-right'))?.destroyed)continue;
  const frame=treadFrame(tread?.roll||0),a=TREAD_ATLAS,x=side*layout.trackX,w=layout.trackWidth,h=layout.trackHalfLength*2;
  c.save();if(!mark){c.beginPath();c.rect(x-w/2,-layout.trackHalfLength,w,54);c.rect(x-w/2,36,w,layout.trackHalfLength-36);c.clip();}
  c.drawImage(atlas,frame*a.cellWidth+a.sourceX,(mark?1:0)*a.cellHeight+a.sourceY,a.sourceWidth,a.sourceHeight,x-w/2,-h/2,w,h);c.restore();
  const speed=tread?.speed||0;if(Math.abs(speed)>2)fx(c,'dustPuff',x,speed>0?h*.46:-h*.46,46,34,0,Math.min(.32,Math.abs(speed)/170));
 }
}
export function drawArmorDamageFX(c,b){
 const engine=(b.parts||[]).find(p=>p.id==='engine-deck');if(engine?.destroyed&&!b.destroying){const s=b.geometryScale||1;fx(c,'fireEngine',engine.localX/s,engine.localY/s,44,56,0,.65);fx(c,'engineSmoke',engine.localX/s,engine.localY/s-24,52,78,0,.52);}
 if(b.entryAge<2.2)for(const side of [-1,1])fx(c,'dirtMix',side*65,88,62,48,0,.35);
}
