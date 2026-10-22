// Measured points on the approved 1207 x 1303 connected Treffas atlas.
export const TREFFAS_ART={width:1207,height:1303,worldWidth:310,gunX:603,gunY:195,gunLength:132};
export const treffasPoint=(b,x,y)=>({x:b.x+x*Math.cos(b.heading||0)-y*Math.sin(b.heading||0),y:b.y+x*Math.sin(b.heading||0)+y*Math.cos(b.heading||0)});
export function treffasGunPivot(b){const s=TREFFAS_ART.worldWidth/TREFFAS_ART.width;return treffasPoint(b,(TREFFAS_ART.gunX-TREFFAS_ART.width/2)*s,(TREFFAS_ART.gunY-TREFFAS_ART.height/2)*s);}
export function treffasGunMuzzle(b){const p=treffasGunPivot(b),length=TREFFAS_ART.gunLength*TREFFAS_ART.worldWidth/TREFFAS_ART.width-(b.parts.get('turret')?.recoil||0)*4;return{x:p.x+Math.cos(b.gunAngle)*length,y:p.y+Math.sin(b.gunAngle)*length};}
export function treffasMgMuzzle(b,p,angle=p.aimAngle??p.angle??-Math.PI/2){return{x:b.x+p.x+Math.cos(angle)*20,y:b.y+p.y+Math.sin(angle)*20};}
export function fliegerGunPivot(b,p){const y=p.id==='car-flak'?-8:-3,a=p.angle||0;return{x:b.x+p.x-Math.sin(a)*y,y:b.y+p.y+Math.cos(a)*y};}
export function fliegerGunMuzzle(b,p,angle=p.shotAngle??((p.angle||0)-Math.PI/2),side=-1){const q=fliegerGunPivot(b,p),length=p.id==='car-flak'?60:30,offset=p.id==='car-flak'?52*length/303*side:0;return{x:q.x+Math.cos(angle)*length-Math.sin(angle)*offset,y:q.y+Math.sin(angle)*length+Math.cos(angle)*offset};}

