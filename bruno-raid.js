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
  points.push({x,y});
 }
 return{target:{...target},points,mode,blind,final,radius,warning,interval,duration:final?.22:.35};
}

// Four audible beats: prepare, lock, ranging row, heavy domino barrage.
// Sample once at aim time. Forecast the IMPACT time, not the current camera:
// a straight-flying pilot must meet a wall rather than leave every shell behind.
export function brunoRhythmSalvo(target,phase,shot,bounds,{blind=false}={}){
 const beat=.8,warning=.9,duration=.28;
 const vx=blind?0:(target.vx||0),vy=blind?0:(target.vy||0),speed=Math.hypot(vx,vy);
 const ax=speed>10?vx/speed:0,ay=speed>10?vy/speed:-1,nx=-ay,ny=ax;
 const width=bounds?Math.abs(nx)*(bounds.right-bounds.left)+Math.abs(ny)*(bounds.bottom-bounds.top):480;
 const span=clamp(width,320,960),columns=clamp(Math.ceil(span/160)*2,8,12),cell=span/columns;
 const radius=cell*.55,interval=Math.max(.45,cell/150),points=[],gaps=[];
 const left=columns/2-2,right=columns/2,first=shot%2?right:left;
 for(let row=0;row<4;row++){
  const start=row===0?0:beat+(row-1)*interval;
  const gap=phase===2&&row>=2?first+(first===left?1:-1)*(row-1):first;
  const side=(gap+1-columns/2)*cell,at=start+(columns-1)*.0225,lead=2*beat+at+warning;
  gaps.push({x:target.x+vx*lead+nx*side,y:target.y+vy*lead+ny*side,side,at:at+warning,row,
   halfWidth:1.5*cell-radius,nx,ny});
  // The heavier fourth-beat round is on the BLOCKED side, never in the gap.
  const heavyColumn=gap===left?columns-2:1;
  for(let column=0;column<columns;column++){
   if(column===gap||column===gap+1)continue;
   const at=start+column*.045,lead=2*beat+at+warning,offset=(column+.5-columns/2)*cell;
   const heavy=row===1&&column===heavyColumn;
   points.push({x:target.x+vx*lead+nx*offset,y:target.y+vy*lead+ny*offset,at,row,heavy,
    radius:heavy?Math.min(88,cell*1.25):radius});
  }
 }
 points.sort((a,b)=>a.at-b.at);
 return{target:{...target},points,gaps,mode:phase===1?'ranging':shot%2?'cross':'tracking',blind,
  rhythm:true,beat,warning,duration,radius,interval,ax,ay,nx,ny,cell,
  end:Math.max(3.2,points[points.length-1].at+warning+duration,points.find(p=>p.heavy).at+warning+1.3),secondCue:false};
}

// Eight real fragments from the heavy impact, fanning AWAY from its escape
// corridor. They punish circling outside the wall without sealing the safe lane.
export function brunoFragments(plan,point,speed=165){
 const gap=plan.gaps[point.row],side=(point.x-gap.x)*plan.nx+(point.y-gap.y)*plan.ny>=0?1:-1;
 const angle=Math.atan2(plan.ny*side,plan.nx*side),shots=[];
 for(let i=0;i<8;i++){
  const a=angle+(i-3.5)*.28;
  shots.push({x:point.x,y:point.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,radius:5,
   warning:0,delay:plan.warning,duration:1.3,kind:'projectile',visual:'rail-mg'});
 }
 return shots;
}
