import {prepareAirThreatArt} from './air-threat-art.js';
import {AIR_THREAT_ASSETS} from './air-threat-assets.js';
import {configureAA} from './air-threat-profiles.js';
import {beginAircraftCrash} from './aircraft-crash.js?v=descent20261022';
import {predictPilot} from './headon-stageboss-core.js?v=tame3&ai=1018&sig=1019&boss=20261020b&phase=1021&harbor=20261021';

const LIMIT=105;
const HP=280;
const GROUPS=[[950,-350],[2450,360],[3950,-280]];
const VALLEY_APPROACH=[0,1570,3320];
const BOSS_APPROACH=450;
const BOSS_FALLBACK=18;
const SALVO_DELAY=5.5;
const DELAY_PER_LOSS=.9;
const offset=(o,a,d,n=0)=>({x:o.x+Math.cos(a)*d-Math.sin(a)*n,y:o.y+Math.sin(a)*d+Math.cos(a)*n});
const livePilot=p=>p?.hp>0&&(!p.status||p.status==='alive');

function advance(g,m){
 const x=Math.cos(m.heading),y=Math.sin(m.heading);
 let far=m.alps?.forward||0;
 for(const p of g.players||[g])if(livePilot(p))far=Math.max(far,(p.x-m.origin.x)*x+(p.y-m.origin.y)*y);
 return far;
}

export function alpsBossContact(g,m){
 const forward=advance(g,m),down=m.alps?.down||0;
 const ready=forward>=BOSS_APPROACH||down>0||m.age>=BOSS_FALLBACK;
 return {stageIndex:6,loopIndex:g.stageBoss?.stages?.loopIndex||0,remaining:ready?0:19,
  progress:Math.min(1,Math.max(forward/BOSS_APPROACH,down,m.age/BOSS_FALLBACK)),approaching:ready,ready};
}

function valleyPoint(g,q,others){
 const mountains=g.alpsMountains;
 for(const radius of [0,200,400,650,900])for(let i=0;i<(radius?12:1);i++){
  const p=offset(q,i*Math.PI/6,radius);
  const peaks=mountains?.query({left:p.x-270,right:p.x+270,top:p.y-270,bottom:p.y+270})||[];
  if(peaks.every(k=>Math.hypot(p.x-k.x,p.y-k.y)>(k.radius||0)+140)&&
     others.every(k=>Math.hypot(p.x-k.x,p.y-k.y)>=225))return p;
 }
 return null;
}

function begin(g,m){
 m.limit=LIMIT;
 const faction=m.faction==='central'?'entente':'central',sprite=faction==='central'?'drachen':'caquot';
 const art=`balloon-${sprite}-alpine-observation`,size=AIR_THREAT_ASSETS[art];
 if(typeof Image!=='undefined')prepareAirThreatArt([art]);
 const targets=[];
 for(const [group,[along,across]] of GROUPS.entries())for(const lane of [-1,0,1]){
  const q=offset(m.origin,m.heading,along+Math.abs(lane)*210,across+lane*285);
  const p=valleyPoint(g,q,targets);
  if(!p)continue;
  const length=216,width=length*size.width/size.height;
  targets.push({...p,id:`${m.id}:balloon:${targets.length}`,type:'balloon',faction,name:'포병 관측 기구',a:-Math.PI/2,
   fieldUnit:'balloon',fieldSprite:sprite,fieldRegion:6,stationary:true,speed:0,fire:Infinity,wobble:0,
   airThreatArt:art,airThreatLength:length,airThreatWidth:width,airThreatRole:'observation',threatEnvironment:'alpine',
   hp:HP,maxHp:HP,hitRadius:width*.39,hullWidth:width*.39,hullLength:length*.45,life:Infinity,
   mapMissionId:m.id,mapAlpsObserver:true,missionTarget:true,group});
 }
 if(targets.length!==9)return false;
 const reserve=targets.splice(3);
 (g.enemies??=[]).push(...targets);
 const batteries=GROUPS.map(([along,across])=>offset(m.origin,m.heading,along+310,across+470));
 m.alps={targets,reserve,batteries,forward:0,down:0,nextAt:6,salvo:0};
 return true;
}

