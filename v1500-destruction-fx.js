// V/1500 painted breakup; local deterministic presentation, no simulation RNG.
import {pushExplosionFx} from './explosion-profiles.js?v=b3bf991d11fc7798';
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
export const V1500_CASCADE_LIFE=2.2;
export function queueV1500CollapseFx(world,event){
 pushExplosionFx(world,{x:event.x,y:event.y,radius:event.radius,direction:event.direction||0,life:V1500_CASCADE_LIFE,maxLife:V1500_CASCADE_LIFE,fxProfile:'engineBreak',v1500Cascade:true,side:'enemy',kind:'v1500-breakup',pulseIndex:event.pulseIndex,final:!!event.final});
 // One sound per beat (not per layer), separated by >= .6s. No generic boom.
 if(event.sound){world.event?.('bossSound','airframeBreak');world.shake=Math.max(world.shake||0,event.final?3.5:2);}
}
export function drawV1500CollapseFx(c,f,x,y,age,fx,radius=0){
 if(!f.v1500Cascade)return false;
 const t=Math.max(0,age),r=radius||Math.min(28,f.radius||20),a=f.direction||0,d=r*4.2;
 if(t<.09)fx(c,'profileFlash',x,y,d*.7,d*.7,a,(1-t/.09)*.85);
 if(t<.68){const q=clamp(t/.68),frame=Math.min(3,Math.floor(q*4));fx(c,'profileAir'+frame,x,y,d*(.65+q*.5),d*(.65+q*.5),a,Math.min(1,(1-q)*2));}
 if(t<1.15){const q=clamp(t/1.15);fx(c,'profileEngine',x,y-d*.08,d*(.54+q*.25),d*(.7+q*.25),a,clamp((1.15-t)/.28)*(.82-q*.3));}
 const smoke=clamp((t-.08)/.4)*clamp((V1500_CASCADE_LIFE-t)/.8);
 if(smoke>0){fx(c,'profileOil',x+d*.12*Math.sin(f.pulseIndex*2.4),y-d*(.08+t*.18),d*(.65+t*.3),d*(.65+t*.34),a*.15,smoke*.72);}
 if(t>.08&&t<1.75)for(let i=0;i<2;i++){const angle=(f.pulseIndex||0)*2.1+i*2.4,q=t/1.75;fx(c,'metalShard'+((i+(f.pulseIndex||0))%4),x+Math.cos(angle)*d*q*.7,y+Math.sin(angle)*d*q*.5+d*q*q*.5,d*.17,d*.22,angle+t*(i?-2:3),(1-q)*.85);}
 return true;
}
