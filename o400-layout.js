// Authored coordinates for the 184 x 122 2/3 O/400 sprite; nose is local -Y.
// Rendering, weapons and collision share this layout, including the tailplane.
export const O400_LAYOUT=Object.freeze({
 width:184,height:184*2/3,
 hull:'./o400-hull-20261101.webp',
 parts:Object.freeze([
  ['engine-left',-27,-23,7,.24],['engine-right',27,-23,7,.24],
  ['front-gun',0,-53,5,.13],['rear-gun',0,-14,5,.13],['bomb-bay',0,10,6,.22]
 ]),
 hulls:Object.freeze([
  [[-6,-57],[6,-57],[6,20],[4,49],[-4,49],[-6,20]],
  [[-90,-31],[-86,-37],[-7,-33],[7,-33],[86,-37],[90,-31],[90,-15],[85,-10],[7,-7],[-7,-7],[-85,-10],[-90,-15]],
  [[-80,-10],[-7,-8],[7,-8],[80,-10],[75,-3],[7,-2],[-7,-2],[-75,-3]],
  [[-37,35],[-32,31],[32,31],[37,35],[37,46],[32,51],[-32,51],[-37,46]],
  [[-32,-35],[-22,-35],[-21,-9],[-33,-9]],
  [[22,-35],[32,-35],[33,-9],[21,-9]]
 ].map(p=>Object.freeze(p.map(([x,y])=>Object.freeze({x,y})))))
});
