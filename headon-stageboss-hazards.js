import {FixedPool} from './headon-stageboss-pool.js';
const wrap = angle => Math.atan2(Math.sin(angle),Math.cos(angle));
const segmentDistance = (px,py,x0,y0,x1,y1) => {
  const dx=x1-x0,dy=y1-y0,len=dx*dx+dy*dy,t=len?Math.max(0,Math.min(1,((px-x0)*dx+(py-y0)*dy)/len)):0;
  return Math.hypot(px-x0-t*dx,py-y0-t*dy);
};
export function contains(h,p) {
  const radius=p.radius||0;
  if(h.kind==='rect')return Math.abs(p.x-h.x)<=h.width/2+radius&&Math.abs(p.y-h.y)<=h.height/2+radius;
  if(h.kind==='beam'){const x1=h.x+Math.cos(h.angle)*h.length,y1=h.y+Math.sin(h.angle)*h.length;return segmentDistance(p.x,p.y,h.x,h.y,x1,y1)<=h.thickness/2+radius;}
  if(h.kind==='searchlight')return Math.hypot(p.x-h.x,p.y-h.y)<=h.radius+radius&&Math.abs(wrap(Math.atan2(p.y-h.y,p.x-h.x)-h.angle))<=h.halfAngle;
  return Math.hypot(p.x-h.x,p.y-h.y)<=h.radius+radius;
}
export class BossHazards {
  constructor({capacity=512,onDamage,onStatus,onBarrierContact,onActivate=()=>{}}) {
    for(const fn of [onDamage,onStatus,onBarrierContact])if(typeof fn!=='function')throw new Error('Hazard adapters required');
    Object.assign(this,{onDamage,onStatus,onBarrierContact,onActivate});this.serial=0;
    this.pool=new FixedPool(capacity,()=>({hits:new Set()}));
  }
  spawn(spec) {
    if(!['circle','rect','projectile','searchlight','beam'].includes(spec.kind)||!spec.encounterId)throw new Error('Invalid hazard');
    for(const key of ['x','y','damage'])if(!Number.isFinite(spec[key]))throw new Error('Invalid hazard '+key);
    if(spec.damage<0||!(spec.duration>0)||!Number.isFinite(spec.duration))throw new Error('Invalid hazard damage/duration');
    if(spec.kind==='beam'&&(!(spec.length>0)||!(spec.thickness>0)||!Number.isFinite(spec.angle)))throw new Error('Invalid beam geometry');
    for(const key of ['delay','warning'])if(spec[key]!=null&&(!Number.isFinite(spec[key])||spec[key]<0))throw new Error('Invalid hazard phase');
    const h=this.pool.acquire();if(!h)return null;
    h.hits.clear();Object.assign(h,{
      id:'boss-hazard-'+(++this.serial),encounterId:spec.encounterId,bossId:spec.bossId,kind:spec.kind,
      x:spec.x,y:spec.y,vx:spec.vx||0,vy:spec.vy||0,radius:spec.radius||6,width:spec.width||1,height:spec.height||1,
      angle:spec.angle||0,angularSpeed:spec.angularSpeed||0,halfAngle:spec.halfAngle||.15,length:spec.length||1,thickness:spec.thickness||1,
      endX:spec.endX??null,endY:spec.endY??null,endVx:spec.endVx||0,
      damage:spec.damage,age:0,delay:spec.delay||0,warning:spec.warning||0,duration:spec.duration,
      tickInterval:spec.tickInterval||.5,nextTick:0,phase:'waiting',once:!!spec.once,applied:false,activated:false,
      targetId:spec.targetId,lockAtWarning:!!spec.lockAtWarning,locked:false,offsetX:spec.offsetX||0,offsetY:spec.offsetY||0,
      blocks:!!spec.blocks,piercing:!!spec.piercing,visual:spec.visual||spec.kind,tag:spec.tag||null
    });return h;
  }
  update(dt,{players,paused=false}) {
    if(paused||dt===0)return;if(!Number.isFinite(dt)||dt<0)throw new Error('Invalid hazard step');
    this.pool.visit(h=>{
      const before=h.age;h.age+=dt;
      if(h.age<h.delay)return;
      if(h.lockAtWarning&&!h.locked) {
        const p=players.find(p=>p.alive&&p.id===h.targetId)||players.find(p=>p.alive);
        if(p){h.x=p.x+h.offsetX;h.y=p.y+h.offsetY;}h.locked=true;
      }
      const start=h.delay+h.warning;
      if(h.age<start){h.phase='warning';return;}
      h.phase='active';if(!h.activated){h.activated=true;this.onActivate(h);}
      const elapsed=Math.min(h.duration,Math.max(0,h.age-start));
      const activeDt=elapsed-Math.min(h.duration,Math.max(0,before-start)),oldX=h.x,oldY=h.y;
      h.x+=h.vx*activeDt;h.y+=h.vy*activeDt;h.angle+=h.angularSpeed*activeDt;
      if(h.kind==='beam'&&h.endX!==null){h.endX+=h.endVx*activeDt;h.angle=Math.atan2(h.endY-h.y,h.endX-h.x);h.length=Math.hypot(h.endX-h.x,h.endY-h.y);}
      if(h.kind==='projectile') {
        for(const p of players)if(h.active&&p.alive&&!h.hits.has(p.id)&&segmentDistance(p.x,p.y,oldX,oldY,h.x,h.y)<=h.radius+(p.radius||0)) {
          h.hits.add(p.id);this.onDamage(p.id,h.damage,h);
          if(!h.piercing){this.pool.release(h.index,h.generation);break;}
        }
      }else {
        if(h.blocks)for(const p of players)if(p.alive&&contains(h,p))this.onBarrierContact(p.id,h);
        if((!h.once||!h.applied)&&elapsed>=h.nextTick) {
          h.nextTick=elapsed+h.tickInterval;h.applied=true;
          for(const p of players)if(p.alive&&contains(h,p)) {
            if(h.kind==='searchlight')this.onStatus(p.id,{type:'searchlight',seconds:.3,speedFactor:.7,aimFactor:1.3,sourceId:h.id,encounterId:h.encounterId});
            else this.onDamage(p.id,h.damage,h);
          }
        }
      }
      if(h.active&&h.age>=start+h.duration)this.pool.release(h.index,h.generation);
    });
  }
  isIlluminated(player) {let found=false;this.pool.visit(h=>{if(h.kind==='searchlight'&&h.phase==='active'&&contains(h,player))found=true;});return found;}
  clear(encounterId) {this.pool.clear(h=>h.encounterId===encounterId);}
  clearTagged(encounterId,tag) {this.pool.clear(h=>h.encounterId===encounterId&&h.tag===tag);}
}
