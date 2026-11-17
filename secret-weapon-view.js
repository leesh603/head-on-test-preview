import {secretWeaponIcon} from './secret-weapons.js';
import {SECRET_ORDNANCE} from './secret-ordnance.js';
import {secretRamSpeed} from './secret-weapon-combat.js';
import {drawGameIcon} from './icons.js?v=buildfit1&afc=1&opt=1';

const clamp=n=>Math.max(0,Math.min(1,n));
export const secretIconKey=(recipe,faction)=>'secret:'+secretWeaponIcon(recipe,faction).split('/').at(-1);
export const secretName=(recipe,en)=>en?recipe.en:recipe.ko;
export const secretDescription=(recipe,en)=>recipe.detail[en?1:0];
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
 c.beginPath();
 c.moveTo(24,2);c.lineTo(36,2);c.lineTo(46,12);c.lineTo(46,36);
 c.lineTo(36,46);c.lineTo(12,46);c.lineTo(2,36);c.lineTo(2,12);c.lineTo(12,2);c.closePath();
 c.fillStyle='#291c22';c.fill();
 c.lineWidth=2.5;c.strokeStyle='#85694f';c.stroke();
 if(progress>0||glint>0){
  const perimeter=96+40*Math.SQRT2;
  if(glint<=0&&progress<1)c.setLineDash([perimeter*progress,perimeter]);
  c.strokeStyle=glint>0?'#fff0c2':'#e5bb78';c.stroke();
 }
 c.beginPath();c.arc(24,24,19.5,0,Math.PI*2);c.clip();
 c.globalAlpha=progress<1?.66:1;drawGameIcon(c,icon,24,24,39);
 c.restore();
}
