// Mission coordinates remain in world space; the camera never changes the target.
export function missionNavigation(g){
 if(g?.mode!=='campaign')return null;
 const distance=o=>Math.hypot(o.x-g.x,o.y-g.y),nearest=list=>[...list].sort((a,b)=>distance(a)-distance(b))[0];
 const zones=g.zones.filter(z=>!z.done),escort=g.convoy.filter(c=>c.hp>0&&!c.escaped),targets=g.enemies.filter(e=>e.missionTarget&&e.hp>0);
 let o=zones.find(z=>z.kind==='extract')||nearest(zones),kind=o?.kind,label,instruction;
 if(o){label={photo:'사진정찰 구역',hold:'관측 유지 구역',checkpoint:'통과 지점',extract:'안전 이탈 구역'}[kind];instruction=kind==='checkpoint'?'원을 통과하세요':`원 안에서 ${Math.max(0,(o.required||0)-o.progress).toFixed(1)}초 유지`;}
 else if(escort.length){o=nearest(escort);kind='escort';label=g.mission.kind==='convoy'?'호위 전차':'호위 편대';instruction='녹색 아군 곁에서 접근하는 적을 요격하세요';}
 else if(targets.length){o=nearest(targets.filter(e=>e.altitude===undefined||e.altitude===g.altitude))||nearest(targets);kind='target';label=o.name||(o.missionTank?'목표 전차':o.missionGround?'목표 대공포':'임무 표적');instruction=o.altitude!==undefined&&o.altitude!==g.altitude?`${['저','중','고'][o.altitude]}고도로 전환 · Q / 고도 버튼`:'금색 표적을 향해 기수를 돌려 공격하세요';}
 else{o={...(g.rallyPoint||{x:0,y:0})};if(g.mission.front&&Number.isFinite(g.frontY))o.y=Math.min(o.y,g.frontY-350);kind='rally';label='대기 공역';const next=g.stage.recommendedDurationSec*(g.phaseIndex<1?.35:g.phaseIndex<2?.7:1);instruction=`주변에서 생존 유지 · ${g.phaseIndex<2?'다음 단계':'작전 종료'} ${Math.max(0,Math.ceil(next-g.stageTimer))}초`;}
 const d=distance(o),angle=Math.atan2(o.y-g.y,o.x-g.x),bearing=(Math.round(angle*180/Math.PI)+450)%360;
 return {target:o,kind,label,instruction,distance:d,angle,bearing,heading:['북','북동','동','남동','남','남서','서','북서'][Math.round(bearing/45)%8]};
}
export function navigationScreenPoint(nav,g,W,H){
 const left=32,right=W-32,top=Math.min(g.navigationTop||208,H*.47),bottom=H-Math.min(g.navigationBottom||170,H*.38),cx=W/2,cy=H/2;
 const dx=nav.target.x-g.x,dy=nav.target.y-g.y,x=cx+dx,y=cy+dy;
 const scale=Math.min(1,dx>0?(right-cx)/dx:dx<0?(left-cx)/dx:1,dy>0?(bottom-cy)/dy:dy<0?(top-cy)/dy:1);
 return {x:cx+dx*Math.max(0,scale),y:cy+dy*Math.max(0,scale),outside:scale<1,left,right,top,bottom};
}
export function drawMissionRadar(c,g,size=224){
 const nav=missionNavigation(g);if(!nav)return;const mid=size/2,r=mid-16,range=Math.max(800,Math.min(6000,nav.distance*1.12));
 c.clearRect(0,0,size,size);c.save();c.fillStyle='#13251fea';c.fillRect(0,0,size,size);c.strokeStyle='#ced5b62b';c.lineWidth=1;
 for(const k of [.5,1]){c.beginPath();c.arc(mid,mid,r*k,0,Math.PI*2);c.stroke()}
 c.beginPath();c.moveTo(mid,16);c.lineTo(mid,size-16);c.moveTo(16,mid);c.lineTo(size-16,mid);c.stroke();
 const point=o=>{let dx=(o.x-g.x)/range*r,dy=(o.y-g.y)/range*r,k=Math.min(1,r/(Math.hypot(dx,dy)||1));return [mid+dx*k,mid+dy*k]};
 const dot=(o,color,n=3)=>{const[x,y]=point(o);c.fillStyle=color;c.fillRect(x-n,y-n,n*2,n*2)};
 for(const e of g.enemies)if(e.hp>0&&Math.hypot(e.x-g.x,e.y-g.y)<range)dot(e,e.missionTarget?'#ffd17f':'#df806c');
 for(const f of g.hostileMinefields||[]){const[x,y]=point(f);c.strokeStyle='#df806c';c.beginPath();c.arc(x,y,Math.max(4,f.radius/range*r),0,6.283);c.stroke()}
 for(const z of g.zones)if(!z.done)dot(z,z.kind==='extract'?'#a9efba':'#8cdeec',4);
 for(const unit of g.convoy)if(unit.hp>0&&!unit.escaped)dot(unit,'#a9efba',4);
 const[x,y]=point(nav.target);c.strokeStyle='#ffe0a1';c.lineWidth=2;c.strokeRect(x-7,y-7,14,14);
 c.save();c.translate(mid,mid);c.rotate(g.a);c.fillStyle='#fff8d9';c.beginPath();c.moveTo(9,0);c.lineTo(-6,-5);c.lineTo(-3,0);c.lineTo(-6,5);c.closePath();c.fill();c.restore();
 c.fillStyle='#d7dec7';c.font='bold 17px sans-serif';c.textAlign='center';c.fillText('N',mid,15);c.font='13px sans-serif';c.fillText(`${Math.round(range)} m`,mid,size-4);c.restore();
}
