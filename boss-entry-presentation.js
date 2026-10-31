// Short, host-timed WWI arrivals. All world marks use existing approved FX art.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const families={
 artillery:['livens-flame-projector','minenwerfer-battery','morser-battery'],
 rail:['paris-gun','lincomparable'],railCarrier:['fliegerzug'],
 naval:['sms-stuttgart','hms-zubian','jutland-grand-fleet'],
 airship:['zeppelin-l70','hma23','final-kaiserkrone'],
 bomber:['final-leviathan','supermarine-nighthawk','siemens-schuckert-r-viii','o400-squadron','gotha-squadron','paris-staaken-rvi','gik','ca4','staaken-rvi'],
 net:['berlin-drachen','drachen-net','flak-tower','london-apron-raid','london-apron','paris-searchlight-fortress'],
 armour:['a7v-flak','mark-v-cruiser','treffas-wagen','mark4-wedge','wustenpanzer','sinai-landship'],
 squadron:['jasta11-circus','naval10-black-flight']
};
export const BOSS_ENTRY_PROFILES=Object.freeze({
 artillery:{label:['전방 포대 포착','ARTILLERY POSITION AHEAD'],reveal:'ground',beats:[[.65,'armorOpen',1.5],[1.5,null,3]]},
 rail:{label:['철로의 굉음','RAILWAY ARTILLERY'],reveal:'length',beats:[[.08,'railClatter',1],[.82,'trainBrake',3.5]]},
 railCarrier:{label:['무장열차 진입','ARMOURED LAUNCH TRAIN'],reveal:'length',beats:[[.08,'railClatter',1],[.9,'trainBrake',3],[1.65,'winchRelease',1.5]]},
 naval:{label:['수평선의 포성','HEAVY WARSHIP INBOUND'],reveal:'length',beats:[[.18,null,1.4],[1.5,null,3.5]]},
 airship:{label:['하늘을 덮는 그림자','GIANT AIRSHIP INBOUND'],reveal:'curtain',beats:[[.15,null,1],[1.35,'winchRelease',2]]},
 bomber:{label:['중폭격대 접근','HEAVY BOMBERS INBOUND'],reveal:'crossing',beats:[[.65,'formationPass',2.2],[1.7,null,2.8]]},
 armour:{label:['강철의 돌파','ARMOURED BREAKTHROUGH'],reveal:'ground',beats:[[.1,'armorDrive',2],[1.3,'armorBrake',4]]},
 squadron:{label:['적 정예편대 접근','ELITE SQUADRON INBOUND'],reveal:'crossing',beats:[[.55,'formationPass',1.5],[1.55,null,1.8]]},
 net:{label:['봉쇄망 전개','AERIAL BLOCKADE'],reveal:'length',beats:[[.55,'winchRelease',1.5],[1.45,null,2]]},
 fortress:{label:['요새 전투 개시','FORTRESS AHEAD'],reveal:'iris',beats:[[.65,'armorOpen',2],[1.5,null,3.5]]}
});
export function bossEntryFamily(id){return Object.keys(families).find(k=>families[k].includes(id))||'fortress';}
export function attachBossEntry(encounter){
 const first=encounter.bodies.values().next().value;if(!first)return;
 const family=bossEntryFamily(encounter.bossId);
 first.bossEntry={bossId:encounter.bossId,family,age:0,length:3.25,nextBeat:0,waitForDiscovery:['livens-flame-projector','minenwerfer-battery','mark4-wedge'].includes(encounter.bossId)};
 for(const body of encounter.bodies.values())body.entryFamily=family;
}
export function activeBossEntry(encounter){for(const body of encounter?.bodies.values()||[])if(body.bossEntry&&!body.dead)return {body,scene:body.bossEntry};return null;}
export function tickBossEntry(addon,encounter,dt){
 const active=activeBossEntry(encounter);if(!active)return;
 const {body,scene}=active;
 if(scene.waitForDiscovery){let seen=false;for(const b of encounter.bodies.values())seen||=!!b.discovered;if(!seen)return;scene.waitForDiscovery=false;}
 scene.age=Math.min(scene.length,scene.age+dt);
 const beats=BOSS_ENTRY_PROFILES[scene.family].beats;
 while(scene.nextBeat<beats.length&&scene.age>=beats[scene.nextBeat][0]){
  const [at,sound,shake]=beats[scene.nextBeat++];
  addon.hooks.onCue({type:'boss-entry-beat',bossId:body.id,encounterId:encounter.id,sound,shake,at});
 }
 if(scene.age>=scene.length)delete body.bossEntry;
}
export function bossEntryReveal(body,bounds=null){
 if(!body.arrivalPending||!body.entryFamily)return null;
 let rx=Math.max(100,body.coreRadius||0,(body.support129?.width||0)/2),ry=Math.max(130,(body.support129?.height||0)/2);
 for(const p of body.parts.values()){rx=Math.max(rx,Math.abs(p.x)+(p.drawWidth||p.radius*2||50)/2);ry=Math.max(ry,Math.abs(p.y)+(p.drawHeight||p.radius*2||50)/2);}
 if(Number.isFinite(bounds?.halfWidth))rx=Math.max(rx,bounds.halfWidth);
 if(Number.isFinite(bounds?.halfHeight))ry=Math.max(ry,bounds.halfHeight);
 return {x:body.x,y:body.y,rx:rx+50,ry:ry+70,kind:BOSS_ENTRY_PROFILES[body.entryFamily].reveal,q:clamp(((body.arrivalAge||0)-(body.arrivalHold||0))/(body.arrivalDuration||.85))};
}
export function clipBossEntry(c,r){
 if(!r||r.q>=1)return;
 const q=r.q*r.q*(3-2*r.q);c.beginPath();
 if(r.kind==='curtain')c.rect(r.x-r.rx*q,r.y-r.ry,r.rx*2*q,r.ry*2);
 else if(r.kind==='crossing')c.rect(r.x-r.rx,r.y-r.ry,r.rx*2*q,r.ry*2);
 else if(r.kind==='ground')c.rect(r.x-r.rx,r.y+r.ry-r.ry*2*q,r.rx*2,r.ry*2*q);
 else if(r.kind==='iris')c.arc(r.x,r.y,Math.hypot(r.rx,r.ry)*q,0,Math.PI*2);
 else c.rect(r.x-r.rx,r.y-r.ry,r.rx*2,r.ry*2*q);
 c.clip();
}
export function drawBossEntryWorld(c,encounter,paint){
 const active=activeBossEntry(encounter);if(!active||active.scene.waitForDiscovery)return;
 const {body:b,scene:s}=active,age=s.age,fade=clamp(age/.35)*clamp((2.65-age)/.6);if(fade<=0)return;
 const r=bossEntryReveal(b)||{rx:Math.max(110,(b.support129?.width||220)/2),ry:Math.max(160,(b.support129?.height||320)/2)},x=b.x,y=b.y;
 const draw=(key,px,py,w,h,a=0,alpha=.55)=>paint(c,key,px,py,w,h,a,alpha*fade);
 c.save();
 switch(s.family){
  case 'naval':draw('shipBow3',x,y-r.ry*.8,Math.min(360,r.rx*2),210,0,.7);draw('shipWake3',x,y+r.ry*.6,Math.min(220,r.rx*1.2),Math.min(600,r.ry*1.3),0,.5);break;
  case 'rail':case 'railCarrier':for(let i=0;i<3;i++)draw(i%2?'gunSmoke':'smokeGray',x+(i-1)*65-age*15,y-r.ry*.6+i*75,140+age*35,210+age*32,-.15,.38);break;
  case 'airship':draw('fx-cloud-bank-0',x-r.rx*.6-age*16,y-r.ry*.22,440,230,0,.6);draw('fx-cloud-bank-1',x+r.rx*.5+age*16,y+r.ry*.2,420,200,.1,.5);break;
  case 'bomber':case 'squadron':for(const side of [-1,1])draw('vaporTrail',x+side*r.rx*.65,y+r.ry*.4,62,Math.min(470,r.ry*2),0,.35);break;
  case 'armour':for(const side of [-1,1])draw('smokeDust',x+side*(r.rx*.85+age*18),y+r.ry*.6,170+age*24,110+age*20,side*.2,.6);break;
  case 'artillery':draw('smokeDust',x-r.rx*.45,y+r.ry*.3,240,130,0,.45);draw('gunSmoke',x+r.rx*.4,y,160,210,-.2,.4);break;
  case 'net':draw('searchlight',x-r.rx*.5,y,220,440,-.35,.35);draw('searchlight',x+r.rx*.5,y,220,440,.35,.35);break;
  default:draw('searchlight',x,y,260,500,Math.sin(age*.9)*.38,.4);draw('smokeDust',x,y+r.ry*.5,340,130,0,.45);
 }
 c.restore();
}
export function drawBossEntryTitle(c,encounter,W,H,{locale='ko',name=''}={}){
 const active=activeBossEntry(encounter);if(!active||active.scene.waitForDiscovery)return;
 const s=active.scene,t=s.age,bar=clamp(t/.22)*clamp((2.65-t)/.4),alpha=clamp((t-.12)/.25)*clamp((1.42-t)/.35);if(bar<=0)return;
 const mobile=W<600,cap=mobile?18:26;c.save();c.fillStyle=`rgba(5,10,12,${.82*bar})`;c.fillRect(0,0,W,cap*bar);c.fillRect(0,H-cap*bar,W,cap*bar);
 if(alpha>0){const y=Math.min(H-130,H*.76),label=BOSS_ENTRY_PROFILES[s.family].label[locale==='en'?1:0];c.globalAlpha=alpha;c.textAlign='center';c.textBaseline='middle';c.shadowColor='#000';c.shadowBlur=6;c.fillStyle='#c7b78b';c.font=`600 ${mobile?11:13}px sans-serif`;c.fillText(label,W/2,y-30,W-40);c.fillStyle='#f0e6cb';c.font=`bold ${mobile?22:34}px Georgia,serif`;c.fillText(name||s.bossId,W/2,y,W-44);}
 c.restore();
}
