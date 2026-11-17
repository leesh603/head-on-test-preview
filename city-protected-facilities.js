// Stable raid target IDs and offsets; the atlas rows follow this order.
export const CITY_FACILITIES=[
 ['west','야전병원','Field Hospital',-420,0],
 ['docks','지휘부','Command HQ',0,-160],
 ['east','피난처','Air Raid Shelter',420,0],
 ['south','연구소','Research Lab',0,245]
];
const rowById=new Map(CITY_FACILITIES.map(([id],row)=>[id,row]));
const cellWidth=144,cellHeight=116;
export const CITY_FACILITY_WIDTH=90;
let atlas,ready;

export function prepareCityFacilityArt(){
 if(!ready&&typeof Image!=='undefined'){
  const im=atlas=new Image();im.decoding='async';
  ready=new Promise(resolve=>{
   im.onload=()=>{(im.decode?.()||Promise.resolve()).catch(()=>{}).finally(resolve);};
   im.onerror=resolve;
   im.src='./city-protected-facilities-20261109.webp';
  });
 }
 return ready;
}
export function releaseCityFacilityArt(){atlas=ready=undefined;}

export function drawCityFacility(c,d,x=d.x,y=d.y,width=CITY_FACILITY_WIDTH){
 const row=rowById.get(d.id);
 if(row===undefined)return;
 if(!atlas?.naturalWidth){prepareCityFacilityArt();return;}
 const column=d.hp<=0?2:d.hp<=d.maxHp/2?1:0;
 const height=width*cellHeight/cellWidth;
 c.save();c.imageSmoothingEnabled=true;
 c.drawImage(atlas,column*cellWidth,row*cellHeight,cellWidth,cellHeight,x-width/2,y-height/2,width,height);
 c.restore();
}
