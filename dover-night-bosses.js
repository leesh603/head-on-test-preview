import {BaseBoss, BossPart} from './headon-stageboss-core.js?v=gal1';

const freezeParts=parts=>Object.freeze(parts.map(Object.freeze));
const freezePolys=polys=>Object.freeze(polys.map(poly=>Object.freeze(poly.map(point=>Object.freeze(point)))));

const NIGHTHAWK_PARTS=freezeParts([
  {id:'lamp',x:0,y:-348,radius:34,kind:'searchlight'},
  {id:'davis-cannon',x:0,y:-214,radius:32,kind:'cannon'},
  {id:'engine-left',x:-134,y:-62,radius:38,kind:'engine'},
  {id:'engine-right',x:134,y:-62,radius:38,kind:'engine'},
  {id:'gun-left',x:-237,y:-116,radius:28,kind:'gun'},
  {id:'gun-right',x:237,y:-116,radius:28,kind:'gun'},
  {id:'bomb-rack',x:0,y:92,radius:28,kind:'payload'},
  {id:'wing-left',x:-470,y:5,radius:74,kind:'structure'},
  {id:'wing-right',x:470,y:5,radius:74,kind:'structure'}
]);
const RVIII_PARTS=freezeParts([
  {id:'drive-outer-left',x:-320,y:-56,radius:40,kind:'drive'},
  {id:'drive-inner-left',x:-130,y:-177,radius:40,kind:'drive'},
  {id:'drive-inner-right',x:130,y:-177,radius:40,kind:'drive'},
  {id:'drive-outer-right',x:320,y:-56,radius:40,kind:'drive'},
  {id:'gun-nose',x:0,y:-305,radius:27,kind:'gun'},
  {id:'gun-dorsal',x:0,y:-63,radius:28,kind:'gun'},
  {id:'gun-tail',x:0,y:178,radius:27,kind:'gun'},
  {id:'bomb-bay-left',x:-68,y:9,radius:32,kind:'payload'},
  {id:'bomb-bay-right',x:68,y:9,radius:32,kind:'payload'},
  {id:'wing-left',x:-500,y:-85,radius:82,kind:'structure'},
  {id:'wing-right',x:500,y:-85,radius:82,kind:'structure'}
]);

// Authored whole sprites are 1200x800, face north and have their origin at
// source pixel 600,400. Hull polygons are deliberately tight to the painted
// aircraft; the transparent corners of that canvas never become a hit disc.
export const DOVER_NIGHTHAWK_LAYOUT=Object.freeze({
  width:1200,height:800,core:Object.freeze({x:0,y:-33,radius:48}),parts:NIGHTHAWK_PARTS,
  hull:freezePolys([
    [[-24,-382],[24,-382],[49,-346],[52,256],[31,374],[-31,374],[-52,256],[-49,-346]],
    [[-545,-274],[545,-274],[578,-253],[578,-207],[548,-185],[-548,-185],[-578,-207],[-578,-253]],
    [[-548,-140],[548,-140],[578,-119],[578,-81],[548,-60],[-548,-60],[-578,-81],[-578,-119]],
    [[-548,-10],[548,-10],[578,11],[578,53],[548,74],[-548,74],[-578,53],[-578,11]],
    [[-535,120],[535,120],[560,142],[560,185],[527,207],[-527,207],[-560,185],[-560,142]],
    [[-260,210],[260,210],[260,322],[218,352],[-218,352],[-260,322]]
  ])
});
export const DOVER_RVIII_LAYOUT=Object.freeze({
  width:1200,height:800,core:Object.freeze({x:0,y:90,radius:50}),parts:RVIII_PARTS,
  hull:freezePolys([
    [[-16,-367],[16,-367],[37,-325],[38,341],[20,374],[-20,374],[-38,341],[-37,-325]],
    [[-550,-222],[550,-222],[592,-194],[592,-128],[558,-100],[-558,-100],[-592,-128],[-592,-194]],
    [[-548,-69],[548,-69],[582,-45],[582,20],[548,45],[-548,45],[-582,20],[-582,-45]],
    [[-232,220],[232,220],[232,296],[207,320],[-207,320],[-232,296]],
    [[-100,-50],[-40,-50],[-40,82],[-100,82]],
    [[40,-50],[100,-50],[100,82],[40,82]]
  ])
});

