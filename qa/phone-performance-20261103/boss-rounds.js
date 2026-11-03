// Weapon-family continuity for hostile boss rounds. Machine guns keep the crimson enemy
// bolt (instantly readable). Guns fire painted WWI ordnance with a baked
// hostile rim: small AP rounds for flak/autocannon, HE shells for ship and
// fortress guns, stronger rounds retain their weapon family, a big HE for the
// alpine cannon, fragmentation shells for shrapnel and fin-stabilised darts
// for rocket rings. Mortars and howitzers lob finned bombs; direct-fire guns
// fly a straight line. No streak lines are drawn.
import {drawBossOrdnance} from './boss-ordnance-art.js?v=tame3&ai=1018';
import {fx,fxReady} from './fx-art.js?v=tame3';
import {drawEnemyProjectile,drawFlightRocket} from './projectiles.js?v=pilotfx20261018';
const ROUND={
 'aa-shell':['ap-small',34],'zeppelin-flak':['ap-small',34],'airship-flak':['ap-small',34],'carrier-flak':['ap-small',34],'stuttgart-flak':['ap-small',28],'gallipoli-aa':['ap-small',34],'twin-aa':['ap-small',34],
 'zubian-shell':['he-shell',38],'harbor-shell':['he-shell',38],'l70-broadside':['he-shell',32],'wusten-shell':['he-shell',38],'jutland-shell':['he-shell',36],
 'alps-cannon':['he-big',40],'rail-shrapnel':['frag-shell',26],'gallipoli-ring':['dart',34]
};
const HEAVY_ROUND=Object.fromEntries(Object.entries(ROUND).map(([key,[family,length]])=>[key,[family==='he-shell'?'he-big':family==='ap-small'?'ap-big':family,length*1.25]]));
const FAMILY_ROUNDS={ap:['ap-small',30],he:['he-shell',36],mortar:['mortar-small',34],fragmentation:['frag-shell',30],dart:['dart',34],'rifle-grenade':['rifle-grenade',34],'rail-shell':['ap-big',42]};
const FAMILY_HEAVY={ap:['ap-big',38],he:['he-big',45],mortar:['mortar-big',42],fragmentation:['frag-shell',39],dart:['dart',42],'rifle-grenade':['rifle-grenade',42],'rail-shell':['ap-big',50]};
const ROCKET_ROUNDS=[['le-prieur',40],['le-prieur',48]];
const MOUNT_ROUNDS={ap:['ap-small',30],he:['he-shell',36],mortar:['mortar-small',34]};
const MOUNT_HEAVY={ap:['ap-big',38],he:['he-big',45],mortar:['mortar-big',42]};
export function roundSprite(visual,heavy,context={}){
 if(context.ordnanceFamily==='rocket')return ROCKET_ROUNDS[heavy?1:0];
 if(context.ordnanceFamily==='machine-gun'||context.weaponFamily==='machine-gun')return null;
 const assigned=(heavy?FAMILY_HEAVY:FAMILY_ROUNDS)[context.ordnanceFamily];if(assigned)return assigned;
 const mount=(context.sourcePartKind||'')+' '+(context.sourcePartArt||'');
 const kind=context.bossKind||'';
 // Existing warned carrier salvos alternate tube rockets and gun rounds by
 // physical port. The firing schedule and hit geometry remain authored.
 if(kind==='hma23'&&visual==='carrier-flak'&&/port-[01]$/.test(context.sourcePartId||''))return ['le-prieur',heavy?48:40];
 // Legacy basic barrages share labels across unlike physical weapons.
 if(visual==='aa-shell'&&/jasta11|naval10/.test(kind))return null;
 if(visual==='aa-shell'&&kind==='mark-v-cruiser')return (heavy?MOUNT_HEAVY:MOUNT_ROUNDS).he;
 if(visual==='aa-shell'&&kind==='minenwerfer-battery')return (heavy?MOUNT_HEAVY:MOUNT_ROUNDS).mortar;
 if(visual==='harbor-shell'&&/mg-/.test(mount))return null;
 if(/nighthawk-mg|rviii-gun|staaken-mg|gotha-mg/.test(visual||''))return null;
 const exact=(heavy?HEAVY_ROUND:ROUND)[visual];if(exact)return exact;
 // Generic barrage labels often cover several actual gun mounts. Read only
 // presentation metadata; source IDs retain their existing cancellation rules.
 const family=/mortar|morser/.test(mount)?'mortar':/flak|anti-air|\baa\b|twin-aa/.test(mount)?'ap':/sponson|cannon|naval-gun|harbor-gun|howitzer/.test(mount)?'he':null;
 return family?(heavy?MOUNT_HEAVY:MOUNT_ROUNDS)[family]:null;
}
export function drawBossRound(c,h,screenScale=1){
 const {x,y,vx,vy,visual,raidHeavy=false}=h;
 const spec=roundSprite(visual,raidHeavy,h),k=Math.max(1,1/Math.max(.45,screenScale));
 if(spec?.[0]==='le-prieur'){if(fxReady('rocket'))return drawFlightRocket(c,{vx,vy,enemy:true},x,y,{length:spec[1],hostile:true,scale:k});}
 else if(spec&&drawBossOrdnance(c,spec[0],x,y,spec[1]*k,Math.atan2(vy,vx)))return true;
 drawEnemyProjectile(c,{enemy:true,life:1,sourceBoss:h.bossKind,visualType:/gotha|staaken|rviii/.test(h.bossKind||'')?'heavyBomber':/zeppelin|hma23/.test(h.bossKind||'')?'zeppelin':/jasta|naval10/.test(h.bossKind||'')?'elite':'boss',raidHeavy,vx,vy},x,y,0,screenScale);return true;
}
// Shell in flight toward a warned impact point.
const LOBBED=/minenwerfer|somme-heavy|morser|observer-shell|verdun-(heavy|offscreen|core|ambush)/;
export function drawShellFlight(c,h,q,{arc=80,size=1}={}){
 if(h.sourceX==null||!(q>0))return;const lob=LOBBED.test(h.visual||'')||['mortar','rifle-grenade'].includes(h.ordnanceFamily),dx=h.x-h.sourceX,dy=h.y-h.sourceY;
 const x=h.sourceX+dx*q,y=h.sourceY+dy*q-(lob?Math.sin(q*Math.PI)*arc:0);
 const angle=lob?Math.atan2(dy-Math.cos(q*Math.PI)*Math.PI*arc,dx):Math.atan2(dy,dx);
 if(lob)return drawBossOrdnance(c,h.ordnanceFamily==='rifle-grenade'||h.visual==='verdun-ambush-shell'?'rifle-grenade':/verdun|morser|somme-heavy/.test(h.visual)?'mortar-big':'mortar-small',x,y,(h.raidHeavy?40:34)*size,angle);
 const rail=/rail-shell/.test(h.visual||''),assigned=(h.raidHeavy?FAMILY_HEAVY:FAMILY_ROUNDS)[h.ordnanceFamily];
 drawBossOrdnance(c,assigned?.[0]||(rail?'ap-big':h.raidHeavy?'he-big':'he-shell'),x,y,(h.raidHeavy?40:32)*size,angle);
}

