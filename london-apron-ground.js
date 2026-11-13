import {CAPITAL_TERRAIN_SIZE} from './capital-terrain.js';
import {GROUND_FRAMES} from './ground-enemy-atlas.js?v=tame3';
import {searchlightGeometry} from './ground-searchlight-art.js';

export const APRON_GROUND={
 light:{kind:'light',size:54,radius:23},
 gun:{kind:'aa',size:50,radius:23}
};
// Paved junctions, squares and bridge approaches in the London terrain tile.
// The city tile repeats without mirroring, so each site repeats with it.
const SITES=[
 [83,75],[248,85],[678,123],[995,145],[1268,65],[1603,198],[1838,245],[2263,105],
 [2498,78],[25,310],[355,308],[648,455],[848,440],[1125,383],[1465,395],[1690,358],
 [2010,428],[2160,443],[2453,468],[38,523],[275,583],[590,578],[850,578],[1033,580],
 [1280,670],[1478,555],[1963,688],[2188,603],[2488,623],[105,785],[410,770],[618,720],
 [853,703],[1145,743],[1423,845],[1730,778],[1933,863],[2155,803],[2373,783],[508,958],
 [620,920],[980,930],[1825,1005],[2055,1083],[95,1585],[343,1485],[620,1455],[833,1475],
 [1163,1460],[1285,1438],[1590,1558],[1815,1633],[2060,1555],[2295,1500],[123,1745],[540,1755],
 [823,1723],[1033,1705],[1333,1780],[1853,1735],[2328,1720],[2453,1633],[590,2025],[883,1945],
 [1065,2065],[1403,2038],[1815,1990],[2160,2058],[2255,1888],[28,2188],[233,2235],[683,2203],
 [1158,2360],[1355,2208],[1590,2223],[1758,2278],[2080,2225],[2310,2273],[2495,2185],[205,2525],
 [370,2360],[893,2465],[1418,2505],[1630,2460],[1840,2438],[2053,2460],[2383,2475]
];

function stationNear(x,y,bossY,other){
 const tile=CAPITAL_TERRAIN_SIZE;
 let best=null,score=Infinity;
 for(const [sx,sy] of SITES){
  const px=sx+Math.round((x-sx)/tile)*tile,py=sy+Math.round((y-sy)/tile)*tile;
  if(other&&Math.hypot(px-other.x,py-other.y)<86)continue;
  const behind=Math.max(0,bossY-py);
  const cost=(px-x)**2+(py-y)**2+5*behind*behind;
  if(cost<score){score=cost;best={x:px,y:py};}
 }
 return best;
}

export function apronGroundSites(x,y,scale){
 const offset=Math.min(145,Math.max(80,94*scale)),front=y+Math.min(136,92*scale);
 const light=stationNear(x-offset,front,y);
 return {light,gun:stationNear(x+offset,front,y,light)};
}

const lamp=searchlightGeometry({faction:'entente'},APRON_GROUND.light.size);
const [, ,baseWidth,baseHeight]=GROUND_FRAMES.entente.aa[0].rect;
const [, , ,barrelHeight]=GROUND_FRAMES.entente.gun[0].rect;
const gunSize=APRON_GROUND.gun.size;
const gunMountY=-.04*gunSize*baseHeight/Math.max(baseWidth,baseHeight);
// The shared ground gun draws its barrel about the 70% pivot. The tip is
// four pixels below the top of the normal atlas frame.
const gunReach=gunSize*.66*(.70-4/barrelHeight);

export function apronGroundWeapon(id,x,y,target){
 const light=id==='light';
 const mountX=x+(light?lamp.mountX:0),mountY=y+(light?lamp.mountY:gunMountY);
 const angle=Math.atan2(target.y-mountY,target.x-mountX),reach=light?lamp.hh*.72:gunReach;
 return {x:mountX+Math.cos(angle)*reach,y:mountY+Math.sin(angle)*reach,angle};
}
