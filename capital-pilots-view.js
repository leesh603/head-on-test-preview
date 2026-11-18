// Presentation only: restrained inked designation brackets and the existing
// painted gun smoke/fire artwork. No simulation RNG or generated placeholders.
import {capitalPilotsState,CAPITAL_PILOT_BALANCE} from './capital-pilots-combat.js';
import {partMark,MARK} from './tactical-marks.js?v=tame3';
import {drawFlakAirburst,flakAirburstLoaded} from './flak-airburst-art.js';
import {drawMaterialFrame,materialRows} from './combat-material-art.js';

const IDS=new Set(['friedrich_karl','robinson']);
const KINDS=new Set(['observe','order','flak','watch','magazine','ignition','ignitionHit','redeploy']);
const finite=n=>Number.isFinite(n)&&Math.abs(n)<=1e7;
const pos=v=>v&&finite(v.x)&&finite(v.y)?{x:v.x,y:v.y}:null;
const time=n=>Number.isFinite(n)&&n>=0&&n<=1e9?n:0;
const clamp=(n,a,b)=>Number.isFinite(n)?Math.max(a,Math.min(b,n)):a;
const integer=(n,a,b)=>Math.floor(clamp(n,a,b));
const ignitionContacts=[
 {row:materialRows.metal,life:.13,w:96,h:74,offset:.48,fallback:'ricochet'},
 {row:materialRows.fuel,life:.19,w:112,h:60,offset:0,fallback:'fireEngine'},
 {row:materialRows.powder,life:.30,w:112,h:66,offset:Math.PI,fallback:'gunSmoke'}
];

