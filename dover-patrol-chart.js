import {DOVER_COAST_PROFILE} from './dover-terrain-profile.js?v=dover3';
// One authored coast profile, mirrored continuously north and south.
export const DOVER_MAP=Object.freeze({width:6144,height:9216,inset:320,coastInset:240,entryY:.47,entryOffshore:330});
const charts=new WeakMap(),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function doverProfileRow(row){
 const last=DOVER_COAST_PROFILE.length-1,phase=((row%(last*2))+last*2)%(last*2);
 return phase<=last?phase:last*2-phase;
}
export function doverWorldBounds(game){
 const chart=doverPatrolChart(game);return {...chart,originTop:chart.top,top:-Infinity,bottom:Infinity};
}
export function doverPatrolChart(game){
 if(!game)return {left:0,top:0,right:DOVER_MAP.width,bottom:DOVER_MAP.height,...DOVER_MAP};
 const loop=game.stageBoss?.stages?.loopIndex||0;let chart=charts.get(game);
 if(!chart||chart.loop!==loop){const entry=DOVER_MAP.entryY*(DOVER_COAST_PROFILE.length-1),i=Math.floor(entry),t=entry-i;
  const shore=DOVER_COAST_PROFILE[i][0]*(1-t)+DOVER_COAST_PROFILE[i+1][0]*t;
  const left=(game.x||0)-shore*DOVER_MAP.width+DOVER_MAP.coastInset-DOVER_MAP.entryOffshore,top=(game.y||0)-DOVER_MAP.height*DOVER_MAP.entryY;
  chart=Object.freeze({left,top,right:left+DOVER_MAP.width,bottom:top+DOVER_MAP.height,loop,...DOVER_MAP});charts.set(game,chart);}
 return chart;
}
// The west chalk cliff is the shared northbound guide, in the same world
// coordinates as the rendered shore. Look ahead through each headland.
export function doverCliffRoute(chart,y,offshore=330,lookAhead=380){
 const height=chart.height||chart.bottom-chart.top,width=chart.width||chart.right-chart.left;
 const north=y-lookAhead;
 const row=doverProfileRow((north-(chart.originTop??chart.top))/height*(DOVER_COAST_PROFILE.length-1)),i=Math.min(DOVER_COAST_PROFILE.length-2,Math.floor(row)),t=row-i;
 const shore=DOVER_COAST_PROFILE[i][0]*(1-t)+DOVER_COAST_PROFILE[i+1][0]*t;
 return {x:chart.left+shore*width-(chart.coastInset||240)+offshore,y:north};
}
export function doverFlightBounds(game){
 const c=doverPatrolChart(game),z=game.camera?.zoom||1;
 const ix=Math.max(c.inset,(game.viewWidth||960)/z/2+96);
 return {left:c.left+ix,right:c.right-ix,top:-Infinity,bottom:Infinity};
}
export function doverWaterInterval(game,y,margin=0){
 const c=doverPatrolChart(game),last=DOVER_COAST_PROFILE.length-1;
 const lo=Math.floor((y-margin-c.top)/c.height*last),hi=Math.ceil((y+margin-c.top)/c.height*last);
 let left=0,right=1;for(let i=lo;i<=hi;i++){const row=DOVER_COAST_PROFILE[doverProfileRow(i)];left=Math.max(left,row[0]);right=Math.min(right,row[1]);}
 return {left:c.left+left*c.width+margin,right:c.left+right*c.width-margin,top:-Infinity,bottom:Infinity};
}
export function doverHullMargin(e){return Math.hypot(e.hullLength||171,e.hullWidth||46)+32;}
export function doverShipAtSea(game,e){
 const q=doverWaterInterval(game,e.y,doverHullMargin(e));return e.x>=q.left&&e.x<=q.right&&e.y>=q.top&&e.y<=q.bottom;
}
export function doverPatrolSpawn(game,x,y,margin=205){
 const q=doverWaterInterval(game,y,margin);return {x:clamp(x,q.left,q.right),y};
}
export function doverShipCourse(game,e,desired){
 const r=doverHullMargin(e),look=Math.max(420,(e.sailingSpeed||26)*24);
 const x=e.x+Math.cos(desired)*look,y=e.y+Math.sin(desired)*look;
 if(doverShipAtSea(game,{...e,x,y}))return desired;
 const ty=y,q=doverWaterInterval(game,ty,r+look*.2);
 return Math.atan2(ty-e.y,clamp(x,q.left,q.right)-e.x);
}
