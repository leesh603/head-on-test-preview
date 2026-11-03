import {V1500_ART} from './v1500-layout.js';
import {V1500_POINTS,V1500_PROP_POINTS,v1500WorldPoint} from './handley-page-v1500.js';
import {fx} from './fx-art.js?v=tame3';
const clamp=n=>Math.max(0,Math.min(1,n));
/** Painted originals only. Propeller rotation is projected from its vertical plane. */
export function drawV1500Boss(c,e,point,scale,images){
 const damaged=e.hp<=e.maxHp*.55||e.phase==='destroyed',hull=images.get(V1500_ART.hull),art=images.get(V1500_ART.damaged);if(!hull)return false;
 const shrink=1-.12*clamp((e.crash?.age||0)/2.9);c.save();c.translate(point.x,point.y);c.rotate((e.a??-Math.PI/2)+Math.PI/2);c.scale(scale*shrink,scale*shrink);c.drawImage(hull,-887,-443.5,1774,887);
 const patch=(sx,sy,w,h)=>c.drawImage(art,sx,sy,w,h,sx-887,sy-443.5,w,h);
 if(damaged||e.parts?.wing_port?.hp<=e.parts?.wing_port?.maxHp*.55||e.damage?.wing_port==='destroyed')patch(0,190,710,310);
 if(damaged||e.parts?.wing_starboard?.hp<=e.parts?.wing_starboard?.maxHp*.55||e.damage?.wing_starboard==='destroyed')patch(1064,190,710,310);
 if(damaged)patch(835,430,105,450);
 // Reuse only the struck wing's painted pixels: no whole-airframe white flash.
 if(!e.v1500Shadow)for(const [id,sx] of [['wing_port',0],['wing_starboard',1064]]){
  const hit=e.flash?.[id]||0;if(hit<=0)continue;
  c.save();c.globalCompositeOperation='lighter';c.globalAlpha*=clamp(hit/.12)*.45;
  const image=e.parts?.[id]?.hp<=e.parts?.[id]?.maxHp*.55?art:hull;
  c.drawImage(image,sx,190,710,310,sx-887,190-443.5,710,310);c.restore();
 }
 for(const[id,p]of Object.entries(V1500_POINTS)){const part=e.parts?.[id],state=e.damage?.[id],hit=e.flash?.[id]||0;if(!id.startsWith('engine'))continue;
  const front=id.endsWith('front'),sx=p.x+887-60,sy=front?125:265;
  if(state==='destroyed'||state==='damaged'||part&&part.hp<=part.maxHp*.55)patch(sx,sy,120,front?140:160);
  if(hit>0&&!e.v1500Shadow){c.save();c.globalCompositeOperation='lighter';c.globalAlpha*=clamp(hit/.12)*.6;c.drawImage(hull,sx,sy,120,front?140:160,sx-887,sy-443.5,120,front?140:160);c.restore();}
 }
 for(const[id,p]of Object.entries(V1500_PROP_POINTS)){const rear=id.endsWith('rear'),im=images.get(rear?V1500_ART.rear:V1500_ART.front);if(!im)continue;const prop=(e.visualProps||e.props)?.[id],phase=prop?.phase??0;c.save();c.translate(p.x,p.y);c.scale(1,.14);c.rotate(phase);const size=rear?160:185;c.drawImage(im,-size/2,-size/2*im.height/im.width,size,size*im.height/im.width);c.restore();}
 const gun=images.get(V1500_ART.gun);for(const id of ['gun_nose','gun_dorsal','gun_tail']){if(e.parts?.[id]?.hp<=0||e.damage?.[id]==='destroyed')continue;const p=V1500_POINTS[id];c.save();c.translate(p.x,p.y);c.rotate(e.turretAngles?.[id]||0);c.translate(0,9*clamp((e.gunRecoil?.[id]||0)/.11));c.drawImage(gun,-10.5,-42,21,21*gun.height/gun.width);const hit=e.flash?.[id]||0;if(hit>0&&!e.v1500Shadow){c.globalCompositeOperation='lighter';c.globalAlpha*=clamp(hit/.12)*.65;c.drawImage(gun,-10.5,-42,21,21*gun.height/gun.width);}c.restore();}
 c.restore();
 if(!e.v1500Shadow)for(const[id,p]of Object.entries(V1500_POINTS)){const part=e.parts?.[id];if(!id.startsWith('engine')||!part||part.hp>part.maxHp*.55)continue;const w=v1500WorldPoint(e,p),ratio=scale/e.scale,x=point.x+(w.x-e.x)*ratio,y=point.y+(w.y-e.y)*ratio,size=part.hp<=0?25:17;fx(c,'profileEngine',x,y,size*ratio,size*1.4*ratio,e.a,.75);}
 return true;
}
/** Draw after hull. Release/impact remain authoritative world positions. No homing or trail. */
export function drawV1500Bombs(c,e,point,z,images){
 const im=images.get(V1500_ART.bomb);if(!im)return;
 for(const b of e.releasedBombs||[]){const q=clamp((b.age+(e.visualV1500Age||0))/b.life),dx=b.targetX-b.releaseX,dy=b.targetY-b.releaseY,a=dx*dx+dy*dy>1?Math.atan2(dy,dx):b.angle,off=Math.sin(q*Math.PI)*16;const x=b.releaseX+dx*q-Math.cos(b.angle)*off,y=b.releaseY+dy*q-Math.sin(b.angle)*off,p=point(x,y),shadow=point(x+8,y+12);const length=(43-10*q*q)*z,h=length*im.height/im.width;
  c.save();c.globalAlpha*=.24;c.filter='brightness(0)';c.translate(shadow.x,shadow.y);c.rotate(a);c.drawImage(im,-length/2,-h/2,length,h);c.restore();
  c.save();c.translate(p.x,p.y);c.rotate(a);c.drawImage(im,-length/2,-h/2,length,h);c.restore();
 }
}
