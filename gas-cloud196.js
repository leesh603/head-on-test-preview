import {fx} from './fx-art.js?v=339';
// Danger boundary uses collision radius; translucent painted clouds are decorative.
export function drawGasCloud196(c,z,x,y,time=0){
  const warning=z.warning>0;
  c.save();
  if(!warning){
    for(let i=0;i<5;i++){
      const a=i*2.399+time*.025,r=i?z.r*.36:0;
      fx(c,i%2?'gasThin':'gas',x+Math.cos(a)*r,y+Math.sin(a)*r,z.r*1.38,z.r*1.38,i*.7+time*.018,.22);
    }
  }
  c.globalAlpha*=warning?.8:.55;c.lineWidth=warning?1.8:1.2;
  c.strokeStyle=warning?'#cfb96b':'#a2a36c';c.setLineDash([5,9]);
  c.beginPath();c.arc(x,y,z.r,0,Math.PI*2);c.stroke();c.setLineDash([]);c.restore();
}
