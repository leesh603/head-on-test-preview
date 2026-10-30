// Existing owned gun/accepted-hit records only; no extra rounds or suppression.
const live=p=>p.pilot==='jacobs'&&p.state==='playing'&&p.hp>0&&p.status!=='downed';
const owned=(p,e)=>e.ownerId===(p.id??'p1');
const clamp=n=>Math.max(0,Math.min(1,n));
export function drawJacobsSuppressedFlow(c,w,e,tex,scale=1){
 const remaining=(e.pilotSuppressedUntil||0)-(w.t||0);
 if(!(e.hp>0)||e.pilotSuppressKind!=='jacobs'||!(remaining>0)||e.crashing||e.crashed||e.expired||e.rivalEscaped||e.surface||e.fieldUnit||e.stageBossBody||e.navalVessel||!(e.speed>40))return;
 // Match the existing suppression bank beat. The aircraft remains readable;
 // only the moving, genuinely suppressed target leaves these short wisps.
 const beat=Math.sin((w.t||0)*29+(e.a||0)*2),fade=clamp(remaining/.18);
 for(const side of [-1,1])tex(c,'windStreak',-24*scale,side*21*scale,38*scale,6*scale,side*.05,.42*fade*(side*beat>0?1:.55),'#dedbc9');
}
export function drawJacobsGunGas(c,p,e,tex){
 const duration=Math.min(.28,e.maxLife??.085),active=e.activeFire??(p.skillTime>0&&!(p.reloadTime>0));
 if(!live(p)||!active||!owned(p,e)||e.kind!=='pressureGun'||!(e.age>=0&&e.age<duration&&e.life>0)||![p.a,e.a,e.x,e.y].every(Number.isFinite))return;
 // Smoke and brass stay at the actual firing point while the aircraft moves.
 const co=Math.cos(p.a),si=Math.sin(p.a),dx=e.x-p.x,dy=e.y-p.y,x=dx*co+dy*si,y=-dx*si+dy*co,a=e.a-p.a,ca=Math.cos(a),sa=Math.sin(a),side=e.gun%2?1:-1,fade=(1-clamp(e.age/duration))**1.5;
 tex(c,'gunSmoke',x-ca*(2+e.age*38),y-sa*(2+e.age*38),28+e.age*60,15+e.age*28,a,.55*fade,'#c6c2af');
 const out=5+e.age*90,back=e.age*30;
 tex(c,'bulletBrass',x-ca*back-sa*side*out,y-sa*back+ca*side*out,6,2.6,a+side*(.5+e.age*16),.9*fade,'#d4b678');
}
export function drawJacobsHitDust(c,p,e,tex,front){
 if(!front||!live(p)||!owned(p,e)||e.kind!=='pressureHit'||!(e.age>=0&&e.age<.24&&e.life>0)||![p.a,e.a].every(Number.isFinite))return;
 const q=clamp(e.age/.24),a=e.a-p.a;
 // Keep the original fabric fragments; this is a small contact puff, not a
 // smoke trail or a second mark on an enemy that has not actually been hit.
 tex(c,'dustPuff',Math.cos(a)*q*7,Math.sin(a)*q*7,25+q*12,17+q*7,a,.48*(1-q),'#b8ad94');
}
