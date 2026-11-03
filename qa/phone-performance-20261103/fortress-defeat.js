import {updateFortress,localToWorld} from './fortress-mechanics.js';
export const FORTRESS_DEFEAT_DURATION=7;
export const DEFEAT_CUES=Object.freeze([
 {at:.65,kind:'steam',x:415,y:260,size:190,life:1.9},
 {at:1.85,kind:'blast',x:291,y:527,size:230,life:.9},
 {at:2.38,kind:'blast',x:864,y:964,size:250,life:.9},
 {at:2.95,kind:'blast',x:880,y:478,size:240,life:.9},
 {at:3.48,kind:'blast',x:450,y:250,size:280,life:1},
 {at:3.7,kind:'dust',x:143,y:1196,size:220,life:2},
 {at:3.95,kind:'dust',x:887,y:1196,size:220,life:2},
 {at:4.15,kind:'dust',x:514,y:1340,size:240,life:2},
 {at:4.65,kind:'core',x:538,y:770,size:420,life:1.1}
]);
export function beginFortressDefeat(s,token){
 if(s.defeat?.token===token)return false;
 s.coreHp=0;s.defeat={token,elapsed:0,stage:'shutdown'};s.drive=0;s.turn=0;s.projectiles=[];s.effects=[];
 const b=s.systems;if(b){b.enabled=false;b.hazards=[];b.friendly=[];b.damageEvents=[];b.audioEvents=[];b.next=Infinity;for(const z of b.zones){z.plan=null;z.timer=0;z.loading=false;z.state=z.hp>0?'offline':'destroyed';}for(const g of s.guns)g.powered=false;}
 return true;
}
export function advanceFortressDefeat(s,dt){
 if(!s.defeat||s.paused||!(dt>0)||!Number.isFinite(dt))return;
 const before=s.defeat.elapsed;s.defeat.elapsed=Math.min(7,before+Math.min(dt,.1));
 updateFortress(s,dt);const t=s.defeat.elapsed;
 s.defeat.stage=t<1.8?'shutdown':t<3.6?'chain':t<4.65?'settle':t<5.7?'core':'wreck';
 if(before<3.6&&t>=3.6){for(const p of s.crawlers)p.hp=0;s.v=0;s.omega=0;s.vx=0;s.vy=0;}
}
export function defeatBodyBlend(s){const t=s.defeat?.elapsed||0;return {collapse:Math.max(0,Math.min(1,(t-1.8)/.7)),wreck:Math.max(0,Math.min(1,(t-4.65)/.65))};}
// Analytical, bounded cosmetics: snapshot playback/seek never re-spawns particles.
export function drawFortressDefeat(c,s,paintFX){
 const t=s.defeat?.elapsed;if(t===undefined)return;
 for(const q of DEFEAT_CUES){const age=t-q.at;if(age<0||age>q.life)continue;const p=localToWorld(s,q.x,q.y),f=age/q.life;
  if(q.kind==='blast'||q.kind==='core'){paintFX(c,'explosion'+Math.min(3,Math.floor(f*4)),p.x,p.y,q.size,q.size,0,.86*(1-f));paintFX(c,'smokeDark',p.x+age*13,p.y-age*35,Math.min(500,q.size*(.65+f)),Math.min(500,q.size*(.65+f)),0,.48*Math.sin(Math.PI*f));}
  else paintFX(c,q.kind==='steam'?'smokeWisp':'smokeGray',p.x+age*17,p.y-age*(q.kind==='steam'?70:18),q.size*(.55+f),q.size*(.55+f),0,.5*Math.sin(Math.PI*f));
 }
 if(t>5.2){for(const [x,y]of[[291,527],[864,964],[538,770]]){const p=localToWorld(s,x,y),alpha=.32*Math.min(1,(t-5.2)/.5);paintFX(c,'smokeDark',p.x+(t-5.2)*12,p.y-(t-5.2)*24,180,180,0,alpha);}}
}
