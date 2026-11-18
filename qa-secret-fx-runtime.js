import * as combat from './secret-weapon-combat.js';
import {prepareSynthesisBomb,detonateSynthesisPayload} from './weapon-synthesis.js';
import {detonateFriendlyBomb} from './bomber-transfer.js';
import {SECRET_WEAPONS} from './secret-weapons.js';
import {drawWWIEquipment,equipmentArtReady} from './wwi-equipment-art.js?perf=1029';
const legend=id=>[id,'legendary'];
const rare=id=>[id,'rare'];
const ranks={
 gun:[['damage','normal'],['rate','magic'],rare('spread'),rare('precisionSynchronizer'),['damage','magic']],
 explosive:[['rockets','magic'],['explosives','normal'],rare('directFuse'),rare('fragmentationFuse'),['mines','normal']],
 formation:[rare('wingman'),rare('wingman'),rare('bomber'),['command','normal'],['command','magic']],
 survival:[['cooldown','normal'],['cooldown','magic'],rare('cooldown'),['armor','normal'],['regen','normal']],
 speed:[['turn','normal'],rare('inertiaRetainer'),rare('maneuverSpring'),['turn','normal'],['turn','magic']]
};
const plans={
 fokkerLeimberger:[...ranks.gun,legend('maximBelt'),legend('quadLewis')],
 vickersPomPom:[...ranks.gun,...ranks.explosive.slice(0,3),legend('cow37'),legend('buckinghamBelt')],
 eliteAirWing:[...ranks.formation,...ranks.survival.slice(0,3),legend('aceWingman')],
 longRangeBombers:[...ranks.formation,...ranks.explosive.slice(0,3),legend('fighterSupply'),legend('cooperRack')],
 sn1650:[ranks.formation[0],ranks.formation[2],...ranks.explosive,legend('veryPistol'),legend('prototypeAmmo')],
 fliegerpfeil:[...ranks.explosive,legend('cooperRack'),legend('flechettes')],
 grunkreuzBarrage:[...ranks.explosive.slice(0,4),...ranks.survival.slice(0,3),legend('grunkreuz'),legend('kaiserFog'),legend('cooperRack')],
 farnboroughFirechain:[...ranks.speed,...ranks.explosive.slice(0,3),legend('fieryGrapnel'),legend('buckinghamBelt')],
 badinBreakthrough:[...ranks.speed,legend('mercedesEngine'),legend('badinGauge')],
 nesterovRam:[legend('steelPlate'),...ranks.survival,...ranks.speed.slice(0,3)],
 explosiveArmor:[...ranks.survival,...ranks.explosive.slice(0,3),legend('steelPlate'),legend('amatolCharge')],
 villarPerosa:[...ranks.gun,legend('mauserAceKiller'),legend('flightGloves')],
 ketteringBug:[...ranks.explosive,...ranks.formation.slice(0,3),legend('wimperisSight')],
 rankenExplosiveDarts:[...ranks.survival.slice(0,3),ranks.survival[4],...ranks.gun.slice(0,3),legend('rankinShell'),legend('buckinghamBelt')],
 lePrieurSalvo:[...Array(3).fill(['rockets','normal']),['explosives','magic'],rare('directFuse'),legend('combinedProjectiles')],
 davisRecoilless:[legend('motorCannon'),...ranks.gun.slice(0,3),...ranks.explosive,legend('hytheCamera')],
 salamanderArmor:[...Array(3).fill(['armor','normal']),['regen','normal'],['cooldown','normal'],legend('steelPlate'),legend('sparkPlug')],
 puw50:[...Array(3).fill(['mines','normal']),['explosives','magic'],rare('fragmentationFuse'),legend('prototypeAmmo')],
 siemensHalske:[...ranks.speed,legend('strutterAirbrake'),legend('immelmannManual')]
};
const expected={fokkerLeimberger:'rotary',vickersPomPom:'pomImpact',eliteAirWing:'wingAttack',longRangeBombers:'bomberImpact',sn1650:'heavyImpact',fliegerpfeil:'steelRain',grunkreuzBarrage:'gasBarrage',farnboroughFirechain:'firechain',badinBreakthrough:'badinWake',nesterovRam:'ram',explosiveArmor:'armorLaunch',villarPerosa:'villarShot',ketteringBug:'bugImpact',rankenExplosiveDarts:'rankenBurst',lePrieurSalvo:'lePrieurImpact',davisRecoilless:'davisShot',salamanderArmor:'salamanderImpact',puw50:'puwImpact',siemensHalske:'siemensReversal'};
const api=window.__HEADON_TEST__,out=parent.document.querySelector('#out');
async function sample(id){
 const r=SECRET_WEAPONS.find(q=>q.id===id);
 if(!api.start({region:0,pilot:'boelcke',invincible:false}))throw Error('출격 실패');
 const g=api.debug();g.level=30;g.events.length=0;
 for(const [card,rarity] of plans[id]){g.state='upgrade';if(!g.upgrade(card,rarity))throw Error('장착 실패 '+card);g.pendingTacticalChoice=null;}
 if(!Object.values(g.secretWeaponState?.slots||{}).includes(id))throw Error('진화 실패');
 g.state='playing';g.enemies.length=0;g.bullets.length=0;g.events.length=0;g.spawn=Infinity;g.need=Infinity;g.invuln=0;g.fire=0;
 const heading=g.a,dx=Math.cos(heading),dy=Math.sin(heading),dist=id==='nesterovRam'?7:id==='rankenExplosiveDarts'?-90:id==='farnboroughFirechain'?28:100;
 function enemy(d,s){const e=g.spawnEnemy('scout')||g.enemies.at(-1);Object.assign(e,{id:'qa'+d+','+s,x:g.x+dx*d-dy*s,y:g.y+dy*d+dx*s,a:g.a,fire:999,hp:9000,maxHp:9000,speed:0,spawnTime:0,invuln:0});return e;}
 const e=enemy(dist,0);if(id==='farnboroughFirechain'){enemy(75,19);enemy(94,-23);}
 Object.assign(g,{rankinShrapnelTimer:0,airframeSpeed:1,cow37Timer:0,wwiGrapnelCooldown:0,motorCannonTimer:0,bomberTimer:0,mauserTimer:0});
 // Deterministic setup of hard-to-repeat conditions, using the game's equipped combat
 // handlers. No cue is inserted by this harness.
 if(id==='davisRecoilless'){g.wwiHytheAnalyzedId=e.id;g.wwiHytheVisible=6;g._updLegendary(.02,{fireHeld:true});}
 if(id==='siemensHalske'){for(let i=0;i<25;i++)g.flyAirframe(.04,{steer:1});g.flyAirframe(.04,{steer:-1});combat.tickSecretWeapons(g,.04);}
 if(id==='badinBreakthrough'){const v=g.baseSpeed*1.25;g.equipmentStraight=.64;g.equipmentCruiseSpeed=v;combat.tickSecretWeapons(g,.04,{x:g.x-dx*v*.04,y:g.y-dy*v*.04});}
 if(id==='explosiveArmor'||id==='salamanderArmor'){const hp=g.hp;g.damageSource={bullet:{vx:dx*400,vy:dy*400},impactX:g.x+8,impactY:g.y+2};g.hp-=8;combat.secretArmorHit(g,hp,prepareSynthesisBomb);}
 if(id==='sn1650'){for(let i=0;i<3;i++)combat.secretVerySignal(g,e,prepareSynthesisBomb);}
 if(id==='fliegerpfeil'){for(let i=0;i<3;i++){const b=prepareSynthesisBomb(g,{x:e.x,y:e.y,life:.5,damage:70,radius:66,cooperBomb:true});combat.secretCooperRelease(g,b);if(i===2)detonateFriendlyBomb(g,b);}}
 if(id==='grunkreuzBarrage')detonateSynthesisPayload(g,{x:e.x,y:e.y,synthesisPayload:{gas:true}});
 if(id==='ketteringBug')g._updFriendlyBomber(.02,{angle:g.a});
 if(id==='villarPerosa')e.ace=true;
 const kinds=new Set(),dt=.02,start=g.t,held={fireHeld:true,inputMode:'gamepad'};let hit;
 for(let i=0;i<320;i++){
  for(const q of g.secretWeaponFx||[])if(q.at+q.life>=g.t){kinds.add(q.kind);if(!hit&&q.kind===expected[id])hit=q;}
  if(hit)break;
  g.state='playing';g.update(dt,held);
 }
 g.state='paused';
 if(!hit)throw Error('미발동 '+[...kinds].join(',')+' / '+(g.t-start).toFixed(2)+'s');
 const sampleAge=Math.min(hit.life*.32,hit.kind==='gasBarrage'?.36:.10),displayT=hit.at+sampleAge;
 g.t=displayT;g.state='paused';
 const w=260,h=170,low=parent.document.querySelector('#screen').value==='390x844';
 const c=parent.document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});
 // Render just the observed combat cue through the same equipment draw entry as the
 // live battle. Excluding ordinary effects makes the alpha coverage meaningful.
 drawWWIEquipment(ctx,{players:[],allies:[],enemies:g.enemies.map(v=>({...v,burnTime:0})),x:hit.x,y:hit.y,t:displayT,secretWeaponFx:[hit],friendlyBombs:[],bullets:[]},w,h,{low});
 const bytes=ctx.getImageData(0,0,w,h).data;let pixels=0;for(let i=3;i<bytes.length;i+=4)if(bytes[i]>14)pixels++;
 const fig=parent.document.createElement('figure'),caption=parent.document.createElement('figcaption');caption.textContent=r.ko+' · '+pixels+' px';fig.append(c,caption);parent.document.querySelector('#tiles').append(fig);
 if(!pixels)throw Error('효과 투명 '+hit.kind+' '+sampleAge);
 return {id,k:hit.kind,pixels,time:(displayT-start).toFixed(2),damage:Math.round(9000-e.hp),age:sampleAge.toFixed(3),cues:[...kinds].join('→')};
}
await equipmentArtReady;parent.bindQA(SECRET_WEAPONS.map(r=>[r.id,r.ko]),sample);
