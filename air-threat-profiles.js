import {AIR_THREAT_ASSETS} from './air-threat-assets.js';
import {airThreatArtReady} from './air-threat-art.js';
export {selectAAArt,aaMuzzle} from './air-threat-art.js';
export const AIR_THREAT_ROLE_PROFILES=Object.freeze({
 recon:Object.freeze({length:280,hp:.72,speed:1.08,fire:1.4}),
 bomber:Object.freeze({length:340,hp:.9,speed:.88,fire:1.2}),
 'heavy-defense':Object.freeze({length:380,hp:1,speed:.76,fire:1.15}),
 observation:Object.freeze({length:240,hp:650/780,maxHp:650,speed:0,fire:1}),
 'balloon-heavy':Object.freeze({length:260,hp:1,maxHp:780,speed:0,fire:1.2})
});
export function threatEnvironment(region){return region===6?'alpine':[1,7,14,16,17].includes(region)?'coastal':'rural';}
export function airshipCandidates(faction,region){
 const env=threatEnvironment(region);
 if(faction==='central')return [`central-${env}-recon`,'central-rural-bomber','central-rural-heavy-defense','central-parseval-pl25'];
 if(faction!=='entente')return [];
 if(env==='coastal')return ['entente-coastal-recon','entente-astra-bomber','entente-northsea-heavy','entente-british-ss'];
 if(env==='alpine')return ['entente-forlanini-f5'];
 return ['entente-british-ss','entente-astra-bomber'];
}
const excluded=(g,e)=>!e||e.hp<=0||e.type!=='zeppelin'||g.bossMechanicSpawn||e.bossPilot||e.bossPlane||e.bossMinion||e.bossEscort||e.stageBossBody||e.heavyBomber||e.missionTarget||e.fieldUnit||e.surface||e.stationary||e.navalVessel||e.formationLeader;
function attachArt(e,id,role,length){
 const m=AIR_THREAT_ASSETS[id];e.airThreatArt=id;e.airThreatRole=role;e.airThreatLength=length;e.airThreatWidth=length*m.width/m.height;
 // Ellipse excludes extremal fins/weapons but follows the visible envelope.
 e.hullLength=length*.45;e.hullWidth=e.airThreatWidth*(role==='heavy-defense'?.34:.39);
 e.hitRadius=e.hullWidth;e.contactRadius=e.hullWidth*.70;
}
export function configureAirship(g,e,ready=airThreatArtReady){
 if(excluded(g,e)||e.airThreatArt)return false;
 const region=g.worldRegion?.()??0,pool=airshipCandidates(e.faction,region);if(!pool.length)return false;
 const groups=g.airThreatSequences??=Object.create(null),key=e.faction+':'+region,seq=groups[key]||0;groups[key]=seq+1;
 // One slot in four retains the stock-bank population; this is a fit selection,
 // never an additional spawn or a change to the battle director's RNG stream.
 if(seq%4===3)return false;
 const index=seq-Math.floor(seq/4),id=pool[index%pool.length],m=AIR_THREAT_ASSETS[id];
 if(!m||!ready(id))return false;
 const role=m.role==='heavy-defense'?'heavy-defense':m.role==='bomber'?'bomber':'recon',p=AIR_THREAT_ROLE_PROFILES[role];
 attachArt(e,id,role,p.length);e.threatEnvironment=threatEnvironment(region);e.airThreatFireFactor=p.fire;
 e.name=({'central-parseval-pl25':'Parseval PL.25 정찰 비행선','entente-british-ss':'British SS 정찰 비행선','entente-forlanini-f5':'Forlanini F.5 정찰 비행선','entente-astra-bomber':'Astra 폭격 비행선'})[id]||({recon:'정찰 비행선',bomber:'폭격 비행선','heavy-defense':'중무장 비행선'})[role];
 const hp=Math.max(1,Math.round(e.maxHp*p.hp));e.hp=Math.min(hp,e.hp);e.maxHp=hp;
 e.speed*=p.speed;e.fire*=p.fire;
 // The new sprite is rendered directly, not through the aircraft-bank override.
 delete e.bankAircraft;delete e.bankHandlingBase;delete e.bankFireFactor;delete e.bankTurnFactor;delete e.escortPlane;delete e.formationLivery;
 return true;
}
export function balloonCandidates(faction,region){
 const env=threatEnvironment(region),roles=['observation','heavy-defense'];
 if(faction==='central')return roles.map(role=>`balloon-drachen-${env}-${role}`);
 if(faction!=='entente')return [];
 // Spheres are French; Caquot national markings follow their environment:
 // US western front, Italian Alpine theater, British coastal theaters.
 return ['sphere','caquot'].flatMap(family=>roles.map(role=>`balloon-${family}-${env}-${role}`));
}
export const AA_PLATFORM_PROFILES=Object.freeze({
 pedestal:Object.freeze({hp:.8,fire:1.15,damage:.85}),
 lorry:Object.freeze({hp:.9,fire:1.1,damage:.95}),
 position:Object.freeze({hp:1,fire:1,damage:1})
});
export function configureAA(g,e,size=66,ready=airThreatArtReady){
 if(!e||e.stageBossBody||e.bossMinion||e.bossPilot||e.airThreatAA)return false;
 const region=e.fieldRegion??e.hazardRegion??e.region??g.worldRegion?.()??0,env=threatEnvironment(region);
 const seqs=g.airThreatAASequences??=Object.create(null),seq=seqs[env]||0;
 seqs[env]=seq+1;
 const platform=['pedestal','lorry','position'][seq%3],id=`aa-${env}-${platform}`;
 if(!AIR_THREAT_ASSETS[id]||!ready(id))return false;
 const p=AA_PLATFORM_PROFILES[platform];
 e.airThreatAA=id;e.aaPlatform=platform;e.threatEnvironment=env;e.aaSize=size;
 e.aaHpFactor=p.hp;e.aaFireFactor=p.fire;e.aaDamageFactor=p.damage;
 if(Number.isFinite(e.maxHp)&&e.maxHp>0){const maxHp=Math.max(1,Math.round(e.maxHp*p.hp));e.hp=Math.max(0,Math.min(maxHp,Math.round(e.hp*p.hp)));e.maxHp=maxHp;}
 return true;
}
export function configureBalloon(g,e,ready=airThreatArtReady){
 if(!e||e.hp<=0||e.fieldUnit!=='balloon'||e.stageBossBody||e.bossMinion||e.airThreatArt)return false;
 const region=e.fieldRegion??g.worldRegion?.()??0,pool=balloonCandidates(e.faction,region);if(!pool.length)return false;
 const groups=g.airThreatBalloonSequences??=Object.create(null),key=e.faction+':'+region,seq=groups[key]||0;groups[key]=seq+1;
 const id=pool[seq%pool.length];if(!AIR_THREAT_ASSETS[id]||!ready(id))return false;
 const heavy=id.endsWith('heavy-defense'),role=heavy?'heavy-defense':'observation',profile=AIR_THREAT_ROLE_PROFILES[heavy?'balloon-heavy':'observation'];
 const length=id.startsWith('balloon-sphere-')?(heavy?210:190):heavy?260:240;attachArt(e,id,role,length);
 e.threatEnvironment=threatEnvironment(region);e.airThreatFireFactor=profile.fire;e.name=heavy?'중무장 관측기구':'관측기구';
 // Retain one existing entity and cap the observer health budget at 780.
 const cap=profile.maxHp,ratio=e.maxHp>0?Math.max(0,Math.min(1,e.hp/e.maxHp)):1;
 e.maxHp=Math.min(e.maxHp||cap,cap);e.hp=Math.round(e.maxHp*ratio);
 return true;
}
export function airThreatDimensions(e){
 const m=AIR_THREAT_ASSETS[e?.airThreatArt];if(!m)return null;
 const height=e.airThreatLength||280;return {width:height*m.width/m.height,height};
}
export function airThreatMuzzles(e){
 const m=AIR_THREAT_ASSETS[e?.airThreatArt],d=airThreatDimensions(e);if(!m||!d)return [];
 const angle=e.fieldUnit==='balloon'?0:(e.a||0)+Math.PI/2,cs=Math.cos(angle),sn=Math.sin(angle);
 const anchors=m.weaponAnchors?.length?m.weaponAnchors:[[.30,.62],[.70,.62]];
 return anchors.map(([u,v],i)=>{
  const lx=(u-.5)*d.width,ly=(v-.5)*d.height;
  const left=u<.5,local=e.airThreatArt==='entente-northsea-heavy'? (left?-Math.PI*.75:-Math.PI*.25):left?Math.PI:0;
  return {x:(e.x||0)+lx*cs-ly*sn,y:(e.y||0)+lx*sn+ly*cs,angle:angle+local,index:i};
 });
}
