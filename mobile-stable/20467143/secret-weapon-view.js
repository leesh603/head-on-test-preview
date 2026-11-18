import {secretWeaponIcon} from './secret-weapons.js';
import {SECRET_ORDNANCE} from './secret-ordnance.js';
import {secretRamSpeed} from './secret-weapon-combat.js';
import {drawGameIcon} from './icons.js?v=buildfit1&afc=1&opt=1';

const clamp=n=>Math.max(0,Math.min(1,n));
export const secretIconKey=(recipe,faction)=>'secret:'+secretWeaponIcon(recipe,faction).split('/').at(-1);
export const secretName=(recipe,en)=>en?recipe.en:recipe.ko;
// One-line summaries for the HUD, pause and cards; the codex keeps the full rules.
const SECRET_BRIEF=Object.freeze({
 fokkerLeimberger:['12총열 회전 기관총을 함께 쏩니다.','Fires a 12-barrel rotary machine gun.'],
 vickersPomPom:['37mm 자동 기관포를 연사합니다.','Fires a rapid 37 mm automatic cannon.'],
 eliteAirWing:['에이스 조종사들이 편대기로 합류합니다.','Ace pilots fly as your wingmen.'],
 longRangeBombers:['아군 중폭격기 편대가 함께 폭격합니다.','A heavy bomber flight bombs with you.'],
 sn1650:['신호탄 세 발로 1,650파운드 폭탄을 부릅니다.','Three flares call a 1,650 lb bomb.'],
 fliegerpfeil:['쿠퍼 폭탄에서 강철 화살이 쏟아집니다.','Cooper bombs rain steel darts.'],
 grunkreuzBarrage:['녹십자 독가스와 연막을 퍼뜨립니다.','Spreads Green Cross gas and smoke.'],
 farnboroughFirechain:['불붙은 케이블이 근처 적기로 번집니다.','A burning cable whips to nearby enemies.'],
 badinBreakthrough:['고속 돌파 때 날개 뒤에 소용돌이를 남깁니다.','High-speed runs leave wingtip vortices.'],
 nesterovRam:['적기에 들이받아 부숩니다.','Ram enemy aircraft to wreck them.'],
 explosiveArmor:['맞으면 장갑판이 폭탄을 흩뿌립니다.','Struck armor scatters bombs.'],
 villarPerosa:['쌍열 기관단총으로 가까운 적기를 쏩니다.','A twin-barrel gun bursts at close enemies.'],
 ketteringBug:['무인 비행 폭탄을 날려 보냅니다.','Launches a pilotless flying bomb.'],
 rankenExplosiveDarts:['뒤쫓는 적기에 작렬 다트를 쏩니다.','Fires exploding darts at pursuers.'],
 lePrieurSalvo:['날개의 르 프리외르 로켓 8발을 쏩니다.','Fires eight wing-strut Le Prieur rockets.'],
 davisRecoilless:['무반동포로 앞뒤 동시에 포탄을 쏩니다.','A recoilless gun fires fore and aft.'],
 salamanderArmor:['장갑 동체로 내구도가 크게 늘어납니다.','An armored fuselage adds durability.'],
 puw50:['50kg 폭탄 네 발을 줄지어 떨어뜨립니다.','Drops a stick of four 50 kg bombs.'],
 siemensHalske:['반전 로터리 엔진이 선회 중 속도를 지킵니다.','A counter-rotary engine holds speed in turns.']
});
export const secretDescription=(recipe,en)=>(SECRET_BRIEF[recipe.id]||recipe.detail)[en?1:0];
export const secretRules=(recipe,en)=>recipe.detail[en?1:0];
export function secretCondition(recipe,en,name,family){
 const {body,catalysts,ranks,extra}=recipe;
 return [...[body.map(name).join(en?' or ':' 또는 ')],...catalysts.map(name),
  ...Object.entries(ranks).map(([id,n])=>family(id)+' ×'+n),
  ...Object.entries(extra).map(([id,n])=>(id==='wings'?(en?'Permanent wingmen':'상설 일반 편대기'):name(id))+' ×'+n)].join(' + ');
}
function badgeState(recipe,p,g,en){
 const id=recipe.id,e=p.secretWeaponState?.effects[id]||{},now=g.t||0;
 const waiting=(en?'WAIT':'대기'),ready=(en?'READY':'준비');
 if(['fokkerLeimberger','salamanderArmor','siemensHalske'].includes(id))return [1,''];
 const cooling=(left,total)=>[1-clamp(left/total),left>0?Math.ceil(left)+'s':ready];
 if(id==='lePrieurSalvo')return e.remaining>0?[1,en?'SALVO':'일제사격']:cooling((e.readyAt||0)-now,SECRET_ORDNANCE.rocket.period);
 if(id==='puw50')return e.remaining>0?[1,en?'DROP':'투하']:cooling((e.readyAt||0)-now,SECRET_ORDNANCE.puw.period);
 if(id==='davisRecoilless')return cooling(p.motorCannonTimer||0,p.ordnanceInterval?.(3)||3);
 if(id==='vickersPomPom'){
  const reload=p.reloadTime,duration=p.weapon?.reload;
  const ammo=(p.ammo||[]).reduce((n,a)=>n+a,0);
  return reload>0?cooling(reload,duration||reload):[1,p.unlimitedAmmo?'∞':String(ammo??0)];
 }
 if(id==='sn1650'||id==='fliegerpfeil'){
  if(e.activeUntil>now)return [1,(e.activeUntil-now).toFixed(1)+'s'];
  const count=e.count||0;
  const left=id==='fliegerpfeil'?p.wwiCooperCooldown:p.wwiVeryCooldown;
  return [count/3,count+'/3'+(left>0?' · '+Math.ceil(left)+'s':'')];
 }
 if(id==='badinBreakthrough')return [1,''];
 if(id==='explosiveArmor'||id==='farnboroughFirechain')return cooling((e.readyAt||0)-now,id==='explosiveArmor'?15:6);
 if(id==='nesterovRam'){const speed=secretRamSpeed(p);return [speed<0?.3:1,speed<0?waiting:ready];}
 if(id==='villarPerosa')return e.remaining>0?[1,en?'BURST':'점사']:cooling(e.delay||0,.73);
 if(id==='ketteringBug')return e.activeUntil>now?[1,en?'FLIGHT':'비행 중']:cooling(Math.max((e.readyAt||0)-now,p.bomberTimer||0),25);
 if(id==='rankenExplosiveDarts')return cooling(p.rankinShrapnelTimer||0,3.2);
 if(id==='eliteAirWing'||id==='longRangeBombers'){
  const bomber=id==='longRangeBombers',wings=(g.allies||[]).filter(w=>(bomber?w.secretBomber:w.secretAce)&&w.ownerId===(p.id||'p1')&&w.life>0&&!w.wingWithdrawal);
  const left=wings.length?Math.min(...wings.map(w=>bomber?(w.secretBombReadyAt||0)-now:w.secretAceReady||0)):Infinity;
  return Number.isFinite(left)&&left>0?cooling(left,bomber?10:14):[1,waiting];
 }
 if(id==='grunkreuzBarrage'&&e.activeUntil>now)return cooling(e.activeUntil-now,e.duration||5);
 return [1,waiting];
}
export function paintSecretBadge(rb,p,g,en,faction){
 const {ctx:c,secret}=rb,icon=secretIconKey(secret,faction);
 const [progress,label]=badgeState(secret,p,g,en),notice=p.secretWeaponState?.notices?.[secret.id]||0;
 const assembly=clamp((notice-(p.t||0))/1.2);
 const flash=progress>=1&&rb.lastProgress<1;
 if(flash)rb.flashAt=g.t;
 const glint=secret.id==='badinBreakthrough'?0:Math.max(assembly,1-clamp(((g.t||0)-(rb.flashAt??-1))/.3));
 const key=progress.toFixed(2)+'|'+glint.toFixed(2)+'|'+icon;
 c.canvas.dataset.secretStatus=label;
 if(rb.frameKey===key)return;
 rb.frameKey=key;rb.lastProgress=progress;
 c.save();
 const scale=c.canvas.width/48;
 c.setTransform(scale,0,0,scale,0,0);
 c.clearRect(0,0,48,48);
 // Crimson seal ring: secret weapons must never read as ordinary equipment.
 c.beginPath();c.arc(24,24,22.5,0,Math.PI*2);
 c.fillStyle='#3a1311';c.fill();
 c.lineWidth=2.4;c.strokeStyle='#d24a3a';c.stroke();
 c.beginPath();c.arc(24,24,20.2,0,Math.PI*2);
 c.lineWidth=.8;c.strokeStyle='#e7c27c';c.stroke();
 c.save();
 c.beginPath();c.arc(24,24,19.6,0,Math.PI*2);c.clip();
 c.globalAlpha=progress<1?.66:1;drawGameIcon(c,icon,24,24,40);
 c.restore();
 if(glint>0||(progress>0&&progress<1)){
  const start=-Math.PI/2;
  c.beginPath();c.arc(24,24,22.5,start,start+Math.PI*2*(glint>0?1:progress));
  c.lineWidth=2.4;c.strokeStyle=glint>0?'#fff0c2':'#ffd28a';c.stroke();
 }
 c.restore();
}
