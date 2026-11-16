// Bomber gunners read the pilot's current turn. A pilot dodges a squadron by
// circling it, so a straight-line lead puts every warned lane outside the turn;
// leading along the turn arc keeps the same warning and still lets a pilot
// escape by reversing or straightening the turn.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function heading(p){const vx=p.vx||0,vy=p.vy||0;return Math.hypot(vx,vy)>10?Math.atan2(vy,vx):Number.isFinite(p.a)?p.a:-Math.PI/2;}
export function trackPilotTurn(b,p,dt){
 const h=heading(p),id=p.id??null;
 if(b.pilotTurnId!==id||b.pilotHeading==null||!(dt>0)){b.pilotTurnId=id;b.pilotHeading=h;b.pilotTurn=0;return 0;}
 const rate=clamp(wrap(h-b.pilotHeading)/dt,-2.2,2.2);
 b.pilotTurn+=(rate-b.pilotTurn)*Math.min(1,dt*6);b.pilotHeading=h;
 return b.pilotTurn;
}
export function arcLead(p,turn,t){
 const vx=p.vx||0,vy=p.vy||0,speed=Math.hypot(vx,vy),h=heading(p);
 if(speed<10||!(t>0))return{x:p.x,y:p.y};
 if(Math.abs(turn)<.05)return{x:p.x+vx*t,y:p.y+vy*t};
 return{x:p.x+speed*(Math.sin(h+turn*t)-Math.sin(h))/turn,y:p.y+speed*(Math.cos(h)-Math.cos(h+turn*t))/turn};
}
