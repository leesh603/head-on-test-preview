// Trim generated atlas cells by alpha once; preserve the established upgrade illustrations.
const keys=['redScarf','prancingHorse','ironCross','telescope','flightGloves','sparkPlug','legacyExtraMagazine','cooldown','control','turn','command','damage','rate','spread','rockets','mines','armor','magnet','repair','regen'];
export const LEGENDARY_ICON_KEYS=Object.freeze(['redScarf','prancingHorse','ironCross','telescope','flightGloves','sparkPlug','goeringBaton','immelmannManual','motorCannon','loEmblem','sacredCowling','steelPlate','mauserAceKiller','boelckeDicta','fogCompass','rearGunner','quadLewis','cow37','rankinShell','kaiserFog','grunkreuz','maximBelt','amatolCharge','lufberyCircle']);
const frames=new Map();
function loadIconAtlas(file,columns,rows,names,smooth=false){return new Promise(resolve=>{const atlas=new Image();atlas.onload=()=>{
 const c=document.createElement('canvas');c.width=atlas.naturalWidth;c.height=atlas.naturalHeight;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(atlas,0,0);const d=ctx.getImageData(0,0,c.width,c.height).data;
 names.forEach((key,i)=>{const x0=Math.round(i%columns*c.width/columns),x1=Math.round((i%columns+1)*c.width/columns),y0=Math.round(Math.floor(i/columns)*c.height/rows),y1=Math.round((Math.floor(i/columns)+1)*c.height/rows);let l=x1,r=x0,t=y1,b=y0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++)if(d[(y*c.width+x)*4+3]>100){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}if(r>=l&&b>=t)frames.set(key,{atlas,x:l,y:t,w:r-l+1,h:b-t+1,smooth})});resolve(true)
};atlas.onerror=()=>resolve(false);atlas.src=file})}
function loadDirectIcon(file,key){return new Promise(resolve=>{const icon=new Image();icon.onload=()=>{if(key.startsWith('cooldown-')){
 const canvas=document.createElement('canvas');canvas.width=icon.naturalWidth;canvas.height=icon.naturalHeight;const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(icon,0,0);const pixels=c.getImageData(0,0,canvas.width,canvas.height),d=pixels.data,w=canvas.width,h=canvas.height;
 // Remove only edge-connected near-black backdrop; enclosed medal details stay intact.
 const seen=new Uint8Array(w*h),queue=[];const add=n=>{if(n<0||n>=w*h||seen[n])return;seen[n]=1;const k=n*4;if(Math.max(d[k],d[k+1],d[k+2])<24){queue.push(n);d[k+3]=0}};
 for(let x=0;x<w;x++){add(x);add((h-1)*w+x)}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1)}for(let i=0;i<queue.length;i++){const n=queue[i],x=n%w;if(x)add(n-1);if(x<w-1)add(n+1);add(n-w);add(n+w)}
 c.putImageData(pixels,0,0);let l=w,r=0,t=h,b=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>0){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}frames.set(key,{atlas:canvas,x:l,y:t,w:r-l+1,h:b-t+1,smooth:true,direct:true});
 }else frames.set(key,{atlas:icon,x:0,y:0,w:icon.naturalWidth,h:icon.naturalHeight,smooth:true,direct:true});resolve(true)};icon.onerror=()=>resolve(false);icon.src=file})}