const clipSet=value=>Object.freeze(Object.fromEntries(Object.entries(value).map(([id,rect])=>[id,Object.freeze(rect)])));
// Clip rectangles use the same centered local coordinate system as the
// layouts. Add 600,400 for source image pixels. Intact and wreck atlases must
// contain complete whole-aircraft renders with every part at identical pixels.
export const DOVER_PART_CLIPS=Object.freeze({
  nighthawk:clipSet({
    lamp:[-42,-385,84,80],'davis-cannon':[-45,-260,90,100],
    'engine-left':[-195,-188,110,238],'engine-right':[85,-188,110,238],
    'gun-left':[-290,-160,95,105],'gun-right':[195,-160,95,105],
    'bomb-rack':[-34,54,68,80],
    'wing-left':[-580,-285,250,500],'wing-right':[330,-285,250,500]
  }),
  rviii:clipSet({
    'drive-outer-left':[-365,-150,100,190],'drive-inner-left':[-175,-285,90,205],
    'drive-inner-right':[85,-285,90,205],'drive-outer-right':[265,-150,100,190],
    'gun-nose':[-34,-365,68,105],'gun-dorsal':[-34,-98,68,74],'gun-tail':[-34,140,68,78],
    'bomb-bay-left':[-100,-52,60,136],'bomb-bay-right':[40,-52,60,136],
    'wing-left':[-592,-225,200,275],'wing-right':[392,-225,200,275]
  })
});

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const pointSegmentDistance=(x,y,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],d=dx*dx+dy*dy,t=d?clamp(((x-a[0])*dx+(y-a[1])*dy)/d,0,1):0;return Math.hypot(x-a[0]-dx*t,y-a[1]-dy*t);};
const firstCircleHit=(x0,y0,x1,y1,cx,cy,r)=>{
  const fx=x0-cx,fy=y0-cy,c=fx*fx+fy*fy-r*r;if(c<=0)return 0;
  const dx=x1-x0,dy=y1-y0,a=dx*dx+dy*dy;if(!a)return Infinity;
  const b=2*(fx*dx+fy*dy),d=b*b-4*a*c;if(d<0)return Infinity;
  const t=(-b-Math.sqrt(d))/(2*a);return t>=0&&t<=1?t:Infinity;
};
const orient=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
const onSegment=(a,b,p)=>p[0]>=Math.min(a[0],b[0])-1e-9&&p[0]<=Math.max(a[0],b[0])+1e-9&&p[1]>=Math.min(a[1],b[1])-1e-9&&p[1]<=Math.max(a[1],b[1])+1e-9;
const segmentsCross=(a,b,c,d)=>{const ab0=orient(a,b,c),ab1=orient(a,b,d),cd0=orient(c,d,a),cd1=orient(c,d,b);return ab0*ab1<0&&cd0*cd1<0||Math.abs(ab0)<1e-9&&onSegment(a,b,c)||Math.abs(ab1)<1e-9&&onSegment(a,b,d)||Math.abs(cd0)<1e-9&&onSegment(c,d,a)||Math.abs(cd1)<1e-9&&onSegment(c,d,b);};
const segmentDistance=(a,b,c,d)=>segmentsCross(a,b,c,d)?0:Math.min(pointSegmentDistance(a[0],a[1],c,d),pointSegmentDistance(b[0],b[1],c,d),pointSegmentDistance(c[0],c[1],a,b),pointSegmentDistance(d[0],d[1],a,b));
const polygonHit=(x,y,r,poly)=>{
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const a=poly[i],b=poly[j];
    if(pointSegmentDistance(x,y,a,b)<=r)return true;
    if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
  }
  return inside;
};
const sweptPolygonHit=(a,b,r,poly)=>{
  if(polygonHit(a[0],a[1],r,poly)||polygonHit(b[0],b[1],r,poly))return true;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++)if(segmentDistance(a,b,poly[j],poly[i])<=r)return true;
  return false;
};
const aliveCount=players=>{let n=0;for(const p of players||[])if(p?.alive)n++;return n;};
const aliveAt=(players,index)=>{const count=aliveCount(players);if(!count)return null;let wanted=((index%count)+count)%count;for(const p of players)if(p?.alive){if(!wanted--)return p;}return null;};
const RVIII_LEFT_DRIVES=Object.freeze(['drive-outer-left','drive-inner-left']);
const RVIII_RIGHT_DRIVES=Object.freeze(['drive-inner-right','drive-outer-right']);
const RVIII_GUNS=Object.freeze(['gun-nose','gun-dorsal','gun-tail']);
const RVIII_LAST_STAND=Object.freeze(['gun-nose','bomb-bay-left','gun-dorsal','bomb-bay-right','gun-tail']);
const NIGHTHAWK_LAST_STAND=Object.freeze(['gun-left','bomb-rack','davis-cannon','gun-right','lamp']);

