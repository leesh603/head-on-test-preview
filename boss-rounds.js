// One look for every hostile boss round. Machine guns keep the crimson enemy
// bolt (instantly readable). Guns fire painted WWI ordnance with a baked
// hostile rim: small AP rounds for flak/autocannon, HE shells for ship and
// fortress guns, the big AP shell for warned heavy rows, a big HE for the
// alpine cannon, fragmentation shells for shrapnel and fin-stabilised darts
// for rocket rings. Mortars and howitzers lob finned bombs; direct-fire guns
// fly a straight line. No streak lines are drawn.
import {drawBossOrdnance,bossOrdnanceLoaded} from './boss-ordnance-art.js?v=gal1';
import {drawEnemyProjectile} from './projectiles.js?v=gal1';
const ROUND={
 'aa-shell':['ap-small',34],'zeppelin-flak':['ap-small',34],'airship-flak':['ap-small',34],'carrier-flak':['ap-small',34],'stuttgart-flak':['ap-small',28],'gallipoli-aa':['ap-small',34],'twin-aa':['ap-small',34],
 'zubian-shell':['he-shell',38],'harbor-shell':['he-shell',38],'l70-broadside':['he-shell',32],'wusten-shell':['he-shell',38],'jutland-shell':['he-shell',36],
 'alps-cannon':['he-big',40],'rail-shrapnel':['frag-shell',26],'gallipoli-ring':['dart',34]
};
export function roundSprite(visual,heavy){return heavy?['ap-big',46]:ROUND[visual]||null;}
export function drawBossRound(c,{x,y,vx,vy,visual,raidHeavy=false,radius=4},screenScale=1){
 const spec=roundSprite(visual,raidHeavy),k=Math.max(1,1/Math.max(.45,screenScale));
 if(spec&&bossOrdnanceLoaded()){const len=Math.max(spec[1],raidHeavy?radius*6:0)*k;return drawBossOrdnance(c,spec[0],x,y,len,Math.atan2(vy,vx));}
 drawEnemyProjectile(c,{enemy:true,life:1,visualType:'boss',vx,vy},x,y,0,screenScale);return true;
}
// Shell in flight toward a warned impact point.
const LOBBED=/minenwerfer|somme-heavy|morser|observer-shell|verdun-(heavy|offscreen|core)/;
export function drawShellFlight(c,h,q,{arc=80,size=1}={}){
 if(h.sourceX==null||!(q>0)||!bossOrdnanceLoaded())return;const lob=LOBBED.test(h.visual||''),dx=h.x-h.sourceX,dy=h.y-h.sourceY;
 const x=h.sourceX+dx*q,y=h.sourceY+dy*q-(lob?Math.sin(q*Math.PI)*arc:0);
 const angle=lob?Math.atan2(dy-Math.cos(q*Math.PI)*Math.PI*arc,dx):Math.atan2(dy,dx);
 if(lob)return drawBossOrdnance(c,/verdun|morser|somme-heavy/.test(h.visual)?'mortar-big':'mortar-small',x,y,(h.raidHeavy?40:34)*size,angle);
 drawBossOrdnance(c,h.raidHeavy?'ap-big':'he-shell',x,y,(h.raidHeavy?40:32)*size,angle);
}
