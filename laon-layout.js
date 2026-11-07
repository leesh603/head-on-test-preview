export const LAON_MISSION=Object.freeze({seconds:90,shots:6,attackShotLimit:6,approach:900});
export const LAON_NORMAL_CYCLE_SECONDS=15;

// North-facing source-art and collision contract. Origin is the concrete
// emplacement centre, never the player's current camera position.
export const LAON_LAYOUT=Object.freeze({
  width:160,height:420,top:-340,bottom:80,recoilDistance:32,
  muzzle:Object.freeze({x:0,y:-335}),
  parts:Object.freeze([
    {id:'barrel',x:0,y:-185,rx:11,ry:148,kind:'barrel',hp:.72},
    {id:'breech',x:0,y:-20,rx:25,ry:33,kind:'command',hp:1},
    {id:'recoil',x:0,y:-53,rx:40,ry:41,kind:'recoil',hp:.30},
    {id:'loader',x:-116,y:55,rx:34,ry:29,kind:'loader',hp:.28},
    {id:'ammo',x:130,y:45,rx:42,ry:32,kind:'payload',hp:.24},
    {id:'aa-west',x:-210,y:-150,rx:24,ry:24,kind:'gun',hp:.15},
    {id:'aa-east',x:210,y:-100,rx:24,ry:24,kind:'gun',hp:.15}
  ].map(Object.freeze))
});
export const LAON_CRITICAL_PARTS=Object.freeze(['barrel','breech']);
export function laonPartState(part){return !part||part.hp<=0?2:part.hp<=part.maxHp*.55?1:0;}
export function pointSegmentDistance(x,y,ax,ay,bx,by){
 const dx=bx-ax,dy=by-ay,d=dx*dx+dy*dy;
 const t=d?Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/d)):0;
 return Math.hypot(x-ax-dx*t,y-ay-dy*t);
}
// Swept ellipse keeps fast shots from tunnelling through the narrow barrel.
export function sweptLaonEllipse(shot,x,y,rx,ry){
 const r=Math.max(0,shot.radius||0),sx=(shot.previousX??shot.x)-x,sy=(shot.previousY??shot.y)-y;
 return pointSegmentDistance(0,0,sx/(rx+r),sy/(ry+r),(shot.x-x)/(rx+r),(shot.y-y)/(ry+r))<=1;
}
