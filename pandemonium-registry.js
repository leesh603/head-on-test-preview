// Three forms of the gated final encounter; standalone previews remain optional diagnostics.
export const PANDEMONIUM_TYPES=Object.freeze({
 mobile:Object.freeze({id:'mobile',name:'판데모니움 · 기동형',worldScale:.5,preview:'./index.html?finalarenaqa=1',mechanics:'./fortress-systems.js',render:'./fortress-render.js',status:'integrated-branch'}),
 asymmetric:Object.freeze({id:'asymmetric',name:'판데모니움 · 비대칭 항공갑판형',worldScale:.5,preview:'./qa/pandemonium-a-preview.html',mechanics:'./pandemonium-a-mechanics.js',render:'./pandemonium-a-render.js',status:'integrated-final-encounter'}),
 factory:Object.freeze({id:'factory',name:'판데모니움 · 이동 군수공장형',worldScale:1,preview:'./qa/pandemonium-factory-preview.html',mechanics:'./pandemonium-factory-mechanics.js',render:'./pandemonium-factory-render.js',status:'integrated-final-encounter'})
});
export function pandemoniumProfile(id){const p=PANDEMONIUM_TYPES[id];if(!p)throw new RangeError('Unknown Pandemonium type: '+id);return p;}
export function encounterIdentity(type,token,entityId){pandemoniumProfile(type);if(!token||!entityId)throw new TypeError('Explicit encounter token and entity ID required');return JSON.stringify([type,String(token),String(entityId)]);}
// Converts the authoring-space module API without changing its own physics.
export function worldPart(profile,part){return {...part,x:part.x*profile.worldScale,y:part.y*profile.worldScale,r:part.r*profile.worldScale};}