export function cleanCapitalPilotsVisual(value){
 if(!value||typeof value!=='object'||!IDS.has(value.pilot))return null;
 const point=pos(value.mark),kind=value.mark?.kind;
 const mark=point&&time(value.mark.until)>0&&['observation','pursuit'].includes(kind)?{...point,until:time(value.mark.until),kind}:null;
 const salvos=Array.isArray(value.salvos)?value.salvos.slice(0,3).flatMap(q=>{
  const p=pos(q),at=time(q?.at),burstAt=time(q?.burstAt);
  return p&&burstAt>=at&&burstAt-at<=1&&q.radius>=1&&q.radius<=150?[{...p,at,burstAt,radius:clamp(q.radius,1,150),index:integer(q.index,0,2)}]:[];
 }):[];
 const effects=Array.isArray(value.effects)?value.effects.slice(-CAPITAL_PILOT_BALANCE.fxLimit).flatMap(e=>{
  const p=pos(e);if(!p||!KINDS.has(e.kind)||!Number.isFinite(e.a)||Math.abs(e.a)>=1e5)return [];
  const effect={...p,a:e.a,at:time(e.at),kind:e.kind,size:clamp(e.size,8,150),stage:integer(e.stage,0,3)};
  // Earlier hosts encode the same three contacts with sizes 40, 47 and 54.
  if(e.kind==='ignitionHit')effect.pulseIndex=Number.isInteger(e.pulseIndex)&&e.pulseIndex>=0&&e.pulseIndex<=2?e.pulseIndex:integer(Math.round((effect.size-40)/7),0,2);
  return [effect];
 }):[];
 return{pilot:value.pilot,mark,activeUntil:time(value.activeUntil),stage:integer(value.stage,0,3),progress:clamp(value.progress,0,1),salvosFired:integer(value.salvosFired,0,3),approaching:value.approaching===true,redeployUntil:time(value.redeployUntil),salvos,effects};
}
export function captureCapitalPilotsVisual(p){
 const s=capitalPilotsState(p);if(!s)return null;
 return cleanCapitalPilotsVisual({...s,mark:s.mark?{...pos(s.mark.target),until:s.mark.until,kind:s.mark.kind}:null});
}
export function capitalPilotsVisual(p){
 if(!IDS.has(p?.pilot)||!(p.hp>0)||p.status==='downed')return null;
 const w=p.world||p,s=w.online&&!w.host?cleanCapitalPilotsVisual(p.capitalPilotsVisual):captureCapitalPilotsVisual(p);
 return s?.pilot===p.pilot?s:null;
}
function drawMagazineContact(c,e,x,y,age,scale,fx){
 if(e.kind==='ignition'){
  if(age<.10)fx(c,'fireFlash',x,y,e.size*.42*scale,e.size*.27*scale,e.a,(1-age/.10)*.76);
  return;
 }
 const pulse=e.pulseIndex,{row,life,w,h,offset,fallback}=ignitionContacts[pulse];
 if(age>=life)return;
 const q=age/life,cell=Math.min(3,Math.floor(q*3)+(pulse===1?0:1)),angle=e.a+offset;
 if(!drawMaterialFrame(c,row,cell,x,y,w*scale,h*scale,angle,1-q*.56))
  fx(c,fallback,x,y,w*.65*scale,h*.7*scale,angle,(1-q)*.8);
}
// After the airframe and its continuous fuel fire, paint only the actual
// cartridge contacts. The designation, HUD and other pilots retain their layer.
export function drawRobinsonContacts(c,p,{sx,sy,z,visible},fx){
 if(p.pilot!=='robinson')return;
 const s=capitalPilotsVisual(p);if(!s)return;
 const t=(p.world||p).t||0;
 for(const e of s.effects){
  if(e.kind!=='ignition'&&e.kind!=='ignitionHit')continue;
  const age=t-e.at;
  if(age>=0&&age<.30&&visible(e.x,e.y,80*z))drawMagazineContact(c,e,sx(e.x),sy(e.y),age,z,fx);
 }
}
function caption(c,label,x,y,color=MARK.warn){
 c.save();c.font='600 10px sans-serif';c.textAlign='center';c.textBaseline='middle';c.strokeStyle=MARK.ink;c.lineWidth=3;c.fillStyle=color;c.strokeText(label,x,y);c.fillText(label,x,y);c.restore();
}
export function drawCapitalPilots(c,p,{point=(x,y)=>[x,y],fx=null,tint=null,locale='ko',visible=()=>true,deferContacts=false}={}){
 const s=capitalPilotsVisual(p);if(!s)return;
 const t=(p.world||p).t||0,karl=p.pilot==='friedrich_karl',colour=karl?'#d9bd80':'#c8d5c9';
 if(s.mark&&s.mark.until>t&&s.mark.until-t<=10){
  const[x,y]=point(s.mark.x,s.mark.y);if(visible(x,y,42)){
   partMark(c,x,y,karl?29:24,karl?23:19,{color:colour,alpha:Math.min(.82,(s.mark.until-t)*1.5)});
   caption(c,locale==='en'?(karl?'DESIGNATED':'ON WATCH'):(karl?'표적 지정':'추격'),x,y-34,colour);
  }
 }
 for(const q of s.salvos){
  if(q.burstAt<t||q.burstAt-t>1)continue;const[x,y]=point(q.x,q.y);if(!visible(x,y,q.radius+15))continue;
  const progress=clamp((t-q.at)/Math.max(.001,q.burstAt-q.at),0,1),r=q.radius*(.66-.22*progress);
  partMark(c,x,y,r,r*.7,{color:MARK.warn,alpha:.35+.4*progress});
  caption(c,String(q.index+1),x,y-r*.7-11,MARK.warn);
 }
 if(fx)for(const e of s.effects){
  const age=t-e.at;if(age<0||age>=1.3)continue;const[x,y]=point(e.x,e.y);if(!visible(x,y,e.size*2+45))continue;
  const fade=clamp(1-age/1.2,0,1),a=e.a,dx=Math.cos(a),dy=Math.sin(a);
  if(e.kind==='flak'){
   // The three individual airbursts share the fleet's painted detonation.
   // Their expanding soot stays inside the corresponding numbered strike.
   const progress=age/1.2;
   const drawnByWorld=flakAirburstLoaded()&&(p.world||p).combatFX?.some(f=>f.capitalRoyal&&!f.fxHidden&&f.life>0&&Math.abs(f.x-e.x)<.1&&Math.abs(f.y-e.y)<.1);
   if(progress>=1||drawnByWorld||drawFlakAirburst(c,x,y,e.size*1.4/1.1,progress,0,.85))continue;
   if(age<.18)fx(c,'fireFlash',x,y,e.size*.7,e.size*.62,a,(1-age/.18)*.85);
   for(const i of [-1,0,1]){const off=i*(12+age*13);fx(c,'gunSmoke',x+off,y-off*.45,e.size*(.6+age*.8),e.size*(.5+age*.5),a+i*.9,.5*fade);}
   if(age<.22)fx(c,'armorSpark',x,y,42,38,a,(1-age/.22)*.65);
  }else if(e.kind==='ignition'||e.kind==='ignitionHit'){
   if(!deferContacts)drawMagazineContact(c,e,x,y,age,1,fx);
  }else if(e.kind==='magazine'||e.kind==='order'){
   const life=e.kind==='order'?.3:.23;if(age<life){fx(c,e.kind==='order'?'muzzleHeavy':'muzzleTwin',x+dx*27,y+dy*27,e.kind==='order'?36:30,20,a,(1-age/life)*.75);fx(c,'gunSmoke',x+dx*34,y+dy*34,28+age*30,16+age*15,a,(1-age/life)*.35);}
  }else if(e.kind==='redeploy'){
   if(age<.6)for(const side of [-1,1])fx(c,'smokeWisp',x-dx*(25+age*65)-dy*side*14,y-dy*(25+age*65)+dx*side*14,24+age*36,10+age*10,a,(1-age/.6)*.22);
  }else if(age<.24)fx(c,'armorSpark',x,y,e.size*.7,e.size*.5,a,(1-age/.24)*.5);
 }
 if(s.activeUntil>t&&s.activeUntil-t<=8){const[x,y]=point(p.x,p.y);if(visible(x,y,70)){
  const label=karl?(locale==='en'?`FIRE ORDER ${s.salvosFired}/3`:`제국의 포령 ${s.salvosFired}/3`):(locale==='en'?`MAGAZINE ${['I','II','III'][Math.max(0,s.stage-1)]}`:`제${Math.max(1,s.stage)}탄창`);
  caption(c,label,x,y+46,colour);
 }}
}
