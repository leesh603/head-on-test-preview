// Three late-roster pilots: local state, existing gun/collision/texture paths.
const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
const live=e=>e&&e.hp>0&&!e.crashed&&!e.rivalEscaped&&!e.expired;
export function threeState(p){
 const s=p.identityState();return s.three??=( {age:0,beat:-1,target:null,previous:null,hold:0,deflections:0,turn:0} );
}
export function beginThreeSkill(p){
 const s=threeState(p);Object.assign(s,{age:0,beat:-1,target:null,previous:null,hold:0,deflections:0,lane:p.a});
}
export function tickThreePilot(p,dt){
 if(!['proctor','schleich','lufbery'].includes(p.pilot)||!(p.hp>0)||p.status==='downed')return;
 const s=threeState(p),active=p.skillTime>0;
 s.turn=wrap(p.a-(s.heading??p.a))/Math.max(.001,dt);s.heading=p.a;
 if(!active){s.target=null;s.hold=0;s.beat=-1;return;}
 if(p.pilot==='proctor'){
  // Four deliberate firing windows replace uninterrupted boosted hose fire.
  // Keep the normal ammo/reload/input gate; never spawn a free extra projectile.
  const beat=Math.floor((s.age+1e-7)/.6),phase=s.age-beat*.6;
  if(beat!==s.beat){s.beat=beat;s.lane=p.a;}
  p.rate*=.24;p.revisionDamageMult*=1.35;p.speed*=1.15;p.baseSpeed*=1.15;
  if(phase>=.28)p.fire=Math.max(p.fire,dt+.015);
  p.aceSkillPhase=phase<.28?'salvo':'reacquire';
 }
 if(p.pilot==='schleich'){
  p.speed*=1.4;p.baseSpeed*=1.4;p.turn*=.75;p.aceSkillPhase='advance';
  // Intercept only incoming light rounds crossing the small forward quarter.
  // Rear shots, shells, rockets and explosions still have to be avoided.
  const ca=Math.cos(p.a),sa=Math.sin(p.a),world=p.combatWorld();
  let count=0;
  for(const b of world.bullets||[]){
   if(!b.enemy||!(b.life>0)||b.heavy||b.flak||b.rocket||b.bomb||b.fieldShell||b.actualExplosion||b.blast||b.shell||b.aceSpecial||b.visualType==='boss')continue;
   const dx=b.x-p.x,dy=b.y-p.y,vx=b.vx*dt,vy=b.vy*dt;
   if(dx*b.vx+dy*b.vy>=0)continue;
   const len=vx*vx+vy*vy,dot=dx*vx+dy*vy,outside=dx*dx+dy*dy-76*76;
   let q=0;if(outside>0){const disc=dot*dot-len*outside;if(!len||disc<0)continue;q=(-dot-Math.sqrt(disc))/len;if(q<0||q>1)continue;}
   const x=dx+vx*q,y=dy+vy*q;
   const front=x*ca+y*sa,side=-x*sa+y*ca;
   if(front<18||front>76||Math.abs(side)>front*.72||x*x+y*y>76*76+.001)continue;
   b.life=0;s.deflections++;
   if(count++<3){const px=p.x+x,py=p.y+y,a=p.a+(side<0?-1:1)*1.05;
    p.identityFx('ricochet',px,py,a,38,.28,{height:17,alpha:.88});
    p.identityFx('gunSmoke',px,py,a,34,.38,{height:18,alpha:.27});
   }
  }
 }
 if(p.pilot==='lufbery'){
  p.rate*=.7;p.revisionDamageMult*=1.2;p.aceSkillPhase='handoff';
  s.hold-=dt;
  const eligible=e=>live(e)&&Math.hypot(e.x-p.x,e.y-p.y)<=620&&Math.abs(wrap(Math.atan2(e.y-p.y,e.x-p.x)-p.a))<=.95;
  if(!eligible(s.target)||s.hold<=0){
   let best=null,distance=Infinity;
   for(const e of p.enemies||[]){if(!eligible(e)||e===s.target)continue;const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<distance){best=e;distance=d}}
   if(!best&&eligible(s.target))best=s.target;
   if(best!==s.target){s.previous=s.target;s.target=best;s.handoff=.3;}
   s.hold=.42;
  }
  s.handoff=Math.max(0,(s.handoff||0)-dt);
 }
 s.age+=dt;
}
export function threeGunDirection(p,base,gun){
 const s=p.pilotIdentity?.three;
 if(!(p.skillTime>0)||!s)return base;
 if(p.pilot==='proctor')return s.lane??base;
 if(p.pilot==='lufbery'&&gun!==1&&live(s.target))return Math.atan2(s.target.y-p.y,s.target.x-p.x);
 return base;
}
