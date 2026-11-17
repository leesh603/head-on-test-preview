import {CITY_FLAK_HULL_SIZE,CITY_FLAK_PIVOT_Y,CITY_FLAK_WEAPONS} from './city-flak-geometry.js?v=qf1023';
const frame=512;
export function drawCityFlakStructure(c,b,atlas){
 if(!atlas?.naturalWidth)return false;
 const size=CITY_FLAK_HULL_SIZE*(b.regionalScale||1),state=b.destroying||b.dead?2:b.coreVulnerable?1:0;
 // Draw exactly one complete registered roof; no mismatched damage overlay.
 c.drawImage(atlas,0,state*frame,frame,frame,-size/2,-size/2,size,size);return true;
}
export function drawCityFlakMount(c,b,p,atlas,signals){
 const spec=CITY_FLAK_WEAPONS[p.id];if(!spec||!atlas?.naturalWidth)return false;
 const s=b.regionalScale||1,state=p.destroyed||b.destroying||b.dead?2:p.hp<p.maxHp*.55?1:0,w=spec.width*s;
 const recoil=state===2||p.id==='ears'?0:(signals.get(p.id)?.recoil||0)*3*s;
 c.save();c.translate(p.x,p.y);c.rotate(p.angle+Math.PI/2);
 c.drawImage(atlas,spec.column*frame,state*frame,frame,frame,-w/2,-w*CITY_FLAK_PIVOT_Y+recoil,w,w);
 c.restore();return true;
}
