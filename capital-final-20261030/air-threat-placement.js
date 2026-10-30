import {GALLIPOLI_ROUTE,gallipoliPoint} from './gallipoli-route.js?v=capital-final-20261030&rail=42&ai=1018&sig=1019&boss=20261020b&phase=1021';
// Only the existing landward Gallipoli field-unit slot gains coastal balloons.
// Open water (sea/Jutland/Dover/harbor) keeps its original exclusions.
export function coastalBalloonAllowed(g){
 const region=g.worldRegion?.()??g.region;
 if([1,7,16,17].includes(region))return false;
 if(region!==14)return true;
 return !!g.gallipoliRoute&&g.gallipoliRoute.maxForward>=GALLIPOLI_ROUTE.shore+150;
}
export function placeCoastalBalloon(g,e){
 if(g.worldRegion?.()!==14||e.fieldUnit!=='balloon')return;
 const r=g.gallipoliRoute;if(!r)return;
 const dx=e.x-r.x,dy=e.y-r.y,cs=Math.cos(r.a),sn=Math.sin(r.a);
 const along=Math.max(GALLIPOLI_ROUTE.shore+220,Math.min(GALLIPOLI_ROUTE.bossLimit-500,dx*cs+dy*sn));
 const lateral=Math.max(-GALLIPOLI_ROUTE.halfWidth+250,Math.min(GALLIPOLI_ROUTE.halfWidth-250,-dx*sn+dy*cs));
 Object.assign(e,gallipoliPoint(r,along,lateral));e.coastalLandPlacement=true;
}

export function placeCoastalGround(g,e){
 if(g.worldRegion?.()!==14)return;
 const anchor={...e,fieldUnit:'balloon'};placeCoastalBalloon(g,anchor);
 e.x=anchor.x;e.y=anchor.y;e.coastalLandPlacement=anchor.coastalLandPlacement===true;
}