class DoverAircraft extends BaseBoss {
  constructor({tuning,kind,layout,faction,...base}){
    for(const key of ['maxHp','partHp','damage','bulletSpeed'])if(!Number.isFinite(tuning?.[key])||tuning[key]<=0)throw new Error('Current boss tuning required: '+key);
    const scale=tuning.geometryScale||1;
    const parts=layout.parts.map(spec=>new BossPart({...spec,maxHp:tuning.partHp,...tuning.parts?.[spec.id],x:spec.x*scale,y:spec.y*scale,radius:spec.radius*scale}));
    super({...base,maxHp:tuning.maxHp,coreRadius:(tuning.coreRadius||layout.core.radius)*scale,parts});
    this.t=tuning;this.kind=kind;this.layout=layout;this.faction=faction;this.a=-Math.PI/2;this.hullYaw=0;this.bank=0;this.turnVelocity=0;this.asymmetryState=0;this.flightSpeed=0;this.patrolPhase=null;this.patrolCenterX=null;this.patrolCenterY=null;this.patrolFlowX=0;this.patrolFlowY=0;this.ownsMotion129=true;
    this.geometryScale=scale;this.coreLocalX=layout.core.x*scale;this.coreLocalY=layout.core.y*scale;this.targetCursor=0;
    for(const p of this.parts.values()){p.localX=p.x;p.localY=p.y;}
    this.rotateMounts();
  }
  command(type,spec={}){this.emit({...spec,type,bossId:this.id,faction:this.faction});}
  hazard(kind,part,spec={}){
    if(!part||part.destroyed)return;
    const x=this.x+part.x,y=this.y+part.y;
    this.command('hazard',{kind,x,y,sourceX:x,sourceY:y,sourcePartId:part.id,tag:this.id+':'+part.id,
      damage:this.t.damage,warning:kind==='projectile'?.65:1,duration:kind==='projectile'?4:.35,...spec});
  }
  partAlive(id){const p=this.parts.get(id);return !!p&&!p.destroyed;}
  countKinds(...kinds){let n=0;for(const p of this.parts.values())if(!p.destroyed&&kinds.includes(p.kind))n++;return n;}
  rotateMounts(){const rotation=this.a+Math.PI/2,c=Math.cos(rotation),s=Math.sin(rotation);for(const p of this.parts.values()){p.x=p.localX*c-p.localY*s;p.y=p.localX*s+p.localY*c;p.angle=this.a;}}
  localPoint(x,y){const rotation=this.a+Math.PI/2,c=Math.cos(rotation),s=Math.sin(rotation),dx=x-this.x,dy=y-this.y;return{x:(dx*c+dy*s)/this.geometryScale,y:(-dx*s+dy*c)/this.geometryScale};}
  coreOffset(){const rotation=this.a+Math.PI/2,c=Math.cos(rotation),s=Math.sin(rotation);return{x:this.coreLocalX*c-this.coreLocalY*s,y:this.coreLocalX*s+this.coreLocalY*c};}
  nearestPart({x,y,previousX=x,previousY=y,radius=0}){
    let found=null,bestT=Infinity,bestEnd=Infinity;
    for(const p of this.parts.values())if(p.hittable&&!p.destroyed){const cx=this.x+p.x,cy=this.y+p.y,t=firstCircleHit(previousX,previousY,x,y,cx,cy,p.radius+radius);if(!Number.isFinite(t))continue;const end=Math.hypot(x-cx,y-cy);
      if(t<bestT-1e-9||Math.abs(t-bestT)<=1e-9&&(end<bestEnd-1e-9||Math.abs(end-bestEnd)<=1e-9&&p.id<(found?.id||''))){found=p;bestT=t;bestEnd=end;}}
    return found?{partId:found.id}:null;
  }
  locateHit(attack){
    const part=this.nearestPart(attack);if(part)return part;if(!this.coreVulnerable)return null;
    const q=this.localPoint(attack.x,attack.y),p=this.localPoint(attack.previousX??attack.x,attack.previousY??attack.y),r=(attack.radius||0)/this.geometryScale;
    for(const poly of this.layout.hull)if(sweptPolygonHit([p.x,p.y],[q.x,q.y],r,poly))return{partId:null};
    return null;
  }
  hitAt(attack){const route=this.locateHit(attack);return route?this.hit({...route,damage:attack.damage}):{damage:0,miss:true};}
  hit(attack){const result=super.hit(attack);if(result.bodyDefeated){this.cancelAll();this.command('cancel-hazards',{tag:this.id+':released-bombs'});}return result;}
  cancelPart(part){this.command('cancel-hazards',{tag:this.id+':'+part.id,sourcePartId:part.id});}
  cancelAll(){for(const p of this.parts.values())this.cancelPart(p);}
  holdBasic(seconds){this.basicHoldUntil=Math.max(this.basicHoldUntil||0,(this.combatTime||0)+seconds);this.basicClock=Math.max(this.basicClock||0,.55);this.command('cancel-hazards',{tag:this.id+':basic-fire'});}
  selectTarget(players){const target=aliveAt(players,this.targetCursor);if(target)this.targetCursor=(this.targetCursor+1)&65535;return target;}
  airframeExtents(){const rotation=this.a+Math.PI/2,c=Math.abs(Math.cos(rotation)),s=Math.abs(Math.sin(rotation)),w=this.layout.width*this.geometryScale/2,h=this.layout.height*this.geometryScale/2;return{x:c*w+s*h,y:s*w+c*h};}
  easeSpeed(target,rate,dt){this.currentSpeed+=(clamp(target-this.currentSpeed,-rate*dt,rate*dt));return this.currentSpeed;}
  fly(dt,players,bounds,speed,turn,asymmetry,committedAngle=null){
    bounds||={left:this.x-600,right:this.x+600,top:this.y-600,bottom:this.y+600};
    const oldX=this.x,oldY=this.y,oldA=this.a,oldFlightSpeed=this.flightSpeed;
    const cx=(bounds.left+bounds.right)/2,cy=(bounds.top+bounds.bottom)/2,spanX=Math.max(240,bounds.right-bounds.left),spanY=Math.max(240,bounds.bottom-bounds.top);
    if(Number.isFinite(this.patrolCenterX)&&dt>0){const measuredX=clamp((cx-this.patrolCenterX)/dt,-260,260),measuredY=clamp((cy-this.patrolCenterY)/dt,-260,260),flowStep=55*dt;this.patrolFlowX+=clamp(measuredX-this.patrolFlowX,-flowStep,flowStep);this.patrolFlowY+=clamp(measuredY-this.patrolFlowY,-flowStep,flowStep);}this.patrolCenterX=cx;this.patrolCenterY=cy;
    const rx=Math.max(190,spanX*.46),ry=Math.max(165,spanY*.44),direction=this.kind==='siemens-schuckert-r-viii'?-1:1;
    if(!Number.isFinite(this.patrolPhase))this.patrolPhase=Math.atan2((this.y-cy)/ry,(this.x-cx)/rx);
    const tangent=Math.max(80,Math.hypot(rx*Math.sin(this.patrolPhase),ry*Math.cos(this.patrolPhase)));
    const flow=Math.hypot(this.patrolFlowX,this.patrolFlowY),orbitSpeed=Math.max(24,speed-Math.min(speed*.84,flow*.82));this.patrolPhase=wrap(this.patrolPhase+direction*orbitSpeed/tangent*dt);
    const tx=cx+Math.cos(this.patrolPhase)*rx,ty=cy+Math.sin(this.patrolPhase)*ry,phaseTangent=Math.max(1,Math.hypot(rx*Math.sin(this.patrolPhase),ry*Math.cos(this.patrolPhase)));
    const tangentX=-Math.sin(this.patrolPhase)*rx/phaseTangent*direction,tangentY=Math.cos(this.patrolPhase)*ry/phaseTangent*direction;
    const far=this.x<bounds.left-spanX*.06||this.x>bounds.right+spanX*.06||this.y<bounds.top-spanY*.06||this.y>bounds.bottom+spanY*.06;
    const correctionLimit=far?240:70,ex=tx-this.x,ey=ty-this.y,correction=Math.min(correctionLimit,Math.hypot(ex,ey)*(far?.95:.2)),errorLength=Math.max(1,Math.hypot(ex,ey)),routeSpeed=far?orbitSpeed*.22:orbitSpeed;
    const desiredX=this.patrolFlowX+tangentX*routeSpeed+ex/errorLength*correction,desiredY=this.patrolFlowY+tangentY*routeSpeed+ey/errorLength*correction,routeGroundSpeed=Math.hypot(desiredX,desiredY);
    const want=Number.isFinite(committedAngle)?committedAngle:Math.atan2(desiredY,desiredX),desiredSpeed=Number.isFinite(committedAngle)?Math.max(speed,Math.abs(this.patrolFlowX*Math.cos(committedAngle)+this.patrolFlowY*Math.sin(committedAngle))+speed*.35):far?Math.min(speed,routeGroundSpeed):routeGroundSpeed;
    this.asymmetryState+=clamp(asymmetry-this.asymmetryState,-.055*dt,.055*dt);this.hullYaw=this.asymmetryState;
    const wantedTurn=clamp(wrap(want-this.a)*.72+(Number.isFinite(committedAngle)?0:this.asymmetryState),-turn,turn),turnAccel=Math.max(.08,turn*.9);
    this.turnVelocity+=clamp(wantedTurn-this.turnVelocity,-turnAccel*dt,turnAccel*dt);this.a=wrap(this.a+this.turnVelocity*dt);
    this.bank=clamp(this.turnVelocity/Math.max(.01,turn)*.78+this.asymmetryState*1.6,-1,1);
    if(speed<=0)this.flightSpeed=0;else{if(!(this.flightSpeed>0))this.flightSpeed=speed;this.flightSpeed+=clamp(clamp(desiredSpeed,36,285)-this.flightSpeed,-52*dt,52*dt);}
    this.x+=Math.cos(this.a)*this.flightSpeed*dt;this.y+=Math.sin(this.a)*this.flightSpeed*dt;
    if(!Number.isFinite(this.x+this.y+this.a+this.turnVelocity)){this.x=Number.isFinite(oldX)?oldX:cx;this.y=Number.isFinite(oldY)?oldY:cy;this.a=Number.isFinite(oldA)?oldA:-Math.PI/2;this.flightSpeed=Number.isFinite(oldFlightSpeed)?oldFlightSpeed:0;this.turnVelocity=0;this.bank=0;this.hullYaw=0;this.patrolPhase=null;this.patrolFlowX=this.patrolFlowY=0;}
    this.rotateMounts();
  }
  suppressive(){}
}

