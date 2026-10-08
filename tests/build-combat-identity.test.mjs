import test from 'node:test';
import assert from 'node:assert/strict';
import {installBuildCombatIdentity,buildIdentityStrength,BUILD_COMBAT_BALANCE} from '../build-combat-identity.js?v=lc3';
import {buildIdentityFor} from '../augmentation-overhaul150.js?v=lc3';
class Fixture{
 constructor(){Object.assign(this,{t:0,x:0,y:0,a:0,hp:100,maxHp:100,invuln:0,upgrades:{},enemies:[],airframeSpeed:.9})}
 upgrade(id){this.upgrades[id]=(this.upgrades[id]||0)+1;return true}
 applySpecialRound(b){const angle=Math.atan2(b.vy,b.vx)+.02,speed=Math.hypot(b.vx,b.vy);b.vx=Math.cos(angle)*speed;b.vy=Math.sin(angle)*speed;return b}
 roundDamageMultiplier(){return 1}
 specialRoundImpact(){}
 flyAirframe(dt,input={}){this.a+=(input.steer||0)*dt;return 'flown'}
 hit(n){if(this.invuln>0)return;this.hp=Math.max(0,this.hp-n);this.invuln=.75}
 breakEnemyFormation(e,duration=2.6){this.disrupted={e,duration};e.formationLeader=null;e.formationCommand=false}
 combatWorld(){return this}
}
installBuildCombatIdentity(Fixture,{identityFor:buildIdentityFor});
const target=(x=200)=>({x,y:0,a:0,hp:80,maxHp:80,type:'hunter',formationCommand:true});
const round=()=>({vx:520,vy:0,damage:10,gun:0});
const build=(upgrades)=>Object.assign(new Fixture(),{upgrades});

test('multiple ranks in existing group unlock bounded identity, including same upgrade ranks',()=>{
 assert.equal(buildIdentityStrength({damage:1},'GUN',buildIdentityFor),0);
 assert.equal(buildIdentityStrength({damage:2},'GUN',buildIdentityFor),.25);
 assert.equal(buildIdentityStrength({damage:999,rate:2,turn:2},'GUN',buildIdentityFor),1);
 const g=build({damage:1});assert.equal(g.buildCombatStrength('GUN'),0);g.upgrade('rate');assert.equal(g.buildCombatStrength('GUN'),.25);
});

test('gun concentration narrows existing fan/jitter only after repeated same target hits and resets',()=>{
 const g=build({damage:3,rate:2}),e=target();for(let i=0;i<6;i++)g.specialRoundImpact(round(),e);
 assert.equal(g.buildGunFan(.11),.11*.55);const b=g.applySpecialRound(round());assert(Math.atan2(b.vy,b.vx)<.02);assert.equal(g.roundDamageMultiplier(b,e),1.12);assert.equal(g.roundDamageMultiplier(b,target()),1);
 e.y=100;assert.equal(g.buildGunFan(.11),.11);e.y=0;g.t=2;assert.equal(g.buildGunFan(.11),.11);
 g.specialRoundImpact(round(),target());assert.equal(g.buildGunFocus.hits,1);
});

test('formation focus accepts recently hit valuable target and leaves pilot targeting as integration priority',()=>{
 const g=build({command:2}),e=target();g.specialRoundImpact(round(),e);assert.equal(g.buildWingTarget({x:0,y:0}),e);
 g.t=2;assert.equal(g.buildWingTarget({x:0,y:0}),null);g.t=0;assert.equal(g.buildWingTarget({x:900,y:0}),null);
 const ordinary={...target(),formationCommand:false};g.buildCommandFocus=null;g.specialRoundImpact(round(),ordinary);assert.equal(g.buildWingTarget({x:0,y:0}),null);
});

