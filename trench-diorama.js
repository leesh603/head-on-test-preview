// Authored 18-second background choreography. No gameplay entities, RNG,
// soldier AI, collisions, particles, canvas allocation or pixel reads.
export const DIORAMA=Object.freeze({period:1254,seconds:18,fps:8,frames:144,slots:7,cell:256,decodedBytes:4194304});
// Coordinates measured on terrain-trenches359r2's existing trench exits.
export const SITES=Object.freeze([
 Object.freeze({x:425,y:327,phase:0,angle:0}),
 Object.freeze({x:839,y:753,phase:6.75,angle:Math.PI})
]);
const stride=6,commands=new Float32Array(DIORAMA.frames*DIORAMA.slots*stride);
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
// Each command is an entire painted group/effect, never an individual soldier.
function command(f,slot,cell,x,y,size,alpha,angle=0){const i=(f*DIORAMA.slots+slot)*stride;commands[i]=cell;commands[i+1]=x;commands[i+2]=y;commands[i+3]=size;commands[i+4]=alpha;commands[i+5]=angle;}
for(let f=0;f<DIORAMA.frames;f++){
 const t=f/DIORAMA.fps,run=clamp((t-2)/5),retreat=clamp((t-11)/4),cover=t>=7&&t<11;
 // Machine guns at fixed trench parapets. Flash poses stop during the lull.
 command(f,0,12+(f%3===0?1:0),-54,-57,39,t<12?.85:0,-.22);
 command(f,1,12+(f%4===0?1:0),143,-96,37,t<10?.72:0,Math.PI);
 // Squad leaves the existing exit, reaches shell-hole cover, withdraws along
 // the same open corridor. Smoke masks the transition to shelter poses.
 const travel=retreat?1-smooth(retreat):smooth(run),alpha=t<1?0:t>15?0:Math.min(1,(t-1)*2, (15-t)*2);
 command(f,2,cover?6:(t>=11?4+(f%2):f%4),-4+travel*74,44-travel*58,72,alpha*.83,t>=11?-.2:0);
 // Second, staggered section takes casualties in the dust, then disperses.
 const q=clamp((t-3.5)/4),d=clamp((t-11)/4);
 command(f,3,t<7.5?4+(f%2):t<8.2?5:t<10?6:7,111-q*31+d*31,-77+q*52-d*16,61,t<3.5?0:t>15?0:Math.min(1,(t-3.5)*2,(15-t)*1.5)*.8);
 // Two fixed impacts; growth, drift and fade are baked into this small table.
 for(let n=0;n<2;n++){
  const age=t-(n?8:5.5),life=age<0?0:age<.25?1:1-smooth((age-2)/6);
  const cell=age<.3?8:age<.7?9:age<1.5?10:11;
  command(f,4+n,cell,n?81:35,n?-26:-5,age<0?0:Math.min(112,40+age*14),Math.max(0,life)*.66);
 }
 // A wreck on the existing open shoulder: a persistent landmark, subtle fire.
 command(f,6,14+(Math.floor(t*4)%2),123,62,68,.8);
}
let image=null,loading=null,generation=0,failed=false,settle=null;
export const dioramaStats={ready:false,draws:0,zones:0,frame:0,decodedBytes:0};
export function prepareTrenchDiorama(){
 if(loading)return loading;if(failed||typeof Image==='undefined')return Promise.resolve(false);
 const token=++generation,im=new Image();image=im;im.decoding='async';
 loading=new Promise(resolve=>{settle=resolve;im.onload=async()=>{try{await im.decode?.()}catch{}if(token!==generation){resolve(false);return}dioramaStats.ready=im.naturalWidth===1024;dioramaStats.decodedBytes=dioramaStats.ready?DIORAMA.decodedBytes:0;resolve(dioramaStats.ready)};im.onerror=()=>{failed=true;resolve(false)};im.src='./trench-diorama-20261016.webp?v=headon-result339-20261028'});
 return loading;
}
export function releaseTrenchDiorama(){if(!image)return;generation++;settle?.(false);settle=null;image.onload=image.onerror=null;image.src='';image=null;loading=null;dioramaStats.ready=false;dioramaStats.decodedBytes=0;}
export function drawTrenchDiorama(c,cx,cy,width,height,time,mobile=false,reduced=false,enabled=true){
 dioramaStats.draws=0;dioramaStats.zones=0;
 if(!enabled||reduced){releaseTrenchDiorama();return 0;}
 if(!dioramaStats.ready){prepareTrenchDiorama();return 0;}
 const left=cx-width/2,top=cy-height/2,s=DIORAMA.period,maxZones=mobile?1:2;
 // Choose only the local tile(s); strict screen culling before any transforms.
 c.save();c.globalAlpha*=.84;c.imageSmoothingEnabled=true;
 for(let iy=Math.floor((top-180)/s);iy<=Math.floor((top+height+180)/s);iy++)for(let ix=Math.floor((left-180)/s);ix<=Math.floor((left+width+180)/s);ix++)for(let z=0;z<SITES.length;z++){
  if(dioramaStats.zones>=maxZones)break;
  const site=SITES[z],x=ix*s+site.x-left,y=iy*s+site.y-top;
  if(x+210<0||x-210>width||y+210<0||y-210>height)continue;
  const phase=site.phase+((ix*7+iy*11)%13+13)%13,rate=mobile?6:8;
  const f=Math.floor((((Math.floor(time*rate)/rate+phase)%18)+18)%18*8),offset=f*DIORAMA.slots*stride;
  dioramaStats.frame=f;dioramaStats.zones++;c.save();c.translate(x,y);c.rotate(site.angle);
  for(let k=0;k<DIORAMA.slots;k++){
   const i=offset+k*stride,a=commands[i+4],size=commands[i+3];if(a<=0||size<=0)continue;
   const cell=commands[i];c.save();c.translate(commands[i+1],commands[i+2]);c.rotate(commands[i+5]);c.globalAlpha*=a;
   c.drawImage(image,(cell%4)*256,Math.floor(cell/4)*256,256,256,-size/2,-size/2,size,size);c.restore();dioramaStats.draws++;
  }c.restore();
 }c.restore();return dioramaStats.draws;
}
