import {LAON_MISSION,LAON_NORMAL_CYCLE_SECONDS,LAON_CRITICAL_PARTS} from './laon-layout.js';
import {LAON_ART_FRAMES} from './laon-art-frames.js';
import {fx} from './fx-art.js?v=tame3';
import {impactMark,aimLine} from './tactical-marks.js?v=tame3';
import {planeSprite,paintedReady} from './aircraft.js?v=outline2&art=pilot-recovery2&pf=1027&crewbake=1&rim=idle&decode=1';
import {prepareLaonTerrain,releaseLaonTerrain} from './laon-terrain.js';
import {paintSlotStrip,drawParisStrip,drawParisGunStrip} from './skyline-strip.js?v=20261104&perf=20261106';
let images={},promise=null;
const AIRCRAFT={breguet14:'breguet14',caudron_r11:'bank_plane_caudron_r11',salmson_2a2:'bank_plane_salmson_2a2'};
const parts=b=>b?.parts instanceof Map?b.parts:new Map(Array.isArray(b?.parts)?b.parts.map(p=>[p.id,p]):Object.entries(b?.parts||{}));
const state=p=>!p||p.hp<=0?2:p.hp<=p.maxHp*.55?1:0;
export function releaseLaonArt(){images={};promise=null;releaseLaonTerrain();}
export function prepareLaonArt(){
 if(promise)return promise;
 const loads=Object.entries({mechanics:'./laon-gun-parts1918.webp',facilities:'./laon-facilities1918.webp'}).map(([key,path])=>new Promise(resolve=>{
  const im=new Image();im.decoding='async';images[key]=im;
  im.onload=()=>{(im.decode?im.decode():Promise.resolve()).catch(()=>{}).finally(()=>resolve(true));};im.onerror=()=>resolve(false);im.src=path;
 }));
 promise=Promise.all([...loads,prepareLaonTerrain(),...Object.values(AIRCRAFT).map(paintedReady)]).then(r=>r.every(Boolean));return promise;
}
function sprite(c,sheet,col,row,x,y,w,h,angle=0,clip=null){
 const im=images[sheet],frames=LAON_ART_FRAMES[sheet],count=sheet==='mechanics'?4:2;
 if(!im?.naturalWidth||!frames)return false;
 const [sx,sy,sw,sh]=frames[row*count+col];
 c.save();c.translate(x,y);c.rotate(angle);c.imageSmoothingEnabled=true;
 if(clip){c.beginPath();c.rect(...clip);c.clip();}
 c.drawImage(im,sx,sy,sw,sh,-w/2,-h/2,w,h);c.restore();return true;
}
export function drawLaonGun(c,gun,visualClock=gun?.clock||0){
 if(!gun)return;const ps=parts(gun),s=gun.scale||gun.t?.geometryScale||1,dead=!!gun.dead;
 const row=id=>dead&&(id==='barrel'||id==='breech')?2:state(ps.get(id));
 c.save();c.translate(gun.x,gun.y);c.scale(s,s);
 // The support and foundation never share the barrel's recoil transform.
 sprite(c,'mechanics',0,dead?2:Math.min(1,Math.max(row('recoil'),row('breech'))),0,-45,170,250);
 const rp=ps.get('recoil');sprite(c,'mechanics',2,row('recoil'),0,-53,72,86);
 if(rp&&row('recoil')<2&&gun.phase==='return'){
  c.save();c.beginPath();c.rect(-40,-92,80,78);c.clip();sprite(c,'mechanics',2,row('recoil'),0,-53+(gun.recoil||0)*.28,72,86);c.restore();
 }
 const recoil=gun.recoil||0,shake=gun.phase==='loading'&&row('loader')<2?Math.sin((gun.clock||0)*27)*.28:0;
 // Separate tube and breech damage frames use one measured axial origin.
 sprite(c,'mechanics',1,row('barrel'),shake,-160+recoil,68,350,0,[-45,-175,90,292]);
 sprite(c,'mechanics',1,row('breech'),shake,-160+recoil,68,350,0,[-45,117,90,58]);
 const loader=ps.get('loader'),ammo=ps.get('ammo');
 if(loader){const move=row('loader')<2?Math.sin((gun.loaderProgress||0)*Math.PI)*9:0;sprite(c,'mechanics',3,row('loader'),loader.localX/s||-116,55-move,68,58);}
 if(ammo)sprite(c,'facilities',0,row('ammo'),ammo.localX/s||130,45,84,68);
 for(const id of ['aa-west','aa-east']){const p=ps.get(id);if(!p)continue;sprite(c,'facilities',1,row(id),p.x/s,p.y/s,57,74,(p.angle||-Math.PI/2)+Math.PI/2);
  if(p.flash>0)fx(c,'muzzle',p.x/s+Math.cos(p.angle)*36,p.y/s+Math.sin(p.angle)*36,26,39,(p.angle||0)+Math.PI/2,.9);
 }
 const clock=visualClock;
 for(const p of ps.values()){
  const r=state(p);if(!r)continue;
  const x=p.x/s,y=p.y/s,drift=(clock*.31+Math.abs(x)*.007)%1;
  if(r===2&&['ammo','loader'].includes(p.id))fx(c,'fireSmall',x,y,30,34,0,.78);
  if(r===2||r===1&&['breech','recoil','loader'].includes(p.id))fx(c,'smokeDark',x+drift*12,y-22-drift*38,22+drift*34,28+drift*41,0,(1-drift)*(r===2?.48:.22));
 }
 if(gun.flash>0&&!dead){fx(c,'muzzle',0,-347+recoil,62,113,0,Math.min(1,gun.flash/.08));}
 if(gun.smoke>0){const a=Math.min(.55,gun.smoke*.48);fx(c,'smokePuff',9,-354+recoil,77,95,0,a);fx(c,'smokeGray',-11,-382+recoil,90,115,0,a*.7);}
 if(gun.phase==='recoil'||gun.phase==='return'&&(gun.phaseAge||0)<1){const a=gun.phase==='recoil'?.42:.22;for(const side of [-1,1])fx(c,'smokePuff',side*79,22,107,43,side*.25,a);}
 c.restore();
}
export function drawLaonWorld(c,g,{layer='all',view=null,locale='ko'}={}){
 const b=g.laonBattle;if(!b?.gun)return;
 const gun=b.gun,raid=b.raid,clock=Math.max(b.elapsed||0,(g.t||0)-(g.stageStartTime||0));
 const visible=(x,y,padX,padY=padX)=>!view||
  Math.abs(x-view.x)<=view.width/2+padX&&Math.abs(y-view.y)<=view.height/2+padY;
 if(layer!=='hazards'){
  const gunScale=gun.scale||gun.t?.geometryScale||1;
  if(visible(gun.x,gun.y-140*gunScale,230*gunScale,320*gunScale))drawLaonGun(c,gun,clock);
  for(const p of raid?.planes||[]){if(p.hp<=0||p.mode==='pending'||p.mode==='destroyed')continue;
   const x=raid.x+p.x,y=raid.y+p.y,key=AIRCRAFT[p.aircraft];if(!key)continue;
   const scale=p.role==='escort'?1.3:p.role==='bomber'?1.15:1;
   if(visible(x,y,140)){
    planeSprite(c,x+8,y+12,p.angle,key,scale,false,true);planeSprite(c,x,y,p.angle,key,scale,false,false,p.hitFlash||0,p.hp<p.maxHp*.55);
   }
   if(p.role==='bomber'&&p.mode==='approach'&&p.destination){
    const {x:tx,y:ty}=p.destination;
    if(visible((x+tx)/2,(y+ty)/2,Math.abs(tx-x)/2+16,Math.abs(ty-y)/2+16))aimLine(c,x,y,tx,ty,{alpha:.33,chevron:true,dash:[9,12]});
   }
  }
 }
 if(layer!=='bodies'){
  for(const bomb of raid?.bombs||[]){const q=Math.min(1,bomb.age/bomb.duration);
   if(visible(bomb.targetX,bomb.targetY,bomb.radius*1.3+8))impactMark(c,bomb.targetX,bomb.targetY,bomb.radius,q,{heavy:true});
   // The visible falling bomb and its impact use the same moving world point.
   const y=bomb.y-38*(1-q);
   if(visible(bomb.x,y,24))fx(c,'bomb',bomb.x,y,14,28,Math.atan2(bomb.targetY-bomb.startY,bomb.targetX-bomb.startX)+Math.PI/2,.95);
  }
  for(const strike of raid?.strikes||[])if(visible(strike.x,strike.y,strike.radius*1.3+8))impactMark(c,strike.x,strike.y,strike.radius,Math.min(1,strike.age/strike.duration),{heavy:true});
  for(const shot of gun.aaShots||[])if(visible(shot.x,shot.y,12))fx(c,'bulletBrass',shot.x,shot.y,7,18,Math.atan2(shot.vy,shot.vx)+Math.PI/2,1);
  for(const e of b.cues||[]){const age=clock-e.at;if(age<0||age>1.15||!visible(e.x,e.y,90))continue;
   if(['laon-bomb-impact','laon-counterbattery-impact','laon-ammo-explosion','laon-stopped','laon-air-destroyed'].includes(e.type)){
    const size=e.type==='laon-stopped'?130:e.type==='laon-ammo-explosion'?150:85,frame=Math.min(3,Math.floor(age/.17));fx(c,'explosionDust'+frame,e.x,e.y,size,size,0,Math.max(0,1-age/1.15));
   }else if(e.type==='laon-part-hit'&&age<.17)fx(c,'spark',e.x,e.y,24,24,0,1-age/.17);
  }
 }
 if(layer!=='hazards'&&view){
  const dx=gun.x-view.x,dy=gun.y-80-view.y,w=view.width/2-44,h=view.height/2-72;
  if(Math.abs(dx)>w||Math.abs(dy)>h){const k=Math.min(w/Math.max(1,Math.abs(dx)),h/Math.max(1,Math.abs(dy))),x=view.x+dx*k,y=view.y+dy*k,a=Math.atan2(dy,dx);
   c.save();c.translate(x,y);c.rotate(a);c.strokeStyle='#e5ce93';c.lineWidth=2.5;c.beginPath();c.moveTo(-9,-7);c.lineTo(0,0);c.lineTo(-9,7);c.stroke();c.rotate(-a);c.fillStyle='#ede1bf';c.font='11px sans-serif';c.textAlign='center';c.fillText((locale==='en'?'GUN ':'포대 ')+Math.round(Math.hypot(dx,dy))+'m',0,19);c.restore();
  }
 }
}
export function laonMissionCard(g,en=false){
 const b=g?.laonBattle;if(!b||g.stageBoss?.stages.stageIndex!==19||b.cleared)return null;
 const hp=Math.max(0,Math.round((b.gun?.hp||0)/(b.gun?.maxHp||1)*100)),distance=Math.round(Math.hypot((b.origin.x||0)-g.x,(b.origin.y||0)-g.y));
 const title=b.role==='attack'?(en?'STOP THE PARIS GUN':'파리포 저지 작전'):(en?'DEFEND THE PARIS GUN':'파리포 방어 작전');
 const objective=b.result?(en?(b.result==='victory'?'MISSION COMPLETE':'MISSION FAILED'):(b.result==='victory'?'임무 성공':'임무 실패')):b.role==='attack'?Math.ceil(b.remaining)+(en?'s left · Paris shelling ':'초 · 파리 포격 ')+b.shotCount+' / '+LAON_MISSION.attackShotLimit:(en?'Firing ':'포격 ')+b.shotCount+' / '+LAON_MISSION.shots+' · '+(en?'Core ':'핵심 ')+hp+'%';
 const phases={loading:en?'Loading':'장전 중',ready:en?'Ready to fire':'발사 직전',recoil:en?'Recoil':'반동',return:en?'Returning':'복좌',reload:en?'Reloading':'재장전',destroyed:en?'Gun silenced':'포격 영구 중단'};
 const damaged=b.discovered?['loader','ammo','recoil'].filter(id=>state(parts(b.gun).get(id))>0):[];
 const weak=damaged.map(id=>(en?{loader:'Loader',ammo:'Ammo',recoil:'Return'}:{loader:'장전',ammo:'탄약',recoil:'복좌'})[id]+(en?[' OK',' DMG',' LOST'][state(parts(b.gun).get(id))]:[' 정상',' 손상',' 파괴'][state(parts(b.gun).get(id))])).join(' · ');
 const meta=(b.role==='attack'&&!b.result?(en?'Destroy barrel or breech':'포신 또는 약실 파괴')+' · ':'')+(phases[b.gun?.phase]||'')+' · '+(weak?(en?'Firing delay: ':'포격 지연: ')+weak+' · ':'')+(b.discovered?(en?'Cycle ':'포격 주기 ')+Math.round(b.gun?.cycleSeconds?.()||b.gun?.cycleDuration||LAON_NORMAL_CYCLE_SECONDS)+'s':(en?'Battery ':'포대 ')+distance+'m');
 return{title,objective,meta};
}
export function updateLaonBossHud(g,locale='ko'){
 const b=g?.laonBattle;if(!b||g.stageBoss?.stages.stageIndex!==19)return false;
 const slot=document.getElementById('stageBossHud'),en=locale==='en';if(!slot)return false;
 const put=(id,value)=>{const el=document.getElementById(id);if(el&&el.textContent!==value)el.textContent=value;};
 document.body.classList.toggle('stageboss-playing',g.state!=='lost');
 slot.classList.toggle('hidden',!b.discovered);slot.classList.remove('gate-armored');
 slot.querySelectorAll('.gate-tick,#stageBossGate').forEach(e=>e.remove());
 const gun=b.gun,raid=b.raid,ps=parts(gun),target=b.role==='attack'?gun:raid;
 const names=en?{barrel:'Barrel',breech:'Breech',loader:'Loader',ammo:'Ammo',recoil:'Return'}:{barrel:'포신',breech:'약실',loader:'장전',ammo:'탄약',recoil:'복좌'},states=en?['OK','DMG','LOST']:['정상','손상','파괴'];
 const partState=id=>names[id]+' '+states[state(ps.get(id))];
 const detail=b.role==='attack'?[...LAON_CRITICAL_PARTS.map(partState),(en?'Delay: ':'지연: ')+['loader','ammo','recoil'].map(partState).join(' / ')].join(' · '):['bomber','escort','observer'].map(role=>{
  const rows=(raid?.planes||[]).filter(p=>p.role===role);return(en?{bomber:'Bombers',escort:'Escorts',observer:'Observer'}:{bomber:'폭격',escort:'호위',observer:'관측'})[role]+' '+rows.filter(p=>p.hp>0).length+'/'+rows.length;
 }).join(' · ');
 put('stageBossParts',detail);
 let hint=document.getElementById('stageBossTactic');if(!hint){hint=document.createElement('small');hint.id='stageBossTactic';slot.append(hint);}
 const hp=Math.ceil(Math.max(0,target?.hp||0)),max=Math.max(1,target?.maxHp||1);
 const text=b.role==='attack'?(en?'Destroy barrel or breech to win · core ':'포신 또는 약실 파괴 시 승리 · 핵심 ')+hp+' / '+Math.round(max):(en?'Intercept bombers and observer · gun core ':'폭격기·관측기 요격 · 아군 핵심 ')+Math.round((gun?.hp||0)/(gun?.maxHp||1)*100)+'%';
 if(hint.textContent!==text)hint.textContent=text;
 document.getElementById('stageBossHp').style.width=Math.max(0,Math.min(100,hp/max*100))+'%';slot.setAttribute('aria-valuenow',String(hp));slot.setAttribute('aria-valuemax',String(max));
 // Silhouette strip (skyline-strip.js): the Entente watches Paris take the shells;
 // the Central pilot watches the gun itself break part by part. One title line.
 const time=g.t||0,locale2=en?'en':'ko';
 put('stageBossTitle',b.result?(en?(b.result==='victory'?'MISSION COMPLETE':'MISSION FAILED'):(b.result==='victory'?'임무 성공':'임무 실패')):b.role==='attack'?(en?`Stop the Paris Gun · ${Math.ceil(b.remaining)}s · gun ${Math.ceil((gun?.hp||0)/(gun?.maxHp||1)*100)}%`:`파리포 저지 · ${Math.ceil(b.remaining)}초 · 파리포 ${Math.ceil((gun?.hp||0)/(gun?.maxHp||1)*100)}%`):(en?`Defend the Paris Gun · shot ${b.shotCount}/${LAON_MISSION.shots}`:`파리포 방어 · 포격 ${b.shotCount}/${LAON_MISSION.shots}`));
 slot.classList.toggle('skyline-tall',b.role!=='attack');
 if(b.role==='attack')paintSlotStrip(slot,(c,w,h)=>drawParisStrip(c,{shotCount:b.shotCount,gunHp:(gun?.hp||0)/(gun?.maxHp||1),phase:gun?.dead?'':gun?.phase,time,locale:locale2},w,h));
 else paintSlotStrip(slot,(c,w,h)=>drawParisGunStrip(c,{gun,parts:ps,stateOf:state,time,locale:locale2},w,h));
 const coop=g.mode==='coop2';document.getElementById('coopXpHud')?.classList.toggle('hidden',!coop);
 if(coop)for(const p of g.players||[]){put(p.id+'XpLabel',p.id.toUpperCase()+' · LV. '+p.level);const bar=document.getElementById(p.id+'XpBar');if(bar)bar.style.width=Math.min(100,p.xp/p.need*100)+'%';}
 return true;
}