test('explosive identity breaks clustered existing formation with bounded duration and cooldown',()=>{
 const g=build({rockets:2}),leader=target(),member={...target(250),formationCommand:false,formationLeader:leader};g.enemies=[leader,member];
 g.specialRoundImpact({...round(),rocket:true},member);assert.equal(g.disrupted.e,member);assert(g.disrupted.duration<1);
 g.disrupted=null;g.specialRoundImpact({...round(),actualExplosion:true},leader);assert.equal(g.disrupted,null);
 const empty=build({rockets:1});empty.specialRoundImpact({...round(),rocket:true},leader);assert.equal(empty.disrupted,undefined);
});

test('speed pass requires straight manual ingress, egress and reentry; recovers energy only on egress',()=>{
 const g=build({turn:5}),e=target();g.airframeSpeed=.9;for(let i=0;i<13;i++)g.flyAirframe(.04);g.specialRoundImpact(round(),e);assert(g.buildSpeedPass);assert.equal(g.buildGunFan(.11),.11);
 g.x=450;g.airframeSpeed=.75;g.flyAirframe(.04);assert(g.buildSpeedPass.ready);assert(g.airframeSpeed>.75);
 g.x=0;g.airframeSpeed=.95;g.flyAirframe(.04);assert(g.buildGunFan(.11)<.11);g.flyAirframe(.04,{steer:1});assert.equal(g.buildGunFan(.11),.11);
 g.t=5;g.flyAirframe(.04);assert.equal(g.buildSpeedPass,null);
});

test('survival repair requires major actual damage then escape, clearance and time; no extra invulnerability',()=>{
 const g=build({armor:5});g.hit(40);assert(g.buildEscapeRepair);assert.equal(g.invuln,.75);g.t=1.3;g.flyAirframe(.04);assert.equal(g.hp,60);
 g.x=150;g.enemies=[{...target(180),formationCommand:false}];g.flyAirframe(.04);assert.equal(g.hp,60);g.enemies=[];for(let i=0;i<40;i++){g.t+=.04;g.flyAirframe(.04)}assert(Math.abs(g.hp-68)<1e-8);assert.equal(g.buildEscapeRepair,null);assert.equal(g.invuln,.75);
 g.invuln=0;g.hit(20);assert.equal(g.buildEscapeRepair,null,'repair cooldown prevents repeated damage farming');
});

test('support/hostile rounds and scripted pilot movements cannot earn build combat rewards',()=>{
 const g=build({damage:5,command:5,turn:5}),e=target();for(const b of [{enemy:true},{ally:true},{patrol:true},{formation:true},{ghost:true}])g.specialRoundImpact({...round(),...b},e);assert.equal(g.buildGunFocus,undefined);assert.equal(g.buildCommandFocus,undefined);
 g.chargeTime=1;for(let i=0;i<20;i++)g.flyAirframe(.04);g.specialRoundImpact(round(),e);assert.equal(g.buildStraightTime,0);assert.equal(g.buildSpeedPass,undefined);
});

test('small damage does not start repair and further damage cancels pending rescue',()=>{
 const g=build({armor:2});g.hit(5);assert.equal(g.buildEscapeRepair,undefined);g.invuln=0;g.t=1;g.hit(20);assert(g.buildEscapeRepair);g.invuln=0;g.hit(1);assert.equal(g.buildEscapeRepair,null);
 assert.equal(BUILD_COMBAT_BALANCE.repairCooldown,12);
});

// Exercise the real projectile/hit, airframe and co-op inheritance paths.
import {Game} from '../engine.js?v=lc3';
import {CoopGame,PlayerState} from '../coop-engine.js?v=lc3';

installBuildCombatIdentity(Game,{identityFor:buildIdentityFor});
installBuildCombatIdentity(Object.getPrototypeOf(PlayerState.prototype).constructor,{identityFor:buildIdentityFor});
const quiet=g=>{for(const key of ['spawn','eventTimer','nextBossAt','nextHeavyAt','_zeppelinSchedule','flakTimer','regionThreat','fieldUnitTimer','gasTimer','gustTimer','patrolTimer','supplyTimer'])g[key]=Infinity;g.battleDirectorEnabled=false;return g};

