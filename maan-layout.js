// Coordinates are shared by sprite composition, swept hits and gun muzzles.
export const MAAN_REGION=13;
export const MAAN_LAYOUT=Object.freeze({
 'wustenpanzer':{width:248,height:520,parts:[
  ['track-left',-99,0,25,242,'track'],['track-right',99,0,25,242,'track'],
  ['heavy-gun',0,-189,23,62,'gun'],['sponson-left',-77,-1,32,42,'gun'],['sponson-right',77,-1,32,42,'gun'],
  ['aa-left',-68,-174,20,24,'mg'],['aa-right',68,-174,20,24,'mg'],
  ['radiator',0,33,48,55,'cooling'],['engine',0,154,37,62,'engine']
 ]},
 'sinai-landship':{width:284,height:540,parts:[
  ['track-front-left',-92,-191,24,68,'track'],['track-front-right',92,-191,24,68,'track'],
  ['track-rear-left',-92,194,24,68,'track'],['track-rear-right',92,194,24,68,'track'],
  ['sponson-left-front',-112,-100,28,33,'gun'],['sponson-right-front',112,-100,28,33,'gun'],
  ['sponson-left-rear',-112,92,28,33,'gun'],['sponson-right-rear',112,92,28,33,'gun'],
  ['lewis',0,-145,35,32,'mg'],['tank',0,0,37,66,'fuel'],['command',0,171,48,45,'command'],['support',0,98,46,31,'support']
 ]}
});
export const rotateMaan=(x,y,a)=>({x:x*Math.cos(a)-y*Math.sin(a),y:x*Math.sin(a)+y*Math.cos(a)});
export function segmentBox(x0,y0,x1,y1,cx,cy,rx,ry,r=0){
 let lo=0,hi=1;
 for(const [start,end,center,half] of [[x0,x1,cx,rx+r],[y0,y1,cy,ry+r]]){
  const d=end-start;if(Math.abs(d)<1e-8){if(Math.abs(start-center)>half)return false;continue;}
  let a=(center-half-start)/d,b=(center+half-start)/d;if(a>b)[a,b]=[b,a];lo=Math.max(lo,a);hi=Math.min(hi,b);if(lo>hi)return false;
 }return true;
}
