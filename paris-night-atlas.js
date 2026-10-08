import {PARIS_FORTRESS_LAYOUT,PARIS_STAAKEN_LAYOUT} from './paris-night-bosses.js?v=r5';
// Clip coordinates share the combat mounts' world space. Original artwork
// is assembled without individually shrinking or redesigning its machinery.
export const PARIS_ART_LAYOUTS={fortress:PARIS_FORTRESS_LAYOUT,staaken:PARIS_STAAKEN_LAYOUT};
export const PARIS_PART_CLIPS={
 fortress:{
  'light-nw':[-440,-295,188,205],'light-ne':[252,-295,188,205],
  'light-sw':[-440,45,188,190],'light-se':[252,45,188,190],
  'light-main':[-90,-230,180,185],
  'generator-left':[-243,-104,136,131],'generator-right':[107,-104,136,131],
  'aa-left':[-553,-296,118,134],'aa-right':[435,-296,118,134],
  'mg-left':[-566,-50,107,137],'mg-right':[459,-50,107,137],command:[-75,98,150,185]
 },
 staaken:{
  'engine-0':[-333,-247,108,213],'engine-1':[-201,-247,108,213],
  'engine-2':[95,-247,108,213],'engine-3':[229,-247,108,213],
  'gun-front':[-33,-254,70,74],'gun-top':[-33,-111,70,74],'gun-rear':[-33,112,70,78],
  'gun-left':[-59,-70,21,113],'gun-right':[39,-70,21,113],
  'bomb-bay-left':[-105,-70,45,147],'bomb-bay-right':[61,-70,45,147]
 }
};