test('actual Game collision records repeated player target focus and excludes ally projectile focus',()=>{
 const g=quiet(new Game('eindecker','voss',()=>.5));Object.assign(g,{x:0,y:0,a:0,upgrades:{damage:5},ammo:[999],reloadTime:0,rate:.05});
 const e={...target(210),hp:10000,maxHp:10000,missionTarget:true,stationary:true,speed:0,fire:Infinity,wobble:0,hitFlash:0,smokeTimer:Infinity};g.enemies=[e];
 for(let i=0;i<20;i++)g.update(.04,{inputMode:'gamepad',fireHeld:true,steer:0});
 assert(e.hp<10000,'real projectile collision should damage target');assert.equal(g.buildGunFocus?.target,e);assert(g.buildGunFocus.hits>1);assert(g.buildGunFan(.11)<.11);
 const focus=g.buildGunFocus;g.specialRoundImpact({...round(),ally:true},target());assert.equal(g.buildGunFocus,focus);
});

test('actual Game large hit and manually flown escape repair leave existing hit immunity unchanged',()=>{
 const g=quiet(new Game('eindecker','voss',()=>.5));Object.assign(g,{invuln:0,upgrades:{armor:5},x:0,y:0});const full=g.hp;g.hit(g.maxHp*.3);const damaged=g.hp,immunity=g.invuln;assert(damaged<full);assert(g.buildEscapeRepair);
 g.x=150;g.enemies=[];g.t+=1.3;g.flyAirframe(.04,{steer:0});assert(g.hp>damaged);assert.equal(g.invuln,immunity);
});

test('co-op owners inherit upgrade-dependent build behavior with isolated focus and strength',()=>{
 const g=quiet(new CoopGame([{pilot:'voss',plane:'eindecker'},{pilot:'baron',plane:'fokker'}],{rng:()=>.5})),p1=g.player('p1'),p2=g.player('p2'),e=target();
 p1.upgrades={damage:5,command:2};Object.assign(p1,{x:0,y:0,a:0});p2.upgrades={};p1.specialRoundImpact(round(),e);p1.specialRoundImpact(round(),e);
 assert.equal(p1.buildCombatStrength('GUN'),1);assert.equal(p2.buildCombatStrength('GUN'),0);assert.equal(p1.buildWingTarget({x:0,y:0}),e);assert.equal(p2.buildWingTarget({x:0,y:0}),null);
});

test('lethal commander explosion preserves full leader-loss break instead of short explosive disruption',()=>{
 const g=build({rockets:5}),leader={...target(),hp:0},member={...target(250),formationCommand:false,formationLeader:leader};g.enemies=[leader,member];g.specialRoundImpact({...round(),actualExplosion:true},leader);assert.equal(g.disrupted.e,member);assert.equal(g.disrupted.duration,2.6);
 const actual=quiet(new Game('eindecker','voss',()=>.5));actual.upgrades={rockets:5};const dead={...target(),hp:0},survivor={...target(250),formationCommand:false,formationLeader:dead};actual.enemies=[dead,survivor];actual.specialRoundImpact({...round(),actualExplosion:true},dead);assert.equal(survivor.formationCollapseUntil-actual.t,2.6);assert.equal(survivor.formationResumeLeader,null);
});

test('lethal hit during temporary break resolves preserved leader and bypasses temporary blast cooldown',()=>{
 const g=build({rockets:5}),dead={...target(),hp:0,formationCommand:false,formationResumeCommand:true,buildBlastDisruptUntil:3},member={...target(250),formationCommand:false,formationLeader:null,formationResumeLeader:dead};g.enemies=[dead,member];g.specialRoundImpact({...round(),actualExplosion:true},dead);assert.equal(g.disrupted.e,member);assert.equal(g.disrupted.duration,2.6);
});

