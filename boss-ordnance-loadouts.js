// Authored weapon identity for existing boss attacks. This does not spawn attacks,
// retarget them, or alter their damage/timing/collision. Families follow the
// physical attack: direct rounds, warned falling explosives, and native hazards.
export const BOSS_LOADOUTS=Object.freeze({
 'supermarine-nighthawk':['machine-gun','he','iron-bomb'],
 'siemens-schuckert-r-viii':['machine-gun','iron-bomb'],
 'paris-gun':['machine-gun','rail-shell'],
 lincomparable:['machine-gun','rail-shell','fragmentation'],
 'sms-stuttgart':['ap','fragmentation','machine-gun','puw'],
 'hms-zubian':['he','mortar','torpedo'],
 'a7v-flak':['machine-gun','ap','fragmentation','incendiary'],
 'mark-v-cruiser':['machine-gun','he','incendiary'],
 'livens-flame-projector':['flame','incendiary','gas'],
 'minenwerfer-battery':['mortar','rifle-grenade'],
 'drachen-net':['mine','mortar'],
 'london-apron-raid':['wire','fragmentation'],
 'flak-tower':['machine-gun','fragmentation'],
 'zeppelin-l70':['ap','he','puw'],
 hma23:['ap','rocket','machine-gun'],
 gik:['machine-gun','he','puw'],
 ca4:['machine-gun','hales'],
 'armored-harbor-fortress':['machine-gun','he','mine','debris'],
 fliegerzug:['machine-gun','fragmentation','drone-bomb'],
 'treffas-wagen':['machine-gun','fragmentation','debris'],
 'jasta11-circus':['machine-gun','rocket'],
 'naval10-black-flight':['machine-gun','dart'],
 'mark4-wedge':['machine-gun','he'],
 'morser-battery':['machine-gun','mortar','ap'],
 'gotha-squadron':['machine-gun','puw'],
 'fort-douaumont':['machine-gun','mortar','ap'],
 'fort-souville':['machine-gun','mortar','ap','rifle-grenade'],
 wustenpanzer:['machine-gun','he','incendiary'],
 'jutland-grand-fleet':['he','torpedo'],
 'gallipoli-fortress':['machine-gun','he'],
 'paris-staaken-rvi':['machine-gun','puw'],
 'paris-searchlight-fortress':['machine-gun','fragmentation'],
 'sinai-landship':['machine-gun','he','rifle-grenade']
});
export const ORDNANCE_NAMES=Object.freeze({
 'machine-gun':'기관총',ap:'대공 철갑탄',he:'고폭탄',mortar:'박격포탄',fragmentation:'파편탄',
 'rail-shell':'열차포탄',rocket:'르프리외르 로켓',dart:'강철 화살탄','rifle-grenade':'소총유탄',
 cooper:'쿠퍼 폭탄',puw:'PuW 폭탄',hales:'헤일스 폭탄','iron-bomb':'철제 낙하폭탄',
 'drone-bomb':'무인폭탄기',torpedo:'어뢰',mine:'기뢰',wire:'방공 와이어',flame:'화염 분사',incendiary:'소이탄',gas:'가스',debris:'파편'
});
const MG=/-mg$|armor-tracer|rviii-gun/;
export function bossOrdnanceFamily(boss,event,part){
 const v=event.visual||'',mount=(event.sourcePartKind||part?.kind||'')+' '+(event.sourcePartArt||part?.art||part?.id||'');
 if(event.ordnanceFamily)return event.ordnanceFamily;
 if(event.type==='formation-shot')return event.raidHeavy&&boss==='jasta11-circus'?'rocket':event.raidHeavy&&boss==='naval10-black-flight'?'dart':'machine-gun';
 if(v==='carpet-bomb')return event.sprite|| (boss==='ca4'?'hales':event.faction==='entente'?'cooper':'puw');
 if(/rviii-bomb|nighthawk-light-bomb/.test(v))return 'iron-bomb';
 if(/torpedo/.test(v))return 'torpedo';
 if(/drachen-fuse|(?:^|-)mine(?:$|-)/.test(v))return 'mine';
 if(/apron|wire/.test(v))return 'wire';
 if(/livens-flame/.test(v))return 'flame';
 if(/livens-gas/.test(v))return 'gas';
 if(/livens-ember|livens-leak|wusten-steam/.test(v))return 'incendiary';
 if(/debris|harbor-swing/.test(v))return 'debris';
 if(boss==='hma23'&&v==='carrier-flak'&&/port-[01]$/.test(event.sourcePartId||''))return 'rocket';
 if(v==='gallipoli-ring')return 'dart';
 if(v==='verdun-ambush-shell')return 'rifle-grenade';
 if(boss==='minenwerfer-battery'&&v==='aa-shell')return 'rifle-grenade';
 if(boss==='sinai-landship'&&v==='sinai-impact'&&!event.raidHeavy)return 'rifle-grenade';
 if(v==='rail-shell')return 'rail-shell';
 if(/rail-shrapnel|black-flak|city-flak-shell|aa-flak/.test(v))return 'fragmentation';
 if(v==='aa-shell'&&/jasta11|naval10/.test(boss))return 'machine-gun';
 if(v==='aa-shell'&&boss==='mark-v-cruiser')return 'he';
 if(event.weaponFamily==='machine-gun'||MG.test(v)||/harbor-shell/.test(v)&&/mg-/.test(mount))return 'machine-gun';
 if(/minenwerfer|observer-shell|somme-heavy|verdun-(heavy|offscreen|core)|zubian-mortar/.test(v))return 'mortar';
 if(/sponson|cannon|naval-gun|harbor-gun|howitzer/.test(mount)||/davis-cannon|alps-cannon|zubian-shell|harbor-shell|l70-broadside|wusten-shell|jutland-shell|coastal-shell|gallipoli-shell|somme-landship|impact$/.test(v))return 'he';
 if(/flak|aa-shell|twin-aa/.test(v)||/flak|anti-air|\baa\b|twin-aa/.test(mount))return 'ap';
 if(/mortar|morser/.test(mount))return 'mortar';
 return event.kind==='projectile'?'machine-gun':null;
}
export function bossStrongSound(family,kind){
 if(kind==='projectile')return family==='rocket'?'rocketHeavy':family==='dart'?'dartSalvo':family==='machine-gun'?'gunSalvo':family==='rifle-grenade'?'grenadeLaunch':family==='mortar'?'mortarLaunch':'heavyShot';
 return /cooper|puw|hales|iron-bomb/.test(family||'')?'explosion':family==='rail-shell'?null:family==='fragmentation'?'flak':family==='flame'||family==='incendiary'?'flameBurn':family==='torpedo'?'waterImpact':family==='mortar'||family==='rifle-grenade'?'earthImpact':null;
}
