import {aircraftKey} from './aircraft.js?v=1091f4e17a46a92b';

// Personal paint is a render key; simulation aircraft and ordinary squadron paint stay intact.
export function enemyAircraftKey(e,fallback){
 if(e.zeroDistrictAircraft)return 'zero_sector_junkers_d1';
 if(e.bossPilot)return aircraftKey(e.bossPlane||e.escortPlane||fallback,false,e.bossPilot);
 return (e.formationLivery&&!e.bossMinion?e.formationLivery:null)||e.escortPlane||e.bossPlane||fallback;
}
