import {TRENCH_ARMOR_LAYOUT} from './trench-armor-layout.js?v=sfx2';
import {fx} from './fx-art.js?v=sfx2';
// Sample the actual hull's steel plates, not a separately scaled generic belt.
// Coordinates are in the authored 640px hull. Rails and track ends stay fixed.
export const TREAD_PROFILES=Object.freeze({
 'a7v-flak':{pitch:27,sourceY:126,halfWidth:12,
  left:[[98,195],[218,195],[408,195],[542,195]],
  right:[[98,455],[218,455],[408,455],[542,455]],segments:[[98,218],[408,542]]},
 'mark-v-cruiser':{pitch:34,sourceY:278,halfWidth:16,
  left:[[12,245],[64,230],[154,217],[280,213],[382,214],[494,217],[570,229],[618,245]],
  right:[[12,405],[64,421],[154,433],[280,437],[382,437],[494,433],[570,421],[618,405]],segments:[[12,618]]}
});
export const TREAD_FRAMES=16;
export function treadFrame(roll=0,kind='a7v-flak'){
 const pitch=TREAD_PROFILES[kind].pitch*.4;
 return ((Math.floor(roll/pitch*TREAD_FRAMES)%TREAD_FRAMES)+TREAD_FRAMES)%TREAD_FRAMES;
}
const treadCache=new WeakMap();
function trackCenter(points,y){
 for(let i=1;i<points.length;i++)if(y<=points[i][0]){
  const [ay,ax]=points[i-1],[by,bx]=points[i];return ax+(bx-ax)*(y-ay)/(by-ay);
 }
 return points[points.length-1][1];
}
// Build once at native art resolution; live rendering is two cached blits.
export function prepareArmorTreads(hull,kind,makeCanvas=()=>typeof OffscreenCanvas==='function'?new OffscreenCanvas(1,1):document.createElement('canvas')){
 if(!hull?.naturalWidth)return null;
 let cached=treadCache.get(hull);if(cached)return cached;
 const profile=TREAD_PROFILES[kind];cached={};
 for(const side of ['left','right']){
  const points=profile[side],width=profile.halfWidth*2;
  const minX=Math.floor(Math.min(...points.map(p=>p[1]))-profile.halfWidth),maxX=Math.ceil(Math.max(...points.map(p=>p[1]))+profile.halfWidth),stripWidth=maxX-minX;
  const native=makeCanvas();native.width=stripWidth*TREAD_FRAMES;native.height=640;
  const ctx=native.getContext('2d');
  const sourceX=trackCenter(points,profile.sourceY)-profile.halfWidth;
  for(let frame=0;frame<TREAD_FRAMES;frame++)for(const [start,end]of profile.segments)for(let y=start;y<end;y++){
   const phase=(y-start+frame*profile.pitch/TREAD_FRAMES)%profile.pitch;
   // Only the plate faces move. The original edge rails, hull and end caps
   // are never covered; the Mark V ribbon follows its curved footprint.
   ctx.drawImage(hull,sourceX,profile.sourceY+phase,width,1,
    frame*stripWidth+trackCenter(points,y)-profile.halfWidth-minX,y,width,1);
  }
  const frameWidth=Math.ceil(stripWidth*.4),atlas=makeCanvas();atlas.width=frameWidth*TREAD_FRAMES;atlas.height=256;
  const target=atlas.getContext('2d');
  for(let frame=0;frame<TREAD_FRAMES;frame++)target.drawImage(native,frame*stripWidth,0,stripWidth,640,frame*frameWidth,0,frameWidth,256);
  // Retain only narrow ribbons (~1.2 MiB for both bosses), not full-hull atlases.
  cached[side]={image:atlas,x:minX*.4-128,width:stripWidth*.4,frameWidth};
 }
 treadCache.set(hull,cached);return cached;
}
export function drawArmorGround(c,b,wire,crossing){
 for(const p of b.trackMarks||[]){c.save();c.translate(p.x-b.x,p.y-b.y);c.rotate(p.yaw);c.globalAlpha*=Math.max(0,1-p.age/9)*.24;c.fillStyle='#29241a';c.fillRect(-p.width/2,-p.length/2,p.width,p.length);c.fillStyle='#6d5740';c.fillRect(-p.width/2,-p.length/2,p.width,2);c.restore();}
 const art=b.assetKey==='mark-v-cruiser'?crossing:wire,mark=b.assetKey==='mark-v-cruiser';
 if(b.entryAge<3.3&&art?.naturalWidth){const row=b.entryAge>1?1:0,hh=art.naturalHeight/2,s=b.geometryScale||1;c.save();c.translate((b.anchorX??b.x)-b.x,(b.anchorY??b.y)+22*s-b.y);c.globalAlpha*=Math.min(1,(3.3-b.entryAge)*2);c.drawImage(art,0,row*hh,art.naturalWidth,hh,-155*s,-(mark?46:30)*s,310*s,(mark?92:60)*s);c.restore();}
}
export function drawArmorTreads(c,b,hull){
 if(b.destroying||!hull?.naturalWidth)return;const layout=TRENCH_ARMOR_LAYOUT[b.assetKey],parts=b.parts||[],atlas=prepareArmorTreads(hull,b.assetKey);
 for(let i=0;i<2;i++){
  const side=i?'right':'left',tread=i?b.rightTrack:b.leftTrack;
  if(parts.find(p=>p.id==='track-'+side)?.destroyed)continue;
  const frame=treadFrame(tread?.roll||0,b.assetKey);
  const ribbon=atlas[side];
  c.drawImage(ribbon.image,frame*ribbon.frameWidth,0,ribbon.frameWidth,256,ribbon.x,-128,ribbon.width,256);
  const speed=tread?.speed||0,h=layout.trackHalfLength*2,x=(i?1:-1)*layout.trackX;
  if(Math.abs(speed)>2)fx(c,'dustPuff',x,speed>0?h*.46:-h*.46,46,34,0,Math.min(.32,Math.abs(speed)/170));
 }
}
export function drawArmorDamageFX(c,b){
 const engine=(b.parts||[]).find(p=>p.id==='engine-deck');if(engine?.destroyed&&!b.destroying){const s=b.geometryScale||1;fx(c,'fireEngine',engine.localX/s,engine.localY/s,44,56,0,.65);fx(c,'engineSmoke',engine.localX/s,engine.localY/s-24,52,78,0,.52);}
 if(b.entryAge<2.2)for(const side of [-1,1])fx(c,'dirtMix',side*65,88,62,48,0,.35);
}
