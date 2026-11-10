import {prepareAirThreatArt} from './air-threat-art.js?v=b3bf991d11fc7798';
import {AIR_THREAT_ASSETS} from './air-threat-assets.js?v=b3bf991d11fc7798';
import {configureAA} from './air-threat-profiles.js?v=b3bf991d11fc7798';
import {beginAircraftCrash} from './aircraft-crash.js?v=b3bf991d11fc7798';
import {predictPilot} from './headon-stageboss-core.js?v=b3bf991d11fc7798';

const LIMIT=105;
const HP=125;
const GROUPS=[[950,-350],[2450,360],[3950,-280]];
const offset=(o,a,d,n=0)=>({x:o.x+Math.cos(a)*d-Math.sin(a)*n,y:o.y+Math.sin(a)*d+Math.cos(a)*n});

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
 (g.enemies??=[]).push(...targets);
 const batteries=GROUPS.map(([along,across])=>offset(m.origin,m.heading,along+310,across+470));
 m.limit=LIMIT;m.alps={targets,batteries,down:0,nextAt:6};
 return true;
}

function fireBattery(g,m,p){
 const s=m.alps,accurate=s.down<3,lead=1.25,along=p.a??m.heading;
 const point=accurate?predictPilot({...p,vx:Math.cos(along)*(p.speed||0),vy:Math.sin(along)*(p.speed||0)},lead):
  offset(p,along,50,(s.salvo%2?-1:1)*260);
 const source=s.batteries.reduce((nearest,q)=>Math.hypot(q.x-p.x,q.y-p.y)<Math.hypot(nearest.x-p.x,nearest.y-p.y)?q:nearest);
 const gun={...source,a:0,fieldRegion:6,life:4,maxLife:4};
 configureAA(g,gun,66);
 (g.flakBursts??=[]).push(gun);
 g.stageBoss.hazards.spawn({kind:'circle',encounterId:m.id,x:point.x,y:point.y,sourceX:source.x,sourceY:source.y,
  warning:lead,duration:.3,once:true,damage:12,radius:66,visual:'observer-shell'});
 g.smoke?.(source.x,source.y,true);
 g.event?.('bossSound','heavyShot');
 s.nextAt=m.age+(s.down>=6?11:5.5);
 s.salvo++;
}

export function tickAlpsObservation(g,m){
 if(!m.alps&&!begin(g,m))return null;
 const s=m.alps;
 s.salvo??=0;
 for(const e of s.targets){
  if(e.mapResult||e.hp>0)continue;
  e.mapResult='down';e.missionTarget=false;s.down++;
  e.crashStyle='spin';beginAircraftCrash(e,g.rng||Math.random);e.crashDuration=e.crashT=2;
  if(!g.enemies.includes(e))g.enemies.push(e);
  if(s.down===3||s.down===6)g.event?.('wave',s.down===3?'관측망 손상 · 포격 정확도 저하':'관측망 붕괴 직전 · 포격 빈도 저하');
 }
 const pilots=(g.players||[g]).filter(p=>p.hp>0&&p.status!=='downed'&&p.status!=='dead'),p=pilots[0];
 m.task=[`적 관측 기구 ${s.down}/9기 격추`,`Enemy observation balloons down ${s.down}/9`];
 m.detail=s.down>=6?['적 포격이 드물고 부정확합니다','Enemy fire is infrequent and inaccurate']:
  s.down>=3?['적 포격 정확도 감소','Enemy fire accuracy reduced']:['세 계곡의 포병 관측망을 파괴하세요','Destroy the artillery observers in three valleys'];
 const active=s.targets.filter(e=>!e.mapResult&&!e.expired).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));
 m.guides=active.slice(0,6).map(e=>({x:e.x,y:e.y,label:[`계곡 ${e.group+1} 관측 기구`,`Valley ${e.group+1} observer`],kind:'target'}));
 const encounter=g.stageBoss.stages.encounter;
 if(s.down===9&&encounter&&!encounter.arrivalPending)return {success:true,reason:['적 포병 관측망 섬멸','Enemy artillery observation network destroyed']};
 if(active.length&&m.age>=s.nextAt)fireBattery(g,m,p);
 return null;
}
