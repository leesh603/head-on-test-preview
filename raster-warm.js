// The first time a large image is drawn on the game canvas the browser decodes
// it for the GPU on the main thread (a 1536x1024 webp: ~80 ms on a desktop
// CPU, several times that on a phone). Boss art loaded during the region
// transition was first drawn the frame the boss arrived, so that frame froze
// just as the WARNING appeared. warmRaster draws each loaded image once,
// invisibly, on the game canvas a frame later -- while the transition screen
// still covers it -- one image per frame so no single frame takes the whole bill.
const queue=[];let scheduled=false;
function pump(){
 scheduled=false;const image=queue.shift();if(!image)return;
 const c=typeof document!=='undefined'&&document.getElementById('game')?.getContext?.('2d');
 if(c&&image.naturalWidth){c.save();c.globalAlpha=.002;c.drawImage(image,0,0,1,1);c.restore();}
 if(queue.length)schedule();
}
function schedule(){if(scheduled||typeof requestAnimationFrame==='undefined')return;scheduled=true;requestAnimationFrame(pump);}
export function warmRaster(image){if(!image||queue.includes(image))return;queue.push(image);schedule();}