export class SupermarineNighthawk extends DoverAircraft {
  constructor(options){
    const layout=options.layout||options.tuning.layout||DOVER_NIGHTHAWK_LAYOUT;
    super({...options,kind:'supermarine-nighthawk',layout,faction:options.faction||'entente'});
    this.phase='hunt';this.coreVulnerable=false;this.phaseClock=0;this.beat=0;this.currentSpeed=148;this.lockFireIn=.4;this.lastStandSlot=0;this.lightBombed=false;this.lightBombPending=0;this.lightBombClock=0;this.lightBombX=0;this.lightBombY=0;this.lightBombNX=0;this.lightBombNY=0;this.lightBombTargetId=null;
  }
  engines(){return this.countKinds('engine');}
  wings(){return this.countKinds('structure');}
  weapons(){return this.countKinds('searchlight','cannon','gun','payload');}
  speedRatio(){return [0.26,.68,1][this.engines()]*(this.wings()===2?1:this.wings()===1?.78:.46);}
  enterRecovery(){this.phase='recovery';this.phaseClock=0;this.coreVulnerable=true;this.cancelPart(this.parts.get('lamp'));this.command('phase-change',{phase:'recovery',seconds:3.2});}
  enterLastStand(){if(this.phase==='last-stand')return;this.phase='last-stand';this.phaseClock=0;this.coreVulnerable=true;this.lastStandSlot=0;this.holdBasic(Infinity);this.cancelAll();this.command('phase-change',{phase:'last-stand'});}
  disabled(){return !this.weapons()||!this.engines()||!this.wings();}
  onPartDestroyed(part){this.cancelPart(part);if(part.id==='bomb-rack')this.lightBombPending=0;if(this.disabled())this.enterLastStand();else this.command('phase-change',{phase:this.phase,partId:part.id});}
  fixedBeam(target){
    const lamp=this.parts.get('lamp');if(lamp.destroyed||!target)return;
    const x=this.x+lamp.x,y=this.y+lamp.y,angle=Math.atan2(target.y-y,target.x-x);
    lamp.angle=angle;this.hazard('searchlight',lamp,{angle,angularSpeed:0,halfAngle:.12,radius:1350*this.geometryScale,warning:1.1,duration:1.05,damage:0,tickInterval:.1,targetId:target.id,visual:'dover-searchlight'});
    this.command('dover-search-warning',{partId:lamp.id,targetId:target.id,angle,seconds:1.1,safeAngle:angle+Math.PI/2});
  }
  machineBurst(id,target,lightLock=false){
    const gun=this.parts.get(id);if(gun.destroyed||!target)return;const x=this.x+gun.x,y=this.y+gun.y,aim=Math.atan2(target.y-y,target.x-x),count=lightLock?4:3,speed=this.t.bulletSpeed*(lightLock?1.12:.9);
    this.command('muzzle',{x,y,partId:id,targetId:target.id});
    for(let i=0;i<count;i++){const angle=aim+(i-(count-1)/2)*.11;this.hazard('projectile',gun,{vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,radius:4,warning:.65,duration:3.6,damage:this.t.damage*(lightLock?.62:.42),targetId:target.id,visual:'nighthawk-mg'});}
  }
  lightBombRack(target){
    const rack=this.parts.get('bomb-rack');if(rack.destroyed||!target)return;const vx=target.vx||0,vy=target.vy||0,v=Math.hypot(vx,vy),lead=1.05;
    this.lightBombX=target.x+vx*lead;this.lightBombY=target.y+vy*lead;this.lightBombNX=v>20?-vy/v:Math.cos(this.a+Math.PI/2);this.lightBombNY=v>20?vx/v:Math.sin(this.a+Math.PI/2);this.lightBombTargetId=target.id;this.lightBombPending=3;this.lightBombClock=0;
    this.command('dover-light-bomb-warning',{partId:rack.id,targetId:target.id,seconds:1.05,count:3,safeOutside:92});
  }
  updateLightBombs(dt){
    if(!this.lightBombPending)return;const rack=this.parts.get('bomb-rack');if(rack.destroyed){this.lightBombPending=0;return;}this.lightBombClock+=dt;
    while(this.lightBombPending&&this.lightBombClock>=(3-this.lightBombPending)*.2){const index=3-this.lightBombPending--,offset=(index-1)*58,sourceX=this.x+rack.x,sourceY=this.y+rack.y;
      this.command('hazard',{kind:'circle',x:this.lightBombX+this.lightBombNX*offset,y:this.lightBombY+this.lightBombNY*offset,sourceX,sourceY,sourcePartId:null,launchPartId:rack.id,tag:this.id+':released-bombs',damage:this.t.damage*.62,warning:1.05,duration:.24,radius:28,once:true,targetId:this.lightBombTargetId,visual:'nighthawk-light-bomb',airborneBomb:true});}
  }
  cannonShot(target){
    const cannon=this.parts.get('davis-cannon');if(cannon.destroyed||!target)return;const x=this.x+cannon.x,y=this.y+cannon.y,speed=550,warning=1.35,range=speed*1.6;
    // Lock the future launch bearing before the warning starts. The shell is
    // physical ordnance after the telegraph, never a tracking or hitscan beam.
    const distance=Math.hypot(target.x-x,target.y-y),lead=warning+Math.min(.7,distance/(speed*2));
    const aim=Math.atan2(target.y+(target.vy||0)*lead-y,target.x+(target.vx||0)*lead-x);
    this.holdBasic(warning+1.6+.4);cannon.angle=aim;
    for(const [offset,delay] of [[-.105,0],[.105,.18]]){const angle=aim+offset;this.hazard('projectile',cannon,{angle,length:range,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,radius:8,delay,warning,duration:1.6,damage:this.t.damage*1.55,targetId:target.id,visual:'davis-cannon'});}
    this.command('dover-cannon-warning',{partId:cannon.id,targetId:target.id,angle:aim,seconds:1.35,safeGap:80});
  }
  hunt(dt,players,isIlluminated){
    this.phaseClock+=dt;
    while(this.beat<3&&this.phaseClock>=this.beat*1.65){this.fixedBeam(this.selectTarget(players));this.beat++;}
    this.lockFireIn-=dt;if(this.lockFireIn<=0){let locked=null;for(const p of players||[])if(p?.alive&&isIlluminated?.(p)){locked=p;break;}if(locked){this.machineBurst(this.beat%2?'gun-left':'gun-right',locked,true);this.lockFireIn=1.15;}else this.lockFireIn=.18;}
    if(!this.lightBombed&&this.phaseClock>=4.25){this.lightBombed=true;this.lightBombRack(this.selectTarget(players));}
    if(this.phaseClock>=5.35){this.cannonShot(this.selectTarget(players));this.phase='cannon';this.phaseClock=0;this.command('phase-change',{phase:'cannon',seconds:1.9});}
  }
  lastStand(dt,players){
    if(!aliveCount(players))return;this.phaseClock-=dt;if(this.phaseClock>0)return;const id=NIGHTHAWK_LAST_STAND[this.lastStandSlot++%NIGHTHAWK_LAST_STAND.length],part=this.parts.get(id),target=this.selectTarget(players);this.phaseClock=1.05;
    if(part.destroyed)return;if(id==='davis-cannon')this.cannonShot(target);else if(id==='lamp')this.fixedBeam(target);else if(id==='bomb-rack')this.lightBombRack(target);else this.machineBurst(id,target,false);
  }
  update(dt,{players=[],bounds,isIlluminated,paused=false}={}){
    if(this.dead||paused||!Number.isFinite(dt)||dt<=0)return;if(this.disabled())this.enterLastStand();
    const left=this.partAlive('engine-left')?0:1,right=this.partAlive('engine-right')?0:1,asymmetry=(left-right)*.12;
    this.easeSpeed(148*this.speedRatio(),30,dt);this.fly(dt,players,bounds,this.currentSpeed,(this.wings()===2?.5:.34),asymmetry);this.updateLightBombs(dt);
    if(this.phase==='last-stand'){this.lastStand(dt,players);return;}
    if(this.phase==='hunt'){this.hunt(dt,players,isIlluminated);return;}
    this.phaseClock+=dt;if(this.phase==='cannon'&&this.phaseClock>=1.9){this.enterRecovery();return;}
    if(this.phase==='recovery'&&this.phaseClock>=3.2){this.phase='hunt';this.phaseClock=0;this.beat=0;this.lightBombed=false;this.coreVulnerable=false;this.command('phase-change',{phase:'hunt'});}
  }
}

