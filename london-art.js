import {drawGroundEnemy,prepareGroundEnemyArt} from './ground-enemy-art.js?v=raid4';
import {impactMark,aimLine} from './tactical-marks.js?v=raid4';
import {fx} from './fx-art.js?v=raid4';
import {drawAttachedApron} from './london-apron369.js?v=raid4';
const paths={gotha:'./gotha-night-atlas20260930.webp',light:'./fx-city-searchlight.webp',gun:'./fx-city-aagun.webp',apron:'./boss-london-apron115.webp?v=r5',apronDamage:'./boss-london-apron-registered-damage369.png?v=r5'};
let art={},artLoadP=null;
export function releaseLondonArt(){art={};artLoadP=null;}
export function prepareLondonArt(){return Promise.all([prepareGroundEnemyArt(),...Object.entries(paths).map(([key,path])=>new Promise(resolve=>{const im=new Image();art[key]=im;im.decoding='async';im.onerror=resolve;im.onload=()=>{(im.decode?im.decode():Promise.resolve()).catch(()=>{}).finally(()=>resolve())};im.src=path;}))]);}
const londonImage=key=>{const im=art[key];if(im?.naturalWidth)return im;if(!artLoadP)artLoadP=prepareLondonArt();return null;};
function installation(c,key,x,y,size,ruined=false){const im=londonImage(key);if(!im)return;c.save();c.imageSmoothingEnabled=true;c.globalAlpha*=ruined?.32:1;c.drawImage(im,x-size/2,y-size/2,size,size);c.restore();if(ruined)fx(c,'smokeDark',x,y-18,50,50,0,.6);}
export function drawGotha(c,b){const im=londonImage('gotha');if(!im)return;const f=b.destroying?Math.min(1,b.destructionAge/b.destructionDuration):0,a=(b.a||0)+Math.PI/2,cw=im.naturalWidth/2,ch=im.naturalHeight;
 c.save();c.translate(b.x,b.y+f*95);c.rotate(a+f*.22);c.imageSmoothingEnabled=true;c.globalAlpha*=1-f*.85;
 const cell=(wreck=false)=>c.drawImage(im,wreck?cw:0,0,cw,ch,-105,-105,210,210);
 cell(b.destroying);
 // Reuse the painted fuselage skin for the two opening leaves, and the
 // existing bomb sprite for the exposed load. No replacement aircraft art.
 if(!b.destroying&&b.bayOpen>0&&!b.parts?.find(p=>p.id==='bomb-bay')?.destroyed){
  const q=b.bayOpen;fx(c,'bomb',0,-14,9,19,0,q*.9);
  for(const side of [-1,1]){c.save();c.translate(side*(3+q*5),-14);c.rotate(side*q*.35);c.drawImage(im,cw*.48+(side>0?cw*.02:0),ch*.39,cw*.02,ch*.10,-2,-10,4,20);c.restore();}
 }
 if(!b.destroying)for(const p of b.parts||[]){if(p.hp>=p.maxHp)continue;const dx=p.x*Math.cos(a)+p.y*Math.sin(a),dy=-p.x*Math.sin(a)+p.y*Math.cos(a);c.save();c.beginPath();c.ellipse(dx,dy,p.id.startsWith('engine')?16:13,p.id.startsWith('engine')?24:18,0,0,Math.PI*2);c.clip();c.globalAlpha*=p.destroyed?1:.55;cell(true);c.restore();if(p.destroyed){fx(c,'fire',dx,dy,29,34,0,.8);fx(c,'smokeDark',dx,dy-28,46,46,0,.65);}}
 c.restore();
}
export function drawLondonRaidApron(c,b){
 const intact=londonImage('apron');if(intact)drawAttachedApron(c,b,intact,londonImage('apronDamage')||intact);
 for(const p of b.parts||[])if(p.id==='light'||p.id==='gun')installation(c,p.id,b.x+p.x,b.y+p.y,70*(b.apronScale||1),p.destroyed);
}
export function drawLondonWorld(c,g,locale='ko'){const battle=g.londonBattle;if(!battle)return;const en=locale==='en';
 for(const e of g.enemies||[]){if(!e.londonInstallation||e.hp<=0)continue;const target=(g.players||[g]).find(p=>(p.londonLitUntil||0)>g.t)||(g.players||[g])[0];drawGroundEnemy(c,target&&e.londonInstallation==='gun'?{...e,gunAim:Math.atan2(target.y-e.y,target.x-e.x)}:e,e.x,e.y,74);if(e.londonInstallation==='light'){c.save();c.translate(e.x,e.y);c.rotate(e.scanA);const gradient=c.createLinearGradient(0,0,570,0);gradient.addColorStop(0,'#dfdc9a33');gradient.addColorStop(1,'#dfdc9a00');c.fillStyle=gradient;c.beginPath();c.moveTo(0,0);c.lineTo(570,-96);c.lineTo(570,96);c.closePath();c.fill();c.restore();}}
 for(const d of battle.districts){c.save();c.strokeStyle=d.hp>0?'#a9c7bd80':'#ce816366';c.lineWidth=1.5;c.setLineDash([5,6]);c.beginPath();c.arc(d.x,d.y,56,0,Math.PI*2);c.stroke();c.setLineDash([]);c.font='12px system-ui';c.textAlign='center';c.fillStyle='#e1e6da';c.fillText((en?d.en:d.name)+' '+Math.ceil(d.hp/d.maxHp*100)+'%',d.x,d.y+75);if(d.hp<d.maxHp*.5){fx(c,'fire',d.x,d.y,45,52,0,.6);fx(c,'smokeDark',d.x,d.y-35,84,84,0,.5);}c.restore();}
 const encounter=g.stageBoss?.stages.encounter;
 for(const w of battle.warnings){const body=encounter?.bodies.get(w.bodyId);if(!body?.runTarget)continue;c.save();aimLine(c,body.x,body.y,w.x,w.y,{alpha:.7,chevron:false,dash:[6,8]});impactMark(c,w.x,w.y,58,1-Math.min(1,Math.max(0,body.runRemaining)/8),{heavy:!!body.onBombLine});c.fillStyle='#f4cb9b';c.strokeStyle='rgba(20,14,10,.6)';c.lineWidth=3;c.textAlign='center';c.font='bold 13px system-ui';c.fillText((body.onBombLine?(en?'DROP ':'투하 '):(en?'APPROACH ':'폭격 접근 '))+Math.max(0,body.runRemaining).toFixed(1)+'s',w.x,w.y-66);c.restore();}
}
