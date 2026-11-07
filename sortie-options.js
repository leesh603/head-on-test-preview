// One normal sortie combines the front and its optional special operation.
// Explicit test/campaign modes retain their isolated, authored progression.
export function sortieProgressionOptions(mode,testMode=false,search=''){
 const params=new URLSearchParams(search),normal=!testMode&&mode!=='campaign';
 return {dynamicFront:normal&&params.get('dynamicFront')!=='0',specialOperations:normal&&params.get('specialOperations')!=='0'};
}
