import {fx} from './fx-art.js?v=492';
import {drawAttachedApron} from './london-apron369.js?v=492';
const paths={gotha:'./gotha-night-atlas20260930.webp',light:'./fx-city-searchlight.webp',gun:'./fx-city-aagun.webp',apron:'./boss-london-apron115.webp?v=483',apronDamage:'./boss-london-apron-registered-damage369.png?v=483'};
let art={},artLoadP=null;
export function releaseLondonArt(){art={};artLoadP=null;}
export function prepareLondonArt(){return Promise.all(Object.entries(paths).map(([key,path])=>new Promise(resolve=>{const im=new Image();art[key]=im;im.decoding='async';im.onload=im.onerror=resolve;im.src=path;})));}
const londonImage=key=>{const im=art[key];if(im?.naturalWidth)return im;if(!artLoadP)artLoadP=prepareLondonArt();return null;};
function installation(c,key,x,y,size,ruined=false){const im=londonImage(key);if(!im)return;c.save();c.imageSmoothingEnabled=true;c.globalAlpha*=ruined?.32:1;c.drawImage(im,x-size/2,y-size/2,size,size);c.restore();if(ruined)fx(c,'smokeDark',x,y-18,50,50,0,.6);}
export function drawGotha(c,b){const im=londonImage('gotha');if(!im)return;const f=b.destroying?Math.min(1,b.destructionAge/b.destructionDuration):0,a=(b.a||0)+Math.PI/2,cw=im.naturalWidth/2,ch=im.naturalHeight;
 c.save();c.translate(b.x,b.y+f*95);c.rotate(a+f*.22);c.imageSmoothingEnabled=true;c.globalAlpha*=1-f*.85;
 const cell=(wreck=false)=>c.drawImage(im,wreck?cw:0,0,cw,ch,-105,-105,210,210);
 cell(b.destroying);
 if(!b.destroying)for(const p of b.parts||[]){if(p.hp>=p.maxHp)continue;const dx=p.x*Math.cos(a)+p.y*Math.sin(a),dy=-p.x*Math.sin(a)+p.y*Math.cos(a);c.save();c.beginPath();c.ellipse(dx,dy,p.id.startsWith('engine')?16:13,p.id.startsWith('engine')?24:18,0,0,Math.PI*2);c.clip();c.globalAlpha*=p.destroyed?1:.55;cell(true);c.restore();if(p.destroyed){fx(c,'fire',dx,dy,29,34,0,.8);fx(c,'smokeDark',dx,dy-28,46,46,0,.65);}}
 c.restore();
}
export function drawLondonRaidApron(c,b){
 const intact=londonImage('apron');if(intact)drawAttachedApron(c,b,intact,londonImage('apronDamage')||intact);
 if(b.coreVulnerable&&!b.destroying){c.strokeStyle='#e9c88b';c.lineWidth=2;c.setLineDash([7,5]);c.strokeRect(b.x-66,b.y-12,132,84);c.setLineDash([]);}
 for(const p of b.parts||[])if(p.id==='light'||p.id==='gun')installation(c,p.id,b.x+p.x,b.y+p.y,70,p.destroyed);
}
export function drawLondonWorld(c,g,locale='ko'){const battle=g.londonBattle;if(!battle)return;const en=locale==='en';
 for(const e of g.enemies||[]){if(!e.londonInstallation||e.hp<=0)continue;installation(c,e.londonInstallation,e.x,e.y,74);if(e.londonInstallation==='light'){c.save();c.translate(e.x,e.y);c.rotate(e.scanA);const gradient=c.createLinearGradient(0,0,570,0);gradient.addColorStop(0,'#dfdc9a33');gradient.addColorStop(1,'#dfdc9a00');c.fillStyle=gradient;c.beginPath();c.moveTo(0,0);c.lineTo(570,-96);c.lineTo(570,96);c.closePath();c.fill();c.restore();}}
 for(const d of battle.districts){c.save();c.strokeStyle=d.hp>0?'#a9c7bd80':'#ce816366';c.lineWidth=1.5;c.setLineDash([5,6]);c.beginPath();c.arc(d.x,d.y,56,0,Math.PI*2);c.stroke();c.setLineDash([]);c.font='12px system-ui';c.textAlign='center';c.fillStyle='#e1e6da';c.fillText((en?d.en:d.name)+' '+Math.ceil(d.hp/d.maxHp*100)+'%',d.x,d.y+75);if(d.hp<d.maxHp*.5){fx(c,'fire',d.x,d.y,45,52,0,.6);fx(c,'smokeDark',d.x,d.y-35,84,84,0,.5);}c.restore();}
 const encounter=g.stageBoss?.stages.encounter;
 for(const w of battle.warnings){const body=encounter?.bodies.get(w.bodyId);if(!body?.runTarget)continue;c.save();c.strokeStyle='#e5b07999';c.lineWidth=1.5;c.setLineDash([6,8]);c.beginPath();c.moveTo(body.x,body.y);c.lineTo(w.x,w.y);c.stroke();c.setLineDash([]);c.beginPath();c.arc(w.x,w.y,58,0,Math.PI*2);c.stroke();c.fillStyle='#f4cb9b';c.textAlign='center';c.font='bold 13px system-ui';c.fillText((en?'DROP ':'투하 ')+Math.max(0,body.runRemaining/(body.engines()===1?.55:1)).toFixed(1)+'s',w.x,w.y-66);c.restore();}
}
