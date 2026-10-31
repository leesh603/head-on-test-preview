import {aircraftKey} from './aircraft.js?v=outline2&art=pilot-recovery2&pf=1027&crewbake=1&rim=idle';

// Personal paint is a render key; simulation aircraft and ordinary squadron paint stay intact.
export function enemyAircraftKey(e,fallback){
 if(e.zeroDistrictAircraft)return 'zero_sector_junkers_d1';
 if(e.bossPilot)return aircraftKey(e.bossPlane||e.escortPlane||fallback,false,e.bossPilot);
 return (e.formationLivery&&!e.bossMinion?e.formationLivery:null)||e.escortPlane||e.bossPlane||fallback;
}
