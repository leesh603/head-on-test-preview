// Geometry for authored pilot effects. Nothing here changes flight physics.
export function signatureRingPose(p){
 const s=p.pilotSignatureState;if(!s)return null;
 const h=s.activationHeading||0;
 const wx=s.activationPoint.x+Math.cos(h)*80,wy=s.activationPoint.y+Math.sin(h)*80;
 const dx=wx-p.x,dy=wy-p.y;
 return {x:dx*Math.cos(p.a)+dy*Math.sin(p.a),y:-dx*Math.sin(p.a)+dy*Math.cos(p.a),angle:h-p.a+Math.PI/2-.24,worldX:wx,worldY:wy};
}
export function signatureWingPositions(p){
 const allies=p.combatWorld?.().allies||p.allies||[];
 return allies.filter(a=>a.life>0&&(a.ownerId===(p.id||'p1')||(!p.world&&!p.players&&a.ownerId===undefined)))
  .slice(0,6).map(a=>{const dx=a.x-p.x,dy=a.y-p.y;return {x:dx*Math.cos(p.a)+dy*Math.sin(p.a),y:-dx*Math.sin(p.a)+dy*Math.cos(p.a),a:(a.a||0)-p.a,fire:a.fire||0,muzzleFlash:a.muzzleFlash||0,muzzleAngle:(a.muzzleAngle??a.a??0)-p.a}});
}

