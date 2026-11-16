export const CITY_BOMBER_GUN_REACH=5;

// Widths are world-space units, the same used by the battle camera.
export function cityBomberScale({regionalViewWidth:width}){
 return Number.isFinite(width)&&width>0?(115+13*Math.max(0,Math.min(1,(width-450)/510)))/100:1;
}

export function glideCityBomber(body,dt,speed){
 body.glideAge=(body.glideAge||0)+dt;
 body.phase='gliding';
 const next=Math.max(52,speed-28*dt),distance=(speed+next)*.5*dt;
 body.x+=Math.cos(body.a)*distance;
 body.y+=Math.sin(body.a)*distance;
 body.rotateMounts();
 return next;
}

export function moveCityBomberBay(body,dt,preparing){
 const target=preparing?1:0,open=body.bayOpen||0;
 const step=dt*(preparing?2.8:1.25);
 body.bayOpen=open+Math.sign(target-open)*Math.min(Math.abs(target-open),step);
}
