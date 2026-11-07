/** Bow-up production paintings with independently moving gun/periscope.
 * Coordinates are centered native pixels; collision excludes painted water. */
const layout=(id)=>{
 const base=`asset-bank/intrusion-bosses/submarines/${id}`,heavy=id==='m1';
 const gunX=heavy?0:-1.8,gunY=heavy?-206:-170,arc=heavy?Math.PI/12:Math.PI/3;
 const size=heavy?[88,246]:[62,162],pivot=heavy?[44,179]:[29.2,120];
 const muzzle={x:0,y:heavy?-385:-290,pivotX:gunX,pivotY:gunY,angle:-Math.PI/2,arc};
 const towerY=heavy?-58.69:-50.36;
 const gunSpec=src=>({src,x:gunX,y:gunY,pivot,width:size[0],height:size[1]});
 const head={src:'asset-bank/intrusion-bosses/submarines/periscope-intact.webp',x:gunX,y:-68,pivot:[9,12.5],drawSize:[18,25]};
 return {id,enabled:true,domain:'sea',hullBounds:{x:0,y:0,width:heavy?183.72:170.52,height:1472},width:heavy?184:171,height:1536,waterWidth:heavy?184:171,waterHeight:1536,
  submarineArt:{surface:`${base}-hull-surface.webp`,diving:`${base}-hull-diving.webp`,periscope:null,width:384,height:1536,separated:true},
  cutin:`${base}-cutin.webp`,parts:[
   {id:'deck_gun_sprite',kind:'turret_body',group:'deck_gun',x:gunX,y:gunY,pivot,angle:0,arc,dependencies:[],rotatesWithTurret:true,destroyedRotates:true,muzzle,
    artAvailability:{damaged:'runtime-fx-only',destroyed:heavy?'painted-destroyed':'unavailable-intact-retained'},
    states:{intact:gunSpec(`${base}-gun-intact.webp`),damaged:gunSpec(`${base}-gun-intact.webp`),destroyed:gunSpec(`${base}-gun-${heavy?'destroyed':'intact'}.webp`)}},
   {id:'periscope_head',kind:'submarine_periscope',group:'dive_control',x:gunX,y:-68,angle:0,arc:0,dependencies:[],artAvailability:{destroyed:'runtime-retraction-only'},states:{intact:head,damaged:head,destroyed:null}}
  ],
  targets:[{id:'core',kind:'core',x:0,y:0,rx:heavy?91:84,ry:736,angle:0,dependencies:[]},
   {id:'deck_gun',kind:'turret_body',x:gunX,y:gunY,rx:42,ry:70,angle:0,dependencies:[],muzzle},
   {id:'propulsion',kind:'engine',x:0,y:610,rx:57,ry:105,angle:0,dependencies:[],visualDamage:'runtime-fx-only'},
   {id:'dive_control',kind:'control',x:0,y:towerY,rx:50,ry:110,angle:0,dependencies:[],visualDamage:'runtime-fx-only'},
   ...(id==='uboat'?[{id:'torpedo_tubes',kind:'launcher',x:0,y:-655,rx:48,ry:55,angle:0,dependencies:[],visualDamage:'runtime-fx-only'}]:[])],shotOcclusion:[]};
};
export const submarineLayouts={uboat:layout('uboat'),m1:layout('m1')};
