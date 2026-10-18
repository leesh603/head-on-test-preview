// Measured points on the approved 1207 x 1303 connected Treffas atlas.
export const TREFFAS_ART={width:1207,height:1303,worldWidth:310,gunX:603,gunY:195,gunLength:132};
export const treffasPoint=(b,x,y)=>({x:b.x+x*Math.cos(b.heading||0)-y*Math.sin(b.heading||0),y:b.y+x*Math.sin(b.heading||0)+y*Math.cos(b.heading||0)});
export function treffasGunPivot(b){const s=TREFFAS_ART.worldWidth/TREFFAS_ART.width;return treffasPoint(b,(TREFFAS_ART.gunX-TREFFAS_ART.width/2)*s,(TREFFAS_ART.gunY-TREFFAS_ART.height/2)*s);}
export function treffasGunMuzzle(b){const p=treffasGunPivot(b),length=TREFFAS_ART.gunLength*TREFFAS_ART.worldWidth/TREFFAS_ART.width-(b.parts.get('turret')?.recoil||0)*4;return{x:p.x+Math.cos(b.gunAngle)*length,y:p.y+Math.sin(b.gunAngle)*length};}
