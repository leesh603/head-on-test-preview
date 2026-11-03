// The eight regional encounters share measured draw/interaction geometry.
// Other bosses deliberately keep their existing geometry and hit routes.
export const REGIONAL_LAYOUT = Object.freeze({
 'drachen-net':{core:[0,0,37,42],parts:{balloon:[0,-90,79,43,175,100],winch:[0,60,49,35,116,83]}},
 'london-apron':{core:[0,0,47,34],parts:{'balloon-0':[-105,-86,43,26,95,57],'balloon-1':[0,-86,43,26,95,57],'balloon-2':[105,-86,43,26,95,57]}},
 'treffas-wagen':{bounds:[-100,-100,100,130],core:[0,0,32,53],parts:{'wheel-left':[-65,8,33,49.5,66,99],'wheel-right':[65,8,33,49.5,66,99],turret:[0,-44,25,25,61,76],rudder:[0,88,18,34,36,84]}},
 'mark4-wedge':{core:[0,64,35,43],parts:{'tank-lead':[0,-118,49,87,108,198],'tank-left':[-168,64,49,87,108,198],'tank-right':[168,64,49,87,108,198]}},
 'morser-battery':{core:[0,8,35,42],parts:{'gun-1':[-155,-62,72,72,176,178],'gun-2':[0,-154,72,72,176,178],'gun-3':[155,-62,72,72,176,178],ammo:[0,130,42,32,98,78]}},
 'staaken-rvi':{bounds:[-190,-108,190,108],core:[0,38,21,43],parts:{'eng-0':[-65.31,-67.29,11,36,36.6,80.2],'eng-1':[-29.69,-67.29,11,36,36.1,80.2],'eng-2':[29.69,-67.29,11,36,35.1,80.2],'eng-3':[64.32,-67.29,11,36,35.1,80.2]}},
 'london-searchlight':{bounds:[-207,-117,218,155],core:[0,92,35,43],parts:{light:[-130,-38,58,54,146,127],gun:[128,-38,36,36,101,125],ammo:[-98,113,40,31,96,76]}}
});
export const REGIONAL_BOSS_IDS=Object.freeze([...Object.keys(REGIONAL_LAYOUT),'fliegerzug']);
export const REGIONAL_BOSS_SET=new Set(REGIONAL_BOSS_IDS);
export const RAIL_CAR_SIZE=Object.freeze({width:95,height:170,rx:43,ry:79,pitch:178,spawnOffset:120});
export function applyRegionalLayout(boss){
 const cfg=REGIONAL_LAYOUT[boss.kind];if(!cfg)return;
 const base=boss.t.geometryScale||1,viewW=boss.t.regionalViewWidth||960,viewH=boss.t.regionalViewHeight||700,mobile=viewW<=600;
 const shapes=Object.values(cfg.parts),k=cfg.core;const bounds=cfg.bounds||[Math.min(k[0]-k[2],...shapes.map(p=>p[0]-p[4]/2)),Math.min(k[1]-k[3],...shapes.map(p=>p[1]-p[5]/2)),Math.max(k[0]+k[2],...shapes.map(p=>p[0]+p[4]/2)),Math.max(k[1]+k[3],...shapes.map(p=>p[1]+p[5]/2))];
 const fit=mobile?Math.min(1,(viewW-48)/((bounds[2]-bounds[0])*base),Math.max(180,viewH-380)/((bounds[3]-bounds[1])*base)):1;
 const scale=base*fit;boss.regionalScale=scale;
 if(mobile&&Number.isFinite(boss.t.regionalPlayerY)){boss.y=boss.t.regionalPlayerY-viewH/2+190-bounds[1]*scale;}

 const [x,y,rx,ry]=cfg.core;boss.regionalCore={x:x*scale,y:y*scale,rx:rx*scale,ry:ry*scale};boss.coreRadius=Math.max(rx,ry)*scale;
 for(const [id,[x,y,rx,ry,w,h]] of Object.entries(cfg.parts)){
  const p=boss.parts.get(id);if(!p)throw new Error('Missing regional part '+boss.kind+':'+id);
  Object.assign(p,{x:x*scale,y:y*scale,radius:Math.max(rx,ry)*scale,hitRadiusX:rx*scale,hitRadiusY:ry*scale,drawWidth:w*scale,drawHeight:h*scale});
 }
}
// Swept ellipses: display dimensions, muzzle coordinates and direct/explosive
// hits all use the same positions. The protected core is never an opaque disc.
export function intersectsEllipse(s,cx,cy,rx,ry,angle=0){
 const radius=s.radius||0;rx+=radius;ry+=radius;
 const cs=Math.cos(angle),sn=Math.sin(angle),px=(s.previousX??s.x)-cx,py=(s.previousY??s.y)-cy;
 const ex=s.x-cx,ey=s.y-cy;
 const x=(px*cs+py*sn)/rx,y=(-px*sn+py*cs)/ry,dx=(ex*cs+ey*sn)/rx-x,dy=(-ex*sn+ey*cs)/ry-y;
 const d=dx*dx+dy*dy,t=d?Math.max(0,Math.min(1,-(x*dx+y*dy)/d)):0;
 return (x+dx*t)**2+(y+dy*t)**2<=1;
}
export function locateRegionalHit(boss,s){
 if(boss.dead||boss.hidden)return null;
 for(const p of boss.parts.values())if(p.hittable&&!p.destroyed&&intersectsEllipse(s,boss.x+p.x,boss.y+p.y,p.hitRadiusX||p.radius,p.hitRadiusY||p.radius))return{partId:p.id};
 const k=boss.regionalCore;
 return boss.coreVulnerable&&k&&intersectsEllipse(s,boss.x+k.x,boss.y+k.y,k.rx,k.ry)?{partId:null}:null;
}
export function regionalMuzzle(boss,id,angle=null,length=0){
 const p=boss.parts.get(id);if(!p)return{x:boss.x,y:boss.y};
 const scale=boss.regionalScale||1;
 if(angle!==null)return{x:boss.x+p.x+Math.cos(angle)*length*scale,y:boss.y+p.y+Math.sin(angle)*length*scale};
 return{x:boss.x+p.x,y:boss.y+p.y-34*scale};
}
export function railLocalPose(boss,part){
 const a=boss.phase==='derailed'?.16:0,cs=Math.cos(a),sn=Math.sin(a),x=part?.x||0,y=part?.y||0;
 return{x:boss.x+x*cs-y*sn,y:boss.y+x*sn+y*cs,angle:a};
}
