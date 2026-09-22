import {planeSprite,registerCampaignSpriteAliases} from './aircraft.js?v=204';
import {SPRITE_ALIASES} from './campaign.js?v=201';
import {drawEquipment} from './equipment.js?v=116&b=117';
registerCampaignSpriteAliases(SPRITE_ALIASES);
import {drawBattlefieldSprite} from './battlefield-art.js?v=116&b=117';
import {missionNavigation,navigationScreenPoint} from './navigation.js?v=128&b=128';
export function drawCampaign(c,g,W,H){
 if(g?.mode!=='campaign')return;const point=o=>[o.x-g.x+W/2,o.y-g.y+H/2];
 c.save();c.font='bold 12px sans-serif';c.textAlign='center';c.lineWidth=2;
 const label=(x,y,text,color='#ffe0a1')=>{const width=c.measureText(text).width;c.fillStyle='#15221ee8';c.fillRect(x-width/2-6,y-12,width+12,18);c.fillStyle=color;c.fillText(text,x,y)};
 const marker=(o,text,color)=>{const[x,y]=point(o);if(x>35&&x<W-35&&y>208&&y<H-170)label(x,y-24,text,color)};
 for(const cloud of g.clouds){const[x,y]=point(cloud);c.globalAlpha=.2;c.fillStyle='#e9ece5';c.beginPath();c.arc(x,y,cloud.r,0,Math.PI*2);c.fill();c.globalAlpha=1;if(Math.hypot(cloud.x-g.x,cloud.y-g.y)<cloud.r)label(W/2,H/2+65,'구름 은폐 · 적 조준 약화','#d8e8f0')}
 for(const h of g.hazards){const[x,y]=point(h);c.save();c.translate(x,y);c.rotate(h.angle);c.fillStyle=h.warning>0?'#f6c76044':'#ed603966';c.fillRect(-h.width,-H,h.width*2,H*2);c.setLineDash([8,7]);c.strokeStyle='#ffd482';c.strokeRect(-h.width,-H,h.width*2,H*2);c.restore();if(h.warning>0)label(x,y,'탄막 예고 '+h.warning.toFixed(1)+'초')}
 if(g.mission.front){const y=g.frontY-g.y+H/2;c.fillStyle='#8e2e2533';c.fillRect(0,Math.max(0,y),W,H);c.strokeStyle='#e3a67b';c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();if(g.y>g.frontY-180)label(W/2,H-145,'전선이 접근합니다 · 북쪽으로 이동','#ffbd9b')}
 if(g.mission.corridor){c.fillStyle='#514b45aa';for(let y=0;y<H;y+=8){const center=Math.sin((g.y-H/2+y)*.001)*180-g.x+W/2;c.fillRect(0,y,Math.max(0,center-560),8);c.fillRect(center+560,y,W,8)}}
 for(const z of g.zones){if(z.done)continue;const[x,y]=point(z),color=z.kind==='extract'?'#a2f8be':'#8fe5f4';c.strokeStyle=color;c.setLineDash([9,6]);c.beginPath();c.arc(x,y,z.r,0,Math.PI*2);c.stroke();c.setLineDash([]);c.lineWidth=5;c.beginPath();c.arc(x,y,z.r,-Math.PI/2,-Math.PI/2+Math.PI*2*Math.min(1,z.progress/(z.required||1)));c.stroke();c.lineWidth=2;marker(z,z.kind==='extract'?'이탈':z.kind==='checkpoint'?'통과 지점':`${z.kind==='photo'?'사진정찰':'관측 유지'} ${z.progress.toFixed(1)}/${z.required}초`,color)}
 if(g.supplyZone&&!g.supplyZone.used){const z=g.supplyZone,[x,y]=point(z);c.strokeStyle='#bff2b3';c.beginPath();c.arc(x,y,z.r,0,6.283);c.stroke();marker(z,'탄띠 보급','#bff2b3')}
 const nearestConvoy=g.convoy.filter(o=>o.hp>0&&!o.escaped).sort((a,b)=>Math.hypot(a.x-g.x,a.y-g.y)-Math.hypot(b.x-g.x,b.y-g.y))[0];
 for(const unit of g.convoy){if(unit.hp<=0||unit.escaped)continue;const[x,y]=point(unit);planeSprite(c,x,y,unit.a,unit.plane,unit.plane==='markiv'?.85:1);c.fillStyle='#253329';c.fillRect(x-24,y+35,48,5);c.fillStyle='#9fdfbd';c.fillRect(x-24,y+35,48*unit.hp/unit.maxHp,5);if(unit===nearestConvoy)marker(unit,'호위 편대 '+g.convoy.filter(c=>c.hp>0).length+'/'+g.convoy.length,'#a3efd3')}
 const nearestTarget=g.enemies.filter(e=>e.missionTarget&&e.hp>0).sort((a,b)=>Math.hypot(a.x-g.x,a.y-g.y)-Math.hypot(b.x-g.x,b.y-g.y))[0];
 for(const e of g.enemies){const[x,y]=point(e);if(e.missionGround){if(e.missionTank)planeSprite(c,x,y,e.a,'markiv',1);else drawBattlefieldSprite(c,'aa',x,y,60);c.fillStyle='#253329';c.fillRect(x-20,y+32,40,4);c.fillStyle='#f3b675';c.fillRect(x-20,y+32,40*e.hp/e.maxHp,4)}
  if(e.missionTarget&&e.hp>0&&(e===nearestTarget||x>50&&x<W-50&&y>200&&y<H-140))marker(e,e.altitude===undefined?'임무 표적':['저고도 표적','중고도 표적','고고도 표적'][e.altitude],e.altitude!==undefined&&e.altitude!==g.altitude?'#c7c8ce':'#ffcc87');
  if(e.precisionWarning){const p=point(e.precisionWarning);c.strokeStyle='#ffb382';c.setLineDash([6,5]);c.beginPath();c.moveTo(x,y);c.lineTo(p[0],p[1]);c.stroke();c.setLineDash([])}
 }
 const nav=missionNavigation(g);if(nav){const p=navigationScreenPoint(nav,g,W,H);
  c.save();c.translate(p.x,p.y);c.rotate(nav.angle);c.fillStyle=nav.kind==='extract'?'#a9efba':'#ffe0a1';c.strokeStyle='#233327';c.lineWidth=3;c.beginPath();c.moveTo(13,0);c.lineTo(-9,-9);c.lineTo(-4,0);c.lineTo(-9,9);c.closePath();c.stroke();c.fill();c.restore();
  const text=`${Math.round(nav.distance)} m`,half=c.measureText(text).width/2+8;label(Math.max(half,Math.min(W-half,p.x)),p.y+25,text);
 }
 c.restore();
}
