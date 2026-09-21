export class BossPart {
  constructor({id,maxHp,x=0,y=0,radius=24,hittable=true,kind='weakpoint'}) {
    if(!id||!Number.isFinite(maxHp)||maxHp<=0)throw new Error('Invalid part');
    Object.assign(this,{id,maxHp,hp:maxHp,x,y,radius,hittable,kind});
  }
  get destroyed(){return this.hp<=0;}
  hit(damage){if(!Number.isFinite(damage)||damage<0)throw new Error('Invalid part damage');if(!this.hittable||this.destroyed)return 0;const dealt=Math.min(this.hp,damage);this.hp-=dealt;return dealt;}
}
export class BaseBoss {
  constructor({id,maxHp,x=0,y=0,coreRadius=80,parts=[],emit=()=>{}}) {
    if(!id||!Number.isFinite(maxHp)||maxHp<=0)throw new Error('Invalid boss');
    Object.assign(this,{id,maxHp,hp:maxHp,x,y,coreRadius,emit});this.timers=new Map();
    if(new Set(parts.map(p=>p.id)).size!==parts.length)throw new Error('Duplicate part ID');
    this.parts=new Map(parts.map(p=>[p.id,p instanceof BossPart?p:new BossPart(p)]));
    this.phase='active';this.coreVulnerable=true;this.dead=false;
  }
  hit({partId=null,damage}) {
    if(!Number.isFinite(damage)||damage<0)throw new Error('Invalid damage');
    if(this.dead)return{damage:0,blocked:true};
    if(partId){const p=this.parts.get(partId);if(!p)return{damage:0,blocked:true};const before=p.destroyed,dealt=p.hit(damage);
      if(!before&&p.destroyed){this.emit({type:'part-destroyed',bossId:this.id,partId});this.onPartDestroyed(p);}
      return{damage:dealt,partId,partDestroyed:!before&&p.destroyed};}
    if(!this.coreVulnerable)return{damage:0,blocked:true};
    const dealt=Math.min(this.hp,damage);this.hp-=dealt;
    if(this.hp<=0){this.dead=true;this.phase='defeated';this.emit({type:'body-defeated',bossId:this.id});}
    return{damage:dealt,bodyDefeated:this.dead};
  }
  onPartDestroyed(){}
  due(key,dt,interval) {
    if(!Number.isFinite(interval)||interval<=0)throw new Error('Invalid interval');
    interval/=this.t?.patternMultiplier||1;
    const left=(this.timers.get(key)??interval)-dt;
    this.timers.set(key,left<=0?interval:left);return left<=0;
  }
  locateHit({x,y,radius=0}) {
    for(const p of this.parts.values())if(p.hittable&&!p.destroyed&&Math.hypot(x-(this.x+p.x),y-(this.y+p.y))<=p.radius+radius)return{partId:p.id};
    return Math.hypot(x-this.x,y-this.y)<=this.coreRadius+radius?{partId:null}:null;
  }
  hitAt({x,y,radius=0,damage}) {
    // Part-first single route prevents one bullet damaging both a part and hull.
    for(const p of this.parts.values())if(p.hittable&&!p.destroyed&&Math.hypot(x-(this.x+p.x),y-(this.y+p.y))<=p.radius+radius)return this.hit({partId:p.id,damage});
    if(Math.hypot(x-this.x,y-this.y)<=this.coreRadius+radius)return this.hit({damage});
    return{damage:0,miss:true};
  }
  update(){}
}
export class BossEncounter {
  constructor({id,bossId,bodies}) {
    if(!id||!bodies?.length||new Set(bodies.map(b=>b.id)).size!==bodies.length)throw new Error('Invalid encounter');
    Object.assign(this,{id,bossId});this.bodies=new Map(bodies.map(b=>[b.id,b]));
    this.maxHpBudget=bodies.reduce((n,b)=>n+b.maxHp,0);
    for(const b of bodies)b.encounter=this;
  }
  get completed(){return this.bodies.size>0&&[...this.bodies.values()].every(b=>b.dead);}
  replaceBody(id,children) {
    const parent=this.bodies.get(id);if(!parent||!children.length||new Set(children.map(b=>b.id)).size!==children.length)return false;
    if(children.some(b=>b.id===id||this.bodies.has(b.id)))throw new Error('Duplicate split body ID');
    if(Math.abs(children.reduce((n,b)=>n+b.hp,0)-parent.hp)>1e-6)throw new Error('Split must conserve remaining HP');
    // Atomic replacement: never poll completion between parent removal and children insertion.
    this.bodies.delete(id);for(const b of children){b.encounter=this;this.bodies.set(b.id,b);}return true;
  }
  update(dt,ctx){for(const b of this.bodies.values())if(!b.dead){
    b.motionTime=(b.motionTime||0)+dt*(b.t?.motionMultiplier||1);b.recoil=Math.max(0,(b.recoil||0)-dt);
    if(b.t?.mobileBoss&&!b.role&&!b.ownsMotion129){
      b.anchorX??=b.x;b.anchorY??=b.y;
      const ship=['sms-stuttgart','hms-zubian'].includes(b.kind),rail=['paris-gun','lincomparable'].includes(b.kind);
      const armor=['a7v-flak','mark-v-cruiser'].includes(b.kind),fixed=['london-apron','drachen-net','armored-harbor-fortress'].includes(b.kind);
      const pace=armor?.18:ship?.42:rail?.55:.32,span=ship?110:rail||armor||fixed?0:65;
      if(rail&&b.railBroken){b.x=b.railStopX??b.x;b.y=b.railStopY??b.y;}
      else{b.x=b.anchorX+Math.sin(b.motionTime*pace)*span;
        b.y=b.anchorY+Math.sin(b.motionTime*pace)*(armor?65:fixed?0:rail?95:ship?55:30);}
    }
    b.update(dt,ctx);
    if(typeof b.suppressive==='function')b.suppressive(dt,ctx.players);
  }}
  snapshot() {
    let hp=0,aliveParts=0,totalParts=0,shielded=false;const phases=[];
    for(const b of this.bodies.values()){
      hp+=Math.max(0,b.hp);shielded||=!b.dead&&!b.coreVulnerable;phases.push(b.phase);
      for(const p of b.parts.values()){totalParts++;if(!p.destroyed)aliveParts++;}
    }
    return{id:this.id,bossId:this.bossId,hp,maxHp:this.maxHpBudget,shielded,aliveParts,totalParts,phases,completed:this.completed};
  }
}
