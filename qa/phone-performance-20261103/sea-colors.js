// Shared water palettes. The color blend keeps the authored waves' luminance.
export const SEA_COLORS=Object.freeze({
 adriatic:Object.freeze({color:'#26877f',strength:.58}),
 zeebrugge:Object.freeze({color:'#64775d',strength:.54}),
 gallipoli:Object.freeze({color:'#3979ab',strength:.58}),
 jutland:Object.freeze({color:'#3e5084',strength:.62})
});
export function applySeaColor(ctx,key,width,height){
 const p=SEA_COLORS[key];if(!p)return;
 ctx.save();ctx.globalCompositeOperation='color';ctx.globalAlpha*=p.strength;
 ctx.fillStyle=p.color;ctx.fillRect(0,0,width,height);ctx.restore();
}