export class SiemensSchuckertRVIII extends DoverAircraft {
  constructor(options){
    const layout=options.layout||options.tuning.layout||DOVER_RVIII_LAYOUT;
    super({...options,kind:'siemens-schuckert-r-viii',layout,faction:options.faction||'central'});
    this.phase='barrage';this.coreVulnerable=false;this.phaseClock=0;this.beat=0;this.currentSpeed=112;this.lastStandSlot=0;this.runAngle=null;this.runCenterX=0;this.runCenterY=0;this.runDropIndex=0;this.runSerial=0;
  }
  drives(){return this.countKinds('drive');}
  wings(){return this.countKinds('structure');}
  weapons(){return this.countKinds('gun','payload');}
  speedRatio(){return [.2,.42,.63,.82,1][this.drives()]*(this.wings()===2?1:this.wings()===1?.8:.5);}
  disabled(){return !this.weapons()||this.drives()<=1||!this.wings();}
  enterRecovery(){this.phase='recovery';this.phaseClock=0;this.runAngle=null;this.coreVulnerable=true;this.command('phase-change',{phase:'recovery',seconds:3});}
  enterLastStand(){if(this.phase==='last-stand')return;this.phase='last-stand';this.phaseClock=0;this.coreVulnerable=true;this.lastStandSlot=0;this.holdBasic(Infinity);this.cancelAll();this.command('phase-change',{phase:'last-stand'});}
  onPartDestroyed(part){this.cancelPart(part);if(this.disabled())this.enterLastStand();else this.command('phase-change',{phase:this.phase,partId:part.id});}
  turretBurst(id,target,heavy=false){
    const gun=this.parts.get(id);if(gun.destroyed||!target)return;const x=this.x+gun.x,y=this.y+gun.y,aim=Math.atan2(target.y-y,target.x-x),count=heavy?5:3,speed=this.t.bulletSpeed*(heavy?1.02:.82);
    if(heavy)this.holdBasic(.75+4+.4);
    this.command('muzzle',{x,y,partId:id,targetId:target.id});
    for(let i=0;i<count;i++){const angle=aim+(i-(count-1)/2)*(heavy?.09:.14);this.hazard('projectile',gun,{vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,radius:5,warning:.75,duration:4,damage:this.t.damage*(heavy?.58:.4),targetId:target.id,visual:'rviii-gun'});}
  }
  beginBombRun(target){
    if(!target)return false;const lead=1.4,tx=target.x+(target.vx||0)*lead,ty=target.y+(target.vy||0)*lead,direct=Math.atan2(ty-this.y,tx-this.x);
    this.runAngle=direct;this.runCenterX=tx;this.runCenterY=ty;this.runDropIndex=0;this.runTargetId=target.id;this.runSerial=(this.runSerial+1)&65535;this.phase='bomb-align';this.phaseClock=0;this.holdBasic(14);return true;
  }
  startBombApproach(){
    const dx=Math.cos(this.runAngle),dy=Math.sin(this.runAngle),lead=clamp(this.flightSpeed*1.6+190,390,620);this.runCenterX=this.x+dx*lead;this.runCenterY=this.y+dy*lead;this.phase='bomb-approach';this.phaseClock=0;
    this.command('dover-bomb-warning',{targetId:this.runTargetId,seconds:1.35,safeGap:76,angle:this.runAngle,exitAngle:this.runAngle+(this.runSerial%2?Math.PI/2:-Math.PI/2),x:this.runCenterX,y:this.runCenterY,length:430});
  }
  releaseRunBomb(index){
    const side=index%2?-1:1,id=side<0?'bomb-bay-left':'bomb-bay-right',bay=this.parts.get(id);if(bay.destroyed)return false;
    const along=(index-3.5)*54,lateral=side*76,dx=Math.cos(this.runAngle),dy=Math.sin(this.runAngle),nx=-dy,ny=dx,x=this.runCenterX+dx*along+nx*lateral,y=this.runCenterY+dy*along+ny*lateral;
    const sourceX=this.x+bay.x,sourceY=this.y+bay.y;
    this.command('hazard',{kind:'circle',x,y,sourceX,sourceY,sourcePartId:null,launchPartId:id,tag:this.id+':released-bombs',damage:this.t.damage*.88,warning:1.05,duration:.28,radius:34,angle:this.runAngle,once:true,targetId:this.runTargetId,visual:'rviii-bomb',airborneBomb:true});return true;
  }
  singleBomb(bay,target){
    if(!bay||bay.destroyed||!target)return;const x=target.x+(target.vx||0)*1.05,y=target.y+(target.vy||0)*1.05,sourceX=this.x+bay.x,sourceY=this.y+bay.y;
    this.command('hazard',{kind:'circle',x,y,sourceX,sourceY,sourcePartId:null,launchPartId:bay.id,tag:this.id+':released-bombs',damage:this.t.damage*.78,warning:1.05,duration:.28,radius:32,once:true,targetId:target.id,visual:'rviii-bomb',airborneBomb:true});
  }
  barrage(dt,players){
    this.phaseClock+=dt;
    if(this.beat===0&&this.phaseClock>=2.15){this.turretBurst(RVIII_GUNS[(this.runSerial+1)%RVIII_GUNS.length],this.selectTarget(players),true);this.beat=1;}
    if(this.phaseClock>=3.45){if(this.countKinds('payload'))this.beginBombRun(this.selectTarget(players));else this.enterRecovery();}
  }
  bombRun(dt){
    this.phaseClock+=dt;if(this.phase==='bomb-align'){if(Math.abs(wrap(this.runAngle-this.a))<=.08&&Math.abs(this.turnVelocity)<=.1)this.startBombApproach();return;}
    if(this.phase==='bomb-approach'&&this.phaseClock>=1.35){this.phase='bomb-run';this.phaseClock=0;this.command('phase-change',{phase:'bomb-run',angle:this.runAngle});return;}
    if(this.phase!=='bomb-run')return;while(this.runDropIndex<8&&this.phaseClock>=.18+this.runDropIndex*.25)this.releaseRunBomb(this.runDropIndex++);
    if(this.phaseClock>=2.15)this.enterRecovery();
  }
  lastStand(dt,players){
    if(!aliveCount(players))return;this.phaseClock-=dt;if(this.phaseClock>0)return;const id=RVIII_LAST_STAND[this.lastStandSlot++%RVIII_LAST_STAND.length],part=this.parts.get(id),target=this.selectTarget(players);this.phaseClock=1.2;
    if(part.destroyed)return;if(part.kind==='payload')this.singleBomb(part,target);else this.turretBurst(id,target,false);
  }
  update(dt,{players=[],bounds,paused=false}={}){
    if(this.dead||paused||!Number.isFinite(dt)||dt<=0)return;if(this.disabled())this.enterLastStand();
    let left=0,right=0;for(const id of RVIII_LEFT_DRIVES)if(!this.partAlive(id))left++;for(const id of RVIII_RIGHT_DRIVES)if(!this.partAlive(id))right++;
    this.easeSpeed(112*this.speedRatio(),18,dt);const committed=this.phase==='bomb-align'||this.phase==='bomb-approach'||this.phase==='bomb-run'?this.runAngle:null;if(Number.isFinite(committed))this.basicHoldUntil=Math.max(this.basicHoldUntil||0,(this.combatTime||0)+.45);this.fly(dt,players,bounds,this.currentSpeed,(this.wings()===2?.4:.28),(left-right)*.075,committed);
    if(this.phase==='last-stand'){this.lastStand(dt,players);return;}if(this.phase==='barrage'){this.barrage(dt,players);return;}
    if(this.phase==='bomb-align'||this.phase==='bomb-approach'||this.phase==='bomb-run'){this.bombRun(dt);return;}
    this.phaseClock+=dt;if(this.phase==='recovery'&&this.phaseClock>=3){this.phase='barrage';this.phaseClock=0;this.beat=0;this.coreVulnerable=false;this.command('phase-change',{phase:'barrage'});}
  }
}
