import {fx} from './fx-art.js?v=tame3';

// Formation equipment uses the wing's confirmed shot, aim and cover membership.
// Positions are projected once from world space for both solo and co-op views.
export function drawEquipmentSupport(c,world,sx,sy,z,visible,{low=false}={}){
 const players=world.players||[world];
 for(const owner of players){
  const u=owner.upgrades;
  if(!(owner.hp>0)||owner.status==='downed'||owner.heineckeEscape>0||!u||
     !(u.fighterSupply||u.goeringBaton||u.lufberyCircle||u.aceWingman))continue;
  for(const wing of world.allies||[]){
   if((wing.ownerId||'p1')!==(owner.id||'p1')||!(wing.life>0)||wing.hp<=0||
      wing.carrierHidden||wing.secretAce||wing.secretBomber||!visible(wing.x,wing.y))continue;
   const ace=wing.aceWingman&&u.aceWingman&&(wing.aceSource||'equipment')==='equipment';
   const regular=wing.permanent&&!wing.aceWingman;
   if(!regular&&!ace)continue;
   const x=sx(wing.x),y=sy(wing.y),heading=wing.a||0;
   // A brief roll of condensation on the inward wing shows which escorts
   // actually contributed to a reduction when the protected aircraft was hit.
   if(regular&&u.lufberyCircle&&owner.hitFlash>0&&owner.equipmentCoverWings?.has?.(wing)){
    const side=Math.sign((owner.y-wing.y)*Math.cos(heading)-(owner.x-wing.x)*Math.sin(heading))||1;
    const fade=Math.min(1,owner.hitFlash/.12);
    fx(c,'vaporTrail',x+(-12*Math.cos(heading)-side*20*Math.sin(heading))*z,
     y+(-12*Math.sin(heading)+side*20*Math.cos(heading))*z,(48-10*fade)*z,10*z,heading+Math.PI+side*.18,fade*.9);
   }
   if(!(wing.muzzleFlash>0)||(!ace&&!u.fighterSupply&&!u.goeringBaton))continue;
   const aim=Number.isFinite(wing.muzzleAngle)?wing.muzzleAngle:heading;
   const dx=Math.cos(aim),dy=Math.sin(aim),mx=x+dx*23*z,my=y+dy*23*z;
   const flash=Math.min(1,wing.muzzleFlash/.085);
   if(ace){
    // The recruited ace fires a tight, bright single burst along its own aim.
    fx(c,'muzzle',mx+dx*8*z,my+dy*8*z,42*z,15*z,aim,flash);
   }else if(u.fighterSupply){
    fx(c,'muzzleTwin',mx+dx*6*z,my+dy*6*z,36*z,20*z,aim,flash);
   }
   if(regular&&u.goeringBaton){
    // The mobilized line's synchronized reports leave drifting gun smoke.
    const drift=(1-flash)*12*z;
    fx(c,'gunSmoke',mx-dx*drift,my-dy*drift,(28+8*(1-flash))*z,17*z,aim,flash*.85);
   }
   if(!low&&(ace||regular&&u.fighterSupply)){
    const eject=(8+12*(1-flash))*z;
    fx(c,'bulletBrass',x-dy*eject,y+dx*eject,8*z,4*z,aim+flash,flash*.9);
   }
  }
 }
}
