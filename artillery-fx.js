// Painted pressure front. Geometry only clips the approved textures; it never
// draws a replacement circle or creates particles, canvases, or simulation RNG.
const TAU=Math.PI*2;
const clamp=n=>Math.max(0,Math.min(1,n));
function band(c,x,y,inner,outer){
 c.beginPath();c.arc(x,y,outer,0,TAU);c.arc(x,y,Math.max(0,inner),0,TAU,true);c.clip();
}
export function drawArtilleryPressure(c,h,paint,{mobile=false}={}){
 const outer=h.radius,inner=Math.max(0,h.innerRadius||0),width=outer-inner;
 if(!(width>0)||!Number.isFinite(outer+inner+h.x+h.y))return false;
 const age=Math.max(0,h.age-h.delay-h.warning),remaining=Math.max(0,h.duration-age);
 // Fixed angular slots prevent puffs popping/reindexing as the wave expands.
 const count=mobile?24:32,mid=(outer+inner)/2,spacing=TAU*mid/count;
 const birth=.65+.35*clamp(age/.1),fade=.65+.35*clamp(remaining/.18);
 c.save();band(c,h.x,h.y,inner,outer);
 // The existing irregular, painted compression ring joins the entire front.
 paint(c,'artilleryWave',h.x,h.y,outer*2.16,outer*2.16,0,.62*birth*fade);
 for(let i=0;i<count;i++){
  const a=i*TAU/count,variation=1+Math.sin(i*2.39)*.12;
  paint(c,'profileDust',h.x+Math.cos(a)*mid,h.y+Math.sin(a)*mid,
   Math.max(width*1.7,spacing*2.25)*variation,width*2.15,a+Math.PI/2,.68*birth*fade);
 }
 c.restore();
 // A faint wake falls behind the dangerous edge. The cleared centre stays open.
 if(inner>12){c.save();band(c,h.x,h.y,Math.max(0,inner-24),inner);
  for(let i=0;i<count/2;i++){
   const a=(i+.35)*TAU/(count/2),r=inner-10;
   paint(c,'profileDust',h.x+Math.cos(a)*r,h.y+Math.sin(a)*r,
    Math.max(64,spacing*3.2),52,a+Math.PI/2,.12*fade);
  }
  c.restore();
 }
 return true;
}

// A short muzzle flash, a fast pressure-driven smoke fan, then slower smoke.
// The caller supplies the real, recoiling muzzle in its current coordinate space.
export function drawArtilleryMuzzle(c,paint,x,y,angle,age,{heavy=false}={}){
 if(!(age>=0)||age>=.95)return;
 const size=heavy?1.3:1,dx=Math.cos(angle),dy=Math.sin(angle);
 if(age<.13)paint(c,'muzzleHeavy',x+dx*9,y+dy*9,88*size,112*size,angle,(1-age/.13)*.95);
 if(age<.38){const q=age/.38;
  for(const side of [-1,1]){
   const lateral=side*(18+q*58)*size,forward=(8+q*25)*size;
   paint(c,'gunSmoke',x+dx*forward-dy*lateral,y+dy*forward+dx*lateral,
    (45+q*64)*size,(35+q*40)*size,angle+side*.5,(1-q)*.48);
  }
 }
 const q=age/.95;
 paint(c,'gunSmoke',x+dx*(20+q*45)*size,y+dy*(20+q*45)*size,
  (42+q*72)*size,(50+q*65)*size,angle,.32*(1-q));
}
