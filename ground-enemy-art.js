import {GROUND_SHEETS,GROUND_FRAMES} from './ground-enemy-atlas.js?v=r5';
const images=new Map(),pending=new Map();
function load(key){if(images.has(key))return images.get(key);const im=new Image();im.crossOrigin='anonymous';im.decoding='async';images.set(key,im);pending.set(key,new Promise((resolve,reject)=>{im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Ground enemy art '+key));}));im.src='./'+GROUND_SHEETS[key]+'?v=r5';return im;}
export function prepareGroundEnemyArt(){for(const key of Object.keys(GROUND_SHEETS))load(key);return Promise.all([...pending.values()]);}
export function groundEnemyKind(e){if(e.groundEscort)return 'aatank';if(e.missionTank)return 'tank';if(e.fieldUnit==='railgun')return 'railgun';if(e.cityUnit==='light'||e.londonInstallation==='light')return 'light';if(e.facSprite?.includes('twinmg'))return 'mg';if(e.missionGround||e.cityUnit==='pit'||e.londonInstallation==='gun')return 'aa';return null;}
export function groundEnemyFrame(faction,kind,state=0){return GROUND_FRAMES[faction==='entente'?'entente':'central']?.[kind]?.[state];}
function part(c,faction,kind,state,x,y,size,angle=0,pivot=.5){const f=groundEnemyFrame(faction,kind,state);if(!f)return false;const im=load(f.key);if(!im.naturalWidth)return false;const w=size*f.rect[2]/Math.max(f.rect[2],f.rect[3]),h=size*f.rect[3]/Math.max(f.rect[2],f.rect[3]);c.save();c.translate(x,y);c.rotate(angle);c.imageSmoothingEnabled=true;c.drawImage(im,...f.rect,-w/2,-h*pivot,w,h);c.restore();return true;}
export function drawGroundEnemy(c,e,x,y,size,kind=groundEnemyKind(e),fallbackFaction='central'){
 if(!kind)return false;const faction=e.faction||fallbackFaction,state=e.artState??(e.hp<=0?2:e.maxHp&&e.hp<e.maxHp*.55?1:0),bodyAngle=kind==='aa'?0:kind==='light'?(e.scanA||0)+Math.PI/2:(e.rail?.angle??e.a??-Math.PI/2)+Math.PI/2;
 if(!part(c,faction,kind,state,x,y,size,bodyAngle))return false;
 if(['aa','aatank','railgun'].includes(kind)){const aim=e.cityShot?Math.atan2(e.cityShot.y-e.y,e.cityShot.x-e.x):e.gunAim??e.fieldSalvoAim??e.a??-Math.PI/2;const frame=groundEnemyFrame(faction,kind,state),height=size*frame.rect[3]/Math.max(frame.rect[2],frame.rect[3]),offset=height*(kind==='aatank'?-.12:kind==='aa'?-.04:0);part(c,faction,'gun',state,x-Math.sin(bodyAngle)*offset,y+Math.cos(bodyAngle)*offset,size*(kind==='aa'?.66:kind==='railgun'?.88:.78),aim+Math.PI/2,.70);}
 return true;
}
