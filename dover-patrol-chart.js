import {DOVER_COAST_PROFILE} from './dover-terrain-profile.js?v=dover3';
// One authored world, shared by rendering, flight boundaries and naval navigation.
export const DOVER_MAP=Object.freeze({width:6144,height:9216,inset:320});
const charts=new WeakMap(),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function doverPatrolChart(game){
 if(!game)return {left:0,top:0,right:DOVER_MAP.width,bottom:DOVER_MAP.height,...DOVER_MAP};
 const loop=game.stageBoss?.stages?.loopIndex||0;let chart=charts.get(game);
 if(!chart||chart.loop!==loop){const left=(game.x||0)-DOVER_MAP.width*.30,top=(game.y||0)-DOVER_MAP.height*.43;
  chart=Object.freeze({left,top,right:left+DOVER_MAP.width,bottom:top+DOVER_MAP.height,loop,...DOVER_MAP});charts.set(game,chart);}
 return chart;
}
export function doverFlightBounds(game){
 const c=doverPatrolChart(game),z=game.camera?.zoom||1;
 const ix=Math.max(c.inset,(game.viewWidth||960)/z/2+96),iy=Math.max(c.inset,(game.viewHeight||700)/z/2+96);
 return {left:c.left+ix,right:c.right-ix,top:c.top+iy,bottom:c.bottom-iy};
}
export function doverWaterInterval(game,y,margin=0){
 const c=doverPatrolChart(game),last=DOVER_COAST_PROFILE.length-1;
 const lo=clamp(Math.floor((y-margin-c.top)/c.height*last),0,last),hi=clamp(Math.ceil((y+margin-c.top)/c.height*last),0,last);
 let left=0,right=1;for(let i=lo;i<=hi;i++){left=Math.max(left,DOVER_COAST_PROFILE[i][0]);right=Math.min(right,DOVER_COAST_PROFILE[i][1]);}
 return {left:c.left+left*c.width+margin,right:c.left+right*c.width-margin,top:c.top+margin+40,bottom:c.bottom-margin-40};
}
export function doverHullMargin(e){return Math.hypot(e.hullLength||171,e.hullWidth||46)+32;}
export function doverShipAtSea(game,e){
 const q=doverWaterInterval(game,e.y,doverHullMargin(e));return e.x>=q.left&&e.x<=q.right&&e.y>=q.top&&e.y<=q.bottom;
}
export function doverPatrolSpawn(game,x,y,margin=205){
 const c=doverPatrolChart(game);y=clamp(y,c.top+margin+64,c.bottom-margin-64);
 const q=doverWaterInterval(game,y,margin);return {x:clamp(x,q.left,q.right),y};
}
export function doverShipCourse(game,e,desired){
 const r=doverHullMargin(e),look=Math.max(420,(e.sailingSpeed||26)*24);
 const x=e.x+Math.cos(desired)*look,y=e.y+Math.sin(desired)*look;
 if(doverShipAtSea(game,{...e,x,y}))return desired;
 const c=doverPatrolChart(game),ty=clamp(y,c.top+r+look,c.bottom-r-look),q=doverWaterInterval(game,ty,r+look*.2);
 return Math.atan2(ty-e.y,clamp(x,q.left,q.right)-e.x);
}
