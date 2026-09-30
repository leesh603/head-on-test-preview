// All coordinates use the existing 640 px hull art, drawn on a square 256 px
// canvas. Simulation, mounts, barrel pivots and rendering share this scale.
export const TRENCH_ARMOR_SIZE=256;
export const TRENCH_ARMOR_LAYOUT=Object.freeze({
 'a7v-flak':{
  gunSize:72,gunIds:['front','left','rear','right'],
  guns:[{id:'front',x:0,y:-84,baseAngle:-Math.PI/2},{id:'rear',x:0,y:84,baseAngle:Math.PI/2},
    {id:'left',x:-49,y:-2,baseAngle:Math.PI},{id:'right',x:55,y:-2,baseAngle:0}],
  trackX:50,trackY:52,trackHalfLength:88,trackWidth:13,engineY:-6
 },
 'mark-v-cruiser':{
  gunSize:100,gunIds:['sponson-left','sponson-right'],
  guns:[{id:'sponson-left',x:-57,y:-24,baseAngle:Math.PI},{id:'sponson-right',x:57,y:-24,baseAngle:0}],
  trackX:38,trackY:64,trackHalfLength:113,trackWidth:13,engineY:14
 }
});
export const armorRotate=(x,y,a)=>({x:x*Math.cos(a)-y*Math.sin(a),y:x*Math.sin(a)+y*Math.cos(a)});
export const armorAngleDelta=(to,from)=>Math.atan2(Math.sin(to-from),Math.cos(to-from));
