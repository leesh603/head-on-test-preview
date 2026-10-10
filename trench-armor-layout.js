// All coordinates use the existing 640 px hull art, drawn on a square 256 px
// canvas. Simulation, mounts, barrel pivots and rendering share this scale.
export const TRENCH_ARMOR_SIZE=256;
export const TRENCH_ARMOR_LAYOUT=Object.freeze({
 'a7v-flak':{
  gunSize:72,gunArc:.28,gunTurnSpeed:.75,gunRecoil:1.6,gunIds:['front','left','rear','right'],
  gunArt:{originX:138,originY:160,pivotX:182,pivotY:155,tipX:300,tipY:155,barrel:[188,127,132,60]},
  guns:[{id:'front',x:0,y:-84,baseAngle:-Math.PI/2},{id:'rear',x:0,y:84,baseAngle:Math.PI/2},
    {id:'left',x:-49,y:-2,baseAngle:Math.PI},{id:'right',x:55,y:-2,baseAngle:0}],
  trackX:50,trackY:52,trackHalfLength:88,trackWidth:13,engineY:-6
 },
 'mark-v-cruiser':{
  gunSize:100,gunArc:.55,gunTurnSpeed:.85,gunRecoil:2,gunIds:['sponson-left','sponson-right'],
  gunArt:{originX:195,originY:160,pivotX:118,pivotY:142,tipX:24,tipY:142,barrel:[0,121,118,44]},
  guns:[{id:'sponson-left',x:-57,y:-24,baseAngle:Math.PI},{id:'sponson-right',x:57,y:-24,baseAngle:0}],
  trackX:38,trackY:64,trackHalfLength:113,trackWidth:13,engineY:14
 }
});
export const armorRotate=(x,y,a)=>({x:x*Math.cos(a)-y*Math.sin(a),y:x*Math.sin(a)+y*Math.cos(a)});
export const armorAngleDelta=(to,from)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));

// A fixed casemate only lets its barrel traverse through the gun port. These
// authored pivots are shared by the renderer and the actual muzzle commands.
export function armorGunTurn(kind,gun){
 const layout=TRENCH_ARMOR_LAYOUT[kind],base=layout.guns.find(g=>g.id===gun.id).baseAngle;
 return Math.max(-layout.gunArc,Math.min(layout.gunArc,armorAngleDelta(gun.aimAngle??base,base)));
}
export function armorGunRecoil(kind,remaining=0){
 const age=.18-Math.max(0,Math.min(.18,remaining));
 return TRENCH_ARMOR_LAYOUT[kind].gunRecoil*(age<.035?age/.035:(.18-age)/.145);
}
export function armorGunMuzzle(kind,gun,hullYaw=0,scale=1){
 const layout=TRENCH_ARMOR_LAYOUT[kind],art=layout.gunArt,k=layout.gunSize/320;
 const base=layout.guns.find(g=>g.id===gun.id).baseAngle,mark=kind==='mark-v-cruiser';
 const mirrored=mark&&gun.id==='sponson-right',px=(art.pivotX-art.originX)*k*(mirrored?-1:1),py=(art.pivotY-art.originY)*k;
 const pivot=armorRotate(px,py,mark?hullYaw:hullYaw+base),angle=hullYaw+base+armorGunTurn(kind,gun);
 const reach=Math.abs(art.tipX-art.pivotX)*k-armorGunRecoil(kind,gun.recoil);
 return{x:gun.x+(pivot.x+Math.cos(angle)*reach)*scale,y:gun.y+(pivot.y+Math.sin(angle)*reach)*scale,angle};
}
