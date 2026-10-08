// Bruno only. These are committed world-space shots, never tracking hazards.
const clamp=(v,a,b)=>a>b?(a+b)/2:Math.max(a,Math.min(b,v));
export function brunoSalvo(target,phase,shot,bounds,{blind=false,final=false,broken=false,starved=false}={}){
 const speed=Math.hypot(target.vx||0,target.vy||0),ax=speed>10?(target.vx||0)/speed:0,ay=speed>10?(target.vy||0)/speed:-1;
 const radius=final?96:88,warning=final?(broken?.5:1.05):.9;
 const count=final?(broken?2:starved?6:8):5,interval=final?(broken?.16:starved?.3:.22):phase===1?.32:.42;
 const mode=final?'iron-rain':phase===1?'ranging':shot%2?'cross':'tracking';
 const points=[];
 // Keep an escape lane beside the salvo; reflect the march at a screen edge
 // rather than clamping several rounds into the same unavoidable pile.
 const margin=radius+28,b=bounds;
 const fold=(v,lo,hi)=>{if(hi<=lo)return(lo+hi)/2;const span=hi-lo,q=((v-lo)%(span*2)+span*2)%(span*2);return lo+(q<=span?q:span*2-q);};
 const origin={x:b?clamp(target.x,b.left+margin,b.right-margin):target.x,y:b?clamp(target.y,b.top+margin,b.bottom-margin):target.y};
 // Every volley twists its axis a little and picks one of three shapes, so the
 // same firing beat never traces the same straight lane twice.
 const shape=shot%3,twist=(shot%4-1.5)*.16,ca=Math.cos(twist),sa=Math.sin(twist);
 const bax=phase===1?0:ax,bay=phase===1?1:ay,dx=bax*ca-bay*sa,dy=bax*sa+bay*ca;
 for(let i=0;i<count;i++){
  if(final&&i===0){points.push({x:target.x,y:target.y});continue;}
  const along=final?i*(blind?72:94):phase===1?(i-2)*76:(i-2)*104;
  const side=final?Math.sin(i*.8)*(blind?50:90)
   :mode==='cross'?(i===4?0:i%2?110:-110)
   :shape===1?Math.sin(i*.9)*120
   :shape===2?i%2?86:-86
   :Math.sin(i*.6)*55;
  let x=origin.x-dy*side+dx*along,y=origin.y+dx*side+dy*along;
  if(b){x=fold(x,b.left+margin,b.right-margin);y=fold(y,b.top+margin,b.bottom-margin);}
  if(!final&&i===2&&!blind){x=origin.x;y=origin.y;}points.push({x,y});
 }
 return{target:{...target},points,mode,blind,final,radius,warning,interval,duration:final?.22:.35};
}