const DIRECT_ICONS=Object.freeze({
 'cooldown-central':'medal_general_central.webp','cooldown-entente':'medal_general_entente.webp',
 damage:'armor_piercing_ammo.webp',rate:'synchronization_gear.webp',rockets:'le_prieur_rocket_launcher.webp',mines:'grenade_throwing_gear.webp',
 explosives:'high_quality_powder.webp',command:'squadron_flight_manual.webp',turn:'laminated_wood_propeller.webp',armor:'plywood_monocoque_fuselage.webp',regen:'mechanics_oil_pump.webp',

 bomber:'bombing_request_carrier_pigeon.webp',wingman:'wingman_joining.webp',fighterSupply:'new_fighter_supply.webp',mercedesEngine:'high_output_mercedes_engine.webp',spread:'wide_barrage_firing_device.webp',combinedProjectiles:'combined_projectile_distributor.webp',
 amatolCharge:'amatol_high_explosive_charge.webp',lufberyCircle:'lufbery_circle.webp',
 sparkPlug:'mccudden_emergency_repair_kit.webp',goeringBaton:'squadron_general_mobilization.webp',steelPlate:'j_type_armor_capsule.webp',mauserAceKiller:'mauser_c96_ace_killer.webp',rearGunner:'scarff_ring_gun_mount.webp',kaiserFog:'brock_smoke_device.webp',grunkreuz:'grunkreuz.webp',fogCompass:'co_5_17_aero_compass.webp',
 'ironCross-central':'medal_award_pour_le_merite.webp','ironCross-entente':'medal_award_british_victoria_cross.webp',
 emblemCentral:'emblem_bare_central.webp',emblemEntente:'emblem_bare_entente.webp'
});
const atlasReady=Promise.all([
 loadIconAtlas('./icons51.webp?v=305',5,4,keys,true),
 loadIconAtlas('./controls53.webp?v=305',2,2,['control','turn','command','cooldown']),
 loadIconAtlas('./special-ammo-icons92.webp?v=305',2,2,['ammo-incendiary','ammo-armorPiercing','ammo-tracer','ammo-explosive'],true),
 loadIconAtlas('./legendary-icons103.webp?v=305',3,1,['boelckeDicta','fogCompass','rearGunner'],true),
 loadIconAtlas('./gun-atlas114.webp?v=305',4,1,['gun-vickers','gun-spandau','gun-lewis','gun-parabellum'],true),
 loadIconAtlas('./legendary-icons109.webp?v=305',6,1,['goeringBaton','motorCannon','quadLewis','cow37','rankinShell','kaiserFog'],true),
 loadIconAtlas('./relic-maxim-belt128.webp',1,1,['maximBelt'],true),
 loadIconAtlas('./relic-steel-plate128.webp',1,1,['steelPlate'],true),
 loadIconAtlas('./relic-immelmann-manual128.webp',1,1,['immelmannManual'],true),
 loadIconAtlas('./relic-lo-emblem128.webp',1,1,['loEmblem'],true),
 loadIconAtlas('./relic-sacred-cowling128.webp',1,1,['sacredCowling'],true)
]);
export const iconsReady=atlasReady.then(async results=>{
 const direct=await Promise.all(Object.entries(DIRECT_ICONS).map(([key,file])=>loadDirectIcon('./augmentation-icons/'+file+'?v=305',key)));
 return results.every(Boolean)&&direct.every(Boolean);
});
export function drawGameIcon(c,key,x,y,size){const f=frames.get(key);if(!f)return;const k=size/Math.max(f.w,f.h);c.save();c.imageSmoothingEnabled=f.smooth;c.drawImage(f.atlas,f.x,f.y,f.w,f.h,x-f.w*k/2,y-f.h*k/2,f.w*k,f.h*k);c.restore()}

export function drawSpecialAmmoIcon(c,type,x,y,size=38){drawGameIcon(c,'ammo-'+type,x,y,size)}

// Keep the authored sprites, but discard tiny detached alpha islands left by
// atlas exports so a legendary stays crisp at its 42px selection size.
function cleanLegendaryFrame(key){
 const f=frames.get(key);if(!f||f.direct)return;const source=document.createElement('canvas');source.width=f.w;source.height=f.h;const s=source.getContext('2d',{willReadFrequently:true});s.drawImage(f.atlas,f.x,f.y,f.w,f.h,0,0,f.w,f.h);const pixels=s.getImageData(0,0,f.w,f.h),data=pixels.data,seen=new Uint8Array(f.w*f.h),parts=[];
 for(let start=0;start<seen.length;start++){if(seen[start]||data[start*4+3]<90)continue;const queue=[start],part=[];seen[start]=1;for(let at=0;at<queue.length;at++){const n=queue[at],x=n%f.w,y=Math.floor(n/f.w);part.push(n);for(const next of [x>0?n-1:-1,x<f.w-1?n+1:-1,y>0?n-f.w:-1,y<f.h-1?n+f.w:-1])if(next>=0&&!seen[next]&&data[next*4+3]>=90){seen[next]=1;queue.push(next)}}parts.push(part)}
 const largest=Math.max(0,...parts.map(p=>p.length)),kept=parts.filter(p=>p.length>=Math.max(6,largest*.055));if(!kept.length)return;let left=f.w,top=f.h,right=0,bottom=0;for(const part of kept)for(const n of part){const x=n%f.w,y=Math.floor(n/f.w);left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y)}
 const clean=document.createElement('canvas'),w=right-left+1,h=bottom-top+1;clean.width=w;clean.height=h;const out=clean.getContext('2d').createImageData(w,h);for(const part of kept)for(const n of part){const x=n%f.w,y=Math.floor(n/f.w),from=n*4,to=((y-top)*w+x-left)*4;out.data[to]=data[from];out.data[to+1]=data[from+1];out.data[to+2]=data[from+2];out.data[to+3]=data[from+3]}clean.getContext('2d').putImageData(out,0,0);frames.set(key,{atlas:clean,x:0,y:0,w,h,smooth:f.smooth});
}
iconsReady.then(()=>{for(const key of LEGENDARY_ICON_KEYS)cleanLegendaryFrame(key)});
