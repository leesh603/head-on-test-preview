const fs=require('node:fs');
const path=require('node:path');
const {createCanvas}=require(require.resolve('@napi-rs/canvas',{
  paths:[process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES,process.cwd()].filter(Boolean),
}));

const CELL=160,SCALE=CELL/100;
const atlas=createCanvas(CELL*3,CELL*2);
const ctx=atlas.getContext('2d');
const ink='#171918',brass='#d59b36',gold='#f2ca6b',leather='#713a24',red='#8e2e27',cream='#e8d8ae',steel='#69777a',green='#24583c';

function pathShape(c,points,fill,stroke=ink,width=3){
  c.beginPath();c.moveTo(points[0][0],points[0][1]);for(const p of points.slice(1))c.lineTo(p[0],p[1]);c.closePath();
  c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke()}
}
function line(c,x1,y1,x2,y2,color,width){c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke()}
function circle(c,x,y,r,fill,stroke=ink,width=3){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=fill;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke()}}
function bolt(c,x,y){circle(c,x,y,2.1,gold,ink,1)}
function cell(index,draw){
  ctx.save();ctx.translate(index%3*CELL,Math.floor(index/3)*CELL);ctx.scale(SCALE,SCALE);ctx.lineJoin='round';ctx.lineCap='round';draw(ctx);ctx.restore();
}
function plane(c,x,y,s=1){
  c.save();c.translate(x,y);c.scale(s,s);
  pathShape(c,[[-3,-12],[3,-12],[5,11],[0,16],[-5,11]],cream,ink,2);
  pathShape(c,[[-14,-5],[14,-5],[11,1],[-11,1]],brass,ink,2);
  pathShape(c,[[-11,3],[11,3],[9,8],[-9,8]],gold,ink,2);
  line(c,0,-14,0,14,'#fff0bd',1.5);c.restore();
}

// Göring's marshal baton with the three permanent wingmen it commands.
cell(0,c=>{
  plane(c,25,25,.55);plane(c,50,15,.62);plane(c,75,25,.55);
  c.save();c.translate(50,56);c.rotate(-Math.PI/4);
  line(c,-31,0,31,0,'#0008',19);line(c,-31,0,31,0,brass,16);line(c,-27,0,27,0,red,10);
  for(const x of [-23,-9,9,23])line(c,x,-7,x,7,gold,4);
  circle(c,-33,0,9,gold,ink,3);circle(c,33,0,9,gold,ink,3);circle(c,-33,0,4,red,ink,1);circle(c,33,0,4,red,ink,1);
  c.restore();
});

// Immelmann's leather manual with a full reversal arrow around the aircraft.
cell(1,c=>{
  pathShape(c,[[15,24],[49,18],[83,25],[78,78],[49,72],[20,80]],leather,ink,4);
  pathShape(c,[[20,27],[48,22],[48,68],[24,73]],cream,ink,2);
  pathShape(c,[[50,22],[78,28],[74,71],[50,68]],'#d9c594',ink,2);
  line(c,49,21,49,70,brass,3);plane(c,49,50,.48);
  c.beginPath();c.arc(50,48,38,.2,5.15);c.strokeStyle=gold;c.lineWidth=6;c.stroke();
  pathShape(c,[[65,12],[82,17],[72,29]],gold,ink,2);
  line(c,29,38,39,34,red,2);line(c,60,60,70,64,red,2);
});

// A breech and short barrel firing one oversized 37 mm shell — no rocket fins.
cell(2,c=>{
  c.save();c.translate(49,54);c.rotate(-.28);
  c.fillStyle='#0007';c.fillRect(-40,-14,69,31);
  pathShape(c,[[-39,-12],[-8,-12],[-3,-8],[-3,10],[-9,14],[-39,11]],steel,ink,3);
  c.fillStyle='#394344';c.fillRect(-31,-8,18,16);c.strokeStyle=ink;c.lineWidth=2;c.strokeRect(-31,-8,18,16);
  c.fillStyle=brass;c.fillRect(-8,-10,12,22);c.strokeStyle=ink;c.strokeRect(-8,-10,12,22);
  pathShape(c,[[3,-7],[37,-5],[37,7],[3,9]],'#4c5859',ink,3);
  line(c,11,-4,34,-3,'#9eaaaa',2);
  pathShape(c,[[39,-11],[51,-5],[51,5],[39,12],[30,5],[30,-5]],'#f3a442',ink,2);
  pathShape(c,[[51,-8],[73,-7],[86,0],[73,7],[51,8]],gold,ink,3);
  c.fillStyle='#8b5a23';c.fillRect(53,-7,7,14);c.strokeStyle=ink;c.strokeRect(53,-7,7,14);
  line(c,63,-4,75,-3,'#fff0a5',2);c.restore();
});

// The cream aircraft panel keeps the literal LO! marking and a critical-health gauge.
cell(3,c=>{
  pathShape(c,[[15,18],[83,13],[89,76],[73,87],[18,81],[10,31]],cream,ink,4);
  pathShape(c,[[20,23],[77,20],[82,69],[69,78],[22,74],[17,34]],'#d8bd85','#8d682d',2);
  for(const [x,y] of [[18,24],[78,20],[82,71],[21,75]])bolt(c,x,y);
  c.save();c.translate(50,50);c.rotate(-.06);c.font='900 31px sans-serif';c.textAlign='center';c.textBaseline='middle';c.lineWidth=5;c.strokeStyle='#f1e2b9';c.strokeText('LO!',0,0);c.fillStyle='#263228';c.fillText('LO!',0,0);c.restore();
  pathShape(c,[[11,84],[88,84],[88,93],[11,93]],'#281b1b',ink,2);
  pathShape(c,[[13,86],[37,86],[37,91],[13,91]],'#d84b3f',null);
  line(c,70,22,65,32,red,3);line(c,65,32,73,38,red,3);line(c,29,68,35,62,red,3);
});

// Werner Voss's green face-painted cowling, ringed by turning arrows.
cell(4,c=>{
  c.beginPath();c.arc(50,50,45,-2.5,-.5);c.strokeStyle=gold;c.lineWidth=5;c.stroke();
  pathShape(c,[[83,20],[91,16],[90,29]],gold,ink,2);
  c.beginPath();c.arc(50,50,45,.65,2.6);c.strokeStyle=gold;c.lineWidth=5;c.stroke();
  pathShape(c,[[17,80],[8,84],[10,71]],gold,ink,2);
  circle(c,50,50,36,brass,ink,4);circle(c,50,50,30,green,ink,3);
  for(let i=0;i<8;i++){const a=i*Math.PI/4;bolt(c,50+33*Math.cos(a),50+33*Math.sin(a))}
  pathShape(c,[[29,39],[43,35],[40,46],[31,47]],cream,ink,2);
  pathShape(c,[[57,35],[71,39],[69,47],[60,46]],cream,ink,2);
  circle(c,37,42,3,ink,null);circle(c,63,42,3,ink,null);
  pathShape(c,[[29,58],[38,54],[50,58],[62,54],[72,59],[65,72],[35,72]],'#17251d',ink,2);
  pathShape(c,[[35,59],[42,57],[44,65],[37,65]],cream,ink,1);
  pathShape(c,[[44,58],[51,60],[51,67],[45,65]],cream,ink,1);
  pathShape(c,[[52,60],[59,57],[64,65],[52,67]],cream,ink,1);
  line(c,46,49,50,45,'#b1d09c',2);line(c,50,45,55,50,'#b1d09c',2);
});

const output=path.resolve(__dirname,'../dist/legendary-icons83.png');
fs.writeFileSync(output,atlas.toBuffer('image/png'));
console.log(output);
