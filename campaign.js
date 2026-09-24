import {Game,PLANES,WEAPONS,PILOTS,PILOT_PLANES,UPGRADES,AIRFRAME_PROFILES,configureAirframeBalance,applyEnemyMovementLimits} from './engine.js?v=302&b=302';
import {CAMPAIGN_DATA} from './campaign-data.js?v=302&b=302';
import {attachAircraftPersonality,personalityFor} from './aircraft-personality164.js?v=302';
export const STAGES=[...CAMPAIGN_DATA.stages].sort((a,b)=>a.faction.localeCompare(b.faction)||a.historicalAnchorDate.localeCompare(b.historicalAnchorDate)||a.id.localeCompare(b.id));
export const stageFaction=s=>s.faction==='allies'?'entente':'central';
// Variant values are arcade fits derived from the existing family, not restored historical statistics.
const fits=[
 ['BE.2c','be2c','re7','entente',0],['Airco DH.2','dh2','nieuport','entente',1],
 ['Aviatik C.I','aviatik','albatros','central',1],['Sopwith 1½ Strutter','strutter','re7','entente',1],
 ['Nieuport 11','nieuport11','nieuport','entente',1],['Nieuport 17','nieuport','nieuport','entente'],
 ['Nieuport 28','nieuport28','nieuport','entente',1],
 ['Sopwith Camel','camel','camel','entente'],['S.E.5a','se5a','se5a','entente'],
 ['Fokker E.I','fokker_e1','eindecker','central',1],['Albatros D.II','albatros_d2','albatros','central'],
 ['Albatros D.III','albatros','albatros','central'],['Albatros D.V','albatros_d5','albatros','central'],
 ['Albatros D.III(Oeffag)','oeffag','albatros','central'],['Fokker Dr.I','fokker_campaign','fokker','central'],
 ['Fokker D.VII','fokker_d7_campaign','fokkerd7','central'],
 ['Sopwith Pup','pup','camel','entente'],['DH.5','dh5','dh2','entente'],['Bristol F.2B','bristol','re7','entente'],
 ['Halberstadt CL.II','halberstadt','albatros','central'],['Albatros D.Va','albatros_d5a','albatros','central'],
 ['SPAD VII','spad7','spad','entente'],['SPAD XIII','spad','spad','entente'],['Hanriot HD.1','hanriot','nieuport','entente'],
 ['Sopwith Triplane','sopwith','sopwith','entente'],['R.E.8','re8','re7','entente'],['DH.4','dh4','re7','entente'],
 ['Fokker E.III','eindecker','eindecker','central'],['Fokker D.VIII','fokkerdv','fokkerdv','central'],
 ['Siemens-Schuckert D.IV','siemens_d4','albatros','central'],['Roland D.VIa','roland_d6','albatros','central'],
 ['Hannover CL.IIIa','hannover_cl3','halberstadt','central',1],['DFW C.V','dfw_cv','aviatik','central',1],
 ['Junkers J.I','junkers_j1','albatros','central',1],['Gotha G.V','gotha','re7','central',1],
 ['Bristol M.1','bristol_m1','pup','entente',1],['Sopwith Dolphin','dolphin','se5a','entente'],
 ['Sopwith Snipe','snipe','camel','entente'],['F.E.2b','fe2b','strutter','entente',1],
 ['Vickers F.B.5','gunbus','strutter','entente',1],['Morane-Saulnier A.I','morane_ai','nieuport','entente',1],
 ['AEG G.IV','aeg_g4','re7','central',1],['Friedrichshafen G.III','friedrichshafen_g3','re7','central',1],
 ['Breguet 14','breguet14','re7','entente',1],['Voisin VIII','voisin8','re7','entente',1],
 ['Caudron G.4','caudron_g4','re7','entente',1],
 ['Siemens-Schuckert D.III','ssw_d3','albatros','central'],['Pfalz D.XII','pfalz_d12','albatros','central'],
 ['Phönix D.I','phonix_d1','albatros','central'],['Aviatik D.I Berg','aviatik_d1','albatros','central'],
 ['Junkers D.I','junkers_d1','albatros','central'],['Ansaldo SVA.5','ansaldo_sva5','spad','entente'],
 ['Hansa-Brandenburg W.29','hb_w29','albatros','central'],['Friedrichshafen FF.33','ff33','re7','central',1],
 ['Felixstowe F.2','felixstowe_f2','re7','entente',1],
 ['Schütte-Lanz SL.11','shuttelanz_sl11','re7','central',0],['Parseval PL','parseval','re7','central',0],
 ['Caquot Balloon','caquot_balloon','re7','entente',0],
 ['Albatros D.Va · 야스타 4','jasta4_albatros','albatros','central'],['Albatros D.Va · 야스타 5','jasta5_albatros','albatros','central'],['Albatros D.Va · 야스타 78b','jasta78b_albatros','albatros','central'],
 ['Albatros D.Va · 키센베르트','kissenberth_albatros','albatros','central'],['Albatros D.Va · 알멘룰더','allmenroder_albatros','albatros','central'],
 ['Fokker Dr.I · 로타르','lothar_dr1','fokker','central'],['Fokker Dr.I · 볼리외','beaulieu_dr1','fokker','central'],['Fokker Dr.I · 마이','mai_dr1','fokker','central'],['Fokker Dr.I · 한텔만','hantelmann_dr1','fokker','central'],
 ['Fokker D.VII · 야스타 11','jasta11_fokkerd7','fokkerd7','central'],['Fokker D.VII · 야스타 18','jasta18_fokkerd7','fokkerd7','central'],['Fokker D.VII · 야스타 43','jasta43_fokkerd7','fokkerd7','central'],
 ['Fokker D.VII · 가브리엘','gabriel_fokkerd7','fokkerd7','central'],['Fokker D.VII · 귀링','jasta27_fokkerd7','fokkerd7','central'],
 ['Pfalz D.XII · 보이머','baeumer_pfalz','pfalz_d12','central'],['Pfalz D.XII · 데겔로프','degelow_pfalz','pfalz_d12','central'],
 ['Phönix D.I · 링케-크로퍼드','linke_crawford_phonix','phonix_d1','central'],['Phönix D.I · 키스','kiss_phonix','phonix_d1','central'],['Aviatik D.I · 아리기','arigi_aviatik','aviatik_d1','central'],
 ['Gotha G.IV · 야간형','gotha_night','gotha','central',1],['Staaken R.VI · 심녹색','staaken_dark','gotha','central',1],
 ['Sopwith Camel · 로이 브라운','brown_camel','camel','entente'],['Sopwith Camel · 맥엘로이','mcelroy_camel','camel','entente'],['Sopwith Camel · 대즐위장','dazzle_camel','camel','entente'],
 ['Nieuport 17 · 러프버리','lufbery_nieuport17','nieuport','entente'],['Nieuport 23 · 도름','dorme_nieuport','nieuport','entente'],['Nieuport · 뮨르메스터','meulemeester_nieuport','nieuport','entente'],
 ['Nieuport 28 · 제27대대','eagle_nieuport28','nieuport28','entente'],['Hanriot HD.1 · 코펜스','coppens_hanriot','hanriot','entente'],
 ['SPAD XIII · 마동','madon_spad','spad','entente'],['SPAD · 타라콘','tarascon_spad','spad','entente'],['SPAD XIII · 보요','boyau_spad','spad','entente'],['SPAD XIII · 제94대대','hatring_spad','spad','entente'],
 ['S.E.5a · 스프링스','springs_se5a','se5a','entente'],['S.E.5a · 프록터','proctor_se5a','se5a','entente'],['S.E.5a · 제60대대','checker_se5a','se5a','entente'],
 ['SVA.5 · 루포','ruffo_sva5','ansaldo_sva5','entente'],['Macchi M.5 · 피에로치','pierozzi_macchi','albatros','entente']
];
// Campaign-specific flight fits: game estimates, not historical test measurements.
const campaignFlight={
 be2c:['re7',103,1.8,.20,.7,'안정 지향 관측기'],
 dh2:['airco_dh2',116,3.4,.25,.85,'초기 푸셔 전투기'],
 aviatik:['re7',114,2.15,.21,.75,'복좌 정찰기'],
 strutter:['bristol_duo',127,2.8,.20,.9,'초기 복좌 전투기'],
 nieuport11:['nieuport',130,4.05,.24,1.1,'경량 초기 전투기'],
 nieuport28:['nieuport',150,3.8,.19,1.15,'미국 특급대 경량 전투기'],
 fokker_e1:['eindecker',102,2.45,.24,.75,'초기 아인데커'],
 albatros_d2:['albatros',140,2.85,.17,1,'초기 알바트로스'],
 albatros_d5:['albatros',150,3,.16,1.1,'알바트로스 후기형'],
 oeffag:['albatros',154,3.1,.15,1.15,'오스트리아제 알바트로스'],
 pup:['sopwith',136,4.05,.20,1.1,'경쾌한 경량 전투기'],
 dh5:['nieuport',144,3.3,.22,1.05,'단좌 전투기'],
 bristol:['bristol_duo',158,3.1,.16,1.1,'공세적인 복좌 전투기'],
 halberstadt:['halberstadt_duo',133,2.85,.19,.95,'복좌 근접 지원기'],
 albatros_d5a:['albatros',151,3,.16,1.1,'알바트로스 후기형'],
 spad7:['spad',163,2.75,.14,1.35,'직선 공격형 전투기'],
 hanriot:['nieuport',143,3.9,.21,1.15,'경쾌한 경량 전투기'],
 re8:['re7',126,2.25,.21,.85,'복좌 정찰·관측기'],
 dh4:['bristol_duo',173,2.4,.15,1.2,'고속 복좌 폭격기'],
 siemens_d4:['albatros',176,3.8,.16,1.3,'고속 상승형 전투기'],
 roland_d6:['albatros',142,2.9,.18,1,'중기체 전투기'],
 hannover_cl3:['halberstadt_duo',137,2.9,.2,1,'복좌 근접 지원기'],
 dfw_cv:['re7',135,2.4,.2,.85,'복좌 정찰기'],
 junkers_j1:['re7',108,2.05,.23,.7,'장갑 지상 공격기'],
 gotha:['re7',96,1.7,.25,.55,'중폭격기'],
 bristol_m1:['nieuport',146,4,.19,1.1,'단엽 초기 전투기'],
 dolphin:['se5a',160,3.4,.18,1.15,'역스태거 고고도 전투기'],
 snipe:['camel',166,3.7,.17,1.2,'캐멀 후계 전투기'],
 fe2b:['re7',118,2.5,.21,.8,'초기 푸셔 복좌기'],
 gunbus:['re7',108,2.3,.22,.7,'초기 푸셔 전투기'],
 morane_ai:['nieuport',140,3.8,.2,1.05,'파라솔 단엽기'],
 aeg_g4:['re7',108,1.9,.24,.62,'쌍발 중폭격기'],
 friedrichshafen_g3:['re7',104,1.85,.24,.6,'쌍발 폭격기'],
 breguet14:['re7',130,2.35,.21,.85,'주간 폭격기'],
 voisin8:['re7',106,2.15,.23,.7,'푸셔 포격기'],
 caudron_g4:['re7',112,2.3,.21,.75,'쌍발 정찰기'],
 ssw_d3:['albatros',172,3.6,.16,1.25,'고속 상승 전투기'],
 pfalz_d12:['albatros',162,3.05,.17,1.1,'후기형 전투기'],
 phonix_d1:['albatros',160,3.05,.17,1.1,'오스트리아 전투기'],
 aviatik_d1:['albatros',158,3.2,.17,1.1,'버그 스카우트'],
 junkers_d1:['albatros',176,3.05,.17,1.2,'전금속 단엽 전투기'],
 ansaldo_sva5:['spad',188,2.95,.15,1.3,'고속 정찰 전투기'],
 hb_w29:['albatros',150,3.2,.18,1.05,'수상 전투기'],
 ff33:['re7',100,2.25,.22,.7,'수상 정찰기'],
 felixstowe_f2:['re7',96,1.7,.25,.55,'대형 비행정'],
 shuttelanz_sl11:['re7',62,1.05,.3,.38,'경질 비행선'],
 parseval:['re7',58,1.15,.3,.42,'비경질 비행선'],
 caquot_balloon:['re7',22,.4,.35,.3,'관측 기구']
};
export const AIRCRAFT_IDS={},SPRITE_ALIASES={};
for(const [name,id,base,faction,guns] of fits){
 AIRCRAFT_IDS[name]=id;
 if(!PLANES[id]){
  Object.defineProperty(PLANES,id,{value:{...PLANES[base],name,faction,campaignOnly:true,personality:personalityFor(base)||PLANES[base]?.personality||null},enumerable:false});
  Object.defineProperty(WEAPONS,id,{value:{...WEAPONS[base],...(guns===undefined?{}:{guns}),...(guns===0?{name:'전방 고정총 없음'}:{})},enumerable:false});
 }
 if(campaignFlight[id]&&id!=='albatros_d2'){const [family,speed,turn,drag,recovery,role]=campaignFlight[id];const original=AIRFRAME_PROFILES[family];const handling=Object.freeze({...original,speed,turn,drag,recovery,role,left:1,history:id==='bristol'?original.history:name+'의 임무와 기체 계열을 반영한 캠페인용 비행 설정입니다. 세부 수치는 게임용 추정치입니다.',tip:id==='bristol'?original.tip:(turn>=3.3?'민첩한 방향 전환을 활용하세요. 급선회 후 직진하면 속도가 회복됩니다.':speed>=160?'속도를 살려 통과 사격하고 넓게 돌아오세요.':'미리 진로를 정해 부드럽게 도세요. 급선회 후에는 속도 회복에 여유를 주세요.')});Object.assign(PLANES[id],{speed,turn,role,handling,personality:personalityFor(family)||PLANES[family]?.personality||PLANES[id].personality})}
 configureAirframeBalance(PLANES[id],({be2c:100,dh2:85,aviatik:110,strutter:110,nieuport11:80,nieuport28:95,fokker_e1:80,albatros_d2:110,albatros_d5:115,oeffag:120,pup:90,dh5:95,bristol:130,halberstadt:120,albatros_d5a:120,spad7:115,hanriot:95,re8:120,dh4:125,siemens_d4:110,roland_d6:105,hannover_cl3:120,dfw_cv:115,junkers_j1:170,gotha:220,bristol_m1:85,dolphin:105,snipe:115,fe2b:115,gunbus:100,morane_ai:85,aeg_g4:200,friedrichshafen_g3:190,breguet14:130,voisin8:160,caudron_g4:150,ssw_d3:100,pfalz_d12:115,phonix_d1:110,aviatik_d1:105,junkers_d1:125,ansaldo_sva5:95,hb_w29:90,ff33:110,felixstowe_f2:230,shuttelanz_sl11:280,parseval:220,caquot_balloon:90})[id]??PLANES[id].hp);
 const OWN_ART=['be2c','aviatik','strutter','nieuport11','nieuport28','hanriot','pup','dh5','re8','dh4','albatros_d2','albatros_d5a','siemens_d4','roland_d6','hannover_cl3','dfw_cv','junkers_j1','gotha','bristol_m1','dolphin','snipe','fe2b','gunbus','morane_ai','aeg_g4','friedrichshafen_g3','breguet14','voisin8','caudron_g4','ssw_d3','pfalz_d12','phonix_d1','aviatik_d1','junkers_d1','ansaldo_sva5','hb_w29','ff33','felixstowe_f2','shuttelanz_sl11','parseval','caquot_balloon','jasta4_albatros','jasta5_albatros','jasta78b_albatros','kissenberth_albatros','allmenroder_albatros','lothar_dr1','beaulieu_dr1','mai_dr1','hantelmann_dr1','jasta11_fokkerd7','jasta18_fokkerd7','jasta43_fokkerd7','gabriel_fokkerd7','jasta27_fokkerd7','baeumer_pfalz','degelow_pfalz','linke_crawford_phonix','kiss_phonix','arigi_aviatik','gotha_night','staaken_dark','brown_camel','mcelroy_camel','dazzle_camel','lufbery_nieuport17','dorme_nieuport','meulemeester_nieuport','eagle_nieuport28','coppens_hanriot','madon_spad','tarascon_spad','boyau_spad','hatring_spad','springs_se5a','proctor_se5a','checker_se5a','ruffo_sva5','pierozzi_macchi'];
 const REMAP={halberstadt:'halberstadt_duo',fokker_campaign:'fokker_standard',dh2:'airco_dh2',albatros_d5:'albatros_d5a'};
 if(id!==base&&!OWN_ART.includes(id))SPRITE_ALIASES[id]=REMAP[id]??base;
}
// Livery variants for the flying-circus look: base sprite key -> alternate painted liveries.
export const LIVERY_POOL={fokker:['lothar_dr1','beaulieu_dr1','mai_dr1','hantelmann_dr1','jasta11_fokkerd7','jasta18_fokkerd7','jasta27_fokkerd7','jasta43_fokkerd7','gabriel_fokkerd7','kissenberth_albatros','allmenroder_albatros','jasta4_albatros','jasta5_albatros','jasta78b_albatros','baeumer_pfalz','degelow_pfalz','linke_crawford_phonix','kiss_phonix','arigi_aviatik'],albatros:['jasta4_albatros','jasta5_albatros','jasta78b_albatros','kissenberth_albatros','allmenroder_albatros','degelow_pfalz','baeumer_pfalz'],nieuport:['dorme_nieuport','meulemeester_nieuport','lufbery_nieuport17','eagle_nieuport28'],camel:['dazzle_camel','mcelroy_camel','brown_camel','coppens_hanriot'],spad:['hatring_spad','madon_spad','tarascon_spad','boyau_spad'],se5a:['springs_se5a','proctor_se5a','checker_se5a']};
// Deterministic per-enemy pick: wobble is a stable per-unit rng value (0..6).
export function liveryVariant(e,base){const pool=LIVERY_POOL[base];if(!pool||e.wobble==null||e.wobble%1<.62)return base;return pool[Math.floor(e.wobble/6*pool.length)%pool.length]}
export function historicalAircraft(stage){const id=AIRCRAFT_IDS[stage.defaultAircraft.split(' / ')[0]];if(!id)throw Error('Unknown historical aircraft: '+stage.defaultAircraft);return id}
export function sortieAircraft(stage,pilot,free=false,cleared=false,baronAircraft='fokker'){
 if(!PILOTS[pilot]||PILOTS[pilot].faction!==stageFaction(stage))throw Error('다른 진영의 파일럿입니다.');
 if(free&&!cleared)throw Error('역사 출격을 먼저 클리어하세요.');
 if(free&&pilot==='baron'&&baronAircraft==='baron_albatros')return 'baron_albatros';
 return free?({baron:'fokker',voss:'fokker',...PILOT_PLANES}[pilot].replace('fokker_red','fokker').replace('fokker_voss','fokker').replace('fokker_jacobs','fokker')):historicalAircraft(stage);
}
// Explicit mission balance introduced by this patch. Source dates and descriptions stay untouched.
export const MISSIONS={
 'A-01':{kind:'photo',quota:[1,2,0],goal:3,extract:true,unarmed:true},
 'A-02':{kind:'escort',count:2,min:1,ace:'immelmann'},
 'A-03':{kind:'observer',quota:[2,2,2],goal:6,ace:'boelcke'},
 'A-04':{kind:'checkpoint',quota:[1,2,1],goal:4,ace:'voss',barrage:true},
 'A-05':{kind:'escort',count:2,min:1,extract:true,ace:'baron'},
 'A-06':{kind:'ground',quota:[4,4,4],goal:12,ace:'udet',barrage:true},
 'A-07':{kind:'convoy',count:5,min:3,ace:'baron'},
 'A-08':{kind:'escort',count:3,min:1,ace:'hantelmann',front:true,supply:true},
 'A-09':{kind:'duel',ace:'baron',goal:1},
 'A-10':{kind:'combined',quota:[4,4,4],goal:1200,ace:'goering',barrage:true},
 'C-01':{kind:'hold',quota:[1,1,1],goal:3},
 'C-02':{kind:'observer',quota:[3,3,2],goal:8,ally:'immelmann'},
 'C-03':{kind:'formation',count:4,min:2,ally:'boelcke'},
 'C-04':{kind:'observer',quota:[3,3,0],goal:6,ace:'ball',combo:true},
 'C-05':{kind:'aces',quota:[1,1,1],goal:3},
 'C-06':{kind:'tank',quota:[3,4,3],goal:10,ace:'mckeever'},
 'C-07':{kind:'ground',quota:[2,2,1],goal:5,ace:'baracca',corridor:true},
 'C-08':{kind:'chain',quota:[5,5,5],goal:15,ace:'fonck',front:true},
 'C-09':{kind:'altitude',quota:[3,3,3],goal:9,ace:'bishop'},
 'C-10':{kind:'retreat',count:3,min:1,ace:'rickenbacker',front:true,extract:true}
};
const genericNames={hantelmann:'게오르크 폰 한텔만',ball:'앨버트 볼',mckeever:'앤드루 맥키버',rickenbacker:'에디 리켄배커',rush1:'영국 순찰대 에이스',rush2:'프랑스 추격대 에이스'};
const segmentDistance=(px,py,ax,ay,bx,by)=>{const dx=bx-ax,dy=by-ay,t=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(px-ax-t*dx,py-ay-t*dy)};
export class CampaignGame extends Game{
 constructor(stageId,pilot,{free=false,cleared=false,rng=Math.random,baronAircraft='fokker'}={}){
  const stage=STAGES.find(s=>s.id===stageId);if(!stage)throw Error('Unknown stage');
  const aircraft=sortieAircraft(stage,pilot,free,cleared,baronAircraft);super(aircraft,pilot,rng);
  this.mode='campaign';this.stage=stage;this.lockedRegion=['A-01','A-09','C-01','C-07'].includes(stageId)?0:2;this.region=this.lockedRegion;this.rallyPoint={x:0,y:0};this.mission=MISSIONS[stageId];this.freeSortie=free;this.phaseIndex=-1;this.phaseHistory=[];this.stageTimer=0;this.campaignScore=0;this.completed=0;this.segments=0;this.chain=0;this.chainBreaks=0;this.chainClock=28;this.altitude=0;this.altitudeCooldown=0;this.altitudeClears=[0,0,0];this.zones=[];this.convoy=[];this.hazards=[];this.clouds=[];this.result=null;this.missionUnits=new Set();this.threatTimer=8;this.hazardTimer=14;this.cloudTimer=0;this.aceEntered=false;this.lastObjectiveHit=-10;this.nextUnit=1;this._supplyTuned=true;
  this.objectiveXp=0;this.objectiveXpBudget=0;let need=6;for(let i=0;i<stage.targetLevelUpCount;i++){this.objectiveXpBudget+=Math.max(need,this.levelRequirement(need));need=Math.ceil(need*1.28)}
  if(this.mission.unarmed){this.weapon.guns=0;this.ammo=[];this.fire=Infinity}
  if(stageId==='C-01'){this.weapon.name='Parabellum MG 14 · 후방 사수';this.fire=Infinity}
  if(this.mission.count){for(let i=0;i<this.mission.count;i++)this.convoy.push({x:(i-(this.mission.count-1)/2)*80,y:-130,a:-Math.PI/2,hp:180,maxHp:180,fire:1+i,plane:this.mission.kind==='convoy'?'markiv':stageFaction(stage)==='central'?'aviatik':'be2c',escaped:false});}
  if(stageId==='C-02')this.damage*=1.15;
  this.events=[];this.enterPhase(0);
 }
 skill(){if(this.mission?.unarmed)return false;return super.skill()}
 reload(){if(this.mission?.unarmed)return false;return super.reload()}
 unarmedChoices(choices,shift=0){
  const safe=['turn','armor','regen','cooldown'].map(id=>UPGRADES.find(u=>u.id===id)).filter(Boolean),start=(this.level+shift)%safe.length;
  return choices.slice(0,3).map((choice,i)=>({...safe[(start+i)%safe.length],rarity:['normal','magic','rare'].includes(choice.rarity)?choice.rarity:'rare'}));
 }
 rollChoices(){const choices=super.rollChoices();if(!this.mission.unarmed)return choices;this.unarmedChoiceShift=0;const safe=this.unarmedChoices(choices);this.lastChoices=safe.map(u=>u.id);return safe}
 rerollChoices(current=[]){const choices=super.rerollChoices(current);if(!choices||!this.mission.unarmed)return choices;this.unarmedChoiceShift=(this.unarmedChoiceShift||0)+1;const safe=this.unarmedChoices(choices,this.unarmedChoiceShift);this.lastChoices=safe.map(u=>u.id);return safe}
 changeAltitude(){if(this.state!=='playing'||this.mission.kind!=='altitude'||this.altitudeCooldown>0)return false;this.altitude=(this.altitude+1)%3;this.altitudeCooldown=1.5;this.event('wave',['저고도','중고도','고고도'][this.altitude]+' · 같은 고도의 표적을 공격하세요');return true}
 canHitTarget(e){return e.altitude===undefined||e.altitude===this.altitude}
 hit(n){const hp=this.hp;super.hit(n);if(this.hp<hp)this.lastObjectiveHit=this.t;if(this.state==='lost'&&!this.result)this.finish(false,'기체 격추')}
 ahead(distance=260,spread=130){const side=(this.rng()-.5)*spread;return{x:this.x+Math.cos(this.a)*distance-Math.sin(this.a)*side,y:this.y+Math.sin(this.a)*distance+Math.cos(this.a)*side}}
 addZone(kind){const n=this.zones.filter(z=>z.kind===kind).length;const p=this.ahead(200+n*240,180);this.zones.push({...p,id:this.nextUnit++,kind,r:kind==='checkpoint'?105:140,progress:0,required:kind==='photo'?4:kind==='hold'?6:kind==='extract'?1.2:0,done:false})}
 enterPhase(index){
  this.phaseIndex=index;this.phaseHistory.push(index);const m=this.mission;this.event('wave',`${this.stage.id} · ${index+1}/3 · ${this.stage.phases[index].description}`);
  if(index>0){this.segments++;this.awardXp(.18);if(m.kind==='aces')this.drops.push({...this.ahead(150,0),value:0,heal:true});}
  const n=m.quota?.[index]||0;
  if(['photo','hold','checkpoint'].includes(m.kind)){for(let i=0;i<n;i++)this.addZone(m.kind)}
  else if(m.kind==='aces')this.spawnAce(['rush1','rush2','collishaw'][index],true);
  else if(n){for(let i=0;i<n;i++)this.spawnMissionTarget(i,index)}
  if(index===0&&m.kind==='duel'){this.spawnAce('baron',true);this.aceEntered=true}
  if(index===2&&m.ace&&!this.aceEntered){this.spawnAce(m.ace,false);this.aceEntered=true}
  if(index===2&&m.ally){this.spawnAlly();const ally=this.allies.at(-1);Object.assign(ally,{life:1e9,plane:PILOT_PLANES[m.ally],scripted:true});attachAircraftPersonality(PLANES,ally,ally.plane);this.event('ally',PILOTS[m.ally].name+' · 아군 지휘 편대 합류')}
  if(m.supply){this.supplyZone={...this.ahead(220,90),r:95,used:false};}
  if(index===2&&this.stage.id==='A-01'){for(let i=0;i<3;i++)this.spawnThreat()}
  if(index>0&&this.stage.id==='A-08')this.spawnEnemy('zeppelin');
  if(index===1&&this.stage.id==='A-02')this.waveQueue=[this.stageTimer,this.stageTimer+12,this.stageTimer+24];
  if(index===1&&this.stage.id==='A-10')this.clouds=[];
  if(index===2&&this.stage.id==='A-10')this.spawnEnemy('heavyBomber');
  if(index===1&&this.stage.id==='C-03')this.formationHigh=true;
  if(index===2&&this.stage.id==='A-03'){for(let i=0;i<2;i++)this.spawnThreat()}
  if(index===1&&['A-03','A-07','A-09','C-06'].includes(this.stage.id))this.spawnFlak();
 }
 spawnEnemy(type){super.spawnEnemy(type);const e=this.enemies.at(-1);if(!e||!this.stage)return;e.ace=false;e.faction=stageFaction(this.stage)==='central'?'entente':'central';if(!e.bossPilot&&!e.heavyBomber&&type!=='zeppelin')e.escortPlane=e.escortPlane||this.enemyAircraft();const id=e.bossPlane||e.escortPlane||e.plane||e.airframe,regular=['scout','hunter'].includes(e.type)&&!e.formationLeader&&!e.missionTarget&&!e.bossPilot;attachAircraftPersonality(PLANES,e,id,{retuneCruise:regular});return e}
 enemyAircraft(){const names=this.stage.enemyDisplayPool||[];const known=names.map(n=>AIRCRAFT_IDS[n]).filter(id=>id&&PLANES[id].faction!==stageFaction(this.stage));return known[Math.floor(this.rng()*known.length)]||(stageFaction(this.stage)==='central'?'camel':'albatros')}
 spawnThreat(){if(this.enemies.length>18)return;const e=this.spawnEnemy('hunter');e.hp=e.maxHp=25+this.stage.difficulty*5;e.speed=85+this.stage.difficulty*5;e.fire=2.4;applyEnemyMovementLimits(this,e);}
 spawnMissionTarget(i,index){
  const m=this.mission,ground=['ground','tank','chain'].includes(m.kind)||m.kind==='combined'&&i%2===0;
  const e=this.spawnEnemy(ground?'hunter':'bomber');const pos=this.ahead(190+i*105,260);Object.assign(e,pos,{missionTarget:true,missionPhase:index,missionId:this.nextUnit++,missionGround:ground,missionTank:m.kind==='tank',hp:ground?52:48,maxHp:ground?52:48,speed:ground?0:70,fire:ground?3.8:2.8,ace:false});
  if(ground)e.escortPlane=undefined;if(m.kind==='observer')e.escortPlane=stageFaction(this.stage)==='central'?'be2c':'aviatik';attachAircraftPersonality(PLANES,e,e.escortPlane);
  if(m.kind==='altitude')e.altitude=index;this.missionUnits.add(e);return e;
 }
 spawnAce(id,required){
  if(PILOTS[id])this.bossDeck=[id];else this.bossDeck=[stageFaction(this.stage)==='central'?'fonck':'boelcke'];
  const e=this.spawnEnemy('boss');Object.assign(e,{missionTarget:required,missionId:this.nextUnit++,missionPhase:this.phaseIndex,hp:260+this.stage.difficulty*32,maxHp:260+this.stage.difficulty*32,speed:id==='baron'?300:95,ace:false,campaignAce:id,abilityTimer:5});applyEnemyMovementLimits(this,e);
  if(!PILOTS[id]){e.bossPilot=null;e.bossPlane=stageFaction(this.stage)==='central'?'camel':'albatros';e.name=genericNames[id];attachAircraftPersonality(PLANES,e,e.bossPlane)}
  else e.name=PILOTS[id].name;
  if(id==='bishop'&&this.mission.kind==='altitude')e.altitude=2;
  if(required)this.missionUnits.add(e);this.event('wave',e.name+' 접근 · '+(required?'격추 목표':'선택 교전'));return e;
 }
 aceAttack(e){
  if(this.sunStrikeContains(e))return;
  if(e.campaignAce==='fonck'){e.precisionWarning={x:this.x,y:this.y,time:1.2};this.event('wave','퐁크 조준선 · 옆으로 선회하세요');return;}
  super.aceAttack(e);
 }
 fireEnemy(e){
  if(this.sunStrikeContains(e))return;
  if(e.navalVessel||e.fieldUnit)return super.fireEnemy(e);
  if(!this.canHitTarget(e)){e.fire=.6;return}
  const hidden=this.clouds.some(c=>Math.hypot(c.x-this.x,c.y-this.y)<c.r);
  if(hidden&&this.rng()<.65){e.fire=1.2;return}
  const protect=this.convoy.filter(c=>c.hp>0&&!c.escaped);
  if(protect.length&&this.rng()<.55){const target=protect[Math.floor(this.rng()*protect.length)],a=Math.atan2(target.y-e.y,target.x-e.x);this.bullets.push({x:e.x,y:e.y,vx:Math.cos(a)*165,vy:Math.sin(a)*165,enemy:true,visualType:e.bossPilot?'boss':e.type,life:5,damage:11,convoyThreat:true});e.fire=2.2;return}
  super.fireEnemy(e);
 }
 awardXp(fraction){const remaining=this.objectiveXpBudget-this.objectiveXp,amount=Math.min(remaining,this.objectiveXpBudget*fraction);this.xp+=amount;this.objectiveXp+=amount;this.checkLevel()}
 countObjective(e){
  if(e.counted)return;e.counted=true;this.rallyPoint={x:e.x,y:e.y};this.completed++;this.campaignScore+=e.missionGround?100:e.type==='boss'?350:150;
  if(e.altitude!==undefined)this.altitudeClears[e.altitude]++;
  if(this.mission.kind==='chain'){this.chain++;this.chainClock=28}
  if(this.mission.combo){this.campaignScore+=this.t-(this.lastTargetTime||-99)<12?100:0;this.lastTargetTime=this.t}
  this.awardXp(.65/(this.mission.kind==='combined'?12:this.mission.goal||1));this.event('wave',`임무 표적 ${this.completed} 확보`);
 }
 updateConvoy(dt,oldBullets){
  for(const c of this.convoy){if(c.hp<=0||c.escaped)continue;c.y-=dt*(this.mission.kind==='convoy'?15:27);c.fire-=dt;
   for(const b of oldBullets){if(!b.enemy||b.convoyHit)continue;const bx=b.x+b.vx*dt,by=b.y+b.vy*dt;if(segmentDistance(c.x,c.y,b.x,b.y,bx,by)<30){c.hp=Math.max(0,c.hp-b.damage);b.life=0;b.convoyHit=true;}}
   for(const e of this.enemies)if(e.hp>0&&Math.hypot(e.x-c.x,e.y-c.y)<35){c.hp=Math.max(0,c.hp-dt*9)}
   if(c.fire<=0&&this.mission.kind==='formation'){c.fire=1;const e=this.enemies.find(e=>e.hp>0&&Math.hypot(e.x-c.x,e.y-c.y)<450);if(e){const a=Math.atan2(e.y-c.y,e.x-c.x);this.bullets.push({x:c.x,y:c.y,vx:Math.cos(a)*440,vy:Math.sin(a)*440,life:1.2,enemy:false,damage:this.formationHigh?12:8,ally:true,hit:new Set()})}}
  }
  if(this.convoy.filter(c=>c.hp>0).length<this.mission.min)this.finish(false,'호위 대상 손실 · 최소 생존 수 미달');
 }
 updateZones(dt){
  for(const z of this.zones){if(z.done)continue;const inside=Math.hypot(this.x-z.x,this.y-z.y)<z.r;if(!inside)continue;
   z.progress+=dt*(this.t-this.lastObjectiveHit<1.2?.25:1);
   if(z.progress>=z.required){z.done=true;this.rallyPoint={x:z.x,y:z.y};if(z.kind==='extract'){this.finish(true,'임무 달성 · 안전 이탈');return}this.completed++;this.campaignScore+=250;this.awardXp(.65/(this.mission.goal||1));this.event('wave',`정찰 구역 ${this.completed}/${this.mission.goal} 확보`)}
  }
 }
 updateEnvironment(dt){
  this.hazardTimer-=dt;this.cloudTimer-=dt;
  const clouded=['A-01','A-06'].includes(this.stage.id)||this.stage.id==='A-10'&&this.phaseIndex<1;
  if(clouded&&this.cloudTimer<=0){this.cloudTimer=12;this.clouds.push({...this.ahead(170,320),r:125,life:24})}
  for(const c of this.clouds)c.life-=dt;this.clouds=this.clouds.filter(c=>c.life>0);
  if(this.hazardTimer<=0){this.hazardTimer=16-this.stage.difficulty;
   if(this.mission.barrage)this.hazards.push({x:this.x+(this.rng()-.5)*250,y:this.y-80,angle:this.rng()*Math.PI,warning:2.2,life:6,width:40});
   else if(this.phaseIndex>0&&!this.mission.unarmed)this.spawnFlak();
   if(this.mission.corridor){this.gusts??=[];this.gusts.push({...this.ahead(260,200),a:Math.PI/2,vx:-170,vy:0,radius:65,life:8,maxLife:8,hit:false})}
  }
  for(const h of this.hazards){h.warning-=dt;h.life-=dt;if(h.warning>0)continue;h.x+=Math.cos(h.angle)*25*dt;h.y+=Math.sin(h.angle)*25*dt;const distance=Math.abs((this.x-h.x)*Math.cos(h.angle)+(this.y-h.y)*Math.sin(h.angle));if(distance<h.width)this.hit(12)}
  this.hazards=this.hazards.filter(h=>h.life>0);
  if(this.mission.corridor){const center=Math.sin(this.y*.001)*180;if(Math.abs(this.x-center)>560)this.hit(20)}
  if(this.mission.front){this.frontY=550-this.stageTimer*20;if(this.y>this.frontY)this.hit(10)}
  if(this.supplyZone&&!this.supplyZone.used&&Math.hypot(this.x-this.supplyZone.x,this.y-this.supplyZone.y)<this.supplyZone.r){this.ammo.fill(this.weapon.belt);this.reloadTime=0;this.supplyZone.used=true;this.event('loaded','전선 보급 · 탄띠 보충')}
  for(const e of this.enemies){if(e.precisionWarning&&!this.sunStrikeContains(e)){e.precisionWarning.time-=dt;if(e.precisionWarning.time<=0){const p=e.precisionWarning,a=Math.atan2(p.y-e.y,p.x-e.x);this.bullets.push({x:e.x,y:e.y,vx:Math.cos(a)*390,vy:Math.sin(a)*390,life:3,enemy:true,visualType:'boss',damage:25});delete e.precisionWarning}}
   if(e.campaignAce&&!e.bossPilot){e.bossDash=Math.max(0,(e.bossDash||0)-dt);e.abilityTimer-=dt;if(e.abilityTimer<=0){e.abilityTimer=9;e.bossDash=1.2;this.event('wave',e.name+' · 고속 패스')}}
  }
  if(this.stage.id==='C-01'){this.rearTimer=(this.rearTimer??0)-dt;if(this.rearTimer<=0){this.rearTimer=.35;const target=this.enemies.find(e=>e.hp>0&&Math.hypot(e.x-this.x,e.y-this.y)<400&&Math.cos(Math.atan2(e.y-this.y,e.x-this.x)-this.a)<-.35);if(target&&this.reloadTime===0&&this.ammo[0]>0){this.ammo[0]--;this.roundsFired++;if(this.ammo[0]===0)this.reload();const a=Math.atan2(target.y-this.y,target.x-this.x);this.bullets.push({x:this.x,y:this.y,vx:Math.cos(a)*440,vy:Math.sin(a)*440,enemy:false,life:1,damage:10,hit:new Set(),ally:true})}}}
 }
 objectivesMet(){const m=this.mission;if(this.convoy.length)return this.convoy.filter(c=>c.hp>0).length>=m.min&&this.stageTimer>=this.stage.recommendedDurationSec;if(m.kind==='duel')return this.completed>=1||this.stageTimer>=this.stage.recommendedDurationSec;if(m.kind==='combined')return this.campaignScore>=m.goal;if(m.kind==='chain')return this.chain>=m.goal;return this.completed>=m.goal}
 finish(won,reason){if(this.result)return;this.state=won?'won':'lost';const medals=won?1+(this.hp/this.maxHp>=.5?1:0)+(this.stageTimer<=this.stage.recommendedDurationSec&&(!this.convoy.length||this.convoy.every(c=>c.hp>0))?1:0):0;this.result={stageId:this.stage.id,won,medals,score:this.campaignScore,time:Math.round(this.stageTimer*10)/10,sortie:this.freeSortie?'free':'historical',reason};this.events=this.events.filter(e=>e.type!=='end');this.event('end',reason)}
 update(dt,input={}){
  if(this.state!=='playing')return;dt=Math.min(.04,Math.max(0,dt));this.stageTimer+=dt;this.altitudeCooldown=Math.max(0,this.altitudeCooldown-dt);
  const duration=this.stage.recommendedDurationSec,phase=this.stageTimer>=duration*.7?2:this.stageTimer>=duration*.35?1:0;
  while(this.phaseIndex<phase)this.enterPhase(this.phaseIndex+1);
  if(this.convoy.length||this.mission.kind==='duel'){const earned=this.objectiveXpBudget*(Math.min(1,this.stageTimer/duration)*.65+this.phaseIndex*.18);if(earned>this.objectiveXp)this.awardXp((earned-this.objectiveXp)/this.objectiveXpBudget)}
  if(this.state!=='playing')return;
  for(const key of ['spawn','nextBossAt','_zeppelinSchedule','nextHeavyAt','eventTimer','allyTimer','flakTimer','regionThreat','gustTimer','supplyTimer'])this[key]=Infinity;
  this.wave=this.t+dt<60?1:this.t+dt<120?2:3;if(this.mission.unarmed||this.stage.id==='C-01'){this.fire=Infinity;this.rockets=0;this.mineCount=0}
  if(this.waveQueue?.length&&this.stageTimer>=this.waveQueue[0]){this.waveQueue.shift();for(let i=0;i<3;i++)this.spawnThreat()}
  this.threatTimer-=dt;if(this.threatTimer<=0){this.threatTimer=Math.max(3.8,12-this.stage.difficulty-this.phaseIndex*1.5);this.spawnThreat()}
  this.updateConvoy(dt,[...this.bullets]);if(this.result)return;
  super.update(dt,input);if(this.result)return;
  for(const e of this.missionUnits)if(e.hp<=0&&!e.counted)this.countObjective(e);
  if(this.state!=='playing')return;
  this.updateZones(dt);if(this.result)return;this.updateEnvironment(dt);if(this.result)return;
  if(this.mission.kind==='chain'&&this.chain>0&&this.enemies.some(e=>e.missionTarget&&e.hp>0)){this.chainClock-=dt;if(this.chainClock<=0){this.chain=0;this.chainBreaks++;this.chainClock=28;this.event('wave','연쇄 끊김 '+this.chainBreaks+'/3');if(this.chainBreaks>=3)this.finish(false,'연쇄 목표 3회 끊김')}}
  if(this.mission.kind==='chain'&&this.phaseIndex===2&&!this.enemies.some(e=>e.missionTarget&&e.hp>0)&&this.chain<15){for(let i=0;i<15-this.chain;i++)this.spawnMissionTarget(i,2)}
  if(this.result)return;
  if(this.phaseIndex===2&&this.objectivesMet()){
   if(this.mission.extract){if(!this.zones.some(z=>z.kind==='extract')){this.addZone('extract');this.event('wave','이탈 구역 개방 · 녹색 원으로 복귀');for(const c of this.convoy)if(c.hp>0)c.escaped=true;}}
   else this.finish(true,this.mission.kind==='duel'?'하천 교전 종료 · 역사적 사망을 재현하지 않는 게임 각색':'작전 목표 달성');
  }
  if(this.stageTimer>duration+(this.mission.extract&&this.convoy.length?30:0)&&!this.result)this.finish(false,'제한시간 종료 · 목표 미달');
 }
 objectiveText(){const m=this.mission;if(this.result)return this.result.reason;if(this.zones.some(z=>z.kind==='extract'))return '이탈 구역으로 복귀 · 원 안에서 1.2초';if(this.convoy.length)return `호위 ${this.convoy.filter(c=>c.hp>0).length}/${this.convoy.length} · 최소 ${m.min} 생존 · 구간 ${Math.min(3,this.segments+1)}/3`;if(m.kind==='duel')return '붉은 남작 격추 또는 제한시간 생존';if(m.kind==='combined')return `합산 작전 점수 ${this.campaignScore}/${m.goal}`;if(m.kind==='chain')return `연쇄 ${this.chain}/15 · 끊김 ${this.chainBreaks}/3 · ${Math.ceil(this.chainClock)}초`;if(m.kind==='altitude')return `고도별 격추 ${this.altitudeClears.join(' / ')} · 현재 ${['저','중','고'][this.altitude]}고도`;return `${this.stage.sourceMission} · ${this.completed}/${m.goal}`}
}

// Dedicated liveries for the six aces added in engine.js pass 2026.
// Cloning lives here because 'snipe' and 'nieuport28' are created above.
const ACES1918_LIVERY={rickenbacker_spad:'spad',ball_se5a:'se5a',barker_snipe:'snipe',luke_nieuport28:'nieuport28',brumowski_albatros:'albatros',gontermann_fokker:'fokker'};
const ACES1918_LIVERY_NAMES={rickenbacker_spad:'SPAD XIII · 리켄바커',ball_se5a:'S.E.5a · 앨버트 볼',barker_snipe:'숍위드 스나이프 · 바커',luke_nieuport28:'니외포르 28 · 프랭크 루크',brumowski_albatros:'알바트로스 D.III · 브루모프스키',gontermann_fokker:'포커 Dr.I · 곤터만'};
for(const[key,base]of Object.entries(ACES1918_LIVERY)){PLANES[key]={...PLANES[base],name:ACES1918_LIVERY_NAMES[key],handling:PLANES[base].handling,campaignOnly:false};WEAPONS[key]={...WEAPONS[base]};PILOT_PLANES[key.split('_')[0]]=key}
