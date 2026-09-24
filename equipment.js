// Trim each atlas cell to its alpha silhouette once; preserve the generated pixels.
const atlas = new Image();
const sprites = {};
const repair = new Image();
repair.src = './repair-pickup.webp?v=301&b=301';
atlas.onload = () => {
  const names = ['rocket', 'mine', 'gun'];
  names.forEach((name, i) => {
    const left = Math.round(i * atlas.width / 3);
    const right = Math.round((i + 1) * atlas.width / 3);
    const c = document.createElement('canvas');
    c.width = right - left; c.height = atlas.height;
    const x = c.getContext('2d', {willReadFrequently:true});
    x.drawImage(atlas, left, 0, c.width, c.height, 0, 0, c.width, c.height);
    const data = x.getImageData(0, 0, c.width, c.height).data;
    let minX=c.width, minY=c.height, maxX=0, maxY=0;
    for(let y=0;y<c.height;y++)for(let xx=0;xx<c.width;xx++){
      if(data[(y*c.width+xx)*4+3]>100){minX=Math.min(minX,xx);minY=Math.min(minY,y);maxX=Math.max(maxX,xx);maxY=Math.max(maxY,y)}
    }
    sprites[name]={x:left+minX,y:minY,w:maxX-minX+1,h:maxY-minY+1};
  });
};
atlas.src = './equipment-atlas.webp?v=301&b=301';
export function drawEquipment(ctx, name, x, y, rotation=0, size=40){
  if(name==='repair'){
    if(!repair.complete||!repair.naturalWidth)return;
    ctx.save();ctx.imageSmoothingEnabled=false;
    ctx.drawImage(repair,x-size/2,y-size/2,size,size);ctx.restore();return;
  }
  if(name==='gun')ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
  const s=sprites[name];if(!s)return;
  const scale=size/Math.max(s.w,s.h);
  ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(Math.round(x),Math.round(y));ctx.rotate(rotation);
  ctx.drawImage(atlas,s.x,s.y,s.w,s.h,-s.w*scale/2,-s.h*scale/2,s.w*scale,s.h*scale);
  ctx.restore();
}
