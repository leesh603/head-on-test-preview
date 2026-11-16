// Small cached compositions of approved painted artwork, never collision geometry.
// Ordinary rounds remain one continuous luminous tracer, never physical ordnance.
import {fxReady,fxTint} from './fx-art.js?v=tame3';
const P=(core,wake,shape,length=26,width=4)=>Object.freeze({core,wake,shape,length,width});
export const GUN_SIGNATURES=Object.freeze({
 standard:P('#e8c981','#d6a551','capsule',20,2.8),
 precision:P('#cfedf1','#71b7cc','needle',32,3),
 suppression:P('#ffe0a2','#df9449','capsule',14,4.6),
 strike:P('#eef3cf','#8ab585','lance',36,3.8),
 duel:P('#8ed3c2','#477e76','soft',25,4),
 counter:P('#ead7ff','#ae78d4','teardrop',17,5.8),
 intercept:P('#d8f4ed','#85baa7','comet',34,3.6),
 piercing:P('#c5e8ee','#719cad','needle',34,3.5),
 incendiary:P('#ffc56b','#dc7439','comet',30,4.5),
 mauser:P('#e2c8ff','#a576da','orb',9,5.5),
 telescope:P('#d4e2ef','#90afc2','comet',32,3),
 reinforcement:P('#b9d3a0','#6b9271','capsule',23,3.5),
 eliteWing:P('#b8e7d6','#78b49f','teardrop',28,4),
 scout:P('#ffd4b8','#e86d55','orb',9,5.2),
 hunter:P('#f4d9f0','#a462ad','needle',24,4.4),
 bomber:P('#fff0b0','#dfb64b','capsule',15,5.2),
 heavyBomber:P('#ffe8b4','#d3a068','orb',12,7),
 elite:P('#f1c8ff','#bf68c8','teardrop',17,6),
 boss:P('#ffd6cc','#db5268','capsule',22,5),
 groundMG:P('#f8e0cb','#7b91a3','comet',22,5.4),
 groundStrong:P('#fff0ce','#a28b77','teardrop',27,6.5),
 bossStrong:P('#fff0c4','#ed8d58','teardrop',23,7),
 zeppelin:P('#f5ecc6','#919d50','soft',21,5.6),
 naval:P('#f2e3d3','#877b98','comet',22,5.6),
 balloon:P('#dfbc87','#aa794c','capsule',19,5),
 flak:P('#ffe3ba','#d5996c','orb',10,6),
 acePrecision:P('#e8e8ff','#878dc1','comet',26,4.8),
 aceAssault:P('#f8bb9b','#c24e40','teardrop',30,5),
 aceDuel:P('#f1d2fa','#995ea6','soft',22,5.2),
 aceCommand:P('#f4f0b3','#bec45c','orb',11,6)
});
const precisionAces=new Set(['fonck','bishop','guynemer','mccudden']);
const assaultAces=new Set(['baron','baracca','immelmann','lothar','loewenhardt']);
const commandAces=new Set(['boelcke','goering','trenchard','mckeever']);
export function gunSignatureId(b){
 if(!b||['railgun','rocket'].includes(b.visualType)||b.rocket||b.hostileRocket||b.cow37||b.motorCannon||b.actualExplosion||b.blast||b.flechette||b.fieryGrapnel)return null;
 if(b.enemy){
  if(/fort|somme|mark|treffas|flieger|minen|a7v/.test(b.sourceBoss||''))return b.raidHeavy?'groundStrong':'groundMG';
  if(b.sourcePilot)return precisionAces.has(b.sourcePilot)?'acePrecision':assaultAces.has(b.sourcePilot)?'aceAssault':commandAces.has(b.sourcePilot)?'aceCommand':'aceDuel';
  if(b.eliteKind)return b.kind==='eliteRearTracer'?'bomber':b.eliteKind==='junkers_squadron'?'heavyBomber':'elite';
  const role=b.ammoVisual||b.visualType||(b.naval?'naval':b.fieldShell?'balloon':b.heavy?'heavyBomber':'scout');
  return b.raidHeavy&&role==='boss'?'bossStrong':GUN_SIGNATURES[role]?role:'scout';
 }
 // Explicit equipment is stronger than a pilot/tactic decoration. Tactical
 // piercing is a consequence of the doctrine, not an equipment selection.
 if(b.mauserRound)return 'mauser';if(b.wwiIncendiary)return 'incendiary';if(b.telescopeGuided)return 'telescope';
 if(b.pierce&&!b.tacticalStyle&&!b.projectileDoctrine)return 'piercing';
 if(b.mannockPass||b.fonckVolley||b.fonckSeeker||b.eagle||b.specialColor)return null;
 const doctrine=b.projectileDoctrine||b.tacticalStyle;
 if(doctrine==='elite')return 'eliteWing';if(GUN_SIGNATURES[doctrine])return doctrine;
 if(b.ally||b.formation||b.patrol)return 'reinforcement';return 'standard';
}
const cache=new Map(),SCALE=2,W=128,H=40;
export function gunSignatureCacheStats(){return{entries:cache.size,accentEntries:accentCache.size,bytes:(cache.size+accentCache.size)*W*H*4,limit:96,accentLimit:48};}
function compose(id,enemy,combo){
 const p=GUN_SIGNATURES[id],key=id+'/'+Number(enemy)+'/'+(combo||'');if(cache.has(key))return cache.get(key);
 if(!fxReady('tracerCore')||typeof document==='undefined')return null;
 const cv=document.createElement('canvas');cv.width=W;cv.height=H;const c=cv.getContext('2d');if(!c)return null;c.scale(SCALE,SCALE);c.translate(54,10);
 const L=p.length,wide=p.width,needle=p.shape==='needle'||p.shape==='lance',drop=p.shape==='teardrop'||p.shape==='comet';
 // Same approved tracer core/glow as the original renderer, always on one axis.
 // The small bright portion overlaps the long core, so it cannot read as a
 // separate projectile. Differences are radiant profile, taper and colour.
 if(fxReady('tracerGlow'))fxTint(c,'tracerGlow',enemy?'#a94045':p.wake,-L*.5,0,L*(enemy?(drop?1.08:1.04):(drop?1.18:1.08)),wide*(enemy?(p.shape==='soft'?1.7:1.5):(p.shape==='soft'?2.2:1.7)),0,enemy?.14:.18);
 c.save();
 if(p.shape==='orb'){c.beginPath();c.ellipse(-L*.5,0,L*.5,wide*.5,0,0,Math.PI*2);c.clip();}
 else if(p.shape==='teardrop'){c.beginPath();c.moveTo(-L,0);c.bezierCurveTo(-L*.5,-wide*.24,-L*.12,-wide*.8,0,0);c.bezierCurveTo(-L*.12,wide*.8,-L*.5,wide*.24,-L,0);c.closePath();c.clip();}
 // A close dark underpaint follows the authored silhouette, separating its
 // luminous centre from bright terrain without a ring or detached danger mark.
 if(enemy)fxTint(c,'tracerCore','#4b242a',-L*.5,0,L*1.04,wide*1.35,0,.9);
 fxTint(c,'tracerCore',p.wake,-L*.5,0,L,wide*(needle?(enemy?.7:.55):drop?(enemy?.85:.8):1),0,.96);
 const tip=needle?L*.55:drop?L*.45:p.shape==='orb'?L*.85:L*.7;
 fxTint(c,'tracerCore',p.core,-tip*.5,0,tip,wide*(needle?.4:drop?.85:p.shape==='orb'?.78:.52),0,.98);c.restore();
 if(combo)accent(c,null,combo);
 if(cache.size>=96)cache.delete(cache.keys().next().value);cache.set(key,cv);return cv;
}
export function drawGunSignature(c,b,x,y,screenScale=1){
 const id=gunSignatureId(b);if(!id)return false;const cv=compose(id,!!b.enemy,b.projectileCombo);if(!cv)return false;
 // Zoom compensation widens only hostile bodies; stretching the entire wake
 // previously made boss fire look like beams while ordinary rounds vanished.
 const k=b.enemy?Math.max(1,1/Math.max(.65,screenScale)):1;
 c.save();c.translate(x,y);c.rotate(Math.atan2(b.vy,b.vx));c.scale(Math.min(k,1.12),k);c.drawImage(cv,-54,-10,64,20);c.restore();return true;
}
// Distinct active-combination wakes. Repair/egress have no projectile entry.
export const COMBO_WAKES=Object.freeze({
 highSpeedIntercept:['#cee9cf','rail'],fireLink:['#efb46f','steps'],crossfire:['#a6d4c8','cross'],defensiveSuppression:['#c9a9dd','guard'],diveBombing:['#e3d5a6','dive'],formationBreakthrough:['#d7e8ba','lance'],guidedBombing:['#a9c5dc','rail'],blockingBombing:['#dfb497','block'],mutualCover:['#acd2a0','guard']
});
function accent(c,doctrine,combo){
 // Active effects modulate the existing light along the same axis. No V-wakes,
 // detached marks or extra apparent rounds, including pilot-specific tracers.
 if(doctrine==='focus'){fxTint(c,'tracerCore','#b5d1db',-16,0,32,1.4,0,.65);}
 if(doctrine==='area'){fxTint(c,'tracerGlow','#d7bd7a',-10,0,22,7,0,.3);}
 if(['precision','suppression','strike','duel','counter','intercept'].includes(doctrine)){
  const p=GUN_SIGNATURES[doctrine];fxTint(c,'tracerCore',p.wake,-p.length*.5,0,p.length,Math.min(3,p.width*.55),0,.4);
 }
 const v=COMBO_WAKES[combo];if(!v)return;const [color,shape]=v;
 const length=shape==='rail'?32:shape==='steps'?24:shape==='cross'?26:shape==='guard'?19:shape==='dive'?35:shape==='lance'?30:22;
 const width=shape==='rail'?1.3:shape==='guard'?3.5:shape==='block'?3:2;
 fxTint(c,'tracerGlow',color,-length*.5,0,length,width*2.3,0,.22);
 fxTint(c,'tracerCore',color,-length*.5,0,length,width,0,.6);
}
const accentCache=new Map();
export function drawProjectileTactic(c,b,x,y,angle=Math.atan2(b.vy||0,b.vx||0)){
 const doctrine=b.projectileDoctrine,combo=COMBO_WAKES[b.projectileCombo]?b.projectileCombo:null;if(!['focus','area','precision','suppression','strike','duel','counter','intercept'].includes(doctrine)&&!combo)return false;
 if(!fxReady('tracerCore')||typeof document==='undefined')return false;const key=(doctrine||'')+'/'+(combo||'');let cv=accentCache.get(key);
 if(!cv){cv=document.createElement('canvas');cv.width=W;cv.height=H;const g=cv.getContext('2d');g.scale(SCALE,SCALE);g.translate(54,10);accent(g,doctrine,combo);if(accentCache.size>=48)accentCache.delete(accentCache.keys().next().value);accentCache.set(key,cv);}
 c.save();c.translate(x,y);c.rotate(angle);c.drawImage(cv,-54,-10,64,20);c.restore();return true;
}
