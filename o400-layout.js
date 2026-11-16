// Authored coordinates for the 184 x 122 2/3 O/400 sprite; nose is local -Y.
// Rendering, weapons and collision share this layout, including the tailplane.
export const O400_LAYOUT=Object.freeze({
 width:184,height:184*2/3,
 hull:'./o400-painted-20261101.webp',
 parts:Object.freeze([
  ['engine-left',-27,-23,7,.24],['engine-right',27,-23,7,.24],
  ['front-gun',0,-53,5,.13],['rear-gun',0,-14,5,.13],['bomb-bay',0,10,6,.22]
 ]),
 // Painted nacelles are long, narrow structures, not 7px circles. These
 // local surface footprints stop at the actual component, never the wingtip.
 partFootprints:Object.freeze({
  'engine-left':{rx:6,ry:22},'engine-right':{rx:6,ry:22},
  'front-gun':{rx:7,ry:7},'rear-gun':{rx:7,ry:7},
  'bomb-bay':{rx:7,ry:8}
 }),
 // Remaining outer silhouette measured from the authored severe state.
 // Coordinates use unsigned lateral distance from the centerline.
 // The microscopic spaces between ribs are inside the wing contact envelope.
 severeWings:Object.freeze({
  left:[[40,-36],[79,-38],[86,-34],[90,-30],[89,-24],[87,-23],[89,-20],[87,-17],[82,-14],[80,-9],[77,-6],[65,-5],[40,-4]],
  right:[[40,-36],[80,-38],[83,-34],[87,-31],[90,-27],[90,-23],[89,-22],[90,-19],[87,-17],[83,-14],[80,-10],[77,-6],[65,-5],[40,-4]]
 }),
 hulls:Object.freeze([
  [[-6,-57],[6,-57],[6,20],[4,49],[-4,49],[-6,20]],
  [[-90,-31],[-86,-37],[-7,-33],[7,-33],[86,-37],[90,-31],[90,-15],[85,-10],[7,-7],[-7,-7],[-85,-10],[-90,-15]],
  [[-80,-10],[-7,-8],[7,-8],[80,-10],[75,-3],[7,-2],[-7,-2],[-75,-3]],
  [[-37,35],[-32,31],[32,31],[37,35],[37,46],[32,51],[-32,51],[-37,46]],
  [[-32,-35],[-22,-35],[-21,-9],[-33,-9]],
  [[22,-35],[32,-35],[33,-9],[21,-9]]
 ].map(p=>Object.freeze(p.map(([x,y])=>Object.freeze({x,y})))))
});

