import {ALPS_BOMBER_LAYOUT,alpsMuzzle} from './alps-bomber-layout.js?v=510';
import {fx} from './fx-art.js?v=510';

function atlasFrame(c,im,frame,w,h){if(!im?.naturalWidth)return false;const sw=im.naturalWidth/3,sh=im.naturalHeight/2;c.drawImage(im,(frame%3)*sw,Math.floor(frame/3)*sh,sw,sh,-w/2,-h/2,w,h);return true;}
function rectWarning(c,lane,alpha){c.globalAlpha=alpha;c.fillStyle=lane.safe?'#82cfc812':'#d69c5120';c.strokeStyle=lane.safe?'#a1d8cc':'#f2bc72';c.lineWidth=1.5;c.setLineDash(lane.safe?[10,10]:[7,5]);c.fillRect(lane.x-lane.width/2,lane.y-lane.height/2,lane.width,lane.height);c.strokeRect(lane.x-lane.width/2,lane.y-lane.height/2,lane.width,lane.height);c.setLineDash([]);}
export function drawAlpsWarnings(c,body){
 if(body.cannonLock){const q=alpsMuzzle(body,'cannon',body.cannonLock.angle),a=body.cannonLock.angle,f=Math.min(1,body.cannonRemaining/1.25);c.save();c.strokeStyle='#ffd18dd0';c.lineWidth=2;c.setLineDash([9,7]);c.beginPath();c.moveTo(q.x,q.y);c.lineTo(q.x+Math.cos(a)*900,q.y+Math.sin(a)*900);c.stroke();c.setLineDash([]);c.strokeStyle='#fff0b6';c.beginPath();c.arc(q.x,q.y,13+f*12,0,Math.PI*2);c.stroke();c.restore();}
 if(body.bombRunRemaining>0){c.save();for(const l of body.laneWarnings||[])rectWarning(c,l,.8);c.restore();}
}
export function drawAlpsBomber(c,b,original,atlas){
 const layout=ALPS_BOMBER_LAYOUT[b.assetKey],s=b.geometryScale||1,w=layout.width*s,h=layout.height*s,parts=b.parts||[],wreck=b.destroying?Math.min(1,b.destructionAge/Math.max(.1,b.destructionDuration)):0;
 c.save();c.translate(b.x,b.y+wreck*130);c.rotate(b.hullYaw+wreck*.8);c.globalAlpha*=1-wreck*.88;c.imageSmoothingEnabled=false;
 const frac=b.hp/b.maxHp,fullFrame=b.destroying?5:frac<.3?4:frac<.65?0:-1;
 if(fullFrame<0||!atlasFrame(c,atlas,fullFrame,w,h)){if(original?.naturalWidth)c.drawImage(original,-w/2,-h/2,w,h);}
 if(!b.destroying){
  for(const p of parts){if(!p.destroyed&&p.hp>=p.maxHp*.55){if(fullFrame>=0&&original?.naturalWidth){const r=p.radius;c.save();c.beginPath();c.rect(p.localX-r*1.6,p.localY-r*2.1,r*3.2,r*4.2);c.clip();c.drawImage(original,-w/2,-h/2,w,h);c.restore();}continue;}
   const frame=p.destroyed?(p.kind==='engine'?1:p.kind==='payload'?3:2):0,r=p.radius;
   c.save();c.beginPath();c.rect(p.localX-r*1.6,p.localY-r*2.1,r*3.2,r*4.2);c.clip();atlasFrame(c,atlas,frame,w,h);c.restore();
  }
  const bay=parts.find(p=>p.id==='bombBay');if(bay?.hittable&&!bay.destroyed){c.fillStyle='#1d2019';c.fillRect(bay.localX-9*s,bay.localY-13*s,18*s,26*s);c.strokeStyle='#bd9556';c.lineWidth=2*s;c.strokeRect(bay.localX-10*s,bay.localY-14*s,20*s,28*s);for(let i=0;i<3;i++)fx(c,'bomb',bay.localX+(i-1)*5*s,bay.localY,15*s,5*s,Math.PI/2,.8);}
  // Moving smoke stays attached to the failed nacelle; healthy engines get
  // short propeller glints, rather than a second decorative weapon sprite.
  for(const p of parts.filter(p=>p.kind==='engine')){
   if(p.destroyed){for(let k=0;k<3;k++){const age=(b.motionTime*.6+k*.31)%1;fx(c,'smokeDark',p.localX+Math.sin(k*4.3)*6,p.localY+age*55*s,(16+age*26)*s,(16+age*26)*s,0,(1-age)*.4);}}
   else{c.save();c.strokeStyle='#e9d9b354';c.lineWidth=1.2*s;c.beginPath();c.ellipse(p.localX,p.localY,5*s,(14+Math.sin(b.motionTime*38+p.localX)*4)*s,0,0,Math.PI*2);c.stroke();c.restore();}
  }
  for(const p of parts)if(p.hitFlash>0){c.save();c.globalAlpha=p.hitFlash/.14*.45;c.strokeStyle='#fff2c6';c.lineWidth=2;c.beginPath();c.arc(p.localX,p.localY,p.radius,0,Math.PI*2);c.stroke();c.restore();}
 }
 c.restore();
 if(b.cannonFlash>0&&!b.destroying){const q=alpsMuzzle({...b,parts:b.parts},'cannon',b.cannonShotAngle);fx(c,'muzzle',q.x,q.y,42,42,b.cannonShotAngle||0,b.cannonFlash/.16);}
}
export function drawAlpsPart(c,p,ring){
 if(!p.hittable||p.destroyed)return;
 // Exposed payloads and recently hit mounts get a cue; normal mounts retain
 // the original art without permanent bright circles covering every engine.
 if(p.kind==='payload'||p.hitFlash>0)ring(p.x,p.y,p.radius,'#f3ce82bb');
 if(p.hp<p.maxHp){const w=p.radius*1.6;c.fillStyle='#1d2929';c.fillRect(p.x-w/2,p.y+p.radius+5,w,3);c.fillStyle='#c6aa75';c.fillRect(p.x-w/2,p.y+p.radius+5,w*p.hp/p.maxHp,3);}
}
export function drawAlpsHazard(c,h,ring){
 if(!['alps-cannon','alps-mg'].includes(h.visual)&&!(h.visual==='carpet-bomb'&&h.airborneBomb))return false;
 const warning=h.phase==='warning',progress=Math.max(0,Math.min(1,(h.age-h.delay)/Math.max(.01,h.warning)));
 if(h.kind==='projectile'){
  if(warning)return true;
  const a=Math.atan2(h.vy,h.vx),big=h.visual==='alps-cannon';c.save();c.translate(h.x,h.y);c.rotate(a);c.strokeStyle=big?'#e9b472b0':'#f6d19fa0';c.lineWidth=big?3:1.5;c.beginPath();c.moveTo(big?-34:-14,0);c.lineTo(-4,0);c.stroke();fx(c,big?'shellHeavy':'tracerCream',0,0,big?30:17,big?10:4,0,1);c.restore();return true;
 }
 if(warning){c.fillStyle='#f0b46413';c.beginPath();c.arc(h.x,h.y,h.radius,0,Math.PI*2);c.fill();ring(h.x,h.y,h.radius,'#eac17da0');ring(h.x,h.y,h.radius*(1-progress),'#ffe3a5');
  const bx=h.sourceX+(h.x-h.sourceX)*progress,by=h.sourceY+(h.y-h.sourceY)*progress-Math.sin(progress*Math.PI)*30;fx(c,'bomb',bx,by,26+progress*8,11+progress*3,Math.atan2(h.y-h.sourceY,h.x-h.sourceX),.95);
 }else{const age=h.age-h.delay-h.warning;fx(c,'explosion0',h.x,h.y,h.radius*2.1,h.radius*2.1,0,Math.max(0,1-age/h.duration));fx(c,'smokeDark',h.x,h.y-age*24,h.radius*(1.5+age),h.radius*(1.5+age),0,.6);}
 return true;
}
