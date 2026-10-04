const ARCHETYPE_KEYS=Object.freeze({
 fokker:'lowSpeedTurn',camel:'closeTurn',fokkerd7:'energyFighter',se5a:'highSpeedEnergy',
 mccudden_se5a:'boomZoom',albatros:'balanced',eindecker:'earlyFighter',
 bristol_duo:'offensiveTwoSeater',re7:'heavyTwoSeater'
});

const stepped=(value,thresholds)=>1+thresholds.reduce((count,threshold)=>count+(value>=threshold?1:0),0);
const growthRating=multiplier=>multiplier<=.88?5:multiplier<=.93?4:multiplier<=1.04?3:multiplier<=1.1?2:1;

export const REPRESENTATIVE_AIRCRAFT=Object.freeze(Object.keys(ARCHETYPE_KEYS));
export const representativeArchetypeKey=id=>ARCHETYPE_KEYS[id]||null;

// Ratings use the same fields as flight and progression. Fixed breakpoints keep
// the five steps stable when unrelated aircraft are added to the roster.
export function aircraftFeelRatings(plane){
 if(!plane?.handling||!plane?.personality)return null;
 const handling=plane.handling,personality=plane.personality;
 return Object.freeze({
  speed:stepped(plane.speed,[115,140,160,178]),
  turn:stepped(plane.turn,[2.2,2.7,3.3,3.9]),
  retention:stepped(1-handling.drag,[.76,.79,.85,.895]),
  acceleration:stepped(handling.recovery*personality.acceleration,[.6,.95,1.25,1.8]),
  growth:growthRating(plane.xpCostMultiplier)
 });
}