test('elite formation members participate in blast disruption and block escape repair while nearby',()=>{
 const g=build({rockets:5,armor:5}),leader={...target(),eliteKind:'le-prieur',squadronId:'s1'},member={...target(250),formationCommand:false,formationLeader:leader,eliteKind:'le-prieur',squadronId:'s1'};g.eliteEnemies={members:[leader,member],squadrons:[{id:'s1',leader,members:[leader,member]}]};g.enemies=[];
 g.specialRoundImpact({...round(),actualExplosion:true},member);assert.equal(g.disrupted.e,member);assert(g.disrupted.duration<1);
 // Core leader death clears formation links, but the squadron still identifies its commander.
 leader.hp=0;leader.alive=false;member.formationLeader=null;g.eliteEnemies.members=[member];g.specialRoundImpact({...round(),actualExplosion:true},leader);assert.equal(g.disrupted.duration,2.6);
 g.hit(40);g.t=1.5;g.x=150;member.x=180;g.flyAirframe(.04);assert.equal(g.hp,60);member.x=600;g.flyAirframe(.04);assert(g.hp>60);
});

import {attachEliteSystem,routeFriendlyProjectileHits} from '../elite-patch/module/headon-bridge.js?v=lc3';
test('actual elite system accepts short live-commander disruption and preserves full death break',()=>{
 const g=quiet(new Game('eindecker','voss',()=>.5));g.upgrades={rockets:5};const system=attachEliteSystem(g,{getPlayerFaction:()=> 'central'}),squad=system.spawnEncounter(),leader=squad.leader;
 const member=squad.members.find(m=>m!==leader);g.specialRoundImpact({...round(),actualExplosion:true},leader);assert.equal(squad.breakUntil-g.t,.9);assert(squad.members.every(m=>m.formationCollapseUntil===squad.breakUntil));
 // Commander still identified by its saved command flag while the squadron is broken.
 system.damageMember(leader,leader.hp+1);g.specialRoundImpact({...round(),actualExplosion:true},leader);assert.equal(squad.breakUntil-g.t,2.6);assert.equal(squad.formationResumeLeader,null);assert.equal(squad.formationDeathBreak,true);assert.equal(member.formationCollapseUntil-g.t,2.6);
});

test('real elite projectile routing delivers player gun focus and high-value multiplier to commander',()=>{
 const g=quiet(new Game('eindecker','voss',()=>.5));Object.assign(g,{x:0,y:0,a:0,upgrades:{damage:5}});const system=attachEliteSystem(g,{getPlayerFaction:()=> 'central'}),squad=system.spawnEncounter(),leader=squad.leader;
 for(const m of squad.members){m.x=m===leader?200:900;m.y=0;m.hp=m.maxHp=1000}g.bullets=[];
 for(let i=0;i<6;i++){g.bullets.push({...round(),x:200,y:0,life:1,damage:1});routeFriendlyProjectileHits(g,system)}
 assert.equal(g.buildGunFocus?.target,leader);assert.equal(g.buildGunFocus.hits,6);assert(g.buildGunFan(.11)<.11);
 const b=g.applySpecialRound({...round(),x:200,y:0,life:1,damage:10}),before=leader.hp;g.bullets.push(b);routeFriendlyProjectileHits(g,system);assert(Math.abs((before-leader.hp)-b.damage*g.roundDamageMultiplier(b,leader))<1e-8,'bridge must apply the same target-specific multiplier as normal combat');
});

test('real lethal elite explosion routing keeps full commander-loss collapse after impact callbacks',()=>{
 const g=quiet(new Game('eindecker','voss',()=>.5));g.upgrades={rockets:5};const system=attachEliteSystem(g,{getPlayerFaction:()=> 'central'}),squad=system.spawnEncounter(),leader=squad.leader;
 for(const m of squad.members){m.x=m===leader?200:900;m.y=0}g.bullets=[{...round(),x:200,y:0,life:1,actualExplosion:true,explosionRadius:10,damage:leader.hp+1}];routeFriendlyProjectileHits(g,system);
 assert.equal(leader.alive,false);assert.equal(squad.breakUntil-g.t,2.6);assert.equal(squad.formationDeathBreak,true);assert(squad.members.filter(m=>m.alive).every(m=>m.formationCollapseUntil-g.t===2.6));
});
