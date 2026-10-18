// Measured against the live 768px, nose-up sprites. All dimensions below
// are unscaled; drawing, mounts and swept collision use this single pose.
export const ALPS_BOMBER_LAYOUT=Object.freeze({
 gik:{width:300,height:300,engines:['leftEngine','rightEngine'],
  parts:[{id:'leftEngine',x:-61,y:3,radius:17,kind:'engine',hp:.072},{id:'rightEngine',x:61,y:3,radius:17,kind:'engine',hp:.072},
   {id:'cannon',x:0,y:-123,radius:12,kind:'gun',hp:.065},{id:'rearGun',x:0,y:121,radius:11,kind:'gun',hp:.052}],
  hull:[[-148,-60,148,-14],[-148,-8,148,34],[-17,-120,17,143],[-77,94,77,134]]},
 ca4:{width:330,height:330,engines:['leftEngine','centerEngine','rightEngine'],
  parts:[{id:'leftEngine',x:-66,y:-24,radius:17,kind:'engine',hp:.063},{id:'centerEngine',x:21,y:68,radius:14,kind:'engine',hp:.053},
   {id:'rightEngine',x:66,y:-24,radius:17,kind:'engine',hp:.063},{id:'bombBay',x:0,y:-20,radius:15,kind:'payload',hp:.07,hittable:false},
   {id:'frontGun',x:0,y:-143,radius:11,kind:'gun',hp:.047},{id:'rearGun',x:0,y:140,radius:11,kind:'gun',hp:.047}],
  hull:[[-163,-111,163,-68],[-163,-52,163,-12],[-163,7,163,50],[-16,-144,16,145],[-73,-22,-58,128],[58,-22,73,128],[-85,92,85,131]]}
});
export const alpsAngleDelta=(to,from)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));
export function alpsRotate(x,y,angle=0){const c=Math.cos(angle),s=Math.sin(angle);return{x:x*c-y*s,y:x*s+y*c};}
export function alpsPoint(body,x,y){const q=alpsRotate(x,y,body.hullYaw||0);return{x:body.x+q.x,y:body.y+q.y};}
export function alpsHullExtents(body){const l=ALPS_BOMBER_LAYOUT[body.kind],s=body.t?.geometryScale||body.geometryScale||1,c=Math.abs(Math.cos(body.hullYaw||0)),sn=Math.abs(Math.sin(body.hullYaw||0));return{halfWidth:(l.width*c+l.height*sn)*s/2,halfHeight:(l.height*c+l.width*sn)*s/2};}
export function alpsMuzzle(body,id,angle){const p=body.parts instanceof Map?body.parts.get(id):body.parts?.find(p=>p.id===id);if(!p)return{x:body.x,y:body.y};const a=angle??(body.hullYaw||0)+(id==='rearGun'?Math.PI/2:-Math.PI/2),length=(id==='cannon'?16:6)*(body.t?.geometryScale||body.geometryScale||1);return{x:body.x+p.x+Math.cos(a)*length,y:body.y+p.y+Math.sin(a)*length};}
function segmentCircle(x0,y0,x1,y1,x,y,r){const dx=x1-x0,dy=y1-y0,n=dx*dx+dy*dy,t=n?Math.max(0,Math.min(1,((x-x0)*dx+(y-y0)*dy)/n)):0;return Math.hypot(x-x0-dx*t,y-y0-dy*t)<=r;}
function segmentRect(a,b,rect,r){let lo=0,hi=1;for(const [k,min,max]of [['x',rect[0]-r,rect[2]+r],['y',rect[1]-r,rect[3]+r]]){const d=b[k]-a[k];if(Math.abs(d)<1e-9){if(a[k]<min||a[k]>max)return false;continue;}let u=(min-a[k])/d,v=(max-a[k])/d;if(u>v)[u,v]=[v,u];lo=Math.max(lo,u);hi=Math.min(hi,v);if(lo>hi)return false;}return true;}
export function locateAlpsHit(body,shot){
 if(body.hidden||body.dead)return null;
 const x0=shot.previousX??shot.x,y0=shot.previousY??shot.y,r=shot.radius||0;
 for(const p of body.parts.values())if(p.hittable&&!p.destroyed&&segmentCircle(x0,y0,shot.x,shot.y,body.x+p.x,body.y+p.y,p.radius+r))return{partId:p.id};
 const s=body.t.geometryScale||1,a=alpsRotate((x0-body.x)/s,(y0-body.y)/s,-body.hullYaw),b=alpsRotate((shot.x-body.x)/s,(shot.y-body.y)/s,-body.hullYaw);
 return body.coreVulnerable&&ALPS_BOMBER_LAYOUT[body.kind].hull.some(rect=>segmentRect(a,b,rect,r/s))?{partId:null}:null;
}