function fireBattery(g,m,p){
 const s=m.alps,lead=1.25,along=p.a??m.heading;
 const predicted=predictPilot({x:p.x,y:p.y,vx:Math.cos(along)*(p.speed||0),vy:Math.sin(along)*(p.speed||0)},lead);
 const point=offset(predicted,along,0,(s.salvo%2?-1:1)*s.down*34);
 const source=s.batteries.reduce((nearest,q)=>Math.hypot(q.x-p.x,q.y-p.y)<Math.hypot(nearest.x-p.x,nearest.y-p.y)?q:nearest);
 const gun={...source,a:0,fieldRegion:6,life:4,maxLife:4};
 configureAA(g,gun,66);
 (g.flakBursts??=[]).push(gun);
 g.stageBoss?.hazards?.spawn?.({kind:'circle',encounterId:m.id,x:point.x,y:point.y,sourceX:source.x,sourceY:source.y,
  warning:lead,duration:.3,once:true,damage:12,radius:66,visual:'observer-shell'});
 g.smoke?.(source.x,source.y,true);
 g.event?.('bossSound','heavyShot');
 s.nextAt=m.age+SALVO_DELAY+s.down*DELAY_PER_LOSS;
 s.salvo++;
}

export function tickAlpsObservation(g,m){
 if(!m.alps&&!begin(g,m))return null;
 const s=m.alps;
 s.forward=advance(g,m);
 const previous=s.down;
 for(const e of s.targets){
  if(e.mapResult||e.hp>0)continue;
  e.mapResult='down';e.missionTarget=false;s.down++;
  e.crashStyle='spin';beginAircraftCrash(e,g.rng||Math.random);e.crashDuration=e.crashT=2;
  if(!g.enemies.includes(e))g.enemies.push(e);
  if(s.down===3||s.down===6)g.event?.('wave',s.down===3?'관측망 손상 · 포격 정확도 저하':'관측망 붕괴 직전 · 포격 빈도 저하');
 }
 if(s.nextAt>m.age)s.nextAt+=(s.down-previous)*DELAY_PER_LOSS;
 // The next observers launch as the pilots reach the valley. A pilot can
 // continue straight through the pass even after disarming the bomber.
 const nextGroup=s.reserve[0]?.group;
 if(nextGroup!==undefined&&(s.forward>=VALLEY_APPROACH[nextGroup]||nextGroup===1&&s.down>=3)){
  const launched=s.reserve.splice(0,3);
  s.targets.push(...launched);g.enemies.push(...launched);
  g.event?.('wave',nextGroup===1?'두 번째 계곡 관측 기구 출현':'마지막 계곡 관측 기구 출현');
 }
 const p=(g.players||[g]).find(livePilot);
 m.task=[`적 관측 기구 ${s.down}/9기 격추`,`Enemy observation balloons down ${s.down}/9`];
 const salvoDelay=(SALVO_DELAY+s.down*DELAY_PER_LOSS).toFixed(1);
 m.detail=s.down?[`적 포격 오차 증가 · ${salvoDelay}초 간격`,`Enemy shell spread increased · ${salvoDelay}s between salvos`]:
  ['세 계곡의 포병 관측망을 파괴하세요','Destroy the artillery observers in three valleys'];
 const point=p||m.origin;
 const active=s.targets.filter(e=>!e.mapResult&&!e.expired).sort((a,b)=>Math.hypot(a.x-point.x,a.y-point.y)-Math.hypot(b.x-point.x,b.y-point.y));
 m.guides=active.slice(0,6).map(e=>({x:e.x,y:e.y,label:[`계곡 ${e.group+1} 관측 기구`,`Valley ${e.group+1} observer`],kind:'target'}));
 const following=s.reserve[0]?.group;
 if(following!==undefined&&m.guides.length<6)m.guides.push({...offset(m.origin,m.heading,VALLEY_APPROACH[following],GROUPS[following][1]),label:[`계곡 ${following+1} 진입로`,`Valley ${following+1} approach`],kind:'target'});
 if(s.down===9)return {success:true,reason:['적 포병 관측망 섬멸','Enemy artillery observation network destroyed']};
 if(p&&s.down<9&&m.age>=s.nextAt)fireBattery(g,m,p);
 return null;
}
