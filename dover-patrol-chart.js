// A shared world-space channel for coast art and surface patrol spawning.
// Responsive chart width is fixed at first entry, never at camera movement.
const charts=new WeakMap();
export function doverPatrolChart(game,width=game?.viewWidth||960){
 if(!game)return {x:0,y:0,halfChannel:350};
 let chart=charts.get(game);
 if(!chart){chart=Object.freeze({x:game.x||0,y:game.y||0,halfChannel:Math.max(155,Math.min(350,width*.3))});charts.set(game,chart);}
 return chart;
}
export function doverPatrolSpawn(game,x,y,margin=62){
 const c=doverPatrolChart(game),reach=Math.max(50,c.halfChannel-margin);
 return {x:Math.max(c.x-reach,Math.min(c.x+reach,x)),y};
}
