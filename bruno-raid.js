// Bruno only. These are committed world-space shots, never tracking hazards.
const clamp=(v,a,b)=>a>b?(a+b)/2:Math.max(a,Math.min(b,v));
export function brunoSalvo(target,phase,shot,bounds,{blind=false,final=false,broken=false,starved=false,extra=0}={}){
 const speed=Math.hypot(target.vx||0,target.vy||0),ax=speed>10?(target.vx||0)/speed:0,ay=speed>10?(target.vy||0)/speed:-1;
 const radius=final?96:88,warning=final?(broken?.5:1.05):.9;
 const count=final?(broken?2:starved?6:8):5+Math.max(0,Math.min(2,extra|0)),interval=final?(broken?.16:starved?.3:.22):(phase===1?.32:.42)*5/count;
 const mode=final?'iron-rain':phase===1?'ranging':shot%2?'cross':'tracking';
 const points=[],offsets=[];
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
  if(final&&i===0){points.push({x:target.x,y:target.y});offsets.push(0);continue;}
  const along=final?i*(blind?140:164):phase===1?(i-2)*156:(i-2)*176;
  const side=final?Math.sin(i*.8)*(blind?66:112)
   :phase===1?(i<2?-1:1)*radius*1.85
   :mode==='cross'?(i===4?0:i%2?148:-148)
   :shape===1?Math.sin(i*.9)*136
   :shape===2?i%2?104:-104
   :Math.sin(i*.6)*55;
  let x=origin.x-dy*side+dx*along,y=origin.y+dx*side+dy*along;
  if(b){x=fold(x,b.left+margin,b.right-margin);y=fold(y,b.top+margin,b.bottom-margin);}
  if(!final&&i===2&&!blind){x=origin.x;y=origin.y;}points.push({x,y});offsets.push(side);
 }
 // Independent reflections used to pile several rounds onto one coordinate
 // near the edge. Keep the true aim point and spread satellites along this
 // attack's axis, never across to the opposite escape flank.
 const anchor=!final&&!blind?2:0,placed=[points[anchor]],chosen=new Map([[anchor,points[anchor]]]),gap=radius*1.65,step=radius*1.9;
 const clear=p=>placed.every(q=>Math.hypot(p.x-q.x,p.y-q.y)>=gap);
 for(let i=0;i<points.length;i++){
  if(i===anchor)continue;let p=points[i];
  if(!clear(p)){
   p=null;
   for(const spread of [0,radius*.3,radius*.6]){for(const n of [1,-1,2,-2,3,-3]){const side=Math.sign(offsets[i])||(i%2?1:-1),q={x:points[i].x+dx*step*n-dy*side*spread,y:points[i].y+dy*step*n+dx*side*spread};
    if(b){q.x=fold(q.x,b.left+margin,b.right-margin);q.y=fold(q.y,b.top+margin,b.bottom-margin);}
    const flank=-dy*(q.x-origin.x)+dx*(q.y-origin.y);
    if(offsets[i]&&Math.sign(offsets[i])*flank < -radius*.2)continue;
    if(clear(q)){p=q;break;}
   }if(p)break;}
  }
  // A constrained edge may fit fewer distinct impacts. Never stack shells or
  // fill the remaining dodge lane just to reach the nominal shot count.
  if(p){placed.push(p);chosen.set(i,p);}
 }
 return{target:{...target},points:[...chosen].sort((a,b)=>a[0]-b[0]).map(([,p])=>p),mode,blind,final,radius,warning,interval,duration:final?.22:.35};
}
