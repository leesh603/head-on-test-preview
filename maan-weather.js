// Regional weather owns no player input or shared combat state. Sand offers
// cover from Ma'an targeting; circles and shells keep their visible warnings.
export const MAAN_SAND=Object.freeze({cap:3,mobileCap:2,rx:145,ry:84,speed:24,life:24,fade:3});
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
export function sandOpacity(s){return clamp(s.age/MAAN_SAND.fade)*clamp((s.life-s.age)/MAAN_SAND.fade);}
export function maanSandCover(weather,x,y){
 return !!weather?.cells.some(s=>sandOpacity(s)>.55&&((x-s.x)/s.rx)**2+((y-s.y)/s.ry)**2<.75);
}
export function tickMaanWeather(g,dt){
 if(g.stageBoss?.stages.stageIndex!==13){g.maanWeather=null;return;}
 if(g.state!=='playing'||dt<=0)return;
 const w=g.maanWeather??={age:0,serial:0,clock:0,cells:[]};w.age+=dt;w.clock-=dt;
 for(const s of w.cells){s.age+=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;}
 w.cells=w.cells.filter(s=>s.age<s.life&&Math.hypot(s.x-g.x,s.y-g.y)<1500);
 const mobile=(g.viewWidth||800)<720,cap=mobile?MAAN_SAND.mobileCap:MAAN_SAND.cap;
 if(w.clock<=0&&w.cells.length<cap){
  const i=w.serial++,side=i%2?-1:1;
  w.cells.push({id:i,x:g.x-side*(mobile?160:260),y:g.y-100+(i%3)*100,rx:MAAN_SAND.rx,ry:MAAN_SAND.ry,age:0,life:MAAN_SAND.life,vx:side*MAAN_SAND.speed,vy:-9,seed:i*1.71});w.clock=8;
 }
}
