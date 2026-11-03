// RII-only painted breakup. No simulation RNG, damage, particles or new assets.
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
export const RII_CASCADE_LIFE=2.2;
export function riiCollapseSites(body){
 const parts=[...body.parts.values()],damage=p=>1-clamp(p.hp/p.maxHp);
 const engines=parts.filter(p=>p.kind==='engine').sort((a,b)=>damage(b)-damage(a)||a.id.localeCompare(b.id));
 const first=engines[0],second=engines.find(p=>Math.sign(p.localX)!==Math.sign(first.localX))||engines[1],side=body.crash?.side||1;
 const sites=[{x:first.localX,y:first.localY,partId:first.id},{x:side*280,y:-110},{x:second.localX,y:second.localY,partId:second.id},{x:-side*300,y:-110},{x:side*520,y:-105},{x:0,y:30},{x:-side*490,y:-100},{x:0,y:300,partId:'rudder'},{x:0,y:115}];
 let seed=2166136261;for(const c of String(body.id))seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
 const times=[0,.18,.47,.79,1.06,1.43,1.82,2.15,2.48],scale=clamp((body.geometryScale||.2)/.2,1,1.25);
 return sites.map((s,i)=>({...s,at:times[i]+(i&&i<8?(((seed>>>(i*3))&7)-3)*.005:0),radius:(i===8?24:16+(i%3)*2)*scale,final:i===8,sound:[0,3,6,8].includes(i),index:i}));
}
export function riiCollapsePulse(body,site){
 const a=body.hullYaw??body.a+Math.PI/2,scale=body.geometryScale*(1-.12*(body.defeatProgress||0)),x=site.x*scale,y=site.y*scale;
 return{type:'boss-destruction-pulse',fxStyle:'rii-cascade',x:body.x+x*Math.cos(a)-y*Math.sin(a),y:body.y+x*Math.sin(a)+y*Math.cos(a),radius:Math.min(28,site.radius),partId:site.partId,final:site.final,sound:site.sound,pulseIndex:site.index,direction:a};
}
export function queueRIICollapseFx(world,event,push){
 push(world,{x:event.x,y:event.y,radius:event.radius,direction:event.direction||0,life:RII_CASCADE_LIFE,maxLife:RII_CASCADE_LIFE,fxProfile:'engineBreak',riiCascade:true,side:'enemy',kind:'rii-breakup',pulseIndex:event.pulseIndex,final:!!event.final});
 // One sound per beat (not per layer), separated by >= .6s. No generic boom.
 if(event.sound){world.event('bossSound','airframeBreak');world.shake=Math.max(world.shake||0,event.final?3.5:2);}
}
export function drawRIICollapseFx(c,f,x,y,age,fx,radius=0){
 if(!f.riiCascade)return false;
 const t=Math.max(0,age),r=radius||Math.min(28,f.radius||20),a=f.direction||0,d=r*4.2;
 if(t<.09)fx(c,'profileFlash',x,y,d*.7,d*.7,a,(1-t/.09)*.85);
 if(t<.68){const q=clamp(t/.68),frame=Math.min(3,Math.floor(q*4));fx(c,'profileAir'+frame,x,y,d*(.65+q*.5),d*(.65+q*.5),a,Math.min(1,(1-q)*2));}
 if(t<1.15){const q=clamp(t/1.15);fx(c,'profileEngine',x,y-d*.08,d*(.54+q*.25),d*(.7+q*.25),a,clamp((1.15-t)/.28)*(.82-q*.3));}
 const smoke=clamp((t-.08)/.4)*clamp((RII_CASCADE_LIFE-t)/.8);
 if(smoke>0){fx(c,'profileOil',x+d*.12*Math.sin(f.pulseIndex*2.4),y-d*(.08+t*.18),d*(.65+t*.3),d*(.65+t*.34),a*.15,smoke*.72);}
 if(t>.08&&t<1.75)for(let i=0;i<2;i++){const angle=(f.pulseIndex||0)*2.1+i*2.4,q=t/1.75;fx(c,'metalShard'+((i+(f.pulseIndex||0))%4),x+Math.cos(angle)*d*q*.7,y+Math.sin(angle)*d*q*.5+d*q*q*.5,d*.17,d*.22,angle+t*(i?-2:3),(1-q)*.85);}
 return true;
}
