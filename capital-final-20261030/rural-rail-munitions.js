// Alternate shells supplement the railway guns' native salvo / 520 mm impact.
// Select by completed gun firings, so damage, aim updates and frame rate cannot reroll a shell.
export function railMunition(shots,final=false){return final?'he':['he','fragmentation','gas','staggered','he'][Math.max(0,shots|0)%5];}
export function railSalvoBeat(index,count,munition){
 if(munition!=='staggered')return index;
 const evens=Math.ceil(count/2);return index%2?evens+(index-1)/2:index/2;
}
export function railMunitionHazards(kind,plan,munition,origin,bounds){
 if(plan.final||munition==='he')return[];
 const heavy=kind==='lincomparable',p=plan.target,points=plan.points||[p],interval=plan.interval||.32;
 const impact=heavy?.02:(plan.warning??.9)+Math.min(2,points.length-1)*interval;
 const angle=Math.atan2(p.y-origin.y,p.x-origin.x),out=[];
 if(munition==='fragmentation'){
  const at=impact+.4,count=heavy?12:9,speed=heavy?210:185;
  out.push({kind:'circle',x:p.x,y:p.y,warning:at,delay:0,duration:.24,once:true,radius:36,damage:.4,visual:'aa-flak',ordnanceFamily:'fragmentation'});
  // A broad escape wedge points away from the gun; shards travel on fixed bearings.
  for(let i=0;i<count;i++){const a=angle+.7+i*(Math.PI*2-1.4)/(count-1);
   out.push({kind:'projectile',x:p.x,y:p.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,warning:0,delay:at,duration:heavy?1.4:1.2,radius:5,damage:.35,visual:'rail-shrapnel',ordnanceFamily:'fragmentation'});
  }
 }else if(munition==='gas'){
  const radius=Math.max(30,Math.min(heavy?166:140,bounds?(bounds.right-bounds.left)*.34:166));
  const seeds=heavy?[-1,1].map(side=>({x:p.x-Math.sin(angle)*side*radius*.82,y:p.y+Math.cos(angle)*side*radius*.82})):[points[0],points.at(-1)];
  for(const [i,q]of seeds.entries()){
   const margin=radius+16,x=bounds?Math.max(bounds.left+margin,Math.min(bounds.right-margin,q.x)):q.x,y=bounds?Math.max(bounds.top+margin,Math.min(bounds.bottom-margin,q.y)):q.y;
   out.push({kind:'circle',x,y,warning:heavy?.9:(plan.warning??.9)+(i?points.length-1:0)*interval+.25,delay:0,duration:4.8,once:false,tickInterval:.7,radius,damage:.2,visual:'rural-rail-gas',ordnanceFamily:'gas'});
  }
 }else if(munition==='staggered'&&heavy){
  for(const [i,side]of [-1,1].entries())out.push({kind:'circle',x:p.x-Math.sin(angle)*side*155,y:p.y+Math.cos(angle)*side*155,warning:1.1+i*.6,delay:0,duration:.25,once:true,radius:54,damage:.65,visual:'rail-shell-outer',ordnanceFamily:'rail-shell'});
 }
 return out;
}
