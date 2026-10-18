// Measured source registration for authored r10 art, in original atlas pixels.
// Carriages rotate on their trunnions; only barrel assemblies translate in recoil.
export const GALLIPOLI_WEAPON_FRAMES=Object.freeze({
 twin:{mount:[0,245,160,138],barrel:[245,261,160,210],tip:5,halfSpacing:24},
 howitzer:{mount:[506,238,160,145],barrel:[744,269,160,220],tip:3},
 aa:{mount:[1013,231,160,128],barrel:[1244,292,160,210],tip:7,halfSpacing:22}
});
export function drawGallipoliWeapon(c,im,p,state=0){
 if(!im?.naturalWidth)return;
 const f=GALLIPOLI_WEAPON_FRAMES[p.art],column=32+state*320;
 const paint=(frame,sx,sy,recoil)=>{const [y,h,px,py]=frame;c.save();c.translate(p.x,p.y);c.rotate(p.angle+Math.PI/2);c.translate(0,recoil);c.drawImage(im,column,y,320,h,-px*sx,-py*sy,320*sx,h*sy);c.restore();};
 const mountScale=p.size/280;
 paint(f.mount,mountScale,mountScale,0);
 const scale=p.muzzle/(f.barrel[3]-f.tip);
 const horizontal=p.art==='twin'?(p.barrelOffset||14)/f.halfSpacing:scale;
 paint(f.barrel,horizontal,scale,state===2?0:(p.recoil||0)*25);
}
export function gallipoliSectorArtState(b,sector){
 if(b.dead)return 2;
 const parts=sector.guards.map(id=>b.parts.get(id)).filter(Boolean);
 if(parts.length&&parts.every(p=>p.destroyed))return 2;
 return parts.some(p=>p.destroyed||p.hp<p.maxHp*.55)?1:0;
}
