import {JUTLAND_RECTS} from './jutland-atlas.js?v=headon-result339-20261028';

// Visual metadata only. The original warning, projectile and collision
// coordinates remain owned by the naval combat controllers.
export function recordAdriaticGunCue(body,event){
 if(!body)return;
 const ship=body.support129;
 if(ship){
  if(event.type==='part-destroyed'&&event.partId?.startsWith('gun')){
   const p=ship.parts.get(event.partId);if(p)p.navalWreckAngle=(p.aimAngle??(ship.angle+(p.nx<0?Math.PI:0)))-ship.angle;
  }else if(event.type==='charge-warning'&&event.partId?.startsWith('gun')){
   const p=ship.parts.get(event.partId);if(p?.hp>0)p.aimAngle=Math.atan2(event.targetY-event.y,event.targetX-event.x);
  }else if(event.type==='aa-volley'){
   ship.effects.visit(f=>{if(f.kind!=='muzzle'||f.age>0)return;
    for(const p of ship.parts.values())if(p.id.startsWith('gun')&&p.hp>0){const x=p.nx*ship.width,y=p.ny*ship.height,c=Math.cos(ship.angle),s=Math.sin(ship.angle);
     if(Math.hypot(ship.x+x*c-y*s-f.x,ship.y+x*s+y*c-f.y)<1){p.aimAngle=f.angle;p.navalShotAt=ship.time;}}
   });
  }return;
 }
 if(!body.kind?.startsWith('hms-zubian'))return;
 const p=body.parts.get(event.partId||(event.type==='mortar-launch'?(body.role==='rear'?'rearGun':'frontGun'):''));
 if(p?.id.endsWith('Gun')&&event.type==='part-destroyed')p.navalWreckAngle=(p.aimAngle??((body.hullYaw||0)-Math.PI/2))-(body.hullYaw||0);
 if(!p||p.destroyed||!p.id.endsWith('Gun'))return;
 if(event.type==='charge-warning'&&Number.isFinite(event.targetX+event.targetY))p.aimAngle=Math.atan2(event.targetY-event.y,event.targetX-event.x);
 if(event.type==='muzzle'||event.type==='mortar-launch')p.navalShotAt=body.motionTime||0;
}

// Reuse the existing single-barrel turret's three separately painted states.
// Its pivot is the mount center; all dimensions are in the caller's hull space.
export function drawAdriaticGun(c,atlas,p,x,y,width,angle,time){
 if(!atlas?.naturalWidth)return false;
 const destroyed=p.destroyed??p.hp<=0,state=destroyed?2:p.hp<p.maxHp*.55?1:0;
 const rect=JUTLAND_RECTS.parts[3+state],height=width*rect[3]/rect[2];
 const age=Number.isFinite(p.navalShotAt)?Math.max(0,time-p.navalShotAt):Infinity;
 const recoil=destroyed?0:Math.max(0,1-age/.22)*width*.12;
 c.save();c.translate(x,y);c.rotate((destroyed?(p.navalWreckAngle??angle):angle)+Math.PI/2);c.translate(0,recoil);
 c.drawImage(atlas,...rect,-width/2,-height*.68,width,height);c.restore();return true;
}
