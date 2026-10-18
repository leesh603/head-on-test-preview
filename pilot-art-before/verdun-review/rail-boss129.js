const defaults = Object.freeze({speed:100,moveSeconds:3.6,brakeSeconds:0.65,aimSeconds:1.4,recoilSeconds:0.65,reloadSeconds:2.2,railHp:250,runawaySpeed:180,runawaySeconds:3.2});
const positive = n => Number.isFinite(n) && n > 0;

// Coordinates are world coordinates. Only the host applies the camera transform.
export class RailBossController {
  constructor({id,from,to,position=0.5,config={},emit=()=>{}}) {
    this.c={...defaults,...config};
    if(!id || !from || !to || !Object.values(this.c).every(positive)) throw new Error('Invalid rail boss configuration');
    if(![from.x,from.y,to.x,to.y,position].every(Number.isFinite) || position<0 || position>1) throw new Error('Invalid rail geometry');
    this.length=Math.hypot(to.x-from.x,to.y-from.y);
    if(this.length<1) throw new Error('Rail path too short');
    this.id=id; this.from={...from}; this.to={...to}; this.emit=emit;
    this.axis={x:(to.x-from.x)/this.length,y:(to.y-from.y)/this.length};
    this.s=position*this.length; this.direction=1; this.velocity=this.c.speed;
    this.phase='move'; this.time=0; this.broken=false; this.dead=false; this.target=null;
    this.railHp=this.c.railHp; this.hitFlash=0; this.shot=0;
    this.railTarget=null;
  }
  get pose(){return{x:this.from.x+this.axis.x*this.s,y:this.from.y+this.axis.y*this.s};}
  event(type,extra={}){this.emit({type,bossId:this.id,...this.pose,...extra});}
  enter(phase){this.phase=phase;this.time=0;}
  // Fix the destructible section to the world, never attach it to the train.
  setRailTarget({x,y,radius=30}) {
    if(![x,y].every(Number.isFinite)||!positive(radius)) throw new Error('Invalid rail target');
    if(this.railTarget) throw new Error('Rail target already placed');
    this.railTarget={x,y,radius};
  }
  hitRail(damage) {
    if(!Number.isFinite(damage)||damage<0) throw new Error('Invalid damage');
    if(this.dead||this.broken) return 0;
    const dealt=Math.min(damage,this.railHp);this.railHp-=dealt;this.hitFlash=0.14;
    if(this.railHp===0){
      this.broken=true;
      this.event('rail-break',{rail:this.railTarget && {...this.railTarget}});
      if(this.phase==='move'||this.phase==='brake'){
        this.brakeStart=this.velocity;this.enter('brake');
      }
    }
    return dealt;
  }
  startRunaway() {
    if(this.dead||this.phase==='runaway'||this.phase==='derailed') return false;
    this.target=null;this.velocity=Math.max(this.c.runawaySpeed,this.c.speed*1.7);
    this.enter('runaway');this.event('runaway-start',{brokenRail:this.broken});return true;
  }
  hitSegment({x0,y0,x1,y1,radius=0,damage}) {
    if(![x0,y0,x1,y1,radius,damage].every(Number.isFinite)||radius<0||damage<0) throw new Error('Invalid projectile');
    const r=this.railTarget;
    if(!r||this.broken||this.dead) return false;
    const dx=x1-x0,dy=y1-y0,l=dx*dx+dy*dy;
    const t=l?Math.max(0,Math.min(1,((r.x-x0)*dx+(r.y-y0)*dy)/l)):0;
    if(Math.hypot(x0+dx*t-r.x,y0+dy*t-r.y)>r.radius+radius) return false;
    this.hitRail(damage);return true;
  }
  update(dt,{paused=false,players=[]}={}) {
    if(!Number.isFinite(dt)||dt<0) throw new Error('Invalid delta time');
    if(paused||this.dead) return;
    // Bound catch-up after a suspended tab. Call from the host simulation clock.
    let left=Math.min(dt,0.25);
    while(left>1e-9){const h=Math.min(left,1/120);this.step(h,players);left-=h;}
  }
  step(dt,players) {
    this.hitFlash=Math.max(0,this.hitFlash-dt);this.time+=dt;
    if(this.phase==='move'){
      this.velocity=this.c.speed;
      this.advance(this.velocity*dt);
      if(this.time>=this.c.moveSeconds){this.brakeStart=this.velocity;this.enter('brake');}
    } else if(this.phase==='brake'){
      this.velocity=this.brakeStart*Math.max(0,1-this.time/this.c.brakeSeconds);
      this.advance(this.velocity*dt);
      if(this.time>=this.c.brakeSeconds){this.velocity=0;this.enter('aim');this.event('stopped');}
    } else if(this.phase==='aim'){
      this.velocity=0;
      const live=players.filter(p=>p.alive!==false&&Number.isFinite(p.x)&&Number.isFinite(p.y));
      if(!this.target && live.length){
        const p=live[this.shot%live.length],sample=.65;
        const vx=Number.isFinite(p.vx)?p.vx:0,vy=Number.isFinite(p.vy)?p.vy:0;
        this.target={x:p.x+vx*sample,y:p.y+vy*sample,vx,vy};
        this.event('aim',{target:{...this.target},seconds:this.c.aimSeconds});
        this.time=0;
      }
      if(this.target&&this.time>=this.c.aimSeconds){
        this.shot++;this.event('fire',{target:{...this.target},shot:this.shot});this.enter('recoil');
      }
    } else if(this.phase==='recoil'){
      if(this.time>=this.c.recoilSeconds)this.enter('reload');
    } else if(this.phase==='reload'&&this.time>=this.c.reloadSeconds){
      this.target=null;this.enter(this.broken?'aim':'move');
    } else if(this.phase==='runaway'){
      const ramp=1+Math.min(.45,this.time*.12);
      this.velocity=Math.max(this.c.runawaySpeed,this.c.speed*1.7)*ramp;
      this.advance(this.velocity*dt);
      const limit=this.broken?Math.min(.9,this.c.runawaySeconds):this.c.runawaySeconds;
      if(this.time>=limit){this.velocity=0;this.enter('derailed');this.event('derail',{brokenRail:this.broken});}
    } else if(this.phase==='derailed'){
      this.velocity=0;
    }
  }
  advance(distance){
    const s=(this.direction===1?this.s:2*this.length-this.s)+distance;
    // Reflection supports short tracks without position jumps outside the path.
    const period=2*this.length;
    const folded=((s%period)+period)%period;
    this.s=folded<=this.length?folded:period-folded;
    this.direction=folded<this.length?1:-1;
  }
  destroy(){if(this.dead)return;this.dead=true;this.velocity=0;this.target=null;this.enter('dead');this.event('cleanup');}
}
